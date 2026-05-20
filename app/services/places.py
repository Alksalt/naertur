"""Place typeahead + reverse-geocode service.

Backs the ``GET /api/places/search`` and ``GET /api/places/nearest`` routes.
Reads from the ``places`` table seeded by ``SsrImporter`` — 3 k+ MR
settlements in the dev DB.

Design notes:

* The query side mirrors how ``app.services.search.SearchService`` does
  PostGIS work: import ``geoalchemy2.functions as geo_func`` and call
  ``geo_func.ST_*`` against ``Place.location``. Mixing the SQLAlchemy
  ``func`` namespace with the geoalchemy2 wrappers stays close to the
  pattern already proven in ``search.py``.
* Text-matching prefix uses two columns — ``name_lower`` for verbatim
  matches and ``name_lower_ascii`` for ø/æ/å folding. Both columns carry
  ``text_pattern_ops`` btree indexes, so prefix LIKE is index-served.
  Folding happens here exactly as it did at import time (see
  ``app.services.ssr.fold_norwegian``); duplicated locally to keep the
  search service free of any import-side coupling.
* Ranking happens in Python because the combined formula
  ``0.65 * text + 0.35 * proximity`` and the four-band text score are
  cheaper to evaluate in-process than to express in SQL, and the LIKE
  cap of 200 rows keeps the slice tractable. ST_X / ST_Y are projected
  into the SELECT so we don't issue a second round-trip per row to read
  coordinates back.
* The 50 km radius in ``nearest_place`` is the safety net for
  out-of-region GPS (Oslo, abroad). The plan asks for "don't return a
  MR place for someone in Oslo"; ST_DWithin with a geography cast
  gives us a true metric radius rather than a degree-space bbox.
"""

from __future__ import annotations

from geoalchemy2 import Geography
from geoalchemy2 import functions as geo_func
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Place
from app.schemas import Location, PlaceResult
from app.services.geo import haversine_meters

# Maximum raw rows pulled from the LIKE prefix scan before Python-side
# ranking. 200 is enough to cover any single prefix on a 3 k-row table
# (the largest prefix in the live MR dataset is ``b*`` at ~280 rows;
# trimming to 200 is fine because the text score saturates at 0.85 for
# anything past the visible top of the typeahead).
_LIKE_CAP = 200

# Distance at which the proximity score reaches zero. 300 km is roughly
# the diagonal of Møre og Romsdal; anything beyond that gets no proximity
# bonus, which lets text relevance dominate for far-away queries.
_PROXIMITY_DISTANCE_FALLOFF_KM = 300.0

# Combined-score weights. Text first, proximity as the tie-breaker —
# without `near`, proximity contributes a neutral 0.5 so the formula
# doesn't penalise queries that lack a location.
_TEXT_WEIGHT = 0.65
_PROXIMITY_WEIGHT = 0.35
_NEUTRAL_PROXIMITY = 0.5

# Hard ceiling on the nearest-place radius. Picked so an Oslo (10°E,
# 59.9°N) coordinate finds nothing — Møre's southern edge is ~250 km
# away from Oslo, so 50 km comfortably excludes anyone not already in
# the region.
_NEAREST_RADIUS_METERS = 50_000


def _fold_norwegian(text: str) -> str:
    """Local copy of ``app.services.ssr.fold_norwegian``.

    Duplicated here so the search service doesn't import from the
    importer. The fold must stay byte-for-byte identical to the import-
    time fold, otherwise an ASCII typeahead miss appears as a phantom
    bug.
    """

    return (
        text.lower()
        .replace("ø", "o")
        .replace("æ", "ae")
        .replace("å", "aa")
    )


def _text_score(
    name_lower: str, name_lower_ascii: str, q_norm: str, q_ascii: str
) -> float:
    """Score a place's name against the user's query.

    Four-band scoring tracks the plan exactly:

    * 1.00 — exact match (either column)
    * 0.85 — prefix match (either column)
    * 0.55 — substring match (either column)
    * 0.30 — fallback floor (we got here via the LIKE prefix scan, so
      this branch is effectively unreachable in production; kept as a
      defensive floor so a future schema drift can't silently zero a row).
    """

    if name_lower == q_norm or name_lower_ascii == q_ascii:
        return 1.0
    if name_lower.startswith(q_norm) or name_lower_ascii.startswith(q_ascii):
        return 0.85
    if q_norm in name_lower or q_ascii in name_lower_ascii:
        return 0.55
    return 0.30


