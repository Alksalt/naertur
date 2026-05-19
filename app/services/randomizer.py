from __future__ import annotations

import random
from dataclasses import dataclass

from app.db.models import Hike
from app.schemas import SafetyResult, SearchRequest


@dataclass(frozen=True)
class Candidate:
    hike: Hike
    safety: SafetyResult
    distance_from_user_meters: float | None
    match_reasons: list[str]


def score_candidate(candidate: Candidate, request: SearchRequest) -> int:
    hike = candidate.hike
    score = hike.quality_score
    requested_tags = set(request.tags)
    score += len(requested_tags.intersection(hike.tags)) * 12
    if "not_steep" in hike.tags and "steep" in request.avoid:
        score += 8
    if candidate.distance_from_user_meters is not None:
        score += max(0, 25 - int(candidate.distance_from_user_meters // 5_000))
    if hike.distance_meters:
        score += 6
    if hike.duration_minutes:
        score += 4
    return score


def choose_candidate(
    candidates: list[Candidate],
    request: SearchRequest,
    rng: random.Random | None = None,
) -> Candidate | None:
    if not candidates:
        return None
    rng = rng or random.Random()
    ranked = sorted(candidates, key=lambda item: score_candidate(item, request), reverse=True)
    pool = ranked[: min(10, len(ranked))]
    return rng.choice(pool)

