from __future__ import annotations

from math import asin, cos, radians, sin, sqrt


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_m = 6_371_000
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * radius_m * asin(sqrt(a))


def linestring_length_meters(coordinates: list[list[float]]) -> int | None:
    if len(coordinates) < 2:
        return None
    length = 0.0
    for previous, current in zip(coordinates, coordinates[1:], strict=False):
        lon1, lat1 = previous[:2]
        lon2, lat2 = current[:2]
        length += haversine_meters(lat1, lon1, lat2, lon2)
    return round(length)


def is_loop_route(coordinates: list[list[float]], tolerance_meters: int = 150) -> bool:
    if len(coordinates) < 3:
        return False
    start = coordinates[0]
    end = coordinates[-1]
    return haversine_meters(start[1], start[0], end[1], end[0]) <= tolerance_meters


def point_wkt(lon: float, lat: float) -> str:
    return f"POINT({lon} {lat})"


def linestring_wkt(coordinates: list[list[float]]) -> str:
    points = ", ".join(f"{lon} {lat}" for lon, lat, *_ in coordinates)
    return f"LINESTRING({points})"


def trailhead_from_geojson(route_geojson: dict) -> tuple[float, float] | None:
    coordinates = route_geojson.get("geometry", {}).get("coordinates") or []
    if not coordinates:
        return None
    lon, lat = coordinates[0][:2]
    return lat, lon

