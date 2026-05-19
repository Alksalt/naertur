from __future__ import annotations

import html
import re

SEASON_MONTHS = {
    "vår": [3, 4, 5],
    "var": [3, 4, 5],
    "sommer": [6, 7, 8],
    "høst": [9, 10, 11],
    "host": [9, 10, 11],
    "vinter": [12, 1, 2],
    "hele året": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "hele aret": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

DIFFICULTY_BY_GRADE = {
    0: "easy",
    1: "medium",
    2: "hard",
    3: "expert",
}

DIFFICULTY_BY_NAME = {
    "grønn": "easy",
    "gronn": "easy",
    "blå": "medium",
    "bla": "medium",
    "rød": "hard",
    "rod": "hard",
    "svart": "expert",
}


def strip_html(value: str | None) -> str | None:
    if not value:
        return None
    without_tags = re.sub(r"<[^>]+>", " ", value)
    normalized = re.sub(r"\s+", " ", html.unescape(without_tags)).strip()
    return normalized or None


def parse_duration_minutes(value: str | None) -> int | None:
    if not value:
        return None
    hours = re.search(r"(\d+)\s*t", value)
    minutes = re.search(r"(\d+)\s*min", value)
    total = 0
    if hours:
        total += int(hours.group(1)) * 60
    if minutes:
        total += int(minutes.group(1))
    return total or None


def normalize_difficulty(route: dict, summary: dict | None = None) -> str:
    grading = route.get("grading") or []
    if grading:
        name = str(grading[0].get("name", "")).lower()
        if name in DIFFICULTY_BY_NAME:
            return DIFFICULTY_BY_NAME[name]
    if summary and summary.get("grade") is not None:
        return DIFFICULTY_BY_GRADE.get(int(summary["grade"]), "medium")
    return "medium"


def season_months(seasons: list[str] | None) -> list[int]:
    if not seasons:
        return []
    months: set[int] = set()
    for season in seasons:
        key = season.lower().strip()
        months.update(SEASON_MONTHS.get(key, []))
    return sorted(months)


def infer_tags(route: dict, route_geojson: dict, distance_meters: int | None) -> list[str]:
    text = " ".join(
        str(route.get(key) or "")
        for key in [
            "name",
            "tour_description",
            "directions",
            "start_point",
            "public_transport",
            "spiecial_conditions",
        ]
    ).lower()
    tags: set[str] = set()
    keyword_tags = {
        "viewpoint": ["utsikt", "panorama", "topp", "varde"],
        "forest": ["skog", "skogen", "skogsveg", "skogsvei"],
        "mountain": ["fjell", "fjellet", "topp", "hornet", "nebba"],
        "water": ["vatn", "vann", "innsjø", "sjø", "elv"],
        "waterfall": ["foss"],
        "child_friendly": ["barnevennlig", "familievennlig", "gapahuk"],
        "dog_ok": ["hund"],
        "public_transport_possible": ["buss", "kollektiv", "ferje", "hurtigbåt"],
        "steep": ["bratt", "krevende stigning", "luftig"],
    }
    for tag, keywords in keyword_tags.items():
        if tag == "steep" and any(phrase in text for phrase in ["ikke bratt", "lite bratt"]):
            continue
        if any(keyword in text for keyword in keywords):
            tags.add(tag)
    coordinates = route_geojson.get("geometry", {}).get("coordinates") or []
    if coordinates:
        from app.services.geo import is_loop_route

        if is_loop_route(coordinates):
            tags.add("loop")
    if "steep" not in tags:
        tags.add("not_steep")
    if distance_meters is not None:
        if distance_meters < 5_000:
            tags.add("under_5km")
        elif distance_meters <= 10_000:
            tags.add("5_10km")
        else:
            tags.add("10km_plus")
    return sorted(tags)