def _proximity_score(
    near: Location | None, lat: float | None, lon: float | None
) -> float:
    """Map distance to a [0..1] proximity score (neutral 0.5 when ``near`` is None).

    Linear falloff against ``_PROXIMITY_DISTANCE_FALLOFF_KM`` — at 0 km
    the score is 1, at 300 km it's 0. The neutral 0.5 when ``near`` is
    missing keeps the combined formula well-defined without special-
    casing the call site.
    """

    if near is None or lat is None or lon is None:
        return _NEUTRAL_PROXIMITY
    dist_km = haversine_meters(near.lat, near.lon, lat, lon) / 1000.0
    return max(0.0, 1.0 - dist_km / _PROXIMITY_DISTANCE_FALLOFF_KM)


def _row_to_result(place: Place, lat: float, lon: float) -> PlaceResult:
    """Build a ``PlaceResult`` from a ``Place`` row + extracted coords.

    Coordinates come off the projected ``ST_X`` / ``ST_Y`` columns rather
    than off ``Place.location`` directly, because reading a PostGIS
    geometry through GeoAlchemy needs a second round-trip and we already
    paid for the projection in the initial SELECT.
    """

    return PlaceResult(
        id=place.id,
        name=place.name,
        place_type=place.place_type,
        kommune=place.kommune_name,
        fylke=place.fylke_name,
        location=Location(lat=lat, lon=lon),
    )


async def search_places(
    session: AsyncSession,
    q: str,
    near: Location | None,
    limit: int,
) -> list[PlaceResult]:
    """Return up to ``limit`` places matching ``q``, ranked by text + proximity.

    Short-circuits to an empty list when ``q`` is shorter than two
    characters — a single-letter prefix returns ~280 rows on the live
    dataset and would flood the typeahead with low-signal noise.
    """

    q_norm = q.strip().lower()
    if len(q_norm) < 2:
        return []
    q_ascii = _fold_norwegian(q_norm)

    pattern = q_norm + "%"
    pattern_ascii = q_ascii + "%"
    stmt = (
        select(
            Place,
            geo_func.ST_X(Place.location).label("lon"),
            geo_func.ST_Y(Place.location).label("lat"),
        )
        .where(
            (Place.name_lower.like(pattern))
            | (Place.name_lower_ascii.like(pattern_ascii))
        )
        .limit(_LIKE_CAP)
    )
    rows = (await session.execute(stmt)).all()

    scored: list[tuple[float, str, Place, float, float]] = []
    for place, lon, lat in rows:
        text_score = _text_score(
            place.name_lower, place.name_lower_ascii, q_norm, q_ascii
        )
        proximity_score = _proximity_score(near, lat, lon)
        combined = _TEXT_WEIGHT * text_score + _PROXIMITY_WEIGHT * proximity_score
        scored.append((combined, place.name_lower, place, lat, lon))

    # Sort highest combined score first; ties broken alphabetically on
    # the lowercased name so output is stable across calls.
    scored.sort(key=lambda item: (-item[0], item[1]))
    top = scored[:limit]
    return [_row_to_result(place, lat, lon) for _, _, place, lat, lon in top]


# Reusable geography type instance — the cast wraps a srid=4326 geometry
# into PostGIS geography(POINT, 4326) so ST_DWithin treats its third
# argument as meters. Building one instance at module load is cheap and
# avoids reconstructing the SQLAlchemy type per request.
_POINT_GEOGRAPHY = Geography(geometry_type="POINT", srid=4326)


async def nearest_place(
    session: AsyncSession, lat: float, lon: float
) -> PlaceResult | None:
    """Find the closest place to ``(lat, lon)`` within 50 km, else ``None``.

    Uses ``ST_DWithin`` over a geography cast so the radius is true
    metric distance (not degree-space). ``ST_DistanceSphere`` powers the
    ORDER BY because the candidate set inside the 50 km bubble is small
    (≤ ~150 rows on the live MR dataset) and DistanceSphere avoids the
    geography-cast overhead per row.
    """

    query_point = geo_func.ST_SetSRID(geo_func.ST_MakePoint(lon, lat), 4326)
    stmt = (
        select(
            Place,
            geo_func.ST_X(Place.location).label("lon_out"),
            geo_func.ST_Y(Place.location).label("lat_out"),
            geo_func.ST_DistanceSphere(Place.location, query_point).label("dist_m"),
        )
        .where(
            geo_func.ST_DWithin(
                func.cast(Place.location, _POINT_GEOGRAPHY),
                func.cast(query_point, _POINT_GEOGRAPHY),
                _NEAREST_RADIUS_METERS,
            )
        )
        .order_by("dist_m")
        .limit(1)
    )
    row = (await session.execute(stmt)).first()
    if row is None:
        return None
    place = row[0]
    return _row_to_result(place, row.lat_out, row.lon_out)
