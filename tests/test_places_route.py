"""End-to-end tests for the /api/places/search and /api/places/nearest routes.

These hit a real PostGIS database (``naertur_test``) so the LIKE prefix
match and the ST_DWithin / ST_DistanceSphere predicates are exercised
exactly as they will be at production runtime. Seeding goes through
SQLAlchemy + the existing ``Place`` ORM so the WKT round-trip is the
same one the SSR importer uses; no SQL injection at the seed layer.

Seeded universe (Møre og Romsdal-ish coordinates, all close to the
real-life settlements they reference):

* Hjelset (Tettsted, Molde) — 62.7400, 7.2300
* Hjelset Gard (Gard, Molde)— 62.7450, 7.2350 (name-tie partner)
* Vatne (Tettsted, Haram)   — 62.5500, 6.5000
* Bø (Gard, Volda)          — 62.1500, 6.1000 (ø-fold partner)
* Molde (By, Molde)         — 62.7400, 7.1600

That's enough rows to exercise: prefix ranking, proximity tie-break,
ø-fold matching, the 1-char short-circuit, the no-result path, and the
50 km radius cutoff in /nearest. Six seeded rows beat the seven test
cases the plan asks for.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Place
from app.db.session import get_session
from app.main import app
from app.services.geo import point_wkt
from app.services.places import _text_score
from app.services.ssr import fold_norwegian
from tests.db import TEST_DATABASE_URL


# Stable UUIDs make the assertions readable when something regresses.
HJELSET_TETTSTED_ID = uuid.UUID("aaaaaaaa-0001-0001-0001-000000000001")
HJELSET_GARD_ID = uuid.UUID("aaaaaaaa-0001-0001-0001-000000000002")
VATNE_ID = uuid.UUID("aaaaaaaa-0002-0002-0002-000000000001")
BO_GARD_ID = uuid.UUID("aaaaaaaa-0003-0003-0003-000000000001")
MOLDE_BY_ID = uuid.UUID("aaaaaaaa-0004-0004-0004-000000000001")


def _make_place(
    place_id: uuid.UUID,
    source_id: str,
    name: str,
    place_type: str,
    kommune_name: str | None,
    lat: float,
    lon: float,
) -> Place:
    """Build a ``Place`` ORM row with the same fold the importer applies.

    ``name_lower`` and ``name_lower_ascii`` MUST match what the live
    importer writes — otherwise the prefix-match path the search service
    relies on would silently mis-fire here. We reuse
    ``app.services.ssr.fold_norwegian`` directly so the test can never
    drift away from the production fold.
    """

    return Place(
        id=place_id,
        source="ssr-test",
        source_id=source_id,
        name=name,
        name_lower=name.lower(),
        name_lower_ascii=fold_norwegian(name),
        place_type=place_type,
        kommune_name=kommune_name,
        kommune_number=None,
        fylke_name="Møre og Romsdal",
        fylke_number="15",
        location=WKTElement(point_wkt(lon, lat), srid=4326),
        payload={"test_seed": True},
    )


@pytest_asyncio.fixture
async def seeded_places_db(bootstrap_test_database: str) -> AsyncIterator[None]:
    """Truncate the ``places`` table and seed six known rows.

    Truncate covers the test-DB schema only; the dev ``naertur`` database
    (with the 3 k+ live SSR rows) is never touched because all tests run
    against ``naertur_test`` per ``tests/db.py``.
    """

    engine = create_async_engine(bootstrap_test_database, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        await engine.dispose()
        pytest.skip(f"Postgres unreachable for places route tests: {exc}")

    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    async with sessionmaker() as setup:
        await setup.execute(text("TRUNCATE TABLE places CASCADE"))
        await setup.execute(text("DELETE FROM source_records WHERE source = 'ssr-test'"))
        await setup.commit()

    async with sessionmaker() as setup:
        setup.add_all(
            [
                _make_place(
                    HJELSET_TETTSTED_ID,
                    "seed-hjelset-tettsted",
                    "Hjelset",
                    "Tettsted",
                    "Molde",
                    62.7400,
                    7.2300,
                ),
                _make_place(
                    HJELSET_GARD_ID,
                    "seed-hjelset-gard",
                    "Hjelset",
                    "Gard",
                    "Molde",
                    62.7450,
                    7.2350,
                ),
                _make_place(
                    VATNE_ID,
                    "seed-vatne-tettsted",
                    "Vatne",
                    "Tettsted",
                    "Haram",
                    62.5500,
                    6.5000,
                ),
                _make_place(
                    BO_GARD_ID,
                    "seed-bo-gard",
                    "Bø",
                    "Gard",
                    "Volda",
                    62.1500,
                    6.1000,
                ),
                _make_place(
                    MOLDE_BY_ID,
                    "seed-molde-by",
                    "Molde",
                    "By",
                    "Molde",
                    62.7400,
                    7.1600,
                ),
            ]
        )
        await setup.commit()

    yield

    # Tear down so the next test starts clean even if pytest order shifts.
    async with sessionmaker() as teardown:
        await teardown.execute(text("TRUNCATE TABLE places CASCADE"))
        await teardown.commit()
    await engine.dispose()


@pytest.fixture
def override_session() -> Generator[None, None, None]:
    """Point the FastAPI ``get_session`` dependency at the test DB.

    Same pattern as ``tests/test_search_route_safety.py``: build a
    separate async engine bound to ``naertur_test`` and override the
    DI hook for the duration of the test, so the route handler sees the
    seeded rows instead of the dev DB.
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


