from __future__ import annotations

import asyncio

import httpx

from app.core.config import get_settings


class MetUnavailable(Exception):
    """Raised when MET locationforecast cannot be retrieved (5xx, 429, network)."""


class MetClient:
    def __init__(self, user_agent: str | None = None) -> None:
        if user_agent is None:
            settings = get_settings()
            user_agent = settings.met_user_agent
        if not user_agent:
            raise RuntimeError(
                "MET User-Agent is not configured. Set MET_USER_AGENT in .env to a real "
                "contact email (values containing example.com are rejected)."
            )
        self._user_agent = user_agent
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
            headers={"User-Agent": user_agent},
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def locationforecast(self, lat: float, lon: float) -> dict:
        params = {"lat": round(lat, 4), "lon": round(lon, 4)}
        url = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
        try:
            response = await self._client.get(url, params=params)
            if response.status_code == 429:
                retry_after = self._retry_after_seconds(response)
                if retry_after is not None and retry_after < 5:
                    await asyncio.sleep(retry_after)
                    response = await self._client.get(url, params=params)
                    if response.status_code == 429:
                        raise MetUnavailable("MET returned 429 after retry")
                else:
                    raise MetUnavailable("MET returned 429 with no actionable Retry-After")
            if response.status_code >= 500:
                raise MetUnavailable(f"MET returned {response.status_code}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise MetUnavailable(f"MET HTTP error: {exc}") from exc
        except httpx.RequestError as exc:
            raise MetUnavailable(f"MET request error: {exc}") from exc

    @staticmethod
    def _retry_after_seconds(response: httpx.Response) -> float | None:
        header = response.headers.get("Retry-After")
        if header is None:
            return None
        try:
            return float(header)
        except ValueError:
            return None
