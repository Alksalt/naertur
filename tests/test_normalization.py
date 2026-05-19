from __future__ import annotations

from app.services.geo import linestring_length_meters
from app.services.normalization import (
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
    assert "not_steep" in tags
    assert distance is not None and distance > 0

