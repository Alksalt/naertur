"""Unit tests for ``parse_elevation_from_html``.

Pure-regex tests with no DB dependency — exercises both markup variants
(``<dt>/<dd>`` and ``<div class="fact__title">/<div class="fact__text">``)
and the defensive fallbacks. The scraper is best-effort enrichment, so a
silent fail-to-(None, None) on garbage input is just as important as a
correct parse on well-formed input; both are asserted here.
"""

from __future__ import annotations

from app.services.morotur import parse_elevation_from_html


def test_parse_both_dt_dd_pairs() -> None:
    """Both ``Stigning`` and ``Høyeste punkt`` present, dt/dd shape."""

    html = """
    <html><body>
        <dl class="route-facts">
            <dt>Stigning</dt><dd>324 m</dd>
            <dt>Høyeste punkt</dt><dd>360 moh</dd>
        </dl>
    </body></html>
    """
    assert parse_elevation_from_html(html) == (324, 360)


def test_parse_both_div_pairs() -> None:
    """Both labels present, div.fact__title / div.fact__text shape.

    Mirrors the markup currently served on morotur.no/tur/{slug} as of
    2026-05-20. Kept alongside the dt/dd case to catch any future
    template flip in either direction.
    """

    html = """
    <html><body>
        <div class="fact__title">Stigning</div>
        <div class="fact__text">324 m</div>
        <div class="fact__title">Høyeste punkt</div>
        <div class="fact__text">360 moh</div>
    </body></html>
    """
    assert parse_elevation_from_html(html) == (324, 360)


def test_only_stigning_present_returns_partial() -> None:
    """Missing highest-point label is allowed; we still return ascent."""

    html = """
    <html><body>
        <dt>Stigning</dt><dd>500 m</dd>
        <dt>Tidsbruk</dt><dd>2 t. 0 min</dd>
    </body></html>
    """
    assert parse_elevation_from_html(html) == (500, None)


def test_neither_label_present_returns_none_none() -> None:
    """Real Morotur fact blocks exist but neither matches our two labels."""

    html = """
    <html><body>
        <dt>Lengde</dt><dd>2,25 km en vei</dd>
        <dt>Sesong</dt><dd>Vår, Sommer, Høst</dd>
        <dt>Merking</dt><dd>Skiltet</dd>
    </body></html>
    """
    assert parse_elevation_from_html(html) == (None, None)


def test_garbage_html_returns_none_none_without_crashing() -> None:
    """Defensive: malformed input must not raise."""

    html = "<<<not-html>>> Stigning 324 m Høyeste 360 moh"
    assert parse_elevation_from_html(html) == (None, None)


def test_empty_input_returns_none_none() -> None:
    """Empty string is the most common degenerate case (404, blocked CDN)."""

    assert parse_elevation_from_html("") == (None, None)


def test_value_without_space_between_number_and_unit() -> None:
    """``324m`` (no space) is a known Morotur formatting variant."""

    html = "<dt>Stigning</dt><dd>324m</dd>"
    assert parse_elevation_from_html(html) == (324, None)


def test_nynorsk_hogaste_punkt_label() -> None:
    """Some Morotur routes use the nynorsk spelling ``Høgaste punkt``."""

    html = """
    <dt>Stigning</dt><dd>200 m</dd>
    <dt>Høgaste punkt</dt><dd>900 moh</dd>
    """
    assert parse_elevation_from_html(html) == (200, 900)


def test_zero_value_treated_as_not_measured() -> None:
    """Morotur uses ``0`` as a sentinel for routes without measured ascent."""

    html = """
    <dt>Stigning</dt><dd>0 m</dd>
    <dt>Høyeste punkt</dt><dd>360 moh</dd>
    """
    assert parse_elevation_from_html(html) == (None, 360)
