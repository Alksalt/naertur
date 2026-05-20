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


_ASCENT_BANDS = [
    ("easy", 0, 250),
    ("medium", 200, 600),
    ("hard", 500, 10_000),
]


def _ascent_difficulty_bonus(ascent_m: int, requested: set[str]) -> int:
    """Bonus when ascent matches one of the requested difficulty bands.

    Bands overlap by design: a 220 m climb is reasonable for both easy and
    medium. Penalises only the clearest mismatch — easy-only request paired
    with a >400 m climb — so we don't double-penalise hikes that already
    failed the hard difficulty filter at the search layer.
    """
    in_band = any(
        difficulty in requested and low <= ascent_m <= high
        for difficulty, low, high in _ASCENT_BANDS
    )
    if in_band:
        return 6
    if "easy" in requested and "medium" not in requested and ascent_m > 400:
        return -10
    return 0


def score_candidate(candidate: Candidate, request: SearchRequest) -> int:
    hike = candidate.hike
    score = 0
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
    if hike.ascent_meters is not None and request.difficulty:
        score += _ascent_difficulty_bonus(hike.ascent_meters, set(request.difficulty))
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