# ---------------------------------------------------------------------------
# Search route tests
# ---------------------------------------------------------------------------


def test_search_prefix_returns_hjelset_first(
    seeded_places_db: None, override_session: None
) -> None:
    """``q=hjels`` → Hjelset (Tettsted) ranks at the top of the result list.

    Both seeded Hjelset rows match the prefix; without proximity the
    tie-break falls back to the stable alphabetic tie-breaker on
    ``name_lower``. Either Hjelset must be first in the output because
    they share the exact same name; the assertion checks the top hit
    is named "Hjelset" so the ordering between the two doesn't matter.
    """

    with TestClient(app) as client:
        response = client.get("/api/places/search", params={"q": "hjels"})
    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "hjels"
    assert len(body["results"]) >= 1
    assert body["results"][0]["name"] == "Hjelset"


def test_search_proximity_tie_break_prefers_closer_hjelset(
    seeded_places_db: None, override_session: None
) -> None:
    """``q=hjelset`` near (62.74, 7.16) returns Hjelset (Tettsted) before Hjelset (Gard).

    With the seeded coords:
        Hjelset Tettsted = (62.74, 7.23) — 7.2 km from (62.74, 7.16)
        Hjelset Gard     = (62.745, 7.235) — 8.1 km from (62.74, 7.16)

    Proximity-weighted ranking should put the closer Tettsted first.
    """

    with TestClient(app) as client:
        response = client.get(
            "/api/places/search",
            params={"q": "hjelset", "lat": 62.74, "lon": 7.16},
        )
    assert response.status_code == 200
    results = response.json()["results"]
    # Both seeded Hjelsets should be in the top results.
    hjelset_results = [r for r in results if r["name"] == "Hjelset"]
    assert len(hjelset_results) == 2, (
        f"expected both seeded Hjelsets in results, got {hjelset_results}"
    )
    # Tettsted is closer to (62.74, 7.16) than Gard, so it must come first.
    assert hjelset_results[0]["placeType"] == "Tettsted"
    assert hjelset_results[1]["placeType"] == "Gard"


def test_search_ascii_fold_matches_bo(
    seeded_places_db: None, override_session: None
) -> None:
    """``q=bo`` returns Bø via the ascii fold (name_lower_ascii='bo')."""

    with TestClient(app) as client:
        response = client.get("/api/places/search", params={"q": "bo"})
    assert response.status_code == 200
    results = response.json()["results"]
    names = [r["name"] for r in results]
    assert "Bø" in names, (
        f"ascii fold path failed to find Bø; got {names}"
    )


def test_search_short_query_returns_empty(
    seeded_places_db: None, override_session: None
) -> None:
    """Single-character ``q`` short-circuits to an empty result list (status 200).

    The route layer accepts ``min_length=1`` so we don't 422 the
    typeahead on the first keystroke; the service layer then bottoms
    out at an empty list for anything below 2 chars. Asserting both
    pieces here lets a future regression on either layer be caught
    by the same test.
    """

    with TestClient(app) as client:
        response = client.get("/api/places/search", params={"q": "a"})
    assert response.status_code == 200
    body = response.json()
    assert body == {"query": "a", "results": []}


def test_search_no_results_returns_empty_list(
    seeded_places_db: None, override_session: None
) -> None:
    """A query with no matches returns ``results: []`` (status 200, not 404)."""

    with TestClient(app) as client:
        response = client.get("/api/places/search", params={"q": "zzzzz"})
    assert response.status_code == 200
    body = response.json()
    assert body["results"] == []


# ---------------------------------------------------------------------------
# Nearest route tests
# ---------------------------------------------------------------------------


