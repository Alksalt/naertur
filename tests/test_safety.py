from __future__ import annotations

from datetime import UTC, datetime

from app.services.safety import SafetyService


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

