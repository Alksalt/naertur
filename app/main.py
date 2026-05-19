from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import admin, health, hikes, search

app = FastAPI(
    title="NærTur API",
    version="0.1.0",
    description="Backend API for random nearby hike recommendations in Norway.",
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(hikes.router, prefix="/api/hikes", tags=["hikes"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

