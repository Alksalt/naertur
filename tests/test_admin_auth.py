from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.routes import admin as admin_module
from app.core import config as config_module
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