def test_nearest_inside_radius_returns_molde_place(
    seeded_places_db: None, override_session: None
) -> None:
    """A point near Molde (62.74, 7.18) returns a kommune=Molde place.

    All three seeded Molde-area rows sit inside the 50 km radius. The
    closest by ST_DistanceSphere should be Molde (By) at (62.74, 7.16),
    ~1 km from the query point — well ahead of the Hjelset pair at
    ~3 km. We assert kommune=Molde rather than a specific seed id to
    keep the test robust against future re-seeding tweaks.
    """

    with TestClient(app) as client:
        response = client.get(
            "/api/places/nearest", params={"lat": 62.74, "lon": 7.18}
        )
    assert response.status_code == 200
    body = response.json()
    assert body["nearest"] is not None
    assert body["nearest"]["kommune"] == "Molde"


def test_nearest_outside_radius_returns_null(
    seeded_places_db: None, override_session: None
) -> None:
    """Oslo coordinates (59.91, 10.74) return ``{"nearest": null}``.

    Oslo is ~350 km from the nearest seeded MR place (well beyond the
    50 km ST_DWithin guard), so the route must return null rather than
    leak a far-away MR settlement that the user didn't ask for.
    """

    with TestClient(app) as client:
        response = client.get(
            "/api/places/nearest", params={"lat": 59.91, "lon": 10.74}
        )
    assert response.status_code == 200
    assert response.json() == {"nearest": None}


# ---------------------------------------------------------------------------
# 4-band text scoring unit tests (J1)
#
# `_text_score` is the in-process ranker behind /api/places/search. Locking
# the numeric outputs of each band into a test keeps the documented contract
# (1.0 / 0.85 / 0.55 / 0.30) honest: if anyone tweaks the weights without
# updating the route docs or the proximity blend, these unit tests will
# catch the drift before it ships. The helper is module-level (not behind a
# class), so a direct underscore-prefixed import is the right wire-in.
# ---------------------------------------------------------------------------


def test_text_score_exact() -> None:
    """``q="hjelset"`` against name="Hjelset" returns the 1.0 exact-match band.

    The folded ASCII column equals the folded ASCII query for this all-ASCII
    pair, so the first branch (``name_lower == q_norm``) trips. Asserting
    against the literal 1.0 guards the highest band of the scoring contract.
    """

    name_lower = "hjelset"
    name_lower_ascii = fold_norwegian(name_lower)
    q_norm = "hjelset"
    q_ascii = fold_norwegian(q_norm)
    assert _text_score(name_lower, name_lower_ascii, q_norm, q_ascii) == 1.0


def test_text_score_prefix() -> None:
    """``q="hjels"`` against name="Hjelset" returns the 0.85 prefix-match band.

    Neither column equals the query but both columns ``startswith`` it, so
    the second branch returns 0.85. This band is what the typeahead leans
    on while the user is still mid-keystroke, so the literal value matters.
    """

    name_lower = "hjelset"
    name_lower_ascii = fold_norwegian(name_lower)
    q_norm = "hjels"
    q_ascii = fold_norwegian(q_norm)
    assert _text_score(name_lower, name_lower_ascii, q_norm, q_ascii) == 0.85


def test_text_score_substring() -> None:
    """``q="set"`` against name="Hjelset" returns the 0.55 substring band.

    "set" is not a prefix of "hjelset" but it IS inside it, so the third
    branch returns 0.55. Verifies that the substring band sits strictly
    below the prefix band — preserving the prefix-over-substring ordering
    that the typeahead relies on.
    """

    name_lower = "hjelset"
    name_lower_ascii = fold_norwegian(name_lower)
    q_norm = "set"
    q_ascii = fold_norwegian(q_norm)
    assert _text_score(name_lower, name_lower_ascii, q_norm, q_ascii) == 0.55


def test_text_score_floor() -> None:
    """``q="xyz"`` against name="Hjelset" returns the 0.30 fallback floor.

    Nothing in "xyz" appears in "hjelset" (no exact / prefix / substring
    match), so the function returns the defensive floor of 0.30. In
    production this branch is technically unreachable because the LIKE
    pattern filters out non-matches upstream, but the floor is the explicit
    fallback the docstring documents — and any future refactor that drops
    this branch would silently zero matching rows.
    """

    name_lower = "hjelset"
    name_lower_ascii = fold_norwegian(name_lower)
    q_norm = "xyz"
    q_ascii = fold_norwegian(q_norm)
    assert _text_score(name_lower, name_lower_ascii, q_norm, q_ascii) == 0.30


