"""End-to-end importer tests against a real Postgres/PostGIS instance.

These tests reproduce the two production bugs found in the live Morotur smoke
test (greenlet lazy-load on geometry assignment, savepoint rollback on a
malformed route) plus the seasons=[None] regression that crashed
season_months(). They require the docker-compose `db` service to be running.
If it isn't, the tests skip (rather than fail loudly) so unit-only runs on
laptops without Docker still go green.

The fixtures use a shared engine + a per-test outer transaction with a
SAVEPOINT, so each test gets full isolation without re-creating the schema.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import httpx
import pytest
import pytest_asyncio
import respx
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Hike, HikeGeometry, SourceRecord
from app.services.morotur import MoroturClient, MoroturImporter
from tests.db import TEST_DATABASE_URL

# IMPORTANT: TEST_DATABASE_URL points at ``naertur_test``, NOT ``naertur``.
# The TRUNCATE in the per-test fixture below would otherwise wipe the live
# dev importer state. ``tests/db.py`` is the single source of truth for the
# test DB connection string.

TEST_MOROTUR_BASE_URL = "https://morotur.test"


def _good_geojson(route_id: int) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [7.669334, 63.034165],
                [7.665, 63.031],
                [7.660, 63.030],
            ],
        },
        "properties": {
            "id": route_id,
            "url": f"https://morotur.no/tur/route-{route_id}",
        },
    }


def _good_route(route_id: int, seasons: list[Any] | None = None) -> dict[str, Any]:
    return {
        "id": route_id,
        "slug": f"route-{route_id}",
        "name": f"Route {route_id}",
        "municipalities": ["Averøy"],
        "seasons": seasons if seasons is not None else ["sommer", "høst"],
        "tour_description": "Fin tur med utsikt.",
        "tour_description_html": "<p>Fin tur med utsikt.</p>",
        "start_point": "Parkering.",
        "grading": [{"id": 1, "name": "Blå"}],
        "time_need": "2 t. 0 min",
        "public_transport": None,
    }


@pytest_asyncio.fixture
async def session(bootstrap_test_database: str) -> AsyncIterator[AsyncSession]:
    """Per-test engine + session.

    A fresh engine is created per test to keep asyncpg connections bound to
    the current event loop (pytest-asyncio in `auto` mode creates a new loop
    per test). If the DB is unreachable, the test is skipped rather than
    failing — laptops without Docker should still pass unit-only runs.

    Depends on ``bootstrap_test_database`` (session-scoped) to ensure
    ``naertur_test`` exists with PostGIS installed and Alembic head applied
    BEFORE any TRUNCATE runs against it. Without this, a fresh checkout
    would fail with "relation does not exist".

    We use TRUNCATE (CASCADE) for hard isolation before yielding, instead of
    a savepoint-wrapped outer transaction. The importer itself calls
    session.commit() in the unit under test, which would prematurely close
    any outer transaction we tried to wrap around it.
    """
    engine = create_async_engine(bootstrap_test_database, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        await engine.dispose()
        pytest.skip(f"Postgres unreachable for importer tests: {exc}")

    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    async with sessionmaker() as setup:
        await setup.execute(
            text("TRUNCATE TABLE safety_snapshots, hike_geometries, hikes, source_records CASCADE")
        )
        await setup.commit()
    async with sessionmaker() as s:
        try:
            yield s
        finally:
            await s.rollback()
    await engine.dispose()


def _mock_morotur(router: respx.Router, route_id: int, route: dict, geojson: dict | None) -> None:
    router.get(f"{TEST_MOROTUR_BASE_URL}/api/v2/routes/{route_id}").mock(
        return_value=httpx.Response(200, json=route)
    )
    if geojson is None:
        router.get(f"{TEST_MOROTUR_BASE_URL}/api/v2/geojson/{route_id}").mock(
            return_value=httpx.Response(200, json={})
        )
    else:
        router.get(f"{TEST_MOROTUR_BASE_URL}/api/v2/geojson/{route_id}").mock(
            return_value=httpx.Response(200, json=geojson)
        )

    # The importer also fetches the public route HTML for elevation scraping
    # (added in a parallel stream as ``_fetch_elevation`` in morotur.py).
    # Mock the slug URL so respx-strict doesn't trip on the unmocked GET.
    # We only register this when the geojson would actually let
    # upsert_route reach the elevation step — otherwise ``assert_all_called``
    # would complain that the slug mock was never hit. The malformed-geojson
    # test deliberately fails before that point and so doesn't need it.
    slug = route.get("slug")
    coordinates = (geojson or {}).get("geometry", {}).get("coordinates") or []
    if slug and len(coordinates) >= 2:
        router.get(f"{TEST_MOROTUR_BASE_URL}/tur/{slug}").mock(
            return_value=httpx.Response(200, text="")
        )


@pytest.mark.asyncio
async def test_importer_successfully_persists_good_route(session: AsyncSession) -> None:
    """Smoke-tests the happy path that 11/20 live routes failed at in Wave 1.

    Asserts: a row in hikes, a row in hike_geometries (proving the greenlet
    crash is gone), and source_records.import_status == 'ok'.
    """
    route_id = 9001
    client = MoroturClient(base_url=TEST_MOROTUR_BASE_URL)
    importer = MoroturImporter(client)

    with respx.mock(assert_all_called=True) as router:
        _mock_morotur(router, route_id, _good_route(route_id), _good_geojson(route_id))
        result = await importer.import_routes(session, [route_id])

    assert result == {
        "imported": 1,
        "failed": 0,
        "route_ids": [route_id],
        "errors": [],
    }

    hike = await session.scalar(
        select(Hike).where(Hike.source == "morotur", Hike.source_id == str(route_id))
    )
    assert hike is not None
    assert hike.name == f"Route {route_id}"
    assert hike.season_months == sorted({6, 7, 8, 9, 10, 11})

    geometry = await session.scalar(
        select(HikeGeometry).where(HikeGeometry.hike_id == hike.id)
    )
    assert geometry is not None
    assert geometry.route_geojson["geometry"]["type"] == "LineString"

    record = await session.scalar(
        select(SourceRecord).where(
            SourceRecord.source == "morotur",
            SourceRecord.source_id == str(route_id),
        )
    )
    assert record is not None
    assert record.import_status == "ok"
    assert record.error is None


@pytest.mark.asyncio
async def test_importer_handles_seasons_none_silently(session: AsyncSession) -> None:
    """seasons=[None] used to crash 7/20 routes via season.lower() on None.

    After the fix the import succeeds and season_months ends up as []."""
    route_id = 9002
    client = MoroturClient(base_url=TEST_MOROTUR_BASE_URL)
    importer = MoroturImporter(client)

    with respx.mock(assert_all_called=True) as router:
        _mock_morotur(
            router,
            route_id,
            _good_route(route_id, seasons=[None]),
            _good_geojson(route_id),
        )
        result = await importer.import_routes(session, [route_id])

    assert result["imported"] == 1
    assert result["failed"] == 0

    hike = await session.scalar(
        select(Hike).where(Hike.source == "morotur", Hike.source_id == str(route_id))
    )
    assert hike is not None
    assert hike.season_months == []


@pytest.mark.asyncio
async def test_importer_rolls_back_malformed_geojson_and_records_failure(
    session: AsyncSession,
) -> None:
    """Bug #3: a malformed GeoJSON must NOT leave an orphaned hikes row.

    Pre-fix, the Hike row was flushed before the geometry validation ran, so
    the outer commit persisted hikes with no geometry — which later crashed
    /api/search/random with AttributeError on route_geojson. Post-fix, the
    per-route savepoint rolls back the partial Hike and we still get a
    SourceRecord with import_status='failed' for diagnosis.
    """
    route_id = 9003
    client = MoroturClient(base_url=TEST_MOROTUR_BASE_URL)
    importer = MoroturImporter(client)

    bad_geojson = {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": [[7.0, 63.0]]},
        "properties": {},
    }

    with respx.mock(assert_all_called=True) as router:
        _mock_morotur(router, route_id, _good_route(route_id), bad_geojson)
        result = await importer.import_routes(session, [route_id])

    assert result["imported"] == 0
    assert result["failed"] == 1
    assert any(f"{route_id}: " in err for err in result["errors"])

    hike = await session.scalar(
        select(Hike).where(Hike.source == "morotur", Hike.source_id == str(route_id))
    )
    assert hike is None, "savepoint rollback must drop the orphaned hike row"

    record = await session.scalar(
        select(SourceRecord).where(
            SourceRecord.source == "morotur",
            SourceRecord.source_id == str(route_id),
        )
    )
    assert record is not None
    assert record.import_status == "failed"
    assert record.error is not None
    assert "at least two coordinates" in record.error
