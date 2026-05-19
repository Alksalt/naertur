from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import Hike, SafetySnapshot
from app.schemas import SafetyResult
from app.services.geo import trailhead_from_geojson
from app.services.met import MetClient


@dataclass(frozen=True)
class WeatherRisk:
    status: str
    reasons: list[str]


class SafetyService:
    def __init__(self, met_client: MetClient | None = None) -> None:
        self.met_client = met_client or MetClient()

    async def evaluate_hike(
        self,
        session: AsyncSession,
        hike: Hike,
        now: datetime | None = None,
        use_cache: bool = True,
    ) -> SafetyResult:
        now = now or datetime.now(UTC)
        season_result = self.evaluate_season(hike, now)
        if season_result.status == "not_recommended_now":
            return season_result

        if use_cache:
            cached = await self.cached_snapshot(session, hike, now)
            if cached is not None:
                return SafetyResult(status=cached.status, reasons=cached.reasons)

        trailhead = trailhead_from_geojson(hike.geometry.route_geojson)
        if trailhead is None:
            return SafetyResult(status="check_conditions", reasons=["missing_trailhead"])

        forecast = await self.met_client.locationforecast(*trailhead)
        weather = self.evaluate_weather(forecast)
        status = self.merge_statuses([season_result.status, weather.status])
        reasons = [*season_result.reasons, *weather.reasons]
        await self.store_snapshot(session, hike, status, reasons, forecast, now)
        return SafetyResult(status=status, reasons=reasons)

    @staticmethod
    def evaluate_season(hike: Hike, now: datetime) -> SafetyResult:
        if not hike.season_months:
            return SafetyResult(status="check_conditions", reasons=["missing_season_data"])
        if now.month not in hike.season_months:
            return SafetyResult(status="not_recommended_now", reasons=["outside_recommended_season"])
        return SafetyResult(status="recommended_today", reasons=["inside_recommended_season"])

    @staticmethod
    def evaluate_weather(forecast: dict) -> WeatherRisk:
        timeseries = forecast.get("properties", {}).get("timeseries", [])[:12]
        reasons: list[str] = []
        max_wind = 0.0
        max_precip = 0.0
        freezing_precip = False
        for item in timeseries:
            details = item.get("data", {}).get("instant", {}).get("details", {})
            next_1h = item.get("data", {}).get("next_1_hours", {}).get("details", {})
            wind = float(details.get("wind_speed") or 0)
            temp = float(details.get("air_temperature") or 99)
            precip = float(next_1h.get("precipitation_amount") or 0)
            max_wind = max(max_wind, wind)
            max_precip = max(max_precip, precip)
            if temp <= 0 and precip > 0:
                freezing_precip = True
        if max_wind >= 15:
            reasons.append("strong_wind_forecast")
        if max_precip >= 8:
            reasons.append("heavy_precipitation_forecast")
        if freezing_precip:
            reasons.append("freezing_precipitation_possible")
        if reasons:
            return WeatherRisk(status="check_conditions", reasons=reasons)
        return WeatherRisk(status="recommended_today", reasons=["no_met_weather_flags"])

    @staticmethod
    def merge_statuses(statuses: list[str]) -> str:
        if "not_recommended_now" in statuses:
            return "not_recommended_now"
        if "check_conditions" in statuses:
            return "check_conditions"
        return "recommended_today"

    async def cached_snapshot(
        self, session: AsyncSession, hike: Hike, now: datetime
    ) -> SafetySnapshot | None:
        return await session.scalar(
            select(SafetySnapshot)
            .where(
                SafetySnapshot.hike_id == hike.id,
                SafetySnapshot.provider == "met",
                SafetySnapshot.expires_at > now,
            )
            .order_by(SafetySnapshot.checked_at.desc())
        )

    async def store_snapshot(
        self,
        session: AsyncSession,
        hike: Hike,
        status: str,
        reasons: list[str],
        payload: dict,
        now: datetime,
    ) -> None:
        settings = get_settings()
        session.add(
            SafetySnapshot(
                hike_id=hike.id,
                provider="met",
                status=status,
                reasons=reasons,
                payload=payload,
                checked_at=now,
                expires_at=now + timedelta(minutes=settings.safety_cache_minutes),
            )
        )

