from __future__ import annotations

import argparse
import asyncio

from app.db.session import AsyncSessionLocal
from app.services.morotur import MoroturClient, MoroturImporter


async def import_morotur(route_ids: list[int], limit: int) -> None:
    async with MoroturClient() as client:
        importer = MoroturImporter(client)
        async with AsyncSessionLocal() as session:
            if not route_ids:
                route_ids = await client.discover_routes(limit=limit)
            result = await importer.import_routes(session, route_ids)
    print(result)


def main() -> None:
    parser = argparse.ArgumentParser(prog="naertur")
    subparsers = parser.add_subparsers(dest="command", required=True)

    import_parser = subparsers.add_parser("import-morotur")
    import_parser.add_argument("--route-id", dest="route_ids", type=int, action="append", default=[])
    import_parser.add_argument("--limit", type=int, default=25)

    args = parser.parse_args()
    if args.command == "import-morotur":
        asyncio.run(import_morotur(args.route_ids, args.limit))


if __name__ == "__main__":
    main()
