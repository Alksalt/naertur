from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from app.core.config import get_settings
from app.db.session import AsyncSessionDependency
from app.schemas import ImportMoroturRequest, ImportMoroturResponse
from app.services.morotur import MoroturClient, MoroturImporter

router = APIRouter()


def _check_admin_token(x_admin_token: str | None) -> None:
    settings = get_settings()
    if not settings.admin_import_token:
        raise HTTPException(status_code=403, detail="Admin token not configured")
    if x_admin_token != settings.admin_import_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")


@router.post(
    "/import/morotur",
    response_model=ImportMoroturResponse,
    response_model_by_alias=True,
)
async def import_morotur(
    request: ImportMoroturRequest,
    session: AsyncSessionDependency,
    x_admin_token: str | None = Header(default=None),
) -> ImportMoroturResponse:
    _check_admin_token(x_admin_token)
    async with MoroturClient() as client:
        importer = MoroturImporter(client)
        route_ids = request.route_ids
        if not route_ids:
            route_ids = await client.discover_routes(limit=request.limit)
        result = await importer.import_routes(session, route_ids)
    return ImportMoroturResponse(**result)
