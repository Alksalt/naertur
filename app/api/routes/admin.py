from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request
from sqlalchemy import select

from app.core.config import get_settings, limiter
from app.db.models import Hike
from app.db.session import AsyncSessionDependency
from app.schemas import (
    ImportMoroturRequest,
    ImportMoroturResponse,
    ImportSsrRequest,
    ImportSsrResponse,
    RefetchElevationRequest,
    RefetchElevationResponse,
)
from app.services.morotur import MoroturClient, MoroturImporter, MoroturUnavailable
from app.services.ssr import SsrClient, SsrImporter, SsrUnavailable

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
# The import endpoint pulls up to 500 routes from Morotur per call, each of
# which fans out into two upstream requests (route + geojson) plus a
# best-effort HTML scrape. Even with a valid admin token, an attacker
# (or a buggy operator) could starve Morotur's edge by replaying this
# endpoint in a tight loop. 5/minute is enough headroom for one
# operator-paced reimport per minute and no more.
@limiter.limit("5/minute")
async def import_morotur(
    request: Request,
    payload: ImportMoroturRequest,
    session: AsyncSessionDependency,
    x_admin_token: str | None = Header(default=None),
) -> ImportMoroturResponse:
    _check_admin_token(x_admin_token)
    async with MoroturClient() as client:
        importer = MoroturImporter(client)
        route_ids = payload.route_ids
        if not route_ids:
            # Discovery is the one upstream call that, when it fails, takes
            # the whole admin request down — every other Morotur call lives
            # behind a per-route savepoint inside the importer. Translate
            # the upstream outage into a 503 instead of letting it bubble
            # out as a 500.
            try:
                route_ids = await client.discover_routes(limit=payload.limit)
            except MoroturUnavailable as exc:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "detail": "Morotur source unavailable",
                        "errors": [str(exc)],
                    },
                ) from exc
        result = await importer.import_routes(session, route_ids)
    return ImportMoroturResponse(**result)


@router.post(
    "/import/ssr",
    response_model=ImportSsrResponse,
    response_model_by_alias=True,
)
# An SSR import enumerates the whole alphabet across a fylke — a single
# call can take 30-90 seconds and issues hundreds of upstream requests.
# Stricter than Morotur's 5/minute because there's no per-route paging
# safety valve; if the admin token leaked, replaying this would burn
# Geonorge's edge in seconds.
@limiter.limit("2/minute")
async def import_ssr(
    request: Request,
    payload: ImportSsrRequest,
    session: AsyncSessionDependency,
    x_admin_token: str | None = Header(default=None),
) -> ImportSsrResponse:
    _check_admin_token(x_admin_token)
    settings = get_settings()
    fnr = payload.fnr or settings.ssr_default_fnr
    place_types = payload.place_types or settings.ssr_place_types
    async with SsrClient() as client:
        importer = SsrImporter(client)
        try:
            result = await importer.import_fylke(session, fnr, place_types)
        except SsrUnavailable as exc:
            raise HTTPException(
                status_code=503,
                detail={
                    "detail": "SSR source unavailable",
                    "errors": [str(exc)],
                },
            ) from exc
    return ImportSsrResponse(**result)


@router.post(
    "/refetch-elevation",
    response_model=RefetchElevationResponse,
    response_model_by_alias=True,
)
# Same rate as Morotur import — refetch-elevation issues one Morotur HTML
# request per hike. Without a cap, an operator could trivially flood
# Morotur's CDN by hammering this against the full 51-route catalogue;
# 5/minute keeps that to one batch per minute, which is plenty for the
# one-shot Wave-4 backfill and any ad-hoc replays.
@limiter.limit("5/minute")
async def refetch_elevation(
    request: Request,
    payload: RefetchElevationRequest,
    session: AsyncSessionDependency,
    x_admin_token: str | None = Header(default=None),
) -> RefetchElevationResponse:
    """Re-scrape Morotur ascent / highest-point HTML for selected hikes.

    Targeting rules:
    - If ``route_ids`` is given, look up Morotur hikes whose ``source_id``
      matches (string-cast) — caller picks exactly which routes to retry.
    - If ``route_ids`` is omitted, default to every Morotur hike whose
      ``ascent_meters`` is NULL. This is the post-Wave-3 backfill case
      (42 hikes imported before the HTML scraper existed).

    A hike whose HTML refuses to surface an ascent number — Morotur
    doesn't publish it for every route — counts toward ``skipped`` rather
    than ``failed``. ``failed`` is reserved for HTTP/parser exceptions.
    """

    _check_admin_token(x_admin_token)
    stmt = select(Hike).where(Hike.source == "morotur")
    if payload.route_ids:
        # Hike.source_id is stored as String; cast each requested id so the
        # equality comparison hits the index rather than triggering an
        # implicit cast on every row.
        target_ids = [str(rid) for rid in payload.route_ids]
        stmt = stmt.where(Hike.source_id.in_(target_ids))
    else:
        stmt = stmt.where(Hike.ascent_meters.is_(None))
    hikes = (await session.execute(stmt)).scalars().all()
    resolved_ids: list[int] = []
    for hike in hikes:
        try:
            resolved_ids.append(int(hike.source_id))
        except (TypeError, ValueError):
            # source_id is meant to be Morotur's numeric id; if it isn't,
            # leave the field off the reported list rather than raising.
            pass

    refetched = 0
    failed = 0
    skipped = 0
    errors: list[str] = []
    async with MoroturClient() as client:
        importer = MoroturImporter(client)
        for hike in hikes:
            try:
                ascent, highest = await importer._fetch_elevation(hike.slug)
            except Exception as exc:
                failed += 1
                errors.append(f"{hike.source_id}: {exc}")
                continue
            # Only persist a change when we actually have a new number to
            # write. Morotur doesn't publish ascent for every route, so a
            # silent (None, None) means "nothing more to do here" rather
            # than "scrape failed".
            if ascent is None and highest is None:
                skipped += 1
                continue
            if ascent is not None:
                hike.ascent_meters = ascent
            if highest is not None:
                hike.highest_point_meters = highest
            refetched += 1
    await session.commit()

    return RefetchElevationResponse(
        refetched=refetched,
        failed=failed,
        skipped=skipped,
        route_ids=resolved_ids,
        errors=errors,
    )
