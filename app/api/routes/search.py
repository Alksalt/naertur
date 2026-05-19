from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db.session import AsyncSessionDependency
from app.schemas import SearchRequest, SearchResponse
from app.services.search import SearchService

router = APIRouter()


@router.post("/random", response_model=SearchResponse)
async def random_hike(request: SearchRequest, session: AsyncSessionDependency) -> SearchResponse:
    result = await SearchService().random_hike(session, request)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No recommended hike matched the current filters and available safety data.",
        )
    return result

