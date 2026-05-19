from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from app.core.config import get_settings
from app.db.session import AsyncSessionDependency
from app.schemas import ImportMoroturRequest, ImportMoroturResponse
from app.services.morotur import MoroturClient, MoroturImporter

router = APIRouter()


def _check_admin_token(x_admin_token: str | None) -> None:
    settings = get_settings()
    if settings.admin_import_token and x_admin_token != settings.admin_import_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")


@router.post("/import/morotur", response_model=ImportMoroturResponse)
async def import_morotur(
    request: ImportMoroturRequest,
    session: AsyncSessionDependency,
    x_admin_token: str | None = Header(default=None),
) -> ImportMoroturResponse:
    _check_admin_token(x_admin_token)
    client = MoroturClient()
    importer = MoroturImporter(client)
    route_ids = request.route_ids
    if not route_ids:
        summaries = await client.discover_routes(limit=request.limit)
        route_ids = [item.id for item in summaries]
    result = await importer.import_routes(session, route_ids)
    return ImportMoroturResponse(**result)

