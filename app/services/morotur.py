from __future__ import annotations

import re
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

# Morotur is the regional source for Møre og Romsdal. The county tag is set
# at the importer (not at the model layer) so future sources can populate
# Hike.county with their own region without leaking MR-specific defaults
# into the schema.
MOROTUR_COUNTY = "Møre og Romsdal"

# Morotur's public ``/api/v2/routes/{id}`` JSON payload does not expose
# ascent or highest-point fields (verified against routes 2, 100, 500,
# 1000, 1950 on 2026-05-20). The numbers are rendered into the public
# ``/tur/{slug}`` HTML page from the same Morotur DB, however, so we parse
# them out of that page as a best-effort enrichment. Failure to fetch or
# parse must NEVER block an import — both fields fall back to None.
#
# Morotur's template has shipped two label/value markup shapes that we have
# seen in the wild:
#   1. ``<dt>Stigning</dt><dd>324 m</dd>`` (terse description-list form)
#   2. ``<div class="fact__title">Stigning</div><div class="fact__text">324 m</div>``
# Either can appear depending on the route page version. The combined
# regex below matches both label/value pairs so a future template flip
# from divs to dt/dd (or vice-versa) does not silently drop ascent and
# highest-point data into NULL again.
_FACT_PAIR_RE = re.compile(
    r"(?:"
    r"<dt[^>]*>\s*([^<]+?)\s*</dt>\s*<dd[^>]*>\s*([^<]+?)\s*</dd>"
    r"|"
    r'<div\s+class="fact__title">\s*([^<]+?)\s*</div>\s*'
    r'(?:<[^>]+>\s*)*'
    r'<div\s+class="fact__text">\s*([^<]+?)\s*</div>'
    r")",
    re.IGNORECASE | re.DOTALL,
)
# Value strings are like "324 m", "324m", or "324 moh". We accept any of
# those forms — the integer-extraction regex below just plucks the leading
# number; the trailing unit is irrelevant once we know we are inside an
# ascent / highest-point fact pair.
_INT_FROM_TEXT_RE = re.compile(r"(\d+(?:[\s,.]\d+)?)")


def _parse_meters(text: str | None) -> int | None:
    """Pull an integer metre count out of a Morotur fact value like '324 m'.

    Handles thin spaces and Norwegian decimal commas. Returns ``None`` when
    the text is missing, non-numeric, or zero (Morotur uses 0 as a "not
    measured" sentinel for some routes).
    """

    if not text:
        return None
    match = _INT_FROM_TEXT_RE.search(text)
    if not match:
        return None
    raw = match.group(1).replace(" ", "").replace(" ", "").replace(",", ".")
    try:
        value = float(raw)
    except ValueError:
        return None
    if value <= 0:
        return None
    return int(value)


def parse_elevation_from_html(html_body: str) -> tuple[int | None, int | None]:
    """Extract (ascent_meters, highest_point_meters) from a Morotur route page.

    Looks for the ``Stigning`` (ascent) and ``Høyeste punkt`` / ``Høgaste
    punkt`` (highest point) fact blocks rendered server-side on
    ``/tur/{slug}``. Matches both ``<dt>/<dd>`` and
    ``<div class="fact__title">/<div class="fact__text">`` markup shapes
    so a future template flip on Morotur's side does not silently turn the
    elevation fields back into NULL.

    Returns ``(None, None)`` if a label is missing or value text cannot be
    parsed — a fully-defensive parse so importer robustness never depends
    on a brittle scrape.
    """

    if not html_body:
        return None, None

    ascent: int | None = None
    highest_point: int | None = None
    # ``findall`` returns one tuple per match with four capture groups —
    # (dt_title, dd_value, div_title, div_value). Exactly one branch of
    # the top-level alternation fires per match, so the other two slots
    # are empty strings; collapse to a single (title, value) pair.
    for dt_title, dd_value, div_title, div_value in _FACT_PAIR_RE.findall(html_body):
        title = (dt_title or div_title).strip()
        value = (dd_value or div_value).strip()
        if not title or not value:
            continue
        title_lc = title.lower()
        if "stigning" in title_lc:
            ascent = _parse_meters(value)
        elif (
            "høyeste punkt" in title_lc
            or "hoyeste punkt" in title_lc
            or "høgaste punkt" in title_lc
            or "hogaste punkt" in title_lc
        ):
            highest_point = _parse_meters(value)
    return ascent, highest_point


class MoroturUnavailable(RuntimeError):
    """Raised when Morotur's discovery endpoint is unreachable or 5xx.

    Carries the original status code (when known) so the admin route can
    translate to an actionable 503. Per-route fetch failures are still
    handled inside the importer's per-route savepoint and recorded as
    failed source_records — only the discovery step short-circuits the
    whole admin request, which would otherwise crash with an unhandled
    httpx exception.
    """

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


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
        # Morotur occasionally 5xxs the discovery endpoint during their
        # nightly index rebuild. The admin handler used to surface that as
        # a bare 500 with no useful body; catching here lets us translate
        # to an actionable 503 upstream without crashing the request.
        try:
            response = await self._client.get(url, params={"tour_type": tour_type})
            response.raise_for_status()
            routes = response.json()
        except httpx.HTTPStatusError as exc:
            raise MoroturUnavailable(
                f"Morotur discover_routes returned {exc.response.status_code}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.HTTPError as exc:
            raise MoroturUnavailable(f"Morotur discover_routes failed: {exc}") from exc
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

    async def fetch_route_html(self, slug: str) -> str | None:
        """Fetch the public route page so we can scrape ascent/highest point.

        Returns ``None`` on any HTTP error so the importer can fall back to
        leaving the elevation fields unset rather than failing the whole
        route. The JSON v2 API does not expose these numbers, but they are
        rendered into the HTML by Morotur from the same database row.
        """

        if not slug:
            return None
        try:
            response = await self._client.get(f"{self.base_url}/tur/{slug}")
            response.raise_for_status()
        except httpx.HTTPError:
            return None
        return response.text


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
        ascent_meters, highest_point_meters = await self._fetch_elevation(route.get("slug"))

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
            hike = Hike(
                source="morotur",
                source_id=source_id,
                source_url=source_url,
                name=route["name"],
                county=MOROTUR_COUNTY,
                difficulty=difficulty,
            )
            session.add(hike)
        else:
            hike = existing

        hike.source_url = source_url
        hike.slug = route.get("slug")
        hike.name = route["name"]
        hike.summary = summary
        hike.description = description
        hike.municipalities = route.get("municipalities") or []
        hike.county = MOROTUR_COUNTY
        hike.difficulty = difficulty
        hike.distance_meters = distance_meters
        hike.duration_minutes = parse_duration_minutes(route.get("time_need"))
        hike.ascent_meters = ascent_meters
        hike.highest_point_meters = highest_point_meters
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

    async def _fetch_elevation(self, slug: str | None) -> tuple[int | None, int | None]:
        """Best-effort scrape of ascent and highest point from the public page.

        Morotur's v2 JSON does not expose these fields; they only appear in
        the rendered HTML. Any fetch or parse failure resolves to
        ``(None, None)`` so the importer keeps working when Morotur changes
        their template — the data is enrichment, not a correctness boundary.
        """

        html_body = await self.client.fetch_route_html(slug or "")
        if html_body is None:
            return None, None
        return parse_elevation_from_html(html_body)

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
