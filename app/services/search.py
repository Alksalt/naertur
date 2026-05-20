from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.models import Hike, HikeGeometry
from app.schemas import SearchRequest, SearchResponse, TransportResult
from app.services.geo import haversine_meters, trailhead_from_geojson
from app.services.hikes import hike_summary
from app.services.randomizer import Candidate, choose_candidate
from app.services.safety import SafetyService


class SearchService:
    def __init__(self, safety_service: SafetyService | None = None) -> None:
        self.safety_service = safety_service or SafetyService()

    async def aclose(self) -> None:
        """Close the underlying SafetyService (and thus its HTTP clients)."""

        await self.safety_service.aclose()

    async def random_hike(
        self,
        session: AsyncSession,
        request: SearchRequest,
    ) -> SearchResponse | None:
        hikes = await self.load_hikes(session, request)
        preliminary = self.preliminary_candidates(hikes, request)
        preliminary = preliminary[: get_settings().search_safety_candidate_limit]

        candidates: list[Candidate] = []
        for hike, distance, reasons in preliminary:
            safety = await self.safety_service.evaluate_hike(session, hike)
            if safety.status != "recommended_today":
                continue
            candidates.append(
                Candidate(
                    hike=hike,
                    safety=safety,
                    distance_from_user_meters=distance,
                    match_reasons=reasons,
                )
            )
        selected = choose_candidate(candidates, request)
        if selected is None:
            return None
        return SearchResponse(
            hike=hike_summary(selected.hike),
            safety=selected.safety,
            transport=self.transport_result(request, selected.distance_from_user_meters, selected.hike),
            match_reasons=selected.match_reasons,
            rejected_reasons=[],
        )

    # Bounding-box halfwidth around the user used to prefilter candidates
    # before the per-hike haversine. ±2° lat × ±3° lon is roughly an
    # MR-sized region (~220 km N-S, ~150 km E-W at 62°N), which is wide
    # enough to keep every realistic car-travel candidate in scope while
    # still cutting national result sets down to a tractable size. When
    # the request has no `location`, no spatial filter runs and every
    # hike is loaded — preserves prior behaviour for browser-only flows.
    _LOCATION_BBOX_LAT_HALFWIDTH_DEG = 2.0
    _LOCATION_BBOX_LON_HALFWIDTH_DEG = 3.0

    async def load_hikes(self, session: AsyncSession, request: SearchRequest) -> list[Hike]:
        # National-ready: filter by SPATIAL proximity to the user, never by
        # county. Filtering by `county == "Møre og Romsdal"` here silently
        # dropped any future non-MR import (e.g. an Oslo or Trondheim
        # source) from search results despite living in the same DB. The
        # brand promise is national-ready architecture; the filter shape
        # must match that promise.
        stmt = select(Hike).options(selectinload(Hike.geometry))
        if request.location is not None:
            lat = request.location.lat
            lon = request.location.lon
            stmt = stmt.join(Hike.geometry).where(
                HikeGeometry.trailhead.ST_Within(
                    func.ST_MakeEnvelope(
                        lon - self._LOCATION_BBOX_LON_HALFWIDTH_DEG,
                        lat - self._LOCATION_BBOX_LAT_HALFWIDTH_DEG,
                        lon + self._LOCATION_BBOX_LON_HALFWIDTH_DEG,
                        lat + self._LOCATION_BBOX_LAT_HALFWIDTH_DEG,
                        4326,
                    )
                )
            )
        if request.difficulty:
            stmt = stmt.where(Hike.difficulty.in_(request.difficulty))
        if request.rejected_hike_ids:
            stmt = stmt.where(Hike.id.not_in(request.rejected_hike_ids))
        result = await session.scalars(stmt)
        return list(result)

    def preliminary_candidates(
        self, hikes: list[Hike], request: SearchRequest
    ) -> list[tuple[Hike, float | None, list[str]]]:
        candidates: list[tuple[Hike, float | None, list[str]]] = []
        for hike in hikes:
            reasons: list[str] = []
            if not self.matches_length(hike, request):
                continue
            if not self.matches_tags(hike, request):
                continue
            if not self.matches_avoid(hike, request):
                continue
            distance = self.distance_from_user(hike, request)
            if distance is not None and not self.within_transport_radius(distance, request):
                continue
            if request.difficulty:
                reasons.append("difficulty_match")
            if request.tags:
                reasons.append("tag_match")
            if request.length_bucket:
                reasons.append("length_match")
            if distance is not None:
                reasons.append("within_travel_radius")
            candidates.append((hike, distance, reasons))
        return sorted(candidates, key=lambda item: item[1] if item[1] is not None else 0)

    @staticmethod
    def matches_length(hike: Hike, request: SearchRequest) -> bool:
        if request.length_bucket is None or hike.distance_meters is None:
            return True
        if request.length_bucket == "under_5km":
            return hike.distance_meters < 5_000
        if request.length_bucket == "5_10km":
            return 5_000 <= hike.distance_meters <= 10_000
        return hike.distance_meters > 10_000

    @staticmethod
    def matches_tags(hike: Hike, request: SearchRequest) -> bool:
        requested = set(request.tags)
        if not requested:
            return True
        # Tags are scored preferences, not hard filters: any overlap qualifies
        # the hike and the randomizer then weights candidates by how many of
        # the requested tags they actually carry.
        return bool(requested & set(hike.tags))

    @staticmethod
    def matches_avoid(hike: Hike, request: SearchRequest) -> bool:
        if "steep" in request.avoid and "steep" in hike.tags:
            return False
        return True

    @staticmethod
    def distance_from_user(hike: Hike, request: SearchRequest) -> float | None:
        if request.location is None or hike.geometry is None:
            return None
        trailhead = trailhead_from_geojson(hike.geometry.route_geojson)
        if trailhead is None:
            return None
        return haversine_meters(request.location.lat, request.location.lon, trailhead[0], trailhead[1])

    @staticmethod
    def within_transport_radius(distance_meters: float, request: SearchRequest) -> bool:
        if request.max_travel_minutes is None:
            return True
        meters_per_minute = {
            "car": 700,
            "walk": 80,
            "public_transport": 500,
        }[request.transport]
        return distance_meters <= request.max_travel_minutes * meters_per_minute

    @staticmethod
    def transport_result(
        request: SearchRequest, distance_meters: float | None, hike: Hike
    ) -> TransportResult:
        estimated = None
        reasons: list[str] = []
        if distance_meters is not None:
            meters_per_minute = {"car": 700, "walk": 80, "public_transport": 500}[request.transport]
            estimated = max(1, round(distance_meters / meters_per_minute))
        status = "estimated"
        if request.transport == "public_transport":
            status = "unverified_until_entur"
            reasons.append("entur_not_enabled_in_backend_v1")
            if "public_transport_possible" in hike.tags:
                reasons.append("source_mentions_public_transport")
        return TransportResult(
            mode=request.transport,
            estimated_minutes=estimated,
            status=status,
            reasons=reasons,
        )

