from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Difficulty = Literal["easy", "medium", "hard"]
LengthBucket = Literal["under_5km", "5_10km", "10km_plus"]
TransportMode = Literal["car", "public_transport", "walk"]
SafetyStatus = Literal["recommended_today", "check_conditions", "not_recommended_now"]


# Shared config — all schemas accept and emit both snake_case (Python) and
# camelCase (wire) names. Combined with response_model_by_alias=True on
# routes, this gives a uniformly camelCase HTTP surface without per-route
# adapter code on the frontend.
_API_CONFIG = ConfigDict(populate_by_name=True)


class Location(BaseModel):
    model_config = _API_CONFIG
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class SearchRequest(BaseModel):
    model_config = _API_CONFIG
    location: Location | None = None
    difficulty: list[Difficulty] = Field(default_factory=list)
    max_travel_minutes: int | None = Field(default=None, alias="maxTravelMinutes", ge=1, le=240)
    transport: TransportMode = "car"
    length_bucket: LengthBucket | None = Field(default=None, alias="lengthBucket")
    tags: list[str] = Field(default_factory=list)
    avoid: list[str] = Field(default_factory=list)
    rejected_hike_ids: list[UUID] = Field(default_factory=list, alias="rejectedHikeIds")


class SafetyResult(BaseModel):
    model_config = _API_CONFIG
    status: SafetyStatus
    reasons: list[str]
    advisory: str = "Recommended based on available data. Always check local conditions."


class TransportResult(BaseModel):
    model_config = _API_CONFIG
    mode: TransportMode
    estimated_minutes: int | None = Field(default=None, alias="estimatedMinutes")
    status: str
    reasons: list[str] = Field(default_factory=list)


class HikeSummary(BaseModel):
    model_config = _API_CONFIG
    id: UUID
    source: str
    source_id: str = Field(alias="sourceId")
    source_url: str = Field(alias="sourceUrl")
    name: str
    municipality: str | None = None
    county: str
    difficulty: Difficulty
    distance_meters: int | None = Field(default=None, alias="distanceMeters")
    duration_minutes: int | None = Field(default=None, alias="durationMinutes")
    ascent_meters: int | None = Field(default=None, alias="ascentMeters")
    tags: list[str]
    trailhead: Location | None = None


class SearchResponse(BaseModel):
    model_config = _API_CONFIG
    hike: HikeSummary
    safety: SafetyResult
    transport: TransportResult
    match_reasons: list[str] = Field(alias="matchReasons")
    rejected_reasons: list[str] = Field(default_factory=list, alias="rejectedReasons")


class ImportMoroturRequest(BaseModel):
    model_config = _API_CONFIG
    route_ids: list[int] = Field(default_factory=list, alias="routeIds")
    limit: int = Field(default=25, ge=1, le=500)


class ImportMoroturResponse(BaseModel):
    model_config = _API_CONFIG
    imported: int
    failed: int
    route_ids: list[int] = Field(alias="routeIds")
    errors: list[str] = Field(default_factory=list)

