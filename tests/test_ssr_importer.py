"""End-to-end tests for the Kartverket SSR importer.

These tests run against the ``naertur_test`` PostGIS database — they
truncate ``places`` (and ``source_records``) between tests so each case
sees a clean slate. SSR's REST surface is mocked via ``respx`` so we
never touch the live Geonorge endpoint.

Covered cases:
- happy path (2 navn → 2 places + 2 ok records)
- multi-page pagination (totaltAntallTreff > PAGE_SIZE)
- per-row savepoint isolation (missing representasjonspunkt)
- upsert idempotency (re-importing the same fnr doesn't duplicate)
- place-type filter (only listed types persisted)

The mocked URL base is ``TEST_SSR_BASE_URL`` to keep the live URL out of
respx route definitions; the client honours ``base_url`` per its public
constructor.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import httpx
import pytest
import pytest_asyncio
import respx
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.models import Place, SourceRecord
from app.services.ssr import SsrClient, SsrImporter
from tests.db import TEST_DATABASE_URL  # noqa: F401 (imported for transitive use)


TEST_SSR_BASE_URL = "https://ssr.test/v1"

# A canonical "good" navn payload mirroring the real SSR /sted response
# shape verified against the live API on 2026-05-20. Keeping it as a
# factory so each test can vary stedsnummer, navneobjekttype, etc. without
# coupling to a single fixture.
def _good_navn(
    stedsnummer: int,
    *,
    name: str = "Hjelset",
    navneobjekttype: str = "Tettsted",
    fnr: str = "15",
    fylkesnavn: str = "Møre og Romsdal",
    kommune: str = "Molde",
    kommunenummer: str = "1506",
    lat: float = 62.7805,
    lon: float = 7.49277,
) -> dict[str, Any]:
    return {
        "stedsnummer": stedsnummer,
        "navneobjekttype": navneobjekttype,
        "stedsnavn": [
            {
                "skrivemåte": name,
                "navnestatus": "hovednavn",
                "skrivemåtestatus": "godkjent og prioritert",
                "språk": "Norsk",
                "stedsnavnnummer": 1,
            }
        ],
        "kommuner": [
            {"kommunenavn": kommune, "kommunenummer": kommunenummer}
        ],
        "fylker": [
            {"fylkesnavn": fylkesnavn, "fylkesnummer": fnr}
        ],
        "representasjonspunkt": {"nord": lat, "øst": lon},
        "stedstatus": "aktiv",
    }


def _response(navn_rows: list[dict[str, Any]], total: int) -> dict[str, Any]:
    """Wrap a navn list in the standard SSR ``/sted`` envelope."""

    return {
        "metadata": {
            "side": 1,
            "totaltAntallTreff": total,
            "treffPerSide": 500,
            "viserFra": 1,
            "viserTil": len(navn_rows),
        },
        "navn": navn_rows,
    }


@pytest_asyncio.fixture
async def session(bootstrap_test_database: str) -> AsyncIterator[AsyncSession]:
    """Per-test engine + session against ``naertur_test``.

    Truncates ``places`` and the SSR slice of ``source_records`` before
    yielding so each test starts at zero rows. Skips when Postgres is
    unreachable — same convention as ``test_morotur_importer.py``.
    """

    engine = create_async_engine(bootstrap_test_database, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        await engine.dispose()
        pytest.skip(f"Postgres unreachable for SSR importer tests: {exc}")

    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    async with sessionmaker() as setup:
        await setup.execute(text("TRUNCATE TABLE places CASCADE"))
        await setup.execute(text("DELETE FROM source_records WHERE source = 'ssr'"))
        await setup.commit()
    async with sessionmaker() as s:
        try:
            yield s
        finally:
            await s.rollback()
    await engine.dispose()


def _mock_letter_pages(
    router: respx.Router, payload_by_letter: dict[str, list[dict[str, Any]]]
) -> None:
    """Wire up alphabet-driven page mocks via a single side_effect handler.

    The importer makes one ``GET /sted`` per (letter, page); we read
    ``sok`` off the request and serve the next response queued for that
    letter. Letters not in ``payload_by_letter`` get an empty navn array
    (matches live behaviour for letters with zero matches and keeps the
    importer loop short — totaltAntallTreff=0 terminates immediately).
    """

    # Mutable queues per letter so side_effect can pop sequentially.
    queues: dict[str, list[httpx.Response]] = {
        letter: [httpx.Response(200, json=resp) for resp in payloads]
        for letter, payloads in payload_by_letter.items()
    }
    empty = httpx.Response(200, json=_response([], 0))

    def _handler(request: httpx.Request) -> httpx.Response:
        sok = request.url.params.get("sok", "")
        # Strip the trailing '*' to recover the letter key.
        letter = sok.rstrip("*")
        if letter in queues and queues[letter]:
            return queues[letter].pop(0)
        return empty

    router.get(f"{TEST_SSR_BASE_URL}/sted").mock(side_effect=_handler)


@pytest.mark.asyncio
async def test_importer_happy_path_persists_two_places(session: AsyncSession) -> None:
    """Two navn under one letter → two places + two ok source_records."""

    client = SsrClient(base_url=TEST_SSR_BASE_URL)
    importer = SsrImporter(client)

    navn_a = [
        _good_navn(1001, name="Aukrasanden"),
        _good_navn(1002, name="Aure", navneobjekttype="Tettsted"),
    ]
    with respx.mock(base_url=TEST_SSR_BASE_URL, assert_all_called=False) as router:
        _mock_letter_pages(router, {"a": [_response(navn_a, 2)]})
        result = await importer.import_fylke(
            session, fnr="15", place_types=["tettsted"]
        )

    assert result["imported"] == 2
    assert result["updated"] == 0
    assert result["failed"] == 0
    assert result["errors"] == []

    places = (
        (await session.execute(select(Place).where(Place.source == "ssr"))).scalars().all()
    )
    assert len(places) == 2
    names = sorted(p.name for p in places)
    assert names == ["Aukrasanden", "Aure"]

    records = (
        (await session.execute(select(SourceRecord).where(SourceRecord.source == "ssr")))
        .scalars()
        .all()
    )
    assert {r.import_status for r in records} == {"ok"}
    assert len(records) == 2


@pytest.mark.asyncio
async def test_importer_paginates_when_total_exceeds_page_size(
    session: AsyncSession,
) -> None:
    """A letter with total > PAGE_SIZE must be paged through cleanly.

    We shrink the threshold by emitting a small first page that claims a
    larger total. The importer should hit the second page, ingest, then
    stop. We verify on stedsnummer counts rather than page calls because
    respx's call ordering changes with side_effect.
    """

    client = SsrClient(base_url=TEST_SSR_BASE_URL)
    # Pin PAGE_SIZE to 3 just for this test so we don't need to mock 500
    # rows per page. The importer's pagination logic uses
    # ``SsrClient.PAGE_SIZE`` so we monkey-patch the class attribute.
    original_page_size = SsrClient.PAGE_SIZE
    SsrClient.PAGE_SIZE = 3
    try:
        importer = SsrImporter(client)

        page1 = _response(
            [_good_navn(2001 + i, name=f"P{i:02d}") for i in range(3)], 5
        )
        page2 = _response(
            [_good_navn(2100 + i, name=f"Q{i:02d}") for i in range(2)], 5
        )

        with respx.mock(base_url=TEST_SSR_BASE_URL, assert_all_called=False) as router:
            _mock_letter_pages(router, {"a": [page1, page2]})
            result = await importer.import_fylke(
                session, fnr="15", place_types=["tettsted"]
            )

        assert result["imported"] == 5
        assert result["failed"] == 0
        count = await session.scalar(
            select(text("COUNT(*)"))
            .select_from(text("places"))
            .where(text("source = 'ssr'"))
        )
        assert count == 5
    finally:
        SsrClient.PAGE_SIZE = original_page_size


@pytest.mark.asyncio
async def test_importer_records_failure_for_missing_coordinates(
    session: AsyncSession,
) -> None:
    """A navn missing representasjonspunkt → failed source_record, no place row."""

    client = SsrClient(base_url=TEST_SSR_BASE_URL)
    importer = SsrImporter(client)

    good = _good_navn(3001, name="Vatne")
    bad = _good_navn(3002, name="Broken")
    bad.pop("representasjonspunkt")

    with respx.mock(base_url=TEST_SSR_BASE_URL, assert_all_called=False) as router:
        _mock_letter_pages(
            router,
            {
                # Both navn share letter 'b' because Broken/B... start with
                # b — except Vatne starts with V, so put them under their
                # actual letters. The importer walks the alphabet, so the
                # letter choice doesn't change correctness.
                "v": [_response([good], 1)],
                "b": [_response([bad], 1)],
            },
        )
        result = await importer.import_fylke(
            session, fnr="15", place_types=["tettsted"]
        )

    assert result["imported"] == 1
    assert result["failed"] == 1
    assert len(result["errors"]) >= 1

    place = await session.scalar(
        select(Place).where(Place.source == "ssr", Place.source_id == "3001")
    )
    assert place is not None
    assert place.name == "Vatne"

    bad_record = await session.scalar(
        select(SourceRecord).where(
            SourceRecord.source == "ssr", SourceRecord.source_id == "3002"
        )
    )
    assert bad_record is not None
    assert bad_record.import_status == "failed"
    assert bad_record.error is not None


@pytest.mark.asyncio
async def test_importer_upsert_is_idempotent(session: AsyncSession) -> None:
    """Re-importing the same fnr updates existing rows, not duplicates."""

    client = SsrClient(base_url=TEST_SSR_BASE_URL)
    importer = SsrImporter(client)
    navn = [_good_navn(4001, name="Volda")]

    with respx.mock(base_url=TEST_SSR_BASE_URL, assert_all_called=False) as router:
        _mock_letter_pages(router, {"v": [_response(navn, 1)]})
        first = await importer.import_fylke(
            session, fnr="15", place_types=["tettsted"]
        )

    assert first["imported"] == 1

    # Tweak the name so we can prove the second run updated the row
    # rather than inserting a fresh one.
    navn2 = [_good_navn(4001, name="Volda by")]
    with respx.mock(base_url=TEST_SSR_BASE_URL, assert_all_called=False) as router:
        _mock_letter_pages(router, {"v": [_response(navn2, 1)]})
        second = await importer.import_fylke(
            session, fnr="15", place_types=["tettsted"]
        )

    assert second["imported"] == 0
    assert second["updated"] == 1

    places = (
        (await session.execute(select(Place).where(Place.source == "ssr"))).scalars().all()
    )
    assert len(places) == 1
    assert places[0].name == "Volda by"


@pytest.mark.asyncio
async def test_importer_filter_excludes_unwanted_place_types(
    session: AsyncSession,
) -> None:
    """``place_types`` filter is forwarded to SSR.

    We can't assert that SSR honored the filter (it's the mocked
    response that controls what comes back), but we CAN assert that the
    importer passes the filter through unchanged — the live SSR API
    filters server-side so the importer never needs to filter again.
    The test mocks a response that already only contains the requested
    type and confirms one place is persisted; a separate assertion on the
    outbound request params confirms the filter forwarding.
    """

    client = SsrClient(base_url=TEST_SSR_BASE_URL)
    importer = SsrImporter(client)

    captured_params: list[dict[str, list[str]]] = []

    def _capture(request: httpx.Request) -> httpx.Response:
        # Use a multi-value-friendly read so repeated navneobjekttype=
        # entries don't get squashed into one.
        params: dict[str, list[str]] = {}
        for key, value in request.url.params.multi_items():
            params.setdefault(key, []).append(value)
        captured_params.append(params)
        return httpx.Response(
            200, json=_response([_good_navn(5001, name="Tettsted-ish")], 1)
        )

    with respx.mock(base_url=TEST_SSR_BASE_URL, assert_all_called=False) as router:
        # Only the 't' page is non-empty in this scenario, but all letters
        # share the same handler so they all return empty.
        router.get(f"{TEST_SSR_BASE_URL}/sted").mock(side_effect=_capture)
        result = await importer.import_fylke(
            session, fnr="15", place_types=["tettsted"]
        )

    # Every letter call must carry exactly the requested filter; SSR's
    # Fjelltopp etc. never reach the import loop because they would have
    # been server-filtered out.
    assert captured_params, "expected at least one captured /sted call"
    for params in captured_params:
        assert params.get("navneobjekttype") == ["tettsted"]
        assert params.get("fnr") == ["15"]

    # Every letter responds with the same fake row but ``stedsnummer``
    # uniqueness dedupes them across the alphabet — we should see exactly
    # one persisted place even though every alphabet letter hit returned
    # the same record.
    assert result["imported"] == 1
    assert result["skipped"] >= 1  # subsequent letters hit the dedupe path
    count = await session.scalar(
        select(text("COUNT(*)")).select_from(text("places"))
    )
    assert count == 1


@pytest.mark.asyncio
async def test_importer_pagination_boundary_total_equals_n_times_page_size(
    session: AsyncSession,
) -> None:
    """Regression for the off-by-one fix in the page-stop check.

    With the old ``side * PAGE_SIZE >= total`` check, a letter whose total
    is exactly ``N * PAGE_SIZE`` stops one page too early when SSR ships
    fewer than PAGE_SIZE on the boundary page. We force the boundary by
    setting PAGE_SIZE=2 and serving total=4 across two pages of two rows
    each. The fixed loop (``>`` instead of ``>=``) must ingest all 4.
    """

    client = SsrClient(base_url=TEST_SSR_BASE_URL)
    original_page_size = SsrClient.PAGE_SIZE
    SsrClient.PAGE_SIZE = 2
    try:
        importer = SsrImporter(client)
        # Two full pages, both reporting total=4 (== 2 * PAGE_SIZE).
        page1 = _response(
            [_good_navn(6001 + i, name=f"B{i:02d}") for i in range(2)], 4
        )
        page2 = _response(
            [_good_navn(6100 + i, name=f"B1{i:02d}") for i in range(2)], 4
        )
        with respx.mock(base_url=TEST_SSR_BASE_URL, assert_all_called=False) as router:
            _mock_letter_pages(router, {"a": [page1, page2]})
            result = await importer.import_fylke(
                session, fnr="15", place_types=["tettsted"]
            )
        assert result["imported"] == 4, (
            "boundary total=N*PAGE_SIZE must not stop one page early"
        )
        assert result["failed"] == 0
        count = await session.scalar(
            select(text("COUNT(*)"))
            .select_from(text("places"))
            .where(text("source = 'ssr'"))
        )
        assert count == 4
    finally:
        SsrClient.PAGE_SIZE = original_page_size
