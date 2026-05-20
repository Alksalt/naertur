from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.routes import admin as admin_module
from app.core import config as config_module
from app.core.config import limiter
from app.db.session import get_session
from app.main import app


@pytest.fixture
def fake_session() -> AsyncIterator[Any]:
    """Stub AsyncSession that satisfies the dependency but is never touched.

    The admin route raises 403 before any DB work when the token check fails;
    when the token is correct we monkeypatch the importer below so the route
    also never reaches the DB.
    """

    class _Session:
        def add(self, *_args: object, **_kwargs: object) -> None: ...

        async def commit(self) -> None: ...

        async def scalar(self, *_args: object, **_kwargs: object) -> None:
            return None

    async def _generator():  # pragma: no cover - trivial generator
        yield _Session()

    return _generator


@pytest.fixture
def override_session(fake_session) -> Any:
    app.dependency_overrides[get_session] = fake_session
    yield
    app.dependency_overrides.pop(get_session, None)


@pytest.fixture
def client(override_session) -> TestClient:
    return TestClient(app)


def _set_admin_token(monkeypatch: pytest.MonkeyPatch, token: str | None) -> None:
    config_module.get_settings.cache_clear()

    def _factory() -> config_module.Settings:
        return config_module.Settings(
            met_user_agent="naertur-test/0.1 test@naertur.example",
            admin_import_token=token,
        )

    monkeypatch.setattr(config_module, "get_settings", _factory)
    monkeypatch.setattr(admin_module, "get_settings", _factory)


