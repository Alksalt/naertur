from __future__ import annotations

from app.db.models import Hike
from app.schemas import HikeSummary, Location
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
        source_id=hike.source_id,
        source_url=hike.source_url,
        name=hike.name,
        municipality=hike.municipalities[0] if hike.municipalities else None,
        county=hike.county,
        difficulty=hike.difficulty,
        distance_meters=hike.distance_meters,
        duration_minutes=hike.duration_minutes,
        ascent_meters=hike.ascent_meters,
        tags=hike.tags,
        trailhead=trailhead,
    )
