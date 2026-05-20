from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import Hike, SafetySnapshot
from app.schemas import SafetyResult
from app.services.geo import trailhead_from_geojson
from app.services.met import MetClient, MetUnavailable
from app.services.nve import NveClient, NveUnavailable, region_id_for_trailhead, slim_nve_payload


class SafetyService:
    def __init__(
        self,
        met_client: MetClient | None = None,
        nve_client: NveClient | None = None,
    ) -> None:
        self.met_client = met_client or MetClient()
        self.nve_client = nve_client or NveClient()

    async def aclose(self) -> None:
        """Close the underlying MET/NVE HTTP clients.

        Uses ``return_exceptions=True`` so a failure closing one client does
        not prevent the other from being closed; the goal is best-effort
        cleanup on shutdown.
        """

        await asyncio.gather(
            self.met_client.aclose(),
            self.nve_client.aclose(),
            return_exceptions=True,
        )

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

        trailhead = trailhead_from_geojson(hike.geometry.route_geojson)
        if trailhead is None:
            return SafetyResult(status="check_conditions", reasons=["missing_trailhead"])

        cached_met = None
        cached_nve = None
        if use_cache:
            cached_met = await self.cached_snapshot(session, hike, now, provider="met")
            cached_nve = await self.cached_snapshot(session, hike, now, provider="nve")

        weather = _result_from_snapshot(cached_met) if cached_met else None
        avalanche = _result_from_snapshot(cached_nve) if cached_nve else None

        if weather is None or avalanche is None:
            met_coro = (
                self.met_client.locationforecast(*trailhead) if weather is None else _noop_coro()
            )
            region_id = region_id_for_trailhead(*trailhead)
            nve_coro = (
                self.nve_client.avalanche_warning(region_id)
                if avalanche is None and region_id is not None
                else _noop_coro()
            )
            met_outcome, nve_outcome = await asyncio.gather(
                met_coro, nve_coro, return_exceptions=True
            )

            if weather is None:
                weather = self._weather_from_outcome(met_outcome)
                if not isinstance(met_outcome, BaseException) and met_outcome is not None:
                    await self.store_snapshot(
                        session=session,
                        hike=hike,
                        status=weather.status,
                        reasons=weather.reasons,
                        payload=_slim_met_payload(met_outcome),
                        now=now,
                        provider="met",
                    )

            if avalanche is None:
                if region_id is None:
                    avalanche = SafetyResult(
                        status="check_conditions",
                        reasons=["avalanche_region_unknown"],
                    )
                else:
                    avalanche = self._avalanche_from_outcome(nve_outcome)
                    if (
                        not isinstance(nve_outcome, BaseException)
                        and isinstance(nve_outcome, dict)
                    ):
                        await self.store_snapshot(
                            session=session,
                            hike=hike,
                            status=avalanche.status,
                            reasons=avalanche.reasons,
                            payload=slim_nve_payload(nve_outcome),
                            now=now,
                            provider="nve",
                        )

        status = self.merge_statuses([season_result.status, weather.status, avalanche.status])
        reasons = [*season_result.reasons, *weather.reasons, *avalanche.reasons]
        return SafetyResult(status=status, reasons=reasons)

    @staticmethod
    def evaluate_season(hike: Hike, now: datetime) -> SafetyResult:
        if not hike.season_months:
            return SafetyResult(status="check_conditions", reasons=["missing_season_data"])
        if now.month not in hike.season_months:
            return SafetyResult(status="not_recommended_now", reasons=["outside_recommended_season"])
        return SafetyResult(status="recommended_today", reasons=["inside_recommended_season"])

    @staticmethod
    def evaluate_weather(forecast: dict) -> SafetyResult:
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
            return SafetyResult(status="check_conditions", reasons=reasons)
        return SafetyResult(status="recommended_today", reasons=["no_met_weather_flags"])

    @staticmethod
    def evaluate_avalanche(record: dict | None) -> SafetyResult:
        if record is None:
            return SafetyResult(
                status="check_conditions",
                reasons=["avalanche_data_unavailable"],
            )
        raw_level = record.get("DangerLevel")
        try:
            level = int(raw_level) if raw_level is not None else None
        except (TypeError, ValueError):
            level = None
        if level is None or level <= 0:
            return SafetyResult(
                status="check_conditions",
                reasons=["avalanche_data_unavailable"],
            )
        if level >= 4:
            return SafetyResult(
                status="not_recommended_now",
                reasons=["avalanche_warning_high"],
            )
        if level == 3:
            return SafetyResult(
                status="check_conditions",
                reasons=["avalanche_warning_moderate"],
            )
        return SafetyResult(
            status="recommended_today",
            reasons=["no_avalanche_warning_flags"],
        )

    @staticmethod
    def merge_statuses(statuses: list[str]) -> str:
        if "not_recommended_now" in statuses:
            return "not_recommended_now"
        if "check_conditions" in statuses:
            return "check_conditions"
        return "recommended_today"

    async def cached_snapshot(
        self,
        session: AsyncSession,
        hike: Hike,
        now: datetime,
        provider: str = "met",
    ) -> SafetySnapshot | None:
        return await session.scalar(
            select(SafetySnapshot)
            .where(
                SafetySnapshot.hike_id == hike.id,
                SafetySnapshot.provider == provider,
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
        provider: str = "met",
    ) -> None:
        settings = get_settings()
        ttl_minutes = (
            settings.nve_cache_minutes if provider == "nve" else settings.safety_cache_minutes
        )
        session.add(
            SafetySnapshot(
                hike_id=hike.id,
                provider=provider,
                status=status,
                reasons=reasons,
                payload=payload,
                checked_at=now,
                expires_at=now + timedelta(minutes=ttl_minutes),
            )
        )

    # ---- helpers for translating fetched results into SafetyResult ----

    def _weather_from_outcome(self, outcome: object) -> SafetyResult:
        if isinstance(outcome, BaseException):
            if isinstance(outcome, MetUnavailable):
                return SafetyResult(
                    status="check_conditions",
                    reasons=["weather_data_unavailable"],
                )
            raise outcome
        if not isinstance(outcome, dict):
            return SafetyResult(
                status="check_conditions",
                reasons=["weather_data_unavailable"],
            )
        return self.evaluate_weather(outcome)

    def _avalanche_from_outcome(self, outcome: object) -> SafetyResult:
        if isinstance(outcome, BaseException):
            if isinstance(outcome, NveUnavailable):
                return SafetyResult(
                    status="check_conditions",
                    reasons=["avalanche_data_unavailable"],
                )
            raise outcome
        if outcome is None:
            return SafetyResult(
                status="check_conditions",
                reasons=["avalanche_data_unavailable"],
            )
        if not isinstance(outcome, dict):
            return SafetyResult(
                status="check_conditions",
                reasons=["avalanche_data_unavailable"],
            )
        return self.evaluate_avalanche(outcome)


def _result_from_snapshot(snapshot: SafetySnapshot) -> SafetyResult:
    """Rehydrate a cached SafetySnapshot row into a SafetyResult.

    The cached row stores ``status`` + ``reasons`` already in the SafetyResult
    shape (since they were written by ``store_snapshot`` after evaluation),
    so this is a direct construction; no per-provider translation needed.
    """

    return SafetyResult(status=snapshot.status, reasons=list(snapshot.reasons))


async def _noop_coro() -> None:
    return None


def _slim_met_payload(forecast: dict) -> dict:
    """Trim a MET locationforecast to the 12-hour window we actually use."""

    properties = forecast.get("properties", {}) or {}
    timeseries = properties.get("timeseries", []) or []
    meta = {
        key: value
        for key, value in (properties.get("meta") or {}).items()
        if key != "units"
    }
    return {
        "type": forecast.get("type"),
        "properties": {
            "meta": meta,
            "timeseries": timeseries[:12],
        },
    }
