from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db.session import AsyncSessionDependency
from app.schemas import HikeDetail
from app.services.hikes import get_hike_detail

router = APIRouter()


@router.get("/{hike_id}", response_model=HikeDetail)
async def get_hike(hike_id: UUID, session: AsyncSessionDependency) -> HikeDetail:
    detail = await get_hike_detail(session, hike_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Hike not found")
    return detail

