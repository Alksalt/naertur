from __future__ import annotations

from datetime import date

import httpx
import pytest
import respx

from app.services.nve import (
    NVE_BASE_URL,
    INDRE_FJORDANE_REGION_ID,
    NveClient,
    NveUnavailable,
    ROMSDAL_REGION_ID,
    SUNNMORE_REGION_ID,
    TROLLHEIMEN_REGION_ID,
    region_id_for_trailhead,
    slim_nve_payload,
)
from app.services.safety import SafetyService


def _url_for(region_id: int, lang_key: int, day: date) -> str:
    iso = day.isoformat()
    return (
        f"{NVE_BASE_URL}/AvalancheWarningByRegion/Simple/"
        f"{region_id}/{lang_key}/{iso}/{iso}"
    )


def test_region_lookup_sunnmore() -> None:
    # Ålesund area.
    assert region_id_for_trailhead(62.47, 6.15) == SUNNMORE_REGION_ID


def test_region_lookup_romsdal() -> None:
    # Molde area.
    assert region_id_for_trailhead(62.74, 7.16) == ROMSDAL_REGION_ID


def test_region_lookup_trollheimen() -> None:
    # Sunndal / Trollheimen.
    assert region_id_for_trailhead(62.80, 9.20) == TROLLHEIMEN_REGION_ID


def test_region_lookup_indre_fjordane() -> None:
    # Loen / Stryn area.
    assert region_id_for_trailhead(61.85, 7.10) == INDRE_FJORDANE_REGION_ID


def test_region_lookup_outside_returns_none() -> None:
    # Oslo — well outside Møre og Romsdal bounding boxes.
    assert region_id_for_trailhead(59.91, 10.75) is None


def test_region_lookup_former_overlap_resolves_to_sunnmore() -> None:
    # Prior to 2026-05-20 the Sunnmøre (lat 62.00–62.55, lon 5.40–7.40) and
    # Romsdal (lat 62.30–63.10, lon 6.80–8.90) bboxes overlapped in lat
    # 62.30–62.55, lon 6.80–7.40 — declaration order silently handed those
    # trailheads to Sunnmøre, but that was a coincidence, not a decision.
    # Romsdal's lat_min was raised to 62.55 (south of its southernmost
    # settled trailheads at Åndalsnes / Eresfjord) so the formerly-overlap
    # zone unambiguously belongs to Sunnmøre — which is the geographically
    # correct region for inner Storfjorden / Stranda municipality.
    assert region_id_for_trailhead(62.45, 7.0) == SUNNMORE_REGION_ID
    # And a clearly-Romsdal coordinate north of the new boundary still
    # resolves to Romsdal.
    assert region_id_for_trailhead(62.60, 7.0) == ROMSDAL_REGION_ID


def test_slim_nve_payload_strips_extra_fields() -> None:
    record = {
        "RegId": 464618,
        "RegionId": 3024,
        "RegionName": "Sunnmøre",
        "DangerLevel": "2",
        "MainText": "blah",
        "ValidFrom": "2026-05-20T00:00:00",
        "ValidTo": "2026-05-20T23:59:59",
        "PublishTime": "2026-05-19T15:31:42.023",
        "NextWarningTime": "2026-05-21T16:00:00",
    }
    slim = slim_nve_payload(record)
    assert set(slim.keys()) == {
        "DangerLevel",
        "MainText",
        "RegionId",
        "ValidFrom",
        "ValidTo",
    }
    assert slim["DangerLevel"] == "2"


@pytest.mark.asyncio
async def test_nve_client_returns_first_record_for_day() -> None:
    client = NveClient(lang_key=2)
    day = date(2026, 5, 20)
    try:
        with respx.mock(assert_all_called=True) as router:
            router.get(_url_for(SUNNMORE_REGION_ID, 2, day)).mock(
                return_value=httpx.Response(
                    200,
                    json=[{"RegionId": SUNNMORE_REGION_ID, "DangerLevel": "2"}],
                )
            )
            record = await client.avalanche_warning(SUNNMORE_REGION_ID, day)
            assert record is not None
            assert record["DangerLevel"] == "2"
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_nve_client_empty_response_is_none() -> None:
    client = NveClient(lang_key=2)
    day = date(2026, 5, 20)
    try:
        with respx.mock(assert_all_called=True) as router:
            router.get(_url_for(SUNNMORE_REGION_ID, 2, day)).mock(
                return_value=httpx.Response(200, json=[])
            )
            record = await client.avalanche_warning(SUNNMORE_REGION_ID, day)
            assert record is None
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_nve_client_503_raises_unavailable() -> None:
    client = NveClient(lang_key=2)
    day = date(2026, 5, 20)
    try:
        with respx.mock(assert_all_called=True) as router:
            router.get(_url_for(SUNNMORE_REGION_ID, 2, day)).mock(
                return_value=httpx.Response(503)
            )
            with pytest.raises(NveUnavailable):
                await client.avalanche_warning(SUNNMORE_REGION_ID, day)
    finally:
        await client.aclose()


def test_evaluate_avalanche_level_4_is_blocked() -> None:
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "4"})
    assert risk.status == "not_recommended_now"
    assert "avalanche_warning_high" in risk.reasons


def test_evaluate_avalanche_level_3_is_warning() -> None:
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "3"})
    assert risk.status == "check_conditions"
    assert "avalanche_warning_moderate" in risk.reasons


def test_evaluate_avalanche_level_1_is_recommended() -> None:
    risk = SafetyService.evaluate_avalanche({"DangerLevel": "1"})
    assert risk.status == "recommended_today"
    assert "no_avalanche_warning_flags" in risk.reasons


def test_evaluate_avalanche_missing_is_unavailable() -> None:
    # Simulates the "503 from Varsom degrades to data unavailable" path that
    # _avalanche_from_outcome takes when NveUnavailable is gathered.
    risk = SafetyService.evaluate_avalanche(None)
    assert risk.status == "check_conditions"
    assert "avalanche_data_unavailable" in risk.reasons
