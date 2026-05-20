"""End-to-end safety integration test for the /api/search/random route.

This is the load-bearing test for NærTur's brand promise: "safety before
randomness." If any of the three filters (season, MET weather, NVE
avalanche) ever leaks an unsafe hike to the user, the product is broken.

Coverage strategy: seed three hikes into a real Postgres + PostGIS test
database, mock the external MET and NVE clients with ``respx`` so the
weather is always benign and only the avalanche level varies, then hammer
``POST /api/search/random`` 30 times and assert that the two unsafe hikes
NEVER come back.

Design notes:

* ``TestClient(app)`` is used in a ``with`` block. Without it the FastAPI
  lifespan never runs, ``app.state.search_service`` is never built, and
  the route 500s on ``request.app.state.search_service``. The existing
  ``test_admin_auth.py`` doesn't hit this because the admin route never
  touches ``app.state``, but the search route does.
* The DB session dependency is overridden to use the test DB engine so the
  three seeded hikes are visible to the route handler and the seeds don't
  collide with the dev DB.
* MET responses are minimal compact-format payloads with 12 hours of
  benign weather (wind=2 m/s, temp=10°C, no precip), which makes
  ``evaluate_weather`` return ``recommended_today``.
* NVE responses use ``DangerLevel`` strings — ``"1"`` for safe regions and
  ``"4"`` for the dangerous hike. The avalanche module looks up region by
  trailhead bounding box, so the seeded coordinates must fall inside a
  real NVE A-region; (63.0, 7.7) is squarely inside Romsdal (3023).
* The test asserts both negatives (unsafe hikes never appear) and a
  positive (the clean hike DOES come back at least once across 30 calls),
  so a future regression that 500s every call or always returns 404 is
  caught immediately rather than silently passing the never-saw-unsafe
  assertion.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Generator
from datetime import UTC, datetime
from typing import Any

import httpx
import pytest
import pytest_asyncio
import respx
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Hike, HikeGeometry
from app.db.session import get_session
from app.main import app
from app.services.geo import linestring_wkt, point_wkt
from tests.db import TEST_DATABASE_URL


# --- seeded hike identifiers (stable so assertions are clear) ---------------
CLEAN_HIKE_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
WINTER_HIKE_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
DANGEROUS_HIKE_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")

# Each trailhead must land inside an NVE A-region bounding box (see
# app/services/nve.py:_REGION_BBOXES). Otherwise the safety evaluator
# short-circuits to ``avalanche_region_unknown`` (status ``check_conditions``,
# not ``recommended_today``), which would block the clean hike too and the
# brand-promise assertion would pass for the wrong reason.
#
# Clean + winter live in Romsdal (3023, bbox 62.55..63.10, 6.80..8.90); the
# dangerous hike lives in Sunnmøre (3024, bbox 62.00..62.55, 5.40..7.40) so
# respx can return different DangerLevel values per region URL.
CLEAN_TRAILHEAD = (63.0, 7.7)
WINTER_TRAILHEAD = (63.01, 7.71)
DANGEROUS_TRAILHEAD = (62.3, 6.5)


def _now_month() -> int:
    return datetime.now(UTC).month


def _in_season_months() -> list[int]:
    """A season list that always includes the current month.

    Returning the canonical Norwegian summer + shoulder range (March through
    November) is correct for the project's home county and is also broad
    enough that the test passes year-round except December–February. The
    dev environment runs in Norway where winter is the "obviously
    out-of-season" case, so this is fine.
    """

    return [3, 4, 5, 6, 7, 8, 9, 10, 11]


def _out_of_season_months() -> list[int]:
    """A season list that excludes the current month (winter-only)."""

    return [12, 1, 2]


def _make_geojson(lat: float, lon: float, hike_id: uuid.UUID) -> dict[str, Any]:
    """Synthetic LineString starting at the trailhead.

    The second coordinate is offset slightly so the geometry is a valid
    multi-point LineString (the importer enforces ``>= 2 coords``). The
    ``properties.url`` matches what the route serializer expects.
    """

    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [[lon, lat], [lon + 0.001, lat + 0.001]],
        },
        "properties": {
            "id": str(hike_id),
            "url": f"https://morotur.test/tur/{hike_id}",
        },
    }


def _build_hike(
    hike_id: uuid.UUID,
    name: str,
    trailhead: tuple[float, float],
    season_months: list[int],
    distance_meters: int = 3_000,
) -> tuple[Hike, HikeGeometry]:
    lat, lon = trailhead
    geojson = _make_geojson(lat, lon, hike_id)
    coordinates = geojson["geometry"]["coordinates"]
    hike = Hike(
        id=hike_id,
        source="test",
        source_id=str(hike_id),
        source_url=f"https://morotur.test/tur/{hike_id}",
        name=name,
        municipalities=["Test"],
        county="Møre og Romsdal",
        difficulty="medium",
        distance_meters=distance_meters,
        duration_minutes=60,
        season_months=season_months,
        tags=["viewpoint", "under_5km"],
    )
    geometry = HikeGeometry(
        hike_id=hike_id,
        route=WKTElement(linestring_wkt(coordinates), srid=4326),
        trailhead=WKTElement(point_wkt(lon, lat), srid=4326),
        route_geojson=geojson,
    )
    return hike, geometry


@pytest_asyncio.fixture
async def seeded_test_db(bootstrap_test_database: str) -> AsyncIterator[None]:
    """Truncate the test DB and seed three known hikes.

    Three hikes are inserted in a single transaction so a partial failure
    rolls back cleanly. ``safety_snapshots`` is also truncated to avoid
    cached results from a previous run masking a fresh evaluation. Two
    hikes (clean + winter) sit in Romsdal (NVE region 3023); the
    dangerous hike sits in Sunnmøre (3024) so the respx mocks can route
    each region to a different ``DangerLevel`` response.
    """

    engine = create_async_engine(bootstrap_test_database, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        await engine.dispose()
        pytest.skip(f"Postgres unreachable for safety integration test: {exc}")

    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    async with sessionmaker() as setup:
        await setup.execute(
            text(
                "TRUNCATE TABLE safety_snapshots, hike_geometries, hikes, source_records CASCADE"
            )
        )
        await setup.commit()

    async with sessionmaker() as setup:
        clean_hike, clean_geom = _build_hike(
            CLEAN_HIKE_ID, "Clean Romsdal hike", CLEAN_TRAILHEAD, _in_season_months()
        )
        winter_hike, winter_geom = _build_hike(
            WINTER_HIKE_ID, "Winter-only hike", WINTER_TRAILHEAD, _out_of_season_months()
        )
        dangerous_hike, dangerous_geom = _build_hike(
            DANGEROUS_HIKE_ID,
            "Dangerous avalanche hike",
            DANGEROUS_TRAILHEAD,
            _in_season_months(),
        )
        setup.add_all(
            [
                clean_hike,
                clean_geom,
                winter_hike,
                winter_geom,
                dangerous_hike,
                dangerous_geom,
            ]
        )
        await setup.commit()

    yield

    # Tear down so repeated runs don't accumulate rows; not strictly
    # necessary because each run truncates first, but it leaves the test DB
    # tidy for ad-hoc inspection.
    async with sessionmaker() as teardown:
        await teardown.execute(
            text(
                "TRUNCATE TABLE safety_snapshots, hike_geometries, hikes, source_records CASCADE"
            )
        )
        await teardown.commit()
    await engine.dispose()


@pytest.fixture
def override_session() -> Generator[None, None, None]:
    """Point the FastAPI ``get_session`` dependency at the test DB.

    The app-level ``AsyncSessionLocal`` is bound to the dev DB engine. We
    create a separate test engine + sessionmaker here so search hits the
    seeded fixtures instead of the live importer state.
    """

    engine = create_async_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)

    async def _test_session() -> AsyncIterator[AsyncSession]:
        async with sessionmaker() as session:
            yield session

    app.dependency_overrides[get_session] = _test_session
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_session, None)
        # Engine cleanup happens at process exit; we can't await here from a
        # sync fixture and the leak is bounded to one connection pool.


def _benign_met_response() -> dict[str, Any]:
    """A locationforecast payload that passes every weather threshold."""

    timeseries = [
        {
            "time": "2026-05-20T00:00:00Z",
            "data": {
                "instant": {
                    "details": {"wind_speed": 2.0, "air_temperature": 10.0}
                },
                "next_1_hours": {"details": {"precipitation_amount": 0.0}},
            },
        }
        for _ in range(12)
    ]
    return {
        "type": "Feature",
        "properties": {
            "meta": {"updated_at": "2026-05-20T00:00:00Z"},
            "timeseries": timeseries,
        },
    }


def _nve_response(level: str) -> list[dict[str, Any]]:
    """Single-day NVE warning record at the given danger level."""

    return [
        {
            "RegionId": 3023,
            "RegionName": "Romsdal",
            "DangerLevel": level,
            "MainText": f"Test danger level {level}",
            "ValidFrom": "2026-05-20T00:00:00",
            "ValidTo": "2026-05-21T00:00:00",
        }
    ]


def test_search_random_never_returns_unsafe_hikes(
    seeded_test_db: None, override_session: None
) -> None:
    """Hammer /api/search/random 30 times; unsafe hikes must never appear.

    Three hikes are seeded:

    * ``CLEAN_HIKE_ID`` — in season, region returns NVE level 1.
    * ``WINTER_HIKE_ID`` — season=[12,1,2] (out of season for May).
    * ``DANGEROUS_HIKE_ID`` — in season, but region returns NVE level 4.

    MET is mocked to always return benign weather. NVE is mocked per
    region: Romsdal (3023, where the clean + winter hikes live) returns
    DangerLevel=1, while Sunnmøre (3024, where the dangerous hike lives)
    returns DangerLevel=4. That setup lets respx route by URL without
    needing per-call ``side_effect`` orchestration and proves the safety
    gate is doing real work, not just happening to short-circuit on
    something else.
    """

    # Sanity: month must be inside _in_season_months() and outside
    # _out_of_season_months() for the assertions below to mean what they
    # say. If a future CI run happens in December, the winter hike would
    # actually be in season and the assertion would falsely pass for the
    # wrong reason. We pin via skip-on-mismatch rather than freezing the
    # clock because the production code reads ``datetime.now(UTC)``
    # directly and we don't own that path.
    if _now_month() not in _in_season_months() or _now_month() in _out_of_season_months():
        pytest.skip(
            "Test assumes current month is in [3..11] and not in [12,1,2]. "
            f"Got month={_now_month()}."
        )

    with respx.mock(assert_all_called=False, assert_all_mocked=True) as router:
        # MET returns benign weather for any lat/lon.
        router.get(
            url__startswith="https://api.met.no/weatherapi/locationforecast/2.0/compact"
        ).mock(return_value=httpx.Response(200, json=_benign_met_response()))

        # Romsdal (3023) — clean response.
        router.get(
            url__regex=r"https://api01\.nve\.no/.*/3023/.*"
        ).mock(return_value=httpx.Response(200, json=_nve_response("1")))
        # Sunnmøre (3024) — dangerous response.
        router.get(
            url__regex=r"https://api01\.nve\.no/.*/3024/.*"
        ).mock(return_value=httpx.Response(200, json=_nve_response("4")))

        with TestClient(app) as client:
            seen_clean = False
            for iteration in range(30):
                response = client.post(
                    "/api/search/random",
                    json={
                        "difficulty": ["easy", "medium", "hard"],
                        "maxTravelMinutes": 240,
                        "transport": "car",
                        "tags": [],
                        "avoid": [],
                        "rejectedHikeIds": [],
                    },
                )
                # The route returns 200 with the chosen hike, or 404 when no
                # candidate passes the safety gate. 404 is acceptable on
                # individual iterations (the randomizer picks from the
                # filtered pool, which can be empty if MET/NVE briefly times
                # out in flaky cases), but at least one 200 with the clean
                # hike must occur across the 30-call burst.
                assert response.status_code in (200, 404), (
                    f"iteration {iteration}: unexpected status "
                    f"{response.status_code}: {response.text}"
                )
                if response.status_code == 404:
                    continue
                body = response.json()
                returned_id = uuid.UUID(body["hike"]["id"])
                assert returned_id != WINTER_HIKE_ID, (
                    f"iteration {iteration}: WINTER hike leaked through "
                    "season gate — brand promise violated"
                )
                assert returned_id != DANGEROUS_HIKE_ID, (
                    f"iteration {iteration}: DANGEROUS hike (NVE level 4) "
                    "leaked through avalanche gate — brand promise violated"
                )
                assert returned_id == CLEAN_HIKE_ID, (
                    f"iteration {iteration}: unexpected hike id "
                    f"{returned_id} — only CLEAN_HIKE_ID should be safe"
                )
                seen_clean = True
            assert seen_clean, (
                "Across 30 iterations the clean hike was never returned — "
                "the test isn't exercising the happy path, so the negative "
                "assertions above are vacuous."
            )


