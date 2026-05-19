from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

Difficulty = Literal["easy", "medium", "hard", "expert"]
Language = Literal["no", "en"]
LengthBucket = Literal["under_5km", "5_10km", "10km_plus"]
TransportMode = Literal["car", "public_transport", "walk"]
SafetyStatus = Literal["recommended_today", "check_conditions", "not_recommended_now"]


class Location(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class SearchRequest(BaseModel):
    location: Location | None = None
    language: Language = "no"
    difficulty: list[Difficulty] = Field(default_factory=list)
    max_travel_minutes: int | None = Field(default=None, alias="maxTravelMinutes", ge=1, le=240)
    transport: TransportMode = "car"
    length_bucket: LengthBucket | None = Field(default=None, alias="lengthBucket")
    tags: list[str] = Field(default_factory=list)
    avoid: list[str] = Field(default_factory=list)
    rejected_hike_ids: list[UUID] = Field(default_factory=list, alias="rejectedHikeIds")


class SafetyResult(BaseModel):
    status: SafetyStatus
    reasons: list[str]
    advisory: str = "Recommended based on available data. Always check local conditions."


class TransportResult(BaseModel):
    mode: TransportMode
    estimated_minutes: int | None = Field(default=None, alias="estimatedMinutes")
    status: str
    reasons: list[str] = Field(default_factory=list)


class HikeSummary(BaseModel):
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


class HikeDetail(HikeSummary):
    summary: str | None = None
    description: str | None = None
    municipalities: list[str]
    season_months: list[int] = Field(alias="seasonMonths")
    route_geojson: dict | None = Field(default=None, alias="routeGeojson")
    transport_notes: str | None = Field(default=None, alias="transportNotes")


class SearchResponse(BaseModel):
    hike: HikeSummary
    safety: SafetyResult
    transport: TransportResult
    match_reasons: list[str] = Field(alias="matchReasons")
    rejected_reasons: list[str] = Field(default_factory=list, alias="rejectedReasons")


class ImportMoroturRequest(BaseModel):
    route_ids: list[int] = Field(default_factory=list, alias="routeIds")
    limit: int = Field(default=25, ge=1, le=500)


class ImportMoroturResponse(BaseModel):
    imported: int
    failed: int
    route_ids: list[int] = Field(alias="routeIds")
    errors: list[str] = Field(default_factory=list)