def test_unset_admin_token_returns_403(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    _set_admin_token(monkeypatch, None)
    response = client.post("/api/admin/import/morotur", json={"routeIds": [], "limit": 1})
    assert response.status_code == 403
    assert "not configured" in response.json()["detail"].lower()


def test_wrong_admin_token_returns_403(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    _set_admin_token(monkeypatch, "expected-token")
    response = client.post(
        "/api/admin/import/morotur",
        json={"routeIds": [], "limit": 1},
        headers={"X-Admin-Token": "wrong-token"},
    )
    assert response.status_code == 403
    assert "invalid" in response.json()["detail"].lower()


def test_correct_admin_token_allows_request(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    _set_admin_token(monkeypatch, "expected-token")

    async def fake_discover_routes(self, limit: int = 25) -> list[Any]:
        return []

    async def fake_import_routes(
        self, session: Any, route_ids: list[int]
    ) -> dict[str, Any]:
        return {"imported": 0, "failed": 0, "route_ids": route_ids, "errors": []}

    from app.services import morotur

    monkeypatch.setattr(morotur.MoroturClient, "discover_routes", fake_discover_routes)
    monkeypatch.setattr(morotur.MoroturImporter, "import_routes", fake_import_routes)

    response = client.post(
        "/api/admin/import/morotur",
        json={"routeIds": [], "limit": 1},
        headers={"X-Admin-Token": "expected-token"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["imported"] == 0
    assert body["failed"] == 0


def test_refetch_elevation_unset_token_returns_403(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    """Fail-closed: refetch-elevation behaves like every other admin route.

    Without an admin token configured, the endpoint MUST refuse the
    request before touching the DB or Morotur. Same shape as the
    morotur-import auth checks above so a future refactor that breaks
    one will break both visibly.
    """

    _set_admin_token(monkeypatch, None)
    response = client.post(
        "/api/admin/refetch-elevation",
        json={"routeIds": []},
    )
    assert response.status_code == 403
    assert "not configured" in response.json()["detail"].lower()


def test_refetch_elevation_wrong_token_returns_403(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    _set_admin_token(monkeypatch, "expected-token")
    response = client.post(
        "/api/admin/refetch-elevation",
        json={"routeIds": []},
        headers={"X-Admin-Token": "wrong-token"},
    )
    assert response.status_code == 403
    assert "invalid" in response.json()["detail"].lower()


def test_refetch_elevation_correct_token_invokes_scrape(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    """Happy path with a mocked Morotur scrape.

    The endpoint should look up Morotur hikes, call ``_fetch_elevation``
    for each, and roll up the results. We mock the DB session to surface
    a single fake hike with a slug, and patch ``_fetch_elevation`` to
    return a non-None ascent — the response must report
    ``refetched == 1``.
    """

    _set_admin_token(monkeypatch, "expected-token")

    # Stub a Hike-like row that satisfies the loop body's attribute reads.
    class _FakeHike:
        def __init__(self) -> None:
            self.source_id = "42"
            self.slug = "fake-route"
            self.ascent_meters: int | None = None
            self.highest_point_meters: int | None = None

    fake_hike = _FakeHike()

    class _Scalars:
        def __init__(self, rows: list[Any]) -> None:
            self._rows = rows

        def all(self) -> list[Any]:
            return list(self._rows)

    class _ExecuteResult:
        def __init__(self, rows: list[Any]) -> None:
            self._rows = rows

        def scalars(self) -> _Scalars:
            return _Scalars(self._rows)

    class _Session:
        def add(self, *_args: object, **_kwargs: object) -> None: ...

        async def commit(self) -> None: ...

        async def scalar(self, *_args: object, **_kwargs: object) -> None:
            return None

        async def execute(self, *_args: object, **_kwargs: object) -> _ExecuteResult:
            return _ExecuteResult([fake_hike])

    async def _override_session() -> AsyncIterator[Any]:  # pragma: no cover - trivial
        yield _Session()

    app.dependency_overrides[get_session] = _override_session

    async def fake_fetch_elevation(self, slug: str | None) -> tuple[int | None, int | None]:
        return 320, 540

    from app.services import morotur

    monkeypatch.setattr(
        morotur.MoroturImporter, "_fetch_elevation", fake_fetch_elevation
    )

    try:
        response = client.post(
            "/api/admin/refetch-elevation",
            json={},
            headers={"X-Admin-Token": "expected-token"},
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["refetched"] == 1
    assert body["failed"] == 0
    assert body["skipped"] == 0
    assert body["routeIds"] == [42]
    # The mocked scrape MUST have actually written to the hike row.
    assert fake_hike.ascent_meters == 320
    assert fake_hike.highest_point_meters == 540


def test_refetch_elevation_rate_limited_after_five_per_minute(
    monkeypatch: pytest.MonkeyPatch, override_session: None
) -> None:
    """``/api/admin/refetch-elevation`` shares Morotur import's 5/min cap.

    Replays the existing import_morotur rate-limit pattern: the first
    five requests succeed (with a mocked, immediately-empty hike list)
    and the sixth comes back 429. Reset the limiter store before and
    after so we don't observe / leave residue from sibling tests.
    """

    _set_admin_token(monkeypatch, "expected-token")

    class _EmptyScalars:
        def all(self) -> list[Any]:
            return []

    class _EmptyExecuteResult:
        def scalars(self) -> _EmptyScalars:
            return _EmptyScalars()

    class _EmptySession:
        def add(self, *_args: object, **_kwargs: object) -> None: ...

        async def commit(self) -> None: ...

        async def scalar(self, *_args: object, **_kwargs: object) -> None:
            return None

        async def execute(self, *_args: object, **_kwargs: object) -> _EmptyExecuteResult:
            return _EmptyExecuteResult()

    async def _override_session() -> AsyncIterator[Any]:  # pragma: no cover - trivial
        yield _EmptySession()

    app.dependency_overrides[get_session] = _override_session

    limiter.reset()
    try:
        with TestClient(app) as c:
            statuses: list[int] = []
            for _ in range(6):
                response = c.post(
                    "/api/admin/refetch-elevation",
                    json={},
                    headers={"X-Admin-Token": "expected-token"},
                )
                statuses.append(response.status_code)
        assert statuses[:5] == [200, 200, 200, 200, 200], (
            f"First five requests must succeed; got {statuses[:5]}"
        )
        assert statuses[5] == 429, (
            f"Sixth request must be rate-limited; got {statuses[5]}"
        )
    finally:
        limiter.reset()
        app.dependency_overrides.pop(get_session, None)


def test_import_morotur_rate_limited_after_five_per_minute(
    monkeypatch: pytest.MonkeyPatch, override_session: None
) -> None:
    """``/api/admin/import/morotur`` is rate-limited at 5/minute.

    Hammer the endpoint six times with a valid admin token and a
    successful (mocked) import path. The first five must return 200; the
    sixth must come back 429 with a ``Retry-After`` header, proving that
    slowapi is wired into the FastAPI exception handler defined in
    ``app/main.py``.

    Lifespan note: this test uses ``with TestClient(app) as c:`` (rather
    than the bare-construction pattern in the auth tests above) so the
    FastAPI startup events run. The rate limiter binding lives in
    ``app/main.py`` and only the ``with``-block form of TestClient runs
    those startup paths.

    State note: ``slowapi.Limiter`` defaults to in-memory storage that
    persists for the lifetime of the process. Other tests in the suite
    can leak counter state into this one (and vice-versa); we reset the
    limiter store before AND after this test so the assertions are
    deterministic regardless of test ordering.
    """

    _set_admin_token(monkeypatch, "expected-token")

    async def fake_import_routes(
        self, session: Any, route_ids: list[int]
    ) -> dict[str, Any]:
        return {"imported": 0, "failed": 0, "route_ids": route_ids, "errors": []}

    from app.services import morotur

    monkeypatch.setattr(morotur.MoroturImporter, "import_routes", fake_import_routes)

    # Reset the limiter's in-memory storage so any previous test's calls
    # against /api/admin/import/morotur are not counted against our budget.
    limiter.reset()
    try:
        with TestClient(app) as client:
            statuses = []
            for _ in range(6):
                response = client.post(
                    "/api/admin/import/morotur",
                    json={"routeIds": [1], "limit": 1},
                    headers={"X-Admin-Token": "expected-token"},
                )
                statuses.append(response.status_code)
        assert statuses[:5] == [200, 200, 200, 200, 200], (
            f"First five requests must succeed; got {statuses[:5]}"
        )
        assert statuses[5] == 429, (
            f"Sixth request must be rate-limited; got {statuses[5]}"
        )
    finally:
        # Tidy up so a later test doesn't observe our exhausted budget.
        limiter.reset()
