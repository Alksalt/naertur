"""NVE / Varsom avalanche-warning client.

API documented at https://api.nve.no/doc/snoeskredvarsel/. The production REST
endpoint at the time of writing is::

    https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api/AvalancheWarningByRegion/Simple/{region_id}/{lang_key}/{from}/{to}

Path parameters:

* ``region_id`` — integer NVE region ID (A-regions are forecast in detail;
  Møre og Romsdal contains 3022 Trollheimen, 3023 Romsdal, 3024 Sunnmøre,
  3027 Indre Fjordane).
* ``lang_key`` — 1 = Norwegian, 2 = English.
* ``from`` / ``to`` — ISO date (``YYYY-MM-DD``). For "today" we pass the same
  date for both.

The response is a JSON array; for a single day there is at most one element
with the fields ``RegionId``, ``RegionName``, ``DangerLevel`` (string ``"0"``
through ``"5"``), ``MainText``, ``ValidFrom``, ``ValidTo``.

Hardcoded region IDs are accepted here as a one-off because they are stable,
documented public identifiers maintained by NVE — see the ``/Region`` endpoint
on the same API for the canonical list.
"""

from __future__ import annotations

import asyncio
from datetime import date

import httpx

NVE_BASE_URL = "https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api"

# Møre og Romsdal A-regions, verified against the live ``/Region`` endpoint
# on 2026-05-20.
SUNNMORE_REGION_ID = 3024
ROMSDAL_REGION_ID = 3023
TROLLHEIMEN_REGION_ID = 3022
INDRE_FJORDANE_REGION_ID = 3027

# Approximate bounding boxes (lat_min, lat_max, lon_min, lon_max). These are
# coarse for v1 — they cover the trailhead point, not the avalanche terrain
# itself. Refine with real polygons in a later wave.
#
# Boundary policy: ranges are inclusive on both ends and the first matching
# region in declaration order wins. This means edges shared between adjacent
# regions are deterministically resolved by ordering rather than overlap.
#
# Fixed 2026-05-20: Romsdal previously started at lat_min=62.30, which created
# a real (non-edge) overlap with Sunnmøre (lat 62.30–62.55, lon 6.80–7.40)
# around inner Storfjorden / Stranda municipality. Those municipalities are
# geographically part of Sunnmøre, so Romsdal's lat_min was raised to 62.55
# (south of Åndalsnes/Eresfjord, which are Romsdal's southernmost settled
# trailheads). This eliminates the overlap; trailheads in the former overlap
# zone now resolve to Sunnmøre, which is the geographically correct region.
#
# Indre Fjordane lat_max=62.00 and Sunnmøre lat_min=62.00 touch on a single
# latitude line (zero-area edge case). Indre Fjordane is listed first so a
# trailhead at exactly lat=62.00 resolves to Indre Fjordane — acceptable for
# the v1 coarse boxes since no surveyed trailhead in MoR sits on that line.
_REGION_BBOXES: list[tuple[int, float, float, float, float]] = [
    # Indre Fjordane — Stryn / Loen / Olden, south of Sunnmøre. Checked first
    # because it is the southernmost A-region in our area.
    (INDRE_FJORDANE_REGION_ID, 61.30, 62.00, 5.90, 7.80),
    # Sunnmøre — Ålesund / Ørsta / Stranda / Geiranger, southern Møre og Romsdal.
    (SUNNMORE_REGION_ID, 62.00, 62.55, 5.40, 7.40),
    # Romsdal — Molde / Åndalsnes / Romsdalsfjorden. lat_min raised from
    # 62.30 to 62.55 to remove the overlap with Sunnmøre (see above).
    (ROMSDAL_REGION_ID, 62.55, 63.10, 6.80, 8.90),
    # Trollheimen — north-eastern Møre og Romsdal into Trøndelag.
    (TROLLHEIMEN_REGION_ID, 62.55, 63.30, 8.40, 10.00),
]


class NveUnavailable(Exception):
    """Raised when the NVE avalanche service cannot be reached or is degraded."""


def region_id_for_trailhead(lat: float, lon: float) -> int | None:
    """Map a trailhead (lat, lon) to an NVE A-region ID, or None if outside the MVP area."""

    for region_id, lat_min, lat_max, lon_min, lon_max in _REGION_BBOXES:
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return region_id
    return None


class NveClient:
    def __init__(self, lang_key: int = 2) -> None:
        # 1 = Norwegian, 2 = English. Default to English so reasons are
        # consistent with the rest of the codebase's stored payloads.
        self._lang_key = lang_key
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
            headers={"Accept": "application/json"},
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def avalanche_warning(
        self, region_id: int, day: date | None = None
    ) -> dict | None:
        """Fetch the single-day avalanche warning for ``region_id``.

        Returns the first record from the array response (NVE issues one
        warning per region per day), or ``None`` if the response array is
        empty.
        """

        day = day or date.today()
        iso = day.isoformat()
        url = (
            f"{NVE_BASE_URL}/AvalancheWarningByRegion/Simple/"
            f"{region_id}/{self._lang_key}/{iso}/{iso}"
        )
        try:
            response = await self._client.get(url)
            if response.status_code == 429:
                retry_after = self._retry_after_seconds(response)
                if retry_after is not None and retry_after < 5:
                    await asyncio.sleep(retry_after)
                    response = await self._client.get(url)
                    if response.status_code == 429:
                        raise NveUnavailable("NVE returned 429 after retry")
                else:
                    raise NveUnavailable("NVE returned 429 with no actionable Retry-After")
            if response.status_code >= 500:
                raise NveUnavailable(f"NVE returned {response.status_code}")
            response.raise_for_status()
            # ``response.json()`` lives inside the try/except so a 200 with
            # an HTML interstitial (WAF page, mojibake body, occasional NVE
            # CDN cache filler) does not bubble out as ``ValueError`` /
            # ``json.JSONDecodeError`` and crash the safety evaluator. The
            # caller in SafetyService._avalanche_from_outcome already
            # catches NveUnavailable; the symmetry just means a non-JSON
            # 200 is treated like any other upstream degradation.
            payload = response.json()
        except httpx.HTTPStatusError as exc:
            raise NveUnavailable(f"NVE HTTP error: {exc}") from exc
        except httpx.RequestError as exc:
            raise NveUnavailable(f"NVE request error: {exc}") from exc
        except ValueError as exc:
            # json.JSONDecodeError is a ValueError subclass.
            raise NveUnavailable("NVE returned non-JSON body") from exc

        if isinstance(payload, list):
            return payload[0] if payload else None
        if isinstance(payload, dict):
            return payload
        return None

    @staticmethod
    def _retry_after_seconds(response: httpx.Response) -> float | None:
        header = response.headers.get("Retry-After")
        if header is None:
            return None
        try:
            return float(header)
        except ValueError:
            return None


def slim_nve_payload(record: dict) -> dict:
    """Trim an NVE warning record to the fields we actually use."""

    return {
        "DangerLevel": record.get("DangerLevel"),
        "MainText": record.get("MainText"),
        "RegionId": record.get("RegionId"),
        "ValidFrom": record.get("ValidFrom"),
        "ValidTo": record.get("ValidTo"),
    }
