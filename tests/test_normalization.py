from __future__ import annotations

from app.services.geo import linestring_length_meters
from app.services.normalization import (
    SEASON_MONTHS,
    infer_tags,
    normalize_difficulty,
    parse_duration_minutes,
    season_months,
    strip_html,
)


def test_morotur_normalization(sample_route: dict, sample_geojson: dict) -> None:
    assert normalize_difficulty(sample_route) == "medium"
    assert season_months(sample_route["seasons"]) == [3, 4, 5, 6, 7, 8, 9, 10, 11]
    assert parse_duration_minutes("2 t. 15 min") == 135
    assert strip_html("<p>Hei &amp; hopp</p>") == "Hei & hopp"

    distance = linestring_length_meters(sample_geojson["geometry"]["coordinates"])
    tags = infer_tags(sample_route, sample_geojson, distance)
    assert "viewpoint" in tags
    assert distance is not None and distance > 0


def _empty_geojson() -> dict:
    return {"geometry": {"coordinates": []}}


def test_infer_tags_does_not_tag_not_steep_by_absence() -> None:
    route = {"tour_description": "En tur."}
    tags = infer_tags(route, _empty_geojson(), distance_meters=None)
    assert "not_steep" not in tags


def test_infer_tags_empty_description_has_no_not_steep() -> None:
    tags = infer_tags({}, _empty_geojson(), distance_meters=None)
    assert "not_steep" not in tags


def test_infer_tags_flat_description_tags_not_steep() -> None:
    route = {"tour_description": "Helt flat sti gjennom skogen."}
    tags = infer_tags(route, _empty_geojson(), distance_meters=None)
    assert "not_steep" in tags


def test_infer_tags_lite_stigning_tags_not_steep() -> None:
    route = {"directions": "Det er lite stigning på denne turen."}
    tags = infer_tags(route, _empty_geojson(), distance_meters=None)
    assert "not_steep" in tags


def test_infer_tags_steep_description_omits_not_steep() -> None:
    route = {"tour_description": "Bratt klatring opp til toppen."}
    tags = infer_tags(route, _empty_geojson(), distance_meters=None)
    assert "not_steep" not in tags
    assert "steep" in tags


def test_infer_tags_consumes_special_conditions_field() -> None:
    # Ensures the renamed (previously misspelled) field is still scanned.
    route = {"special_conditions": "Mye foss og vann langs ruta."}
    tags = infer_tags(route, _empty_geojson(), distance_meters=None)
    assert "waterfall" in tags
    assert "water" in tags


def test_season_months_skips_none() -> None:
    # Live Morotur API returns [None] for routes with no season metadata.
    # Calling .lower() on that used to crash the whole import.
    assert season_months([None]) == []


def test_season_months_handles_mixed_none_and_strings() -> None:
    # Mixed lists must keep the valid strings; None entries are silently
    # skipped rather than silently filtered to ["vinter"].
    expected = sorted(set(SEASON_MONTHS["vinter"]))
    assert season_months([None, "vinter"]) == expected
    assert season_months(["sommer", None, "høst"]) == sorted(
        set(SEASON_MONTHS["sommer"]) | set(SEASON_MONTHS["høst"])
    )


def test_season_months_handles_non_string_elements_skip_them() -> None:
    # Non-string entries (e.g. an int) follow the same "skip silently" rule
    # as None — we don't trust upstream typing, but we also don't crash.
    assert season_months([42, "vinter"]) == sorted(set(SEASON_MONTHS["vinter"]))