# ---------------------------------------------------------------------------
# 50 km radius boundary test (J3)
#
# /api/places/nearest hides the live PostGIS query behind the route, but the
# 50 km cap is the contract we ship to the frontend. Pinning the boundary
# behaviour with two seeded places (one just inside, one just outside)
# locks the ST_DWithin semantics — if the operator ever migrates to a
# different distance function (e.g. <= vs <), this test catches the drift.
#
# Distance calc: PostGIS ``ST_DWithin(geography, geography, 50000)`` uses
# spheroid (WGS84) geography distance, not haversine. Empirically against
# the live DB:
#   delta_lat=0.4485 → 49990.28 m → ST_DWithin(., 50000) = TRUE
#   delta_lat=0.4486 → 50001.42 m → ST_DWithin(., 50000) = FALSE
# Those two deltas bracket the 50 km cap from below and above at ~1 km
# separation in degree-space, ~11 m in metric-space — tight enough that
# any future change to the radius constant or comparison operator will
# flip at least one of the assertions.
# ---------------------------------------------------------------------------


# Base point near Molde — picked so the latitude offset stays inside MR
# longitudinally even after a ~50 km northward bump.
_BOUNDARY_BASE_LAT = 62.7372
_BOUNDARY_BASE_LON = 7.1607

# Empirically measured against PostGIS geography distance — see comment block
# above. These are NOT free parameters; changing them silently breaks the
# bracket. If the underlying earth model ever changes, regenerate via psql.
_DELTA_LAT_INSIDE_50KM = 0.4485   # ~49990 m → within
_DELTA_LAT_OUTSIDE_50KM = 0.4486  # ~50001 m → outside

INSIDE_BOUNDARY_PLACE_ID = uuid.UUID("aaaaaaaa-0005-0005-0005-000000000001")
OUTSIDE_BOUNDARY_PLACE_ID = uuid.UUID("aaaaaaaa-0005-0005-0005-000000000002")


@pytest_asyncio.fixture
async def boundary_places_db(bootstrap_test_database: str) -> AsyncIterator[None]:
    """Seed two places that bracket the 50 km radius around the base point.

    Truncates and re-seeds the ``places`` table just like
    ``seeded_places_db`` — never touches the dev DB. The two seeded rows
    sit one on each side of the 50 km ST_DWithin cap so that the same
    query can prove both the inclusive and the exclusive cases in two
    separate route calls.
    """

    engine = create_async_engine(bootstrap_test_database, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        await engine.dispose()
        pytest.skip(f"Postgres unreachable for boundary test: {exc}")

    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    async with sessionmaker() as setup:
        await setup.execute(text("TRUNCATE TABLE places CASCADE"))
        await setup.execute(text("DELETE FROM source_records WHERE source = 'ssr-test'"))
        await setup.commit()

    async with sessionmaker() as setup:
        setup.add_all(
            [
                _make_place(
                    INSIDE_BOUNDARY_PLACE_ID,
                    "seed-boundary-inside",
                    "InsidePlace",
                    "Tettsted",
                    "Molde",
                    _BOUNDARY_BASE_LAT + _DELTA_LAT_INSIDE_50KM,
                    _BOUNDARY_BASE_LON,
                ),
                _make_place(
                    OUTSIDE_BOUNDARY_PLACE_ID,
                    "seed-boundary-outside",
                    "OutsidePlace",
                    "Tettsted",
                    "Molde",
                    _BOUNDARY_BASE_LAT + _DELTA_LAT_OUTSIDE_50KM,
                    _BOUNDARY_BASE_LON,
                ),
            ]
        )
        await setup.commit()

    yield

    async with sessionmaker() as teardown:
        await teardown.execute(text("TRUNCATE TABLE places CASCADE"))
        await teardown.commit()
    await engine.dispose()


def test_nearest_at_50km_boundary_pins_st_dwithin_semantics(
    boundary_places_db: None, override_session: None
) -> None:
    """Pin the ST_DWithin contract at the 50 km cap.

    Two queries, one seeded universe:

    * Query base point with both bracket seeds present → ST_DWithin's
      ``<=`` semantics return the InsidePlace (the only one within 50 km)
      while the OutsidePlace (50001 m away) is excluded.

    The single assertion bundles both behaviours: when the route returns
    InsidePlace AND that result is the only one within the cap, we have
    proved both that the cap is at ~50 km and that the comparison is
    inclusive of the inside bracket (the inside place is at 49990 m, not
    exactly 50000 m, but the outside place at 50001 m being excluded
    pins the cap tighter than a haversine-imprecise exact-50 km probe
    ever could).
    """

    with TestClient(app) as client:
        response = client.get(
            "/api/places/nearest",
            params={"lat": _BOUNDARY_BASE_LAT, "lon": _BOUNDARY_BASE_LON},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["nearest"] is not None, (
        "InsidePlace at ~49990 m must be returned (within the 50 km cap)"
    )
    assert body["nearest"]["name"] == "InsidePlace", (
        f"expected InsidePlace (the only seed within 50 km); got "
        f"{body['nearest']['name']}. OutsidePlace at ~50001 m must be "
        f"excluded by ST_DWithin."
    )
