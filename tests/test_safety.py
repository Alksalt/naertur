from __future__ import annotations

from datetime import UTC, datetime

import httpx
import pytest
import respx

from app.services.met import MetClient, MetUnavailable
from app.services.safety import SafetyService, _slim_met_payload


def test_season_gate_blocks_outside_recommended_season(sample_hike) -> None:
    result = SafetyService.evaluate_season(sample_hike, datetime(2026, 1, 15, tzinfo=UTC))
    assert result.status == "not_recommended_now"
    assert "outside_recommended_season" in result.reasons


def test_weather_flags_check_conditions() -> None:
    forecast = {
        "properties": {
            "timeseries": [
                {
                    "data": {
                        "instant": {"details": {"wind_speed": 16, "air_temperature": 2}},
                        "next_1_hours": {"details": {"precipitation_amount": 0}},
                    }
                }
            ]
        }
    }
    risk = SafetyService.evaluate_weather(forecast)
    assert risk.status == "check_conditions"
    assert "strong_wind_forecast" in risk.reasons


def test_avalanche_high_danger_blocks() -> None:
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "4"})
    assert risk.status == "not_recommended_now"
    assert "avalanche_warning_high" in risk.reasons


def test_avalanche_moderate_danger_warns() -> None:
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "3"})
    assert risk.status == "check_conditions"
    assert "avalanche_warning_moderate" in risk.reasons


def test_avalanche_low_danger_recommends() -> None:
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "1"})
    assert risk.status == "recommended_today"
    assert "no_avalanche_warning_flags" in risk.reasons


def test_avalanche_missing_record_is_unavailable() -> None:
    risk = SafetyService.evaluate_avalanche(None)
    assert risk.status == "check_conditions"
    assert "avalanche_data_unavailable" in risk.reasons


def test_avalanche_zero_level_is_no_rating_today() -> None:
    # DangerLevel="0" is NVE's "no rating issued today" signal (normal during
    # the non-avalanche season). It is distinct from a service failure and
    # gets its own reason so the audit trail / UI can tell them apart.
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "0"})
    assert risk.status == "check_conditions"
    assert "avalanche_no_rating_today" in risk.reasons
    assert "avalanche_data_unavailable" not in risk.reasons


def test_avalanche_unparseable_level_is_unavailable() -> None:
    # A garbage / non-numeric DangerLevel is treated as a failure mode,
    # not as "no rating today" — we genuinely cannot interpret it.
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "wat"})
    assert risk.status == "check_conditions"
    assert "avalanche_data_unavailable" in risk.reasons


def test_merge_statuses_prefers_worst() -> None:
    assert (
        SafetyService.merge_statuses(
            ["recommended_today", "check_conditions", "not_recommended_now"]
        )
        == "not_recommended_now"
    )
    assert (
        SafetyService.merge_statuses(["recommended_today", "check_conditions"])
        == "check_conditions"
    )
    assert SafetyService.merge_statuses(["recommended_today"]) == "recommended_today"


def test_slim_met_payload_truncates_timeseries() -> None:
    forecast = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [6.0, 62.0, 0]},
        "properties": {
            "meta": {
                "updated_at": "2026-05-20T00:00:00Z",
                "units": {"air_temperature": "celsius"},
            },
            "timeseries": [{"i": i} for i in range(48)],
        },
    }
    slim = _slim_met_payload(forecast)
    assert "geometry" not in slim
    assert len(slim["properties"]["timeseries"]) == 12
    assert slim["properties"]["meta"] == {"updated_at": "2026-05-20T00:00:00Z"}


