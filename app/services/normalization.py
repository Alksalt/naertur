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

DIFFICULTY_BY_NAME = {
    "grønn": "easy",
    "gronn": "easy",
    "blå": "medium",
    "bla": "medium",
    "rød": "hard",
    "rod": "hard",
    # Morotur's "svart" (black) is the steepest band; we map it to "hard"
    # rather than a separate "expert" because the product surface is 3
    # buckets, not 4.
    "svart": "hard",
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


def normalize_difficulty(route: dict) -> str:
    grading = route.get("grading") or []
    if grading:
        name = str(grading[0].get("name", "")).lower()
        if name in DIFFICULTY_BY_NAME:
            return DIFFICULTY_BY_NAME[name]
    return "medium"


def season_months(seasons: list[str] | None) -> list[int]:
    if not seasons:
        return []
    months: set[int] = set()
    for season in seasons:
        # Morotur occasionally returns [None] or mixed lists with non-string
        # entries; skip those silently rather than crashing the whole import.
        if not isinstance(season, str):
            continue
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
            "special_conditions",
        ]
    ).lower()
    tags: set[str] = set()
    # Every tag below requires an affirmative textual signal — never tag by
    # absence. Adding a tag because a description forgot to mention "bratt"
    # makes us promise things the data doesn't say.
    keyword_tags = {
        "viewpoint": ["utsikt", "panorama", "topp", "varde"],
        "forest": ["skog", "skogen", "skogsveg", "skogsvei"],
        "mountain": ["fjell", "fjellet", "topp", "hornet", "nebba"],
        "water": ["vatn", "vann", "innsjø", "sjø", "elv"],
        "waterfall": ["foss"],
        "child_friendly": ["barnevennlig", "familievennlig", "gapahuk"],
        "dog_ok": ["hund"],
        "public_transport_possible": ["buss", "kollektiv", "ferje", "hurtigbåt"],
        # "luftig" means airy/exposed terrain — implies exposure risk but
        # not necessarily a steep gradient. Coastal cliff walks were being
        # tagged `steep` and excluded for users with `avoid: ["steep"]`
        # who could safely do them. The `exposed` tag isn't wired through
        # the frontend yet (no `utsatt`/`exposed` in frontend/src/i18n.ts),
        # so we drop "luftig" without introducing a new tag in this wave.
        "steep": ["bratt", "krevende stigning"],
        "not_steep": [
            "flat",
            "flatt",
            "lite stigning",
            "slak",
            "slakk",
            "enkel terreng",
            "lett terreng",
        ],
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
    if distance_meters is not None:
        if distance_meters < 5_000:
            tags.add("under_5km")
        elif distance_meters <= 10_000:
            tags.add("5_10km")
        else:
            tags.add("10km_plus")
    return sorted(tags)
