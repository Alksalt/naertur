"""Kartverket Sentralt stedsnavnregister (SSR) client + importer.

SSR is the authoritative place-name service maintained by Statens kartverk
(NLOD 2.0, no authentication). The client talks to ``/sted`` for searches
and ``/punkt`` for radial reverse lookups; the importer persists settlement
rows into the ``places`` table for the live typeahead.

Live shape (verified against ``https://ws.geonorge.no/stedsnavn/v1`` on
2026-05-20):

```
{ "metadata": { "totaltAntallTreff": <int>, ... },
  "navn": [ {
    "stedsnummer": <int>,
    "navneobjekttype": "Tettsted" | "By" | ...,
    "stedsnavn": [ {"skrivemåte": "Hjelset", "navnestatus": "hovednavn", ...} ],
    "kommuner": [ {"kommunenavn": "Molde", "kommunenummer": "1506"} ],
    "fylker":   [ {"fylkesnavn": "Møre og Romsdal", "fylkesnummer": "15"} ],
    "representasjonspunkt": {"nord": 62.7805, "øst": 7.49277},
    "stedstatus": "aktiv",
    ...
  } ] }
```

Deviations from the plan agent's guesses, all forced by the live shape:

1. The fylke filter param is ``fnr``, NOT ``fylkesnummer`` (the plan agent's
   guess silently returned all-of-Norway when passed ``fylkesnummer=15``).
2. ``sok`` is REQUIRED — ``sok=*`` is rejected with
   ``"Søkeparameteren kan ikke kun være et wildcard."``. Full-fylke
   enumeration therefore walks the alphabet (``a*``, ``b*``, …, ``z*``,
   ``ø*``, ``æ*``, ``å*``) and dedupes by ``stedsnummer``.
3. The ``navneobjekttype`` filter takes the lowercase camelCase **code**
   (e.g. ``tettsted``, ``bygdelagBygd``), not the display name
   (``Tettsted``). The display name comes back on each ``navn`` row.
4. The primary name lives at ``stedsnavn[i].skrivemåte``; the importer
   prefers the entry with ``navnestatus == "hovednavn"`` and falls back
   to index 0 otherwise.
5. The coordinate field is ``representasjonspunkt.øst`` (lon, ETRS89 ≈
   WGS84 in ``utkoordsys=4258``). The non-ASCII key ``ø`` works in JSON
   per-spec; we read it directly with ``["øst"]``.
"""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import Place, SourceRecord
from app.services.geo import point_wkt

# Alphabet driver for full-fylke pagination. SSR rejects bare ``sok=*`` so
# we feed it 29 single-letter prefixes (with one trailing wildcard each).
# Across MR (fnr=15) the union covers every settlement row; we dedupe on
# ``stedsnummer`` so a name like "Aurland" that pops up under both ``a*``
# and a hypothetical alternate spelling is only written once.
_ALPHABET = list("abcdefghijklmnopqrstuvwxyzøæå")


def fold_norwegian(text: str) -> str:
    """Lowercase + fold ``ø/æ/å`` to ASCII.

    The fold is intentionally tiny — just the three glyphs that distinguish
    Norwegian from ASCII. Storing the result in ``Place.name_lower_ascii``
    lets a user typing ``bo`` find ``Bø``, ``aalesund`` find ``Ålesund``,
    and so on, without query-time string functions.
    """

    return (
        text.lower()
        .replace("ø", "o")
        .replace("æ", "ae")
        .replace("å", "aa")
    )


