from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.core.config import limiter
from app.db.session import AsyncSessionDependency
from app.schemas import SearchRequest, SearchResponse
from app.services.search import SearchService

router = APIRouter()


@router.post("/random", response_model=SearchResponse, response_model_by_alias=True)
@limiter.limit("30/minute")
async def random_hike(
    request: Request,
    payload: SearchRequest,
    session: AsyncSessionDependency,
) -> SearchResponse:
    # The SearchService is constructed once per process in main.lifespan and
    # held on app.state, so the underlying httpx.AsyncClient instances in
    # MetClient and NveClient are reused across requests. Constructing a new
    # SearchService here would silently negate that.
    service: SearchService = request.app.state.search_service
    result = await service.random_hike(session, payload)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No recommended hike matched the current filters and available safety data.",
        )
    return result
