from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import Hike
from app.db.session import AsyncSessionLocal
from app.services.morotur import MoroturClient, MoroturImporter
from app.services.ssr import SsrClient, SsrImporter


async def import_morotur(route_ids: list[int], limit: int) -> None:
    async with MoroturClient() as client:
        importer = MoroturImporter(client)
        async with AsyncSessionLocal() as session:
            if not route_ids:
                route_ids = await client.discover_routes(limit=limit)
            result = await importer.import_routes(session, route_ids)
    print(result)


async def refetch_elevation(route_ids: list[int]) -> None:
    """Re-scrape Morotur ascent / highest-point HTML for selected hikes.

    With no ``--route-id`` flags, the command targets every Morotur hike
    whose ``ascent_meters`` is NULL — the post-Wave-3 backfill case for
    the 42 routes imported before the HTML scraper existed.
    """

    stmt = select(Hike).where(Hike.source == "morotur")
    if route_ids:
        stmt = stmt.where(Hike.source_id.in_([str(r) for r in route_ids]))
    else:
        stmt = stmt.where(Hike.ascent_meters.is_(None))
    refetched = 0
    failed = 0
    skipped = 0
    errors: list[str] = []
    resolved_ids: list[int] = []
    async with MoroturClient() as client:
        importer = MoroturImporter(client)
        async with AsyncSessionLocal() as session:
            hikes = (await session.execute(stmt)).scalars().all()
            for hike in hikes:
                try:
                    resolved_ids.append(int(hike.source_id))
                except (TypeError, ValueError):
                    pass
            for hike in hikes:
                try:
                    ascent, highest = await importer._fetch_elevation(hike.slug)
                except Exception as exc:
                    failed += 1
                    errors.append(f"{hike.source_id}: {exc}")
                    continue
                if ascent is None and highest is None:
                    skipped += 1
                    continue
                if ascent is not None:
                    hike.ascent_meters = ascent
                if highest is not None:
                    hike.highest_point_meters = highest
                refetched += 1
            await session.commit()
    print(
        {
            "refetched": refetched,
            "failed": failed,
            "skipped": skipped,
            "route_ids": resolved_ids,
            "errors": errors,
        }
    )


async def import_ssr(fnr: str | None, place_types: list[str] | None) -> None:
    """CLI driver for the SSR importer.

    Mirrors the morotur CLI so an operator can run a full fylke import
    without going through the rate-limited admin route — useful when
    repopulating ``naertur_test`` for an ad-hoc smoke or refreshing the
    dev DB after a schema change.
    """

    settings = get_settings()
    effective_fnr = fnr or settings.ssr_default_fnr
    effective_types = place_types or settings.ssr_place_types
    async with SsrClient() as client:
        importer = SsrImporter(client)
        async with AsyncSessionLocal() as session:
            result = await importer.import_fylke(session, effective_fnr, effective_types)
    print(result)


def main() -> None:
    parser = argparse.ArgumentParser(prog="naertur")
    subparsers = parser.add_subparsers(dest="command", required=True)

    import_parser = subparsers.add_parser("import-morotur")
    import_parser.add_argument("--route-id", dest="route_ids", type=int, action="append", default=[])
    import_parser.add_argument("--limit", type=int, default=25)

    ssr_parser = subparsers.add_parser("import-ssr")
    ssr_parser.add_argument("--fnr", default=None)
    ssr_parser.add_argument(
        "--place-type",
        dest="place_types",
        action="append",
        default=None,
        help="SSR navneobjekttype code (e.g. tettsted). Repeatable.",
    )

    refetch_parser = subparsers.add_parser("refetch-elevation")
    refetch_parser.add_argument(
        "--route-id",
        dest="route_ids",
        type=int,
        action="append",
        default=[],
        help=(
            "Morotur route id to refetch elevation for. Repeatable. "
            "When omitted, every hike with ascent_meters IS NULL is targeted."
        ),
    )

    args = parser.parse_args()
    if args.command == "import-morotur":
        asyncio.run(import_morotur(args.route_ids, args.limit))
    elif args.command == "import-ssr":
        asyncio.run(import_ssr(args.fnr, args.place_types))
    elif args.command == "refetch-elevation":
        asyncio.run(refetch_elevation(args.route_ids))


if __name__ == "__main__":
    main()
