from __future__ import annotations

import uuid

import pytest

from app.db.models import Hike, HikeGeometry
from tests.db import TEST_DATABASE_URL, ensure_test_database


@pytest.fixture(scope="session")
def bootstrap_test_database() -> str:
    """Create ``naertur_test`` if missing and run Alembic migrations on it.

    Session-scoped so the bootstrap runs once per pytest invocation. Any DB
    test that needs the schema in place should depend on this fixture.
    Returns the test database URL so callers don't have to import it
    separately. If Postgres is unreachable, skips the dependent test rather
    than failing the whole session — laptops without Docker still pass
    unit-only runs.
    """

    try:
        ensure_test_database()
    except RuntimeError as exc:
        pytest.skip(f"Test database unavailable: {exc}")
    return TEST_DATABASE_URL


@pytest.fixture
def sample_route() -> dict:
    return {
        "id": 1950,
        "slug": "klimpan",
        "name": "Klimpan",
        "municipalities": ["Averøy"],
        "tour_type": [{"id": 0, "name": "Fottur"}],
        "seasons": ["Vår", "Sommer", "Høst"],
        "tour_description": "Fantastisk utsikt på toppen.",
        "tour_description_html": "<p>Fantastisk utsikt på toppen.</p>",
        "directions": "<p>Jevn god stigning, men ikke bratt.</p>",
        "start_point": "Parkering ved Leite.",
        "grading": [{"id": 1, "name": "Blå"}],
        "time_need": "2 t. 0 min",
        "public_transport": None,
        "conditions": {"consent_api": True},
    }


@pytest.fixture
def sample_geojson() -> dict:
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [[7.669334, 63.034165], [7.665, 63.031], [7.660, 63.030]],
        },
        "properties": {
            "id": 1950,
            "turtype": "Fottur",
            "navn": "Klimpan",
            "gradering": "Blå",
            "url": "https://morotur.no/tur/klimpan",
            "kommune": "Averøy",
        },
    }


@pytest.fixture
def sample_hike(sample_geojson: dict) -> Hike:
    hike = Hike(
        id=uuid.uuid4(),
        source="morotur",
        source_id="1950",
        source_url="https://morotur.no/tur/klimpan",
        name="Klimpan",
        municipalities=["Averøy"],
        county="Møre og Romsdal",
        difficulty="medium",
        distance_meters=2_300,
        duration_minutes=120,
        season_months=[3, 4, 5, 6, 7, 8, 9, 10, 11],
        tags=["viewpoint", "mountain", "not_steep", "under_5km"],
    )
    hike.geometry = HikeGeometry(
        hike_id=hike.id,
        route_geojson=sample_geojson,
        route=None,
        trailhead=None,
    )
    return hike
