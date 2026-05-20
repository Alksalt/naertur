from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.routes import admin, health, places, search
from app.core.config import get_settings, limiter
from app.services.search import SearchService

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Construct shared services on startup, close their HTTP clients on shutdown.

    A single ``SearchService`` is built per process and stored on
    ``app.state``. It owns one ``SafetyService`` which in turn owns one
    ``MetClient`` and one ``NveClient`` — each holding a single
    ``httpx.AsyncClient``. Without this, every search constructed fresh
    clients per request, defeating the Wave-1 shared-client optimization.
    """

    app.state.search_service = SearchService()
    try:
        yield
    finally:
        await app.state.search_service.aclose()


app = FastAPI(
    title="NærTur API",
    version="0.1.0",
    description="Backend API for random nearby hike recommendations in Norway.",
    lifespan=lifespan,
)

app.state.limiter = limiter


def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    response = JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )
    response.headers["Retry-After"] = "60"
    return response


app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(places.router, prefix="/api/places", tags=["places"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
