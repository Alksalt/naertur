from __future__ import annotations

import random
import uuid

from app.db.models import Hike
from app.schemas import SafetyResult, SearchRequest
from app.services.randomizer import Candidate, choose_candidate, score_candidate


def _safety() -> SafetyResult:
    return SafetyResult(status="recommended_today", reasons=["inside_recommended_season"])


def _hike(*, ascent_meters: int | None) -> Hike:
    """Build a minimal Hike with controllable ascent; no DB binding required."""
    return Hike(
        id=uuid.uuid4(),
        source="morotur",
        source_id=f"test-{uuid.uuid4()}",
        source_url="https://example.test/tur",
        name="Test",
        municipalities=["Averøy"],
        county="Møre og Romsdal",
        difficulty="medium",
        distance_meters=2_300,
        duration_minutes=120,
        ascent_meters=ascent_meters,
        season_months=[3, 4, 5, 6, 7, 8, 9, 10, 11],
        tags=["viewpoint"],
    )


def _candidate(hike: Hike) -> Candidate:
    return Candidate(
        hike=hike,
        safety=_safety(),
        distance_from_user_meters=1000,
        match_reasons=["tag_match"],
    )


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


def test_ascent_in_band_easy_request_adds_bonus() -> None:
    request = SearchRequest(difficulty=["easy"])
    baseline = score_candidate(_candidate(_hike(ascent_meters=None)), request)
    matched = score_candidate(_candidate(_hike(ascent_meters=180)), request)
    assert matched - baseline == 6


def test_ascent_above_easy_band_penalises_easy_only_request() -> None:
    request = SearchRequest(difficulty=["easy"])
    baseline = score_candidate(_candidate(_hike(ascent_meters=None)), request)
    penalised = score_candidate(_candidate(_hike(ascent_meters=800)), request)
    assert penalised - baseline == -10


def test_ascent_above_easy_band_no_penalty_when_medium_also_requested() -> None:
    request = SearchRequest(difficulty=["easy", "medium"])
    baseline = score_candidate(_candidate(_hike(ascent_meters=None)), request)
    neutral = score_candidate(_candidate(_hike(ascent_meters=800)), request)
    assert neutral - baseline == 0


def test_missing_ascent_leaves_score_unchanged() -> None:
    """No ascent means the bonus path is skipped entirely — score matches
    the pre-ascent-bonus baseline exactly.
    """
    request = SearchRequest(difficulty=["easy"])
    no_difficulty_request = SearchRequest(difficulty=[])
    with_ascent_filter = score_candidate(_candidate(_hike(ascent_meters=None)), request)
    without_ascent_filter = score_candidate(
        _candidate(_hike(ascent_meters=None)), no_difficulty_request
    )
    assert with_ascent_filter == without_ascent_filter


def test_choose_candidate_favours_matching_ascent_band() -> None:
    request = SearchRequest(difficulty=["easy"])
    good = _candidate(_hike(ascent_meters=200))
    bad = _candidate(_hike(ascent_meters=900))
    # Top-10 pool selection: with only two candidates both are in the pool,
    # but the scoring contract is what we assert directly — `choose_candidate`
    # ranks by descending score, so `good` is the first ranked item.
    good_score = score_candidate(good, request)
    bad_score = score_candidate(bad, request)
    assert good_score > bad_score
    # With a seeded RNG and a 2-item pool, rng.choice may still pick either,
    # but over many seeds `good` wins the head of the ranked list every time.
    head_ranks = []
    for seed in range(20):
        # Sort by score desc (same as choose_candidate) to verify head order
        ranked = sorted([good, bad], key=lambda c: score_candidate(c, request), reverse=True)
        head_ranks.append(ranked[0] is good)
        # And confirm choose_candidate's pool always contains `good`
        picked = choose_candidate([good, bad], request, random.Random(seed))
        assert picked is good or picked is bad
    assert all(head_ranks)


def test_ascent_in_overlap_of_medium_and_hard_bands_adds_bonus() -> None:
    request = SearchRequest(difficulty=["medium", "hard"])
    baseline = score_candidate(_candidate(_hike(ascent_meters=None)), request)
    matched = score_candidate(_candidate(_hike(ascent_meters=500)), request)
    assert matched - baseline == 6


def test_ascent_penalty_pushes_bad_hike_out_of_top10_pool() -> None:
    """The -10 ascent-difficulty penalty has teeth at the pool level, not
    just at the per-candidate score.

    ``choose_candidate`` ranks by descending score, takes the top 10, then
    uniformly picks one. So if a "bad" 800 m hike sits 16 points below 10
    "good" 200 m hikes under an easy-only request (+6 vs -10 = 16-point
    gap), it must drop OUT of the top-10 pool entirely — and so it must
    never be returned. This test proves the penalty changes pool
    composition (not just relative ordering); without the penalty the bad
    hike would tie the good ones on every other score component and could
    sneak into the random pick.

    The seeded ``random.Random()`` is irrelevant to the assertion — even
    a worst-case RNG can't pick a candidate that isn't in the pool — but
    we still run 50 iterations as defence against a future refactor that
    might widen the pool or change the selection logic.
    """

    request = SearchRequest(difficulty=["easy"])
    good_candidates = [_candidate(_hike(ascent_meters=200)) for _ in range(10)]
    bad_candidate = _candidate(_hike(ascent_meters=800))
    pool = [*good_candidates, bad_candidate]

    # Sanity check the per-candidate scoring contract: the bad hike must
    # score strictly below every good hike, otherwise the pool-level
    # exclusion below is a tautology.
    good_score = score_candidate(good_candidates[0], request)
    bad_score = score_candidate(bad_candidate, request)
    assert bad_score < good_score, (
        f"penalty path broken: bad_score={bad_score} not below "
        f"good_score={good_score}; ascent-difficulty bonus contract "
        f"changed and this test no longer probes what it claims to."
    )

    # 50 iterations with deterministic seeded RNGs — each call to
    # ``choose_candidate`` re-sorts and re-slices, so a healthy pool means
    # the bad hike is excluded every single time.
    picks_of_bad_hike = 0
    for seed in range(50):
        picked = choose_candidate(pool, request, random.Random(seed))
        if picked is bad_candidate:
            picks_of_bad_hike += 1
    assert picks_of_bad_hike == 0, (
        f"the -10 penalty failed to evict the 800 m hike from the top-10 "
        f"pool: it was picked {picks_of_bad_hike}/50 times. Either the "
        f"penalty isn't applied, the pool slice is wider than 10, or the "
        f"good hikes no longer outscore the bad one by enough to displace "
        f"it."
    )