@pytest.mark.asyncio
async def test_met_client_429_with_retry_after_retries_once() -> None:
    client = MetClient(user_agent="naertur-test/0.1 test@naertur.example")
    try:
        with respx.mock(assert_all_called=True) as router:
            route = router.get(
                "https://api.met.no/weatherapi/locationforecast/2.0/compact"
            ).mock(
                side_effect=[
                    httpx.Response(429, headers={"Retry-After": "1"}),
                    httpx.Response(200, json={"properties": {"timeseries": []}}),
                ]
            )
            result = await client.locationforecast(62.4, 6.1)
            assert result == {"properties": {"timeseries": []}}
            assert route.call_count == 2
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_met_client_429_without_retry_after_raises_unavailable() -> None:
    client = MetClient(user_agent="naertur-test/0.1 test@naertur.example")
    try:
        with respx.mock(assert_all_called=True) as router:
            router.get(
                "https://api.met.no/weatherapi/locationforecast/2.0/compact"
            ).mock(return_value=httpx.Response(429))
            with pytest.raises(MetUnavailable):
                await client.locationforecast(62.4, 6.1)
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_met_client_5xx_raises_unavailable() -> None:
    client = MetClient(user_agent="naertur-test/0.1 test@naertur.example")
    try:
        with respx.mock(assert_all_called=True) as router:
            router.get(
                "https://api.met.no/weatherapi/locationforecast/2.0/compact"
            ).mock(return_value=httpx.Response(503))
            with pytest.raises(MetUnavailable):
                await client.locationforecast(62.4, 6.1)
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_met_client_network_error_raises_unavailable() -> None:
    client = MetClient(user_agent="naertur-test/0.1 test@naertur.example")
    try:
        with respx.mock(assert_all_called=True) as router:
            router.get(
                "https://api.met.no/weatherapi/locationforecast/2.0/compact"
            ).mock(side_effect=httpx.ConnectError("boom"))
            with pytest.raises(MetUnavailable):
                await client.locationforecast(62.4, 6.1)
    finally:
        await client.aclose()


def test_met_user_agent_rejects_example_com() -> None:
    from pydantic import ValidationError

    from app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(met_user_agent="NaerTur/0.1 dev@example.com")


def test_met_user_agent_rejects_whitespace() -> None:
    from pydantic import ValidationError

    from app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(met_user_agent="   ")


def test_met_client_refuses_to_init_without_user_agent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The MET client must refuse to initialise without a User-Agent.

    The project ``.env`` ships ``MET_USER_AGENT`` set to a real value, and
    ``pydantic-settings`` reads ``.env`` on top of OS env vars. Just calling
    ``monkeypatch.delenv("MET_USER_AGENT")`` is therefore not enough — the
    ``.env`` file would still be consulted by the next ``Settings()`` call.

    We instead build a Settings instance with ``_env_file=None`` (disabling
    the ``.env`` lookup entirely) and combine it with
    ``monkeypatch.delenv`` so the OS env is also clean. ``get_settings``'
    ``@lru_cache`` is replaced via ``monkeypatch.setattr`` at both the
    config module AND the ``app.services.met`` module's import site (the
    ``from`` import binds a separate reference to the function). The
    monkeypatch is torn down automatically by pytest, restoring the original
    cached settings for subsequent tests in the same process.
    """

    from app.core import config as config_module
    from app.services import met as met_module

    monkeypatch.delenv("MET_USER_AGENT", raising=False)
    config_module.get_settings.cache_clear()

    def _no_user_agent_settings() -> config_module.Settings:
        return config_module.Settings(_env_file=None, met_user_agent=None)

    monkeypatch.setattr(config_module, "get_settings", _no_user_agent_settings)
    monkeypatch.setattr(met_module, "get_settings", _no_user_agent_settings)

    with pytest.raises(RuntimeError, match="MET User-Agent is not configured"):
        MetClient(user_agent=None)

    # Monkeypatch teardown restores both the ``get_settings`` rebind and the
    # ``MET_USER_AGENT`` env var. We don't need an explicit cache_clear()
    # here because the cleared LRU cache will recompute on next access and
    # see the restored env value at that point.


@pytest.mark.asyncio
async def test_search_service_aclose_closes_underlying_clients_and_is_idempotent() -> None:
    """SearchService.aclose() must propagate through SafetyService into MET+NVE.

    Pre-fix, app.state.search_service was never closed on shutdown — the
    Wave-1 ``aclose()`` methods on MetClient/NveClient existed but were
    never called. This test verifies the lifecycle plumbing now actually
    fires, and that calling aclose() twice (e.g. on a degraded shutdown
    path) does not raise.
    """

    from app.services.nve import NveClient
    from app.services.safety import SafetyService
    from app.services.search import SearchService

    met_client = MetClient(user_agent="naertur-test/0.1 test@naertur.example")
    nve_client = NveClient(lang_key=2)
    safety_service = SafetyService(met_client=met_client, nve_client=nve_client)
    service = SearchService(safety_service=safety_service)

    assert not met_client._client.is_closed
    assert not nve_client._client.is_closed

    await service.aclose()

    assert met_client._client.is_closed
    assert nve_client._client.is_closed

    # Idempotent: a second aclose() must not raise even though both clients
    # are already closed. asyncio.gather(return_exceptions=True) swallows
    # any RuntimeError from re-closing an already-closed httpx client.
    await service.aclose()