class SsrUnavailable(RuntimeError):
    """Raised when the SSR endpoint is unreachable or returns 5xx.

    Carries the upstream status (when known) so the admin handler can
    translate to a 503 with an actionable error body — identical pattern
    to ``MoroturUnavailable`` for the Morotur source.
    """

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class SsrClient:
    """Thin async client around the SSR REST endpoints we use.

    A single ``httpx.AsyncClient`` is reused across pages. A full MR import
    issues ~30 letter × N-page requests; constructing a new client per call
    burned a noticeable amount of time on TCP handshakes in early prototypes,
    same pattern as ``MoroturClient``.
    """

    DEFAULT_BASE_URL = "https://ws.geonorge.no/stedsnavn/v1"
    PAGE_SIZE = 500

    def __init__(self, base_url: str | None = None) -> None:
        settings = get_settings()
        self.base_url = (base_url or settings.ssr_base_url).rstrip("/")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> SsrClient:
        return self

    async def __aexit__(self, exc_type: object, exc: object, tb: object) -> None:
        await self.aclose()

    async def fetch_page(
        self,
        fnr: str,
        side: int,
        place_types: list[str],
        *,
        sok: str = "a*",
        utkoordsys: int = 4258,
    ) -> tuple[list[dict[str, Any]], int]:
        """Fetch one page of ``/sted`` results.

        Returns ``(navn_list, total_treff)``. The caller drives pagination
        and the alphabet walk. SSR's ``totaltAntallTreff`` is per-query so
        each ``sok`` letter has its own total; the importer terminates a
        letter's loop once ``side * PAGE_SIZE >= total_treff``.

        ``utkoordsys=4258`` returns ETRS89 lat/lon which we treat as
        WGS84-equivalent for PostGIS srid=4326 storage (the two systems
        agree to within ~1 cm in Norway).
        """

        url = f"{self.base_url}/sted"
        params: list[tuple[str, str]] = [
            ("sok", sok),
            ("fnr", fnr),
            ("treffPerSide", str(self.PAGE_SIZE)),
            ("side", str(side)),
            ("utkoordsys", str(utkoordsys)),
        ]
        for place_type in place_types:
            params.append(("navneobjekttype", place_type))
        try:
            response = await self._client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPStatusError as exc:
            raise SsrUnavailable(
                f"SSR /sted returned {exc.response.status_code}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.HTTPError as exc:
            raise SsrUnavailable(f"SSR /sted failed: {exc}") from exc
        navn = payload.get("navn") or []
        total = int(payload.get("metadata", {}).get("totaltAntallTreff") or 0)
        return navn, total

    async def reverse(
        self, lat: float, lon: float, radius_m: int = 5000
    ) -> list[dict[str, Any]]:
        """Reverse-geocode a point through ``/punkt``.

        Returns the raw ``navn`` array (each item carries an extra
        ``meterFraPunkt`` field). The importer doesn't use this — it
        powers the runtime ``/api/places/nearest`` endpoint that turns a
        GPS fix into "Hjelset" instead of bare coordinates. Wrapped in
        the same error surface as ``fetch_page``.
        """

        url = f"{self.base_url}/punkt"
        params = {
            "nord": f"{lat}",
            "ost": f"{lon}",
            "koordsys": "4258",
            "radius": str(radius_m),
            "treffPerSide": "10",
            "side": "1",
        }
        try:
            response = await self._client.get(url, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise SsrUnavailable(
                f"SSR /punkt returned {exc.response.status_code}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.HTTPError as exc:
            raise SsrUnavailable(f"SSR /punkt failed: {exc}") from exc
        payload = response.json()
        return payload.get("navn") or []


def _pick_primary_name(stedsnavn: list[dict[str, Any]]) -> str | None:
    """Pick the ``hovednavn`` skrivemåte, falling back to index 0.

    A ``navn`` entry can carry several skrivemåter (e.g. a Sami alternate
    spelling); we want the official primary. SSR marks it with
    ``navnestatus == "hovednavn"``. Falls back to the first entry when no
    explicit primary is present so the importer doesn't silently drop a
    row that lacks the convention.
    """

    if not stedsnavn:
        return None
    for entry in stedsnavn:
        if entry.get("navnestatus") == "hovednavn":
            skrivemate = entry.get("skrivemåte")
            if skrivemate:
                return str(skrivemate)
    skrivemate = stedsnavn[0].get("skrivemåte")
    return str(skrivemate) if skrivemate else None


class SsrImporter:
    """Drives the full-fylke import: alphabet walk + paginated upsert.

    The shape mirrors ``MoroturImporter``: an outer per-row savepoint
    isolates malformed rows so one bad payload doesn't abort the batch,
    and every imported row is logged to ``source_records`` (status ``ok``
    or ``failed``) for diagnostics.
    """

    def __init__(self, client: SsrClient) -> None:
        self.client = client

    async def import_fylke(
        self,
        session: AsyncSession,
        fnr: str,
        place_types: list[str],
    ) -> dict[str, Any]:
        """Import every settlement in ``fnr`` whose type is in ``place_types``.

        Iterates the alphabet ``a*``…``å*``, paginating each letter until
        we have read ``totaltAntallTreff`` rows. A ``stedsnummer`` we have
        already seen in this run is skipped silently (counts toward
        ``skipped``). Malformed rows (missing primary name or
        representasjonspunkt) land in ``source_records`` with status
        ``failed`` and increment ``failed``; everything else commits to
        ``places``.
        """

        imported = 0
        updated = 0
        failed = 0
        skipped = 0
        errors: list[str] = []
        seen_stedsnummer: set[str] = set()

        for letter in _ALPHABET:
            sok = f"{letter}*"
            side = 1
            while True:
                navn_list, total = await self.client.fetch_page(
                    fnr, side, place_types, sok=sok
                )
                if not navn_list:
                    break
                for navn in navn_list:
                    stedsnummer = navn.get("stedsnummer")
                    if stedsnummer is None:
                        failed += 1
                        errors.append("missing stedsnummer in navn payload")
                        continue
                    source_id = str(stedsnummer)
                    if source_id in seen_stedsnummer:
                        skipped += 1
                        continue
                    seen_stedsnummer.add(source_id)

                    # Per-row savepoint mirrors morotur.py:228-251 so a
                    # bad navn payload (missing coords, etc.) leaves the
                    # batch intact and lands a failed source_record for
                    # diagnostics.
                    savepoint = await session.begin_nested()
                    try:
                        result = await self._upsert_place(session, navn)
                    except Exception as exc:
                        await savepoint.rollback()
                        failed += 1
                        errors.append(f"{source_id}: {exc}")
                        failure_savepoint = await session.begin_nested()
                        try:
                            await self._upsert_source_record(
                                session, navn, "failed", str(exc)
                            )
                            await failure_savepoint.commit()
                        except Exception as record_exc:
                            await failure_savepoint.rollback()
                            errors.append(
                                f"{source_id} (failure record): {record_exc}"
                            )
                    else:
                        await savepoint.commit()
                        # Mirror the failure path's savepoint pattern so a
                        # transient flush error on the diagnostics record
                        # (e.g. asyncpg connection blip during a long full-MR
                        # import) doesn't unwind the whole batch's outer
                        # transaction. The ok-record upsert is best-effort
                        # diagnostics, not a correctness boundary, so any
                        # error here is logged and skipped.
                        ok_savepoint = await session.begin_nested()
                        try:
                            await self._upsert_source_record(
                                session, navn, "ok", None
                            )
                            await ok_savepoint.commit()
                        except Exception as record_exc:
                            await ok_savepoint.rollback()
                            errors.append(
                                f"{source_id} (ok record): {record_exc}"
                            )
                        if result == "inserted":
                            imported += 1
                        else:
                            updated += 1
                # SSR returns totaltAntallTreff for the query — once we've
                # paged past it, more pages would just echo zero rows back.
                # Break early so we don't burn requests.
                #
                # Using ``>`` (not ``>=``) is the off-by-one fix: a letter
                # whose total is exactly ``N * PAGE_SIZE`` would otherwise
                # stop one page early when SSR returns fewer than PAGE_SIZE
                # on the boundary page. We rely on the ``if not navn_list``
                # guard above for the double-stop on the empty next page.
                if side * SsrClient.PAGE_SIZE > total:
                    break
                side += 1
                # Defensive throttle, but ONLY between pages of the same
                # letter — never after the last page (which is about to
                # break out of the loop anyway). At 29 letters this saves
                # ~2.9s of useless sleep on every import.
                await asyncio.sleep(0.1)

        await session.commit()
        return {
            "imported": imported,
            "updated": updated,
            "failed": failed,
            "skipped": skipped,
            "errors": errors,
        }

    async def _upsert_place(
        self, session: AsyncSession, navn: dict[str, Any]
    ) -> str:
        """Insert or update a single ``Place`` row. Returns 'inserted'/'updated'.

        Raises ``ValueError`` on malformed input so the outer savepoint can
        roll back cleanly.
        """

        stedsnummer = navn.get("stedsnummer")
        if stedsnummer is None:
            raise ValueError("navn missing stedsnummer")
        source_id = str(stedsnummer)

        primary_name = _pick_primary_name(navn.get("stedsnavn") or [])
        if not primary_name:
            raise ValueError("navn missing primary stedsnavn")

        repr_point = navn.get("representasjonspunkt") or {}
        # SSR keys the longitude field with the literal Norwegian glyph
        # 'øst'. We accept the ASCII fallback 'ost' too because the
        # /punkt endpoint accepts it on the query side; defensive read.
        lon = repr_point.get("øst")
        if lon is None:
            lon = repr_point.get("ost")
        lat = repr_point.get("nord")
        if lat is None or lon is None:
            raise ValueError("navn missing representasjonspunkt coordinates")

        fylker = navn.get("fylker") or []
        if not fylker:
            raise ValueError("navn missing fylker")
        # A navn can sit across two fylker (e.g. a place straddling the
        # border) — picking [0] is consistent with our admin filter, which
        # is parameterised by a single fnr.
        fylke = fylker[0]
        fylke_name = str(fylke.get("fylkesnavn") or "")
        fylke_number = str(fylke.get("fylkesnummer") or "")
        if not fylke_name or not fylke_number:
            raise ValueError("navn fylker entry incomplete")

        # Pick the first kommune. Same rationale as fylker — a settlement
        # straddling a municipal border is rare and the typeahead label
        # only carries room for one.
        kommuner = navn.get("kommuner") or []
        kommune_name: str | None = None
        kommune_number: str | None = None
        if kommuner:
            first = kommuner[0]
            kommune_name = (first.get("kommunenavn") or None)
            kommune_number = (first.get("kommunenummer") or None)

        place_type = str(navn.get("navneobjekttype") or "")
        if not place_type:
            raise ValueError("navn missing navneobjekttype")

        name_lower = primary_name.lower()
        name_lower_ascii = fold_norwegian(primary_name)

        existing = await session.scalar(
            select(Place).where(Place.source == "ssr", Place.source_id == source_id)
        )
        is_new = existing is None
        if is_new:
            place = Place(
                source="ssr",
                source_id=source_id,
                name=primary_name,
                name_lower=name_lower,
                name_lower_ascii=name_lower_ascii,
                place_type=place_type,
                kommune_name=kommune_name,
                kommune_number=kommune_number,
                fylke_name=fylke_name,
                fylke_number=fylke_number,
                location=WKTElement(point_wkt(float(lon), float(lat)), srid=4326),
                payload=navn,
            )
            session.add(place)
        else:
            place = existing
            place.name = primary_name
            place.name_lower = name_lower
            place.name_lower_ascii = name_lower_ascii
            place.place_type = place_type
            place.kommune_name = kommune_name
            place.kommune_number = kommune_number
            place.fylke_name = fylke_name
            place.fylke_number = fylke_number
            place.location = WKTElement(point_wkt(float(lon), float(lat)), srid=4326)
            place.payload = navn

        await session.flush()
        return "inserted" if is_new else "updated"

    async def _upsert_source_record(
        self,
        session: AsyncSession,
        navn: dict[str, Any],
        status: str,
        error: str | None,
    ) -> None:
        """Mirror ``MoroturImporter.upsert_source_record`` for SSR rows.

        ``source="ssr"`` is the shared identifier so the existing
        ``source_records`` index works without a schema change. The
        ``source_url`` field is the public Geonorge browse URL for the
        stedsnummer — clickable from the diagnostics view.
        """

        stedsnummer = navn.get("stedsnummer")
        # Caller already validated stedsnummer existed, but keep the cast
        # defensive — this is the diagnostics path, never raise from it.
        source_id = str(stedsnummer) if stedsnummer is not None else "unknown"
        source_url = (
            f"https://www.norgeskart.no/#!?project=norgeskart&stedsnummer={source_id}"
        )
        record = await session.scalar(
            select(SourceRecord).where(
                SourceRecord.source == "ssr", SourceRecord.source_id == source_id
            )
        )
        if record is None:
            record = SourceRecord(
                source="ssr",
                source_id=source_id,
                source_url=source_url,
                payload=navn,
                import_status=status,
                error=error,
            )
            session.add(record)
        else:
            record.source_url = source_url
            record.payload = navn
            record.import_status = status
            record.error = error
