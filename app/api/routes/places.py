"""HTTP routes for the live place typeahead + GPS reverse-geocode.

Both endpoints sit behind the shared slowapi limiter. Search is rated
generously (120/min) because the frontend types into it on every
keystroke after a 180 ms debounce — a single user can plausibly issue
8–10 calls in a minute and we don't want a power user to trip the
limiter on a fast-typed correction. Nearest is rated more strictly
(60/min) because each call is paired with a GPS fix and the frontend
should never need more than one per location change.

The service layer (``app.services.places``) carries all the ranking,
folding, and PostGIS interaction. These handlers are deliberately thin
so the route file stays trivially reviewable.
"""

from __future__ import annotations

from fastapi import APIRouter, Query, Request

from app.core.config import limiter
from app.db.session import AsyncSessionDependency
from app.schemas import (
    Location,
    PlaceNearestResponse,
    PlaceSearchResponse,
)
from app.services.places import nearest_place, search_places

router = APIRouter()


@router.get(
    "/search",
    response_model=PlaceSearchResponse,
    response_model_by_alias=True,
)
@limiter.limit("120/minute")
async def search(
    request: Request,
    session: AsyncSessionDependency,
    q: str = Query(..., min_length=1),
    lat: float | None = Query(None, ge=-90, le=90),
    lon: float | None = Query(None, ge=-180, le=180),
    limit: int = Query(8, ge=1, le=20),
) -> PlaceSearchResponse:
    """Typeahead search for places by name, optionally biased toward ``(lat,lon)``.

    ``q`` is accepted with ``min_length=1`` at the FastAPI layer so the
    client can send a single character without a 422 — the service
    layer then short-circuits anything under 2 chars to an empty list.
    That split keeps the wire contract permissive while the ranker
    stays sane.
    """

    near = (
        Location(lat=lat, lon=lon)
        if lat is not None and lon is not None
        else None
    )
    results = await search_places(session, q, near, limit)
    return PlaceSearchResponse(query=q, results=results)


@router.get(
    "/nearest",
    response_model=PlaceNearestResponse,
    response_model_by_alias=True,
)
@limiter.limit("60/minute")
async def nearest(
    request: Request,
    session: AsyncSessionDependency,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> PlaceNearestResponse:
    """Reverse-geocode a GPS fix to the nearest known place within 50 km.

    Wraps a single ORDER BY ST_DistanceSphere query. Returns
    ``{"nearest": null}`` for any coordinate outside the 50 km radius
    (the most common case being users outside Møre og Romsdal). The
    radius is enforced in the service layer so the wire shape can stay
    a plain optional object.
    """

    place = await nearest_place(session, lat, lon)
    return PlaceNearestResponse(nearest=place)
