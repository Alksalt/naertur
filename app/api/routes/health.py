from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.db.session import AsyncSessionDependency

router = APIRouter()


@router.get("/health")
async def health(session: AsyncSessionDependency) -> dict[str, object]:
    database_ok = False
    try:
        await session.execute(text("SELECT 1"))
        database_ok = True
    except Exception:
        database_ok = False
    return {
        "ok": database_ok,
        "app": "ok",
        "database": "ok" if database_ok else "error",
        "importer": "ready",
    }

