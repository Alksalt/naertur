from __future__ import annotations

import random

from app.schemas import SafetyResult, SearchRequest
from app.services.randomizer import Candidate, choose_candidate


def test_randomizer_excludes_empty_pool(sample_hike) -> None:
    request = SearchRequest(difficulty=["medium"])
    assert choose_candidate([], request, random.Random(1)) is None


def test_randomizer_returns_candidate(sample_hike) -> None:
    request = SearchRequest(difficulty=["medium"], tags=["viewpoint"])
    candidate = Candidate(
        hike=sample_hike,
        safety=SafetyResult(status="recommended_today", reasons=["inside_recommended_season"]),
        distance_from_user_meters=1000,
        match_reasons=["tag_match"],
    )
    assert choose_candidate([candidate], request, random.Random(1)) == candidate

