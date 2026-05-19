from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Hike
from app.schemas import HikeDetail, HikeSummary, Location
from app.services.geo import trailhead_from_geojson


def hike_summary(hike: Hike) -> HikeSummary:
    trailhead = None
    if hike.geometry is not None:
        point = trailhead_from_geojson(hike.geometry.route_geojson)
        if point is not None:
            trailhead = Location(lat=point[0], lon=point[1])
    return HikeSummary(
        id=hike.id,
        source=hike.source,
        sourceId=hike.source_id,
        sourceUrl=hike.source_url,
        name=hike.name,
        municipality=hike.municipalities[0] if hike.municipalities else None,
        county=hike.county,
        difficulty=hike.difficulty,
        distanceMeters=hike.distance_meters,
        durationMinutes=hike.duration_minutes,
        ascentMeters=hike.ascent_meters,
        tags=hike.tags,
        trailhead=trailhead,
    )


async def get_hike_detail(session: AsyncSession, hike_id: UUID) -> HikeDetail | None:
    hike = await session.scalar(
        select(Hike).options(selectinload(Hike.geometry)).where(Hike.id == hike_id)
    )
    if hike is None:
        return None
    summary = hike_summary(hike)
    return HikeDetail(
        **summary.model_dump(by_alias=True),
        summary=hike.summary,
        description=hike.description,
        municipalities=hike.municipalities,
        seasonMonths=hike.season_months,
        routeGeojson=hike.geometry.route_geojson if hike.geometry else None,
        transportNotes=hike.transport_notes,
    )

