from __future__ import annotations

import httpx

from app.core.config import get_settings


class MetClient:
    async def locationforecast(self, lat: float, lon: float) -> dict:
        settings = get_settings()
        headers = {"User-Agent": settings.met_user_agent}
        params = {"lat": round(lat, 4), "lon": round(lon, 4)}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                "https://api.met.no/weatherapi/locationforecast/2.0/compact",
                params=params,
                headers=headers,
            )
            response.raise_for_status()
        return response.json()

