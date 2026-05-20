from __future__ import annotations

from typing import Any

import httpx
from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.models import Hike, HikeGeometry, SourceRecord
from app.services.geo import linestring_length_meters, linestring_wkt, point_wkt
from app.services.normalization import (
    infer_tags,
    normalize_difficulty,
    parse_duration_minutes,
    season_months,
    strip_html,
)


class MoroturClient:
    def __init__(self, base_url: str | None = None) -> None:
        settings = get_settings()
        self.base_url = (base_url or settings.morotur_base_url).rstrip("/")
        # A single httpx.AsyncClient is reused across discover/fetch_route/
        # fetch_geojson. A 300-route import previously opened ~600 TCP
        # connections by constructing a new client per call; reusing keeps
        # the connection pool warm and respects Morotur's edge.
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> MoroturClient:
        return self

    async def __aexit__(self, exc_type: object, exc: object, tb: object) -> None:
        await self.aclose()

    async def discover_routes(self, limit: int = 25, tour_type: int = 0) -> list[int]:
        url = f"{self.base_url}/api/v2/routes"
        response = await self._client.get(url, params={"tour_type": tour_type})
        response.raise_for_status()
        routes = response.json()
        return [int(item["id"]) for item in routes[:limit]]

    async def fetch_route(self, route_id: int) -> dict[str, Any]:
        response = await self._client.get(f"{self.base_url}/api/v2/routes/{route_id}")
        response.raise_for_status()
        return response.json()

    async def fetch_geojson(self, route_id: int) -> dict[str, Any]:
        response = await self._client.get(f"{self.base_url}/api/v2/geojson/{route_id}")
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, list) and payload:
            return payload[0]
        if isinstance(payload, dict) and payload.get("type") == "Feature":
            return payload
        raise ValueError(f"Morotur route {route_id} did not return route GeoJSON")


class MoroturImporter:
    def __init__(self, client: MoroturClient) -> None:
        self.client = client

    async def import_routes(self, session: AsyncSession, route_ids: list[int]) -> dict[str, Any]:
        imported = 0
        failed = 0
        errors: list[str] = []
        for route_id in route_ids:
            # Per-route savepoint: a route that raises partway through (e.g.
            # malformed GeoJSON after a Hike row has already been flushed) is
            # rolled back to a clean state before we record the failure.
            # Without this, the outer commit would persist orphaned hike rows
            # missing their hike_geometries — which then crashes
            # /api/search/random with AttributeError on route_geojson.
            savepoint = await session.begin_nested()
            try:
                await self.import_route(session, route_id)
            except Exception as exc:
                await savepoint.rollback()
                failed += 1
                errors.append(f"{route_id}: {exc}")
                # Record the failure in its own savepoint so we have a DB trail
                # even when the route payload itself never made it into the
                # primary tables.
                failure_savepoint = await session.begin_nested()
                try:
                    await self.upsert_source_record(
                        session,
                        {"id": route_id, "slug": None},
                        {},
                        "failed",
                        str(exc),
                    )
                    await failure_savepoint.commit()
                except Exception as record_exc:
                    await failure_savepoint.rollback()
                    errors.append(f"{route_id} (failure record): {record_exc}")
            else:
                await savepoint.commit()
                imported += 1
        await session.commit()
        return {"imported": imported, "failed": failed, "route_ids": route_ids, "errors": errors}

    async def import_route(self, session: AsyncSession, route_id: int) -> Hike:
        route = await self.client.fetch_route(route_id)
        geojson = await self.client.fetch_geojson(route_id)
        hike = await self.upsert_route(session, route, geojson)
        await self.upsert_source_record(session, route, geojson, "ok", None)
        return hike

    async def upsert_route(self, session: AsyncSession, route: dict, geojson: dict) -> Hike:
        source_id = str(route["id"])
        coordinates = geojson.get("geometry", {}).get("coordinates") or []
        if len(coordinates) < 2:
            raise ValueError("route GeoJSON must contain a LineString with at least two coordinates")

        distance_meters = linestring_length_meters(coordinates)
        source_url = geojson.get("properties", {}).get("url") or f"{self.client.base_url}/tur/{route.get('slug')}"
        description = strip_html(route.get("tour_description_html") or route.get("tour_description"))
        summary = description[:280] if description else None
        tags = infer_tags(route, geojson, distance_meters)
        difficulty = normalize_difficulty(route)

        existing = await session.scalar(
            select(Hike)
            .options(selectinload(Hike.geometry))
            .where(Hike.source == "morotur", Hike.source_id == source_id)
        )
        # Capture is_new BEFORE flush so we can decide create-vs-mutate on the
        # geometry without re-reading hike.geometry on a freshly-flushed row.
        # An async lazy-load triggered from outside an async loop raises
        # `greenlet_spawn has not been called`, which broke 11/20 routes in
        # the live smoke test.
        is_new = existing is None
        if is_new:
            hike = Hike(source="morotur", source_id=source_id, source_url=source_url, name=route["name"])
            session.add(hike)
        else:
            hike = existing

        hike.source_url = source_url
        hike.slug = route.get("slug")
        hike.name = route["name"]
        hike.summary = summary
        hike.description = description
        hike.municipalities = route.get("municipalities") or []
        hike.county = "Møre og Romsdal"
        hike.difficulty = difficulty
        hike.distance_meters = distance_meters
        hike.duration_minutes = parse_duration_minutes(route.get("time_need"))
        hike.ascent_meters = None
        hike.highest_point_meters = None
        hike.season_months = season_months(route.get("seasons"))
        hike.tags = tags
        hike.transport_notes = strip_html(route.get("public_transport"))
        await session.flush()

        route_element = WKTElement(linestring_wkt(coordinates), srid=4326)
        trailhead_lon, trailhead_lat = coordinates[0][:2]
        trailhead_element = WKTElement(point_wkt(trailhead_lon, trailhead_lat), srid=4326)
        if is_new:
            hike.geometry = HikeGeometry(
                hike_id=hike.id,
                route=route_element,
                trailhead=trailhead_element,
                route_geojson=geojson,
            )
        else:
            # Existing rows already preloaded `geometry` via selectinload above,
            # so this attribute access never triggers a lazy I/O.
            hike.geometry.route = route_element
            hike.geometry.trailhead = trailhead_element
            hike.geometry.route_geojson = geojson
        return hike

    async def upsert_source_record(
        self,
        session: AsyncSession,
        route: dict,
        geojson: dict,
        status: str,
        error: str | None,
    ) -> None:
        source_id = str(route["id"])
        source_url = geojson.get("properties", {}).get("url") or f"{self.client.base_url}/tur/{route.get('slug')}"
        record = await session.scalar(
            select(SourceRecord).where(
                SourceRecord.source == "morotur", SourceRecord.source_id == source_id
            )
        )
        if record is None:
            record = SourceRecord(
                source="morotur",
                source_id=source_id,
                source_url=source_url,
                payload={},
                import_status=status,
            )
            session.add(record)
        record.source_url = source_url
        record.payload = {"route": route, "geojson": geojson}
        record.import_status = status
        record.error = error
