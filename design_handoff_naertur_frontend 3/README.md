# Handoff — NærTur frontend · v2 "Trail Map"

> Reference design for the NærTur "one tap, get a nearby hike" picker — Norwegian-first, mobile-focused PWA. Editorial topographic direction, single-accent color system (default Brick; original Vermillion + 4 other presets available), spring-physics motion.
> Backend repo this design pairs with: [`Alksalt/naertur`](https://github.com/Alksalt/naertur).

---

## 1. About this bundle

The files in this bundle are **design references created in HTML/React** — interactive prototypes showing intended look-and-feel and behavior. **They are not production code to copy directly.**

Your job is to **recreate these designs in the NærTur target environment** (mobile-first PWA per the project wiki) using whatever stack the team has chosen — React + Vite, Next.js, SvelteKit, plain web components, etc. Reuse the visual language, motion, and copy verbatim, but rewrite the components against your stack's idioms, routing, and state management.

How to preview the design:
- **`Naertur.html`** — the source-of-truth design canvas. Loads its dependencies (React, Babel, fonts, JSX files) from CDN. Opens a Figma-like canvas with 3 sections (iPhone, Android, Web) and 12 artboards (5 screens × 2 platforms + 2 web views). Right-bottom tweaks panel toggles language, palette, and visibility.
- **`Naertur-standalone.html`** — same design, but every dependency inlined into one 1.7 MB file. **Open this offline** — no server, no CDN needed.
- **`Naertur — Moss v1.html`** — the **earlier moss-cream-fjord-illustration variant** we considered and then rejected for being too close to the current generic-AI-app aesthetic. Kept here for reference / comparison. Do not implement v1.

Click into any phone frame in the canvas to drive that prototype: tap CTAs to advance screens, toggle filters, etc. Each artboard mounts a fresh stateful `<NaerturApp>` at a chosen starting screen so reviewers can jump straight to any screen.

---

## 2. Fidelity

**High-fidelity.** Colors, spacing, typography, motion timings, and copy are final. Where this bundle defines an SVG (topographic map, elevation chart, legend icons, difficulty glyphs), you can either:
- Replace with your stack's preferred drawing approach, OR
- Lift the SVG markup from `app-trail.jsx` verbatim — it's intentionally compact and stylistically intentional.

---

## 3. Why this direction (v2)

The first pass (`Naertur — Moss v1.html`) used a warm cream/moss palette with stylized SVG fjord scenes and Schibsted Grotesk type. After review, that direction read as generic-AI-app (currently a common look) and the project lead asked for something *totally different*, grounded in Google's best-practice updates and animated.

The v2 direction commits to:

1. **Topographic maps as the visual language**, not stylized scene illustrations. The hike *is* a map — make the map the hero.
2. **Editorial / printed-guidebook tone** — mono callsigns, numbered sections, hairline rules, factual stats up front. Feels like a paper hiking guide rather than a feed app.
3. **Single bold accent** on warm paper instead of two-color moss + sunset. Confident, recognizable. *(Originally `#C8242C` vermillion / Norwegian-flag red; the **default has since been softened to `Brick #A04A3E`** following stakeholder feedback — see §5.1 Accent overlay. The original vermillion is still available as a preset.)*
4. **Spring-physics motion** following Google's [Material 3 Expressive](https://m3.material.io/blog/building-with-m3-expressive) (2025) research — bouncier interactions, contour lines and trails *draw on*, numbers count up, stagger reveals at ~60–90ms intervals.
5. **Sharper geometry** — rectangular cards & 4–6px corners instead of pill everything.

This positioning differentiates from competitors:
- Komoot / AllTrails are dense map-and-list apps. NærTur is intentionally a single-result randomizer. v2's editorial bias reinforces that *less is the product*.
- Generic outdoor-app aesthetic = soft green + photo hero. v2's typographic-topographic look stands out at app-store thumbnail size.

---

## 4. Screens

State machine:
```
welcome ──tap CTA──▶ filters ──Finn tur──▶ finding ──~2.4s / API response──▶ result
result  ──Velg en annen──▶ finding (hikeIdx++) ──▶ result
result  ──Ikke min tur──▶ finding (push rejected, hikeIdx++) ──▶ result
result  ──Mer info──▶ detail
detail / result / filters ──◀ back──▶ previous screen
```

### 4.1 Welcome

```
┌────────────────────────────────────┐
│ ▔▔▔ status bar (60px safe area)    │
│  NÆRTUR        ● N 62.47° · Ø 6.15°│  ← wordmark + mono coords pill
│                                    │
│ ╭───────────────────────────╮      │  ← topographic map (54% h)
│ │   ◯  ◯  ◯  ◯  ◯           │      │     concentric contour rings
│ │  ╱╲╱╲  trail draws in      │      │     trail in vermillion red
│ │ ▼ trailhead    ▲ summit    │      │     scale bar + compass rose
│ ╰───────────────────────────╯      │
│  (gradient fade into paper)        │
│                                    │
│ NÆRTUR · MØRE OG ROMSDAL · MVP     │  ← red mono breadcrumb, 10/600
│                                    │
│ Én tapp.                           │  ← H1 44/700/-1.6 Bricolage
│ Én tur. I dag.                     │     "I dag." in italic serif
│                                    │     (Newsreader 500) + vermillion
│ Vi finner én tur for deg —         │  ← body 15/1.5/graphite
│ basert på vær, sesong og hva       │     max-width 320
│ du har lyst på i dag.              │
│                                    │
│ ──────────────────────────         │
│ TURER  │ SESONG │ VARSEL           │  ← fact strip
│  124   │  Åpen  │   0              │     mono labels, big numerals
│ ──────────────────────────         │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 📍  Bruk min posisjon          │ │  ← 58px primary, vermillion bg
│ └────────────────────────────────┘ │     5–10px radius (NOT pill)
│ ┌────────────────────────────────┐ │
│ │      Velg sted                 │ │  ← 50px ghost, 1px hairline
│ └────────────────────────────────┘ │
│  Vi lagrer ingenting om deg.       │  ← privacy line, 11.5/sub
└────────────────────────────────────┘
```

**Components:**

- **Topographic hero** — see §6. Drives the visual identity. ~54% of viewport height. Animates contours drawing on (1.1s, staggered 90ms) → trail line draws on at 0.7s offset → trailhead pop at 1.5s → summit pop at 1.8s. Compass rose floats top-right; scale bar bottom-left.
- **Wordmark `<Wordmark>`** — small SVG glyph (an `N`-shaped peak with a vermillion accent triangle inside) + `NÆRTUR` set in Bricolage Grotesque 700 with **wdth axis at 90** (slightly condensed) and tight tracking (-0.8). All-caps. Never use the wordmark below 18px or above 32px in the mobile shell.
- **Coords pill** — `● N 62.47° · Ø 6.15°` — small mono callout, paper-bg, hairline border, 4px radius. Reinforces the "field instrument" feel and is real data (user's approximate location, when available).
- **Headline split** — first two lines in Bricolage 700 ink, third short word in **Newsreader italic 500** + vermillion. The italic-serif accent appears in exactly one spot per screen — uses sparingly to avoid noise.
- **Fact strip** — three cells separated by hairline-soft dividers, top + bottom rule, padded 10/0. Mono labels (9px / 600 / 0.7sp) over 18/700 numerals. Live numbers in production: `count of hikes in DB`, `season status`, `count of active NVE warnings`.
- **Primary CTA** — 58px tall, vermillion bg, paper text, 5px radius on iOS / 10px on Android, with a 18px location icon. Spring-tap (scale 0.96 on press, 180ms cubic-bezier(.3, 1.4, .5, 1)).
- **Secondary CTA** — 50px ghost. 1px hairline, paper text.

### 4.2 Filters

```
┌────────────────────────────────────┐
│ ▔▔▔ status bar                     │
│ ◀ │ SØKEPARAMETRE     │ 📍 Ålesund │  ← mono eyebrow + title
│   │ Filtre            │            │     19/700/-0.5
├────────────────────────────────────┤
│                                    │
│ 01 ── VANSKELIGHET                 │  ← section: mono num + dash + label
│ ┌─────────┬─────────┬─────────┐    │
│ │  ╱──    │  /\__   │  /╲╱╲   │    │  ← profile glyphs per difficulty
│ │ Enkel   │ Medium  │ Krevende│    │     active = vermillion fill
│ └─────────┴─────────┴─────────┘    │
│                                    │
│ 02 ── LENGDE                       │
│ ┌─────────┬─────────┬─────────┐    │
│ │  <5     │  5–10   │  10+    │    │  ← big numerals (22/700)
│ │  km     │  km     │  km     │    │     "km" subdued
│ └─────────┴─────────┴─────────┘    │
│                                    │
│ 03 ── TRANSPORT                    │
│ ┌─────────┬─────────┬─────────┐    │
│ │   🚗     │   🚌     │   👣     │    │
│ │   Bil   │Kollektiv│ Til fots│    │
│ └─────────┴─────────┴─────────┘    │
│                                    │
│ 04 ── MAKS REISETID       45 min   │
│ ●──────────────────────────────    │  ← native range, vermillion thumb
│ 15   30      60      90    120     │     mono tick labels
│                                    │
│ 05 ── HVA SLAGS TUR                │
│ [👁 Utsikt][🌲 Skog][⛰ Fjell]      │  ← rectangular chips, 4px radius
│ [💧 Vann][↻ Rundtur][👶 Barn]      │     active = vermillion fill
│                                    │
│ 06 ── UNNGÅ                        │
│ [📈 Ikke bratt]                    │
│                                    │
│ ──────────────────────────         │
│ ┌────────────────────────────────┐ │
│ │ 🧭 Finn tur          [03 KAND] │ │  ← sticky CTA + candidate count
│ └────────────────────────────────┘ │     mono badge inside button
└────────────────────────────────────┘
```

**Section header pattern:**
```jsx
<div>
  <span style={{ font: '600 10.5px/1 ui-monospace', color: vermillion, letterSpacing: 0.6 }}>01</span>
  <span style={{ height: 1, background: hairline, flex: '0 0 14px' }} />
  <span style={{ font: '600 11px/1 sans', textTransform: 'uppercase', letterSpacing: 0.9 }}>VANSKELIGHET</span>
  {right && <span style={{ marginLeft: 'auto', font: '500 11px/1 sans', color: graphite, fontVariantNumeric: 'tabular-nums' }}>{right}</span>}
</div>
```

**Difficulty tile** — 14px padding, paper bg, hairline border, 5px radius. Contents: a 56×22 `<DifficultyGlyph>` showing trail steepness (gentle curve for easy, peaked path for medium, jagged for hard) on a tiny baseline. Active state: vermillion bg + paper text + the glyph re-strokes in paper. **Multi-select** — toggling adds/removes from `difficulty[]`.

**Length tile** — same wrapper, big numeral (22/700 Bricolage with tabular-nums) + faint `km` subtitle. **Single-select** — tapping the active option clears it (so `null` is a valid state).

**Transport tile** — icon centered, label below, 14/8 padding. **Single-select**.

**Travel slider** — see §6 for the custom thumb CSS. The right-aligned readout in the section header counts up live as the user scrubs.

**Tag chip** — 7/11 padding, 4px radius on iOS, 100px (pill) on Android — *one of the only platform variations that's allowed*. Active state fills vermillion. Use `display: flex; gap` not inline whitespace.

**Sticky CTA** — 58px vermillion, with a small mono badge inside on the right (`[03 KANDIDATER]` / `[03 CANDIDATES]`) showing live the count of matches. Spring-tap. Gradient mask above the CTA so scrolling content fades out behind it.

### 4.3 Finding

```
┌────────────────────────────────────┐
│   (topographic backdrop, faded)    │
│                                    │
│         ●                          │
│      ●     ●                       │  ← three concentric rings
│   ●          ●                     │     pulsing outward in vermillion
│  ●     ▲      ●                    │     ring 1 + ring 2 + ring 3
│   ●  trailhead●                    │     800ms stagger
│      ●     ●                       │     2.4s loop
│         ●                          │
│                                    │
│ SØKER · 03/04                      │  ← mono progress counter
│ Finner din tur.                    │  ← 26/700/-0.7
│ Sjekker vær, sesong og reisetid    │  ← 14 graphite body
│                                    │
│ ┌──────────────────────────────┐   │  ← checklist strip cards
│ │ ● Posisjon funnet            │   │     paper-snow bg, hairline
│ │ ● Innenfor sesong            │   │     status circle morphs:
│ │ ◐ God værmelding              │   │       muted ring → red ring (active)
│ │   Velger tur                  │   │       → red fill + check (done)
│ └──────────────────────────────┘   │
└────────────────────────────────────┘
```

**Ring pulse implementation** (CSS only):
```css
@keyframes trail-ring-pulse {
  0%   { transform: scale(0.5); opacity: 0.7; }
  80%  { opacity: 0.05; }
  100% { transform: scale(1.8); opacity: 0; }
}
```
Three 140px rings, each delayed 0/800/1600ms, infinite. Centered over a small vermillion crosshair + trailhead triangle.

**Phase machine:**
- 0–700 ms — phase 0 (only first checklist item active)
- 700–1300 ms — phase 1
- 1300–1900 ms — phase 2
- 1900–2400 ms — phase 3
- 2400 ms — transition to Result (skipped when the artboard *starts* on `finding` for preview purposes)

In production, drive this with the actual API call: show this screen while `POST /api/search/random` is in-flight, advance phases on a minimum-2.4s timer so users feel the app being deliberate, transition to Result when both the timer and the response complete.

### 4.4 Result

```
┌────────────────────────────────────┐
│ ╭─ topographic hero (270px) ─╮     │
│ │ ◀ │ ● MOROTUR / 1950 │ 🗺 │     │  ← top bar: back / ID callsign / map
│ │  contour rings + trail     │     │
│ ╰────────────────────────────╯     │
│ ─────── full-width safety strip ── │  ← good/caution/danger tinted
│ ● Anbefalt i dag · Innenfor       │     status dot in matching color
│   sesong · Ingen aktive varsler   │     date stamp on the right
│           20 MAI · 14:32           │
├────────────────────────────────────┤
│                                    │
│ ANBEFALT TUR · VESTNES             │  ← red mono eyebrow
│                                    │
│ Klimpan                            │  ← H1 38/700/-1.4
│ Vestnes kommune · Møre og Romsdal  │  ← 14 graphite
│                                    │
│ ──────────────────────────         │
│ ↔ LENGDE │ ▲ STIGNING │ ⊙ TID │ ◇ REISE │
│  2,2 km  │   180 m   │  1t  │ 22 min │  ← counts up on mount
│ ──────────────────────────         │     hairline dividers
│                                    │
│ ×5    HVORFOR DENNE TUREN          │
│ 01    Lett nok                     │  ← numbered editorial list
│ ──                                 │     mono num + 15/500 reason
│ 02    Rundtur som du ønsket        │     hairline-soft between
│ ──                                 │
│ 03    Utsikt på toppen             │
│ ──                                 │
│ 04    22 min innenfor reisetid     │
│ ──                                 │
│ 05    Skogstur                     │
│                                    │
│ [UTSIKT][SKOG][RUNDTUR][BARN]      │  ← mono flag chips
│                                    │
│ ┌──────────────────────────────┐   │
│ │ ↗  Mer info  BESKR · KART... │   │  ← snow row with mono hint
│ └──────────────────────────────┘   │
│                                    │
│ ──────────────────────────         │
│ ┌────────────────────────────────┐ │
│ │ ⚐  Start tur          [↗ 22m] │ │  ← 58px vermillion + mono tag
│ └────────────────────────────────┘ │
│ ┌────────────┬───────────────────┐ │
│ │ ↻ Velg en  │  ✕ Ikke min tur   │ │  ← 46px ghosts, 50/50
│ │   annen    │                   │ │
│ └────────────┴───────────────────┘ │
└────────────────────────────────────┘
```

**Hero callsign pill** — center of the top bar: `● MOROTUR / 1950`. Reinforces that this is a real route from a real source. In production, format as `{source.toUpperCase()} / {sourceId}`.

**Safety strip** — **full-bleed band**, NOT a pill. 11/20 padding. Background = safety color at ~10% alpha (defined per-palette as `goodTint`, `cautionTint`, `dangerTint`). A solid 8px dot in the saturated safety color, then label + dot + short reasons inline, then a date stamp (`20 MAI · 14:32`) in mono on the right. This row earns its own line because safety is a hard gate per the project wiki.

**Stats row** — 4-column grid with `border-right: 1px solid hairlineSoft` dividers. Each cell has a `<StatIcon>` (legend-glyph: ↔ length, ▲ ascent, ⊙ duration, ◇ travel) in vermillion at 11px next to a mono uppercase label, with the value below at 22/700/-0.8 tabular-nums. **Numbers animate-count from 0 to target on mount** (700ms cubic-out). Re-runs when `hike.id` changes.

```jsx
const km  = useCountUp(hike.distanceMeters / 1000, 700, [hike.id]);
const asc = useCountUp(hike.ascentMeters, 700, [hike.id]);
```

**Why this hike** — `×{n}` red mono badge + uppercase label header, then a numbered vertical list. Each row is `01 / Lett nok` style with a hairline-soft separator between rows. No box around it — sits in the paper.

**Tags** — mono uppercase 9px / 600 chips with a 4px corner radius and hairline border. The contrast with the section-1 chips on Filters (which fill vermillion when active) is intentional: here on Result they're informational *labels*, not interactive controls.

**Sticky actions** — primary `Start tur` is vermillion with the travel time `↗ 22m` in a mono pill on the right. Below it, two 46px ghost buttons split 50/50 for "Pick another" and "Not my hike". On Android, the same buttons get a 10px radius and the primary gets a subtle vermillion-tinted drop shadow.

### 4.5 Detail

The Detail view is **always** reached via the `Mer info` row on Result. Same top-bar treatment, smaller hero (200px), then:

- `01 ── OM TUREN` — body description (`hike.descNo / hike.descEn`), 15.5/1.6/ink.
- `02 ── HØYDEPROFIL` (with `{ascent} m stigning` on the right) — elevation chart in a paper-snow card: hairline horizontal gridlines, vermillion path with `stroke-dasharray` draw-on (1200ms), summit marker is a vermillion dot with a dashed callout up to a `▲ 314m` label. Mono X-axis: `0 KM · SUMMIT · 4,8 KM`.
- `03 ── STARTPUNKT` — a smaller topographic-map card, parking label in eyebrow style, and a small "↗ Åpne i kart" pill button on the right.
- `04 ── SESONG` — 12-cell month strip. Each cell is `flex: 1`, hairline border, 10/0/7 padding, 9.5/600 mono uppercase month abbreviation. In-season months fill vermillion; out-of-season are snow + sub.
- `05 ── SIKKERHET` — a paper-snow card listing each safety reason as a row (red-filled check circle + label). Below it, a dashed-top disclaimer in `sub` color: *"Anbefalt basert på tilgjengelige data. Sjekk alltid lokale forhold."*
- Footer source row — `SRC → morotur.no/tur/klimpan` in snow with hairline border. In production this must be an external link.

---

## 5. Design tokens

### 5.1 Palettes (defined in `app-trail.jsx` → `TRAIL_PALETTES`)

#### Trailhead (light, default)

| Token            | Value      | Use                                            |
| ---------------- | ---------- | ---------------------------------------------- |
| `--paper`        | `#F2EFE7`  | Page background (warm cream)                   |
| `--snow`         | `#FAF8F2`  | Card / chip background                         |
| `--card`         | `#FFFFFF`  | Pure-white card surfaces (rare)                |
| `--ink`          | `#141413`  | Primary text                                   |
| `--graphite`     | `#605C53`  | Secondary text                                 |
| `--sub`          | `#8B867A`  | Tertiary (mono labels, captions)               |
| `--hairline`     | `#D9D3C3`  | Standard 1px borders, dividers                 |
| `--hairlineSoft` | `#E6E1D2`  | Inner row dividers                             |
| `--vermillion`   | `#C8242C`  | THE accent — CTAs, trail, accent text, focus   |
| `--vermillionInk`| `#FAF8F2`  | Foreground on vermillion                       |
| `--vermillionTint`| rgba(8%) | Why-this card backgrounds                      |
| `--vermillionEdge`| rgba(22%)| Why-this card border                           |
| `--topo`         | `#B7AC93`  | Standard contour lines                         |
| `--topoDeep`     | `#8E826A`  | Index contour lines (every 4th)                |
| `--topoLight`    | `#E0D7BF`  | Soft fills / faded base map                    |
| `--good`         | `#1F5C34`  | Safety: recommended                            |
| `--caution`      | `#B7651F`  | Safety: check conditions                       |
| `--danger`       | `#8B1E2A`  | Safety: not recommended                        |
| `--goodTint`     | rgba(10%)  | Safety strip background — good                 |
| `--cautionTint`  | rgba(10%)  | Safety strip background — caution              |
| `--dangerTint`   | rgba(10%)  | Safety strip background — danger               |

#### Night Map (dark)

True near-black ground (`#0E0D0B`), not just inverted. `--card` is `#1B1813` (a touch warm so it doesn't read as iOS-style gray). `--vermillion` brightens to `#E0353D` for AA contrast against dark surfaces. `--good` shifts to `#5C9E6E` so safety dots still read as muted green. All contour colors compressed into a dark brown band so the topo lines feel like firelight.

#### Fjord (alt)

Cool blue-grey paper (`#E8EDEC`), slightly more saturated, `--vermillion` desaturated to `#B23222` for a muted Scandinavian-coast feel. Contour lines shift to teal-grey. Use when the brand wants a colder/coastal voice (e.g. summer marketing, late-season hikes).

#### Accent overlay (added in latest revision)

Stakeholder feedback: the original `#C8242C` vermillion read too aggressive — fine on small accent marks, too shouty when it carried a 58px full-width CTA. We kept vermillion in the codebase as one option, but the **default accent is now `Brick`**, with five other curated options exposed via the tweaks panel.

The accent overlay **does not replace the palette** — it only overwrites the four `vermillion*` slots (`vermillion`, `vermillionInk`, `vermillionTint`, `vermillionEdge`) so every existing reference (CTAs, trail line, search rings, accent text, section numbers, range thumb, in-season month cells, etc.) recolors automatically. The map's topographic ink, the safety colors (`good`/`caution`/`danger`), and the paper/snow/ink ground are untouched.

Defined in `Naertur.html` as `ACCENT_PRESETS`, applied via `applyAccent(palette, key, isDark)`:

| Key          | Light `base` | Dark `base` | When to use                                                    |
| ------------ | ------------ | ----------- | -------------------------------------------------------------- |
| `brick`      | `#A04A3E`    | `#C56858`   | **Default.** Softer dusty red — keeps the Norwegian-flag warmth without the aggression. |
| `terracotta` | `#B86A3D`    | `#D78A5C`   | Warm clay / orange-shifted — friendly, autumnal, earthy.       |
| `moss`       | `#3F6B45`    | `#6FA37A`   | Outdoor green — most on-brand for hiking, calm and grounded.   |
| `slate`      | `#344A5E`    | `#7B97AE`   | Quiet ink-blue — sophisticated, neutral, very Scandinavian-modern. |
| `ink`        | `#141413`    | `#F2EFE7`   | Monochrome — no chromatic accent. Maximum editorial restraint. |
| `vermillion` | `#C8242C`    | `#E0353D`   | Original. Keep as an opt-in for bold-mode marketing surfaces.  |

For each preset, derive `ink` (text-on-accent, AA-contrast), `tint` (~8–12 % alpha for soft backgrounds), and `edge` (~20–28 % alpha for the Android CTA drop-shadow). Light/dark variants are pre-tuned so the dark mode hop matches the existing `Night Map` brightness shift.

Implementation in the target stack should follow the same idea: store the accent as a single semantic token (`--accent`, `--on-accent`, `--accent-tint`, `--accent-edge`) and swap *only* those four values rather than forking the whole theme. Pick **one** default and ship the rest behind a feature flag if the team wants to A/B in production.

### 5.2 Typography

**Primary family:** [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) (Google Fonts). Variable on three axes: `opsz`, `wdth` (75–100), `wght` (400–800). The compressibility of the width axis is what we exploit — the wordmark uses `wdth: 90` for a slightly condensed feel; everything else uses the default 100.

**Italic accent:** [Newsreader](https://fonts.google.com/specimen/Newsreader) italic at weight 500. Used **sparingly** — one or two words per screen, always in vermillion. e.g. `One hike. Today.` where "Today." is the Newsreader italic.

**Mono:** native `ui-monospace, SF Mono, monospace` — no Google import needed. Mono is used heavily for callsigns, section numbers, coords, fact labels, slider ticks. Always with letter-spacing ≥ 0.4 for legibility at small sizes.

| Role                  | Font / Size / Weight              | Letter-sp / Notes                  |
| --------------------- | --------------------------------- | ---------------------------------- |
| Welcome H1            | Bricolage 700, 44/0.95            | -1.6, balance wrap                 |
| Welcome H1 accent     | Newsreader italic 500, same size  | -1, vermillion                     |
| Result H1             | Bricolage 700, 38/0.96            | -1.4                               |
| Filter title          | Bricolage 700, 19/1.1             | -0.5                               |
| Web hero H1           | Bricolage 700, 76/0.92            | -3, wdth 95                        |
| Body                  | Bricolage 400, 15/1.5             | 0                                  |
| Body (long-form)      | Bricolage 400, 15.5/1.6           | 0                                  |
| Stat value            | Bricolage 700, 22/1               | -0.8, tabular-nums                 |
| Big numeral (length tiles, fact strip) | Bricolage 700, 22 / 18 / 32 | -0.8 to -1.2, tabular-nums |
| **Section number**    | **Mono 600, 10.5**                | 0.6, vermillion                    |
| **Section label**     | **Bricolage 600, 11**             | 0.9, UPPERCASE                     |
| **Mono callsign**     | **Mono 600, 11**                  | 0.5, ink                           |
| **Mono fact label**   | **Mono 600, 9.5–10.5**            | 0.6–0.8, graphite / sub            |
| **Mono progress**     | **Mono 600, 10.5**                | 1.2, vermillion (`SØKER · 03/04`)  |
| Chip (active)         | Bricolage 500, 13                 | 0                                  |
| Tag chip              | Mono 600, 9.5–10.5                | 0.4, UPPERCASE                     |
| Caption / footnote    | Bricolage 500, 11.5–12.5          | 0.2                                |

All numerics use `font-variant-numeric: tabular-nums`. Body sets `font-feature-settings: "ss01" on, "ss02" on` for Bricolage's stylistic alternates. The wordmark uses `font-variation-settings: "wdth" 90` (CSS variable axis).

### 5.3 Radii — sharper than v1

| Use                          | iOS    | Android    |
| ---------------------------- | ------ | ---------- |
| Primary CTA                  | 6      | 10         |
| Ghost CTA                    | 5      | 8          |
| Tag chip                     | 4      | 100 (pill) |
| Floating icon button         | 5      | 5          |
| Card / section surface       | 0–6    | 0–8        |
| Filter tile                  | 5      | 8          |
| Range thumb                  | 50%    | 50%        |

The radii are deliberately tighter than the moss v1. The only allowed platform variation is the tag chip — Android gets pill, iOS gets a rectangular 4px corner — to honor Material 3's pill-chip convention without breaking the editorial vibe on iOS.

### 5.4 Shadows

Used very sparingly. The design relies on hairlines and color, not depth.

| Use                                | Shadow                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Floating top-bar button (over hero)| `0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)`                 |
| Android primary CTA                | `0 2px 6px rgba(vermillion, .22)`                                       |
| Range slider thumb                 | `0 0 0 1px rgba(0,0,0,.10), 0 1px 3px rgba(0,0,0,.18)`                  |
| Browser-window mock                | `0 30px 60px rgba(0,0,0,.08)`                                           |

### 5.5 Spacing

- Outer page padding: 20–22 px
- Section vertical spacing: 18 px top, 10 px between header & content
- Stack gap within a section: 8 px
- Sticky CTA bottom inset: `34 + 14` px (iOS) / `24 + 14` px (Android)
- Stat row internal padding: 14/0
- Status-bar safe area: 60 px (iOS) / 56 px (Android)

---

## 6. The topographic map (`<TopoMap>`)

This is the **most important component** in the v2 design. It appears on Welcome (hero), Result (hero), Detail (hero + smaller card), and Finding (faded full-screen backdrop).

**Geometry:** 400 × 300 SVG viewBox, `preserveAspectRatio="xMidYMid slice"` so it always fills its container. Internally:

1. **Base** — solid `--paper` rect.
2. **Grid** — light hairline-soft lines every 50 units (so you can faintly see a coordinate grid behind the topo). Opacity 0.4–0.8 depending on `mode`.
3. **Contour rings (×8)** — Each ring is a "blobby" closed path generated by walking 0–360° in 18° steps and computing `(cx + cos(a)·r·w, cy + sin(a)·r·w)` where `w` is `1 + sin(a + seed)·wobble + cos(a + seed)·wobble·0.6`. Each successive ring is +18 units larger and slightly more wobbly. Every 4th ring is an *index contour* — `--topoDeep` color and 1.1px stroke. Others are `--topo` at 0.6px.
4. **Trail path** — quadratic + smooth-T curve from `(50, 240)` (lower-left) to the contour focal point (the "summit"). Stroke is `--vermillion`, 2.4px, rounded caps & joins.
5. **Trailhead marker** — at the trail start: a 7px snow-filled circle with a vermillion ring, with a small filled vermillion triangle inside.
6. **Summit marker** — at the focal point: a snow-filled triangle (8 units) outlined in `--ink` with a smaller solid `--ink` triangle inside (snow-cap effect).
7. **Compass rose** (only in `mode="hero"`) — top-right, a small circled compass with vermillion north arrow + 'N' label.
8. **Scale bar** (only in `mode="hero"`) — bottom-left, alternating filled/outlined 40-unit segments with a mono `0   1 km` label.

**Seeding for visual variety.** Each hike's `id` (e.g. `morotur-1950`) gets hashed into a 16-bit seed that offsets the contour focal point and wobble phase. So the topo for Klimpan looks different from the topo for Sukkertoppen — the user gets the impression each map is *of* its hike, not a generic illustration.

**`drawOn` animation.** When set true (default for screens entered by navigation), each ring draws on with `stroke-dasharray: 800; stroke-dashoffset: 800; animation: trail-draw 1100ms {i*90}ms` — index `i` from 0 to 7 staggers the reveal across ~1.7 s. The trail line follows at 700 ms after the rings begin. Trailhead and summit triangles `pop` in (a 520 ms spring keyframe with overshoot at 60%) at 1500 ms and 1800 ms.

**`mode='bg'`** — used on the Finding backdrop and inside the Detail trailhead card. Hides the compass / scale bar, reduces contour opacity to ~0.45, skips the trail draw-on.

When implementing this in your codebase, you can copy the SVG generation verbatim from `app-trail.jsx`. Or substitute with **real topographic raster tiles** from Kartverket — the dashed-vermillion trail line on top would still work as the "overlay layer" of any real map. The seeded-stylized version is a great fallback for offline / map-tile-failed states.

---

## 7. Motion system

All keyframes are defined once in `app-trail.jsx` (look for `trail-anim-css`) and shared across the app.

| Animation         | Keyframe                                                        | Default timing                          |
| ----------------- | --------------------------------------------------------------- | --------------------------------------- |
| Trail / contour draw-on | `stroke-dashoffset: N → 0`                                | 1100–1400 ms `cubic-bezier(.6,.1,.3,1)` |
| Section/content fade-up | `opacity 0→1, translateY(8→0)`                            | 420 ms `cubic-bezier(.2,.85,.3,1.1)`    |
| Static fade-in    | `opacity 0→1`                                                   | 380 ms ease-out                         |
| Pop (markers, glyphs) | `scale 0.6 → 1.06 → 1` + opacity                            | 520 ms `cubic-bezier(.3,1.5,.4,1)`      |
| Ring pulse        | `scale 0.5 → 1.8, opacity 0.7 → 0`                              | 2400 ms, infinite, 800 ms stagger       |
| Tap (button)      | `scale 1 → 0.96`                                                | 180 ms `cubic-bezier(.3,1.4,.5,1)`      |
| Card tap          | `scale 1 → 0.985`                                               | 180 ms same                             |
| Count-up (stats)  | `0 → target` via `requestAnimationFrame` + cubic-out             | 700 ms                                  |
| Breathe (idle)    | `translateY 0 ↔ -2px`                                           | 2 s, infinite                           |

**Stagger pattern.** When multiple elements should reveal together, increment `animation-delay` by 60–90 ms per element. The Welcome screen reveals six things in sequence (breadcrumb → H1 → body → fact strip → primary CTA → ghost CTA) using delays 0/60/140/220/300/360 ms.

**Reduce motion.** Add a `@media (prefers-reduced-motion: reduce)` block in production that drops the durations to 0 and removes the spring keyframes. The current prototype does not include this (a known omission — flag for the implementer).

---

## 8. Copy reference

All NO/EN strings live in `data.js` → `window.I18N`. Lift verbatim. Key strings:

| Key                | NO                                       | EN                                       |
| ------------------ | ---------------------------------------- | ---------------------------------------- |
| `tagline`          | Én tapp. Få en nær tur som passer i dag. | One tap. A nearby hike that fits today.  |
| `welcomeSub`       | Vi finner én tur for deg…                | We pick one hike for you…                |
| `useLocation`      | Bruk min posisjon                        | Use my location                          |
| `chooseTown`       | Velg sted                                | Choose a place                           |
| `findHike`         | Finn tur                                 | Find hike                                |
| `finding`          | Finner din tur                           | Finding your hike                        |
| `recommended`      | Anbefalt i dag                           | Recommended today                        |
| `checkConditions`  | Sjekk forhold                            | Check conditions                         |
| `notRecommended`   | Ikke anbefalt nå                         | Not recommended now                      |
| `startHike`        | Start tur                                | Start hike                               |
| `anotherOne`       | Velg en annen                            | Pick another                             |
| `notMine`          | Ikke min tur                             | Not my hike                              |
| `safetyNote`       | Anbefalt basert på tilgjengelige data.…  | Recommended based on available data.…    |
| `privacy`          | Vi lagrer ingenting om deg.              | We store nothing about you.              |

**Editorial micro-copy specific to v2** (not in i18n yet — flag for translation):

| Surface                     | NO                        | EN                       |
| --------------------------- | ------------------------- | ------------------------ |
| Welcome breadcrumb          | NÆRTUR · MØRE OG ROMSDAL · MVP | NÆRTUR · MØRE OG ROMSDAL · MVP |
| Welcome stat strip          | TURER / SESONG / VARSEL   | HIKES / SEASON / ALERT   |
| Filter eyebrow              | SØKEPARAMETRE             | SEARCH PARAMETERS        |
| Filter CTA badge            | nn KANDIDATER             | nn CANDIDATES            |
| Finding header              | SØKER · n/04              | SEARCHING · n/04         |
| Finding 4th step            | Velger tur                | Picking hike             |
| Result eyebrow              | ANBEFALT TUR · MUNICIPALITY | YOUR HIKE · MUNICIPALITY |
| Why-this counter            | ×n                        | ×n                       |
| Mer-info row hint           | BESKRIVELSE · KART · SESONG | DESCRIPTION · MAP · SEASON |
| Source row prefix           | SRC →                     | SRC →                    |
| Date stamp (safety strip)   | 20 MAI · 14:32            | 20 MAY · 14:32           |

The headline accent word is **always the last short word in the headline** — "I dag." on Welcome, never moved.

---

## 9. API contract

Unchanged from v1. Backend exposes:

```
POST /api/search/random
  → { hike, safety, transport, matchReasons[], rejectedReasons[] }

GET  /api/hikes/{id}
  → HikeDetail (extends HikeSummary)
```

See `app/schemas.py` in the [backend repo](https://github.com/Alksalt/naertur) for full types. The frontend translates `matchReasons` and safety `reasons` with helpers in `app-trail.jsx`:

```js
reasonLabel(r, L, hike) // returns NO/EN label for a reason key
```

Add new keys to **both** `data.js` i18n blocks AND `reasonLabel` when the backend introduces them.

**Local persistence:**
- `rejected: UUID[]` — store in `localStorage` and send back in `rejectedHikeIds` of the next request.
- `tags`, `difficulty`, `length`, `transport`, `maxTravel` — also persist locally so repeat sessions skip the filter screen if the user wants to re-roll immediately.
- The wiki specifies **soft-penalty weights** based on rejection history. Until the backend accepts weights, downweight client-side: when picking from candidates locally, prefer hikes whose tags overlap less with the rejected-tags set.

---

## 10. Mock hike data

In `data.js` → `window.HIKES`. Five real Møre og Romsdal hikes with realistic distance / ascent / season:

| ID            | Name                       | Municipality | Difficulty | km  | Ascent | Time   | Travel |
| ------------- | -------------------------- | ------------ | ---------- | --- | ------ | ------ | ------ |
| morotur-1950  | Klimpan                    | Vestnes      | easy       | 2.2 | 180 m  | 1 h    | 22 min |
| morotur-2104  | Sukkertoppen               | Ålesund      | medium     | 4.8 | 314 m  | 1 h 50 | 12 min |
| morotur-1788  | Rotsethornet               | Volda        | medium     | 6.2 | 659 m  | 3 h    | 38 min |
| morotur-3211  | Slogen via Patchellhytta   | Ørsta        | hard       | 12.4| 1564 m | 8 h    | 55 min |
| morotur-2440  | Aksla                      | Ålesund      | easy       | 1.2 | 120 m  | 30 min | 8 min  |

Slogen is intentionally `safety: 'check_conditions'` so the amber safety strip is exercised. Replace this fixture set with real Morotur imports once the backend is feeding live.

---

## 11. Platform notes

The `<NaerturApp>` component is the same for iOS / Android / Web. Differences:

1. **Frame chrome** (status bar, dynamic island vs hole punch, home indicator vs gesture pill) — handled by `IOSDevice` / `AndroidDevice` wrappers in the prototype. In production these come from the OS / PWA manifest.
2. **Button shapes** — passed via the `platform` prop:
   - iOS: 5–6 px radius CTAs, 4 px radius chips
   - Android: 8–10 px radius CTAs, **100 px (pill) radius chips**, subtle vermillion drop shadow on primary
3. **Safe area** — iOS 60 px top + 34 px bottom; Android 56 + 24. In a PWA, use `env(safe-area-inset-*)` with these fallbacks.
4. **Web (desktop / large viewport)** — wiki says mobile-first PWA. Don't reflow horizontally — wrap the mobile UI in a centered phone-width frame, with a faint topographic backdrop in the rest of the viewport. See `WebFrame` + `WebCopy` in `Naertur.html` for the marketing surround we used for the Web row of the canvas (left = copy + fact strip + PWA install hint; right = phone).

---

## 12. Accessibility

- All chips / tiles / tags are real `<button>`s — keep this. Don't substitute `<div onClick>`.
- Color contrast: `--ink` on `--paper` is well over WCAG AA. Vermillion on paper is 5.6:1 (passes AA). On dark theme, vermillion-on-card is 6.1:1.
- **Never** rely on color alone for safety state. The safety strip always shows: dot in color + word ("Anbefalt") + reasons + date. The state is also encoded in the strip's tinted background.
- Topographic maps are decorative. Add `aria-hidden="true"` or `role="presentation"` to the SVG.
- The native `<input type="range">` is keyboard accessible by default. Add a 2px outline on `:focus-visible` for the custom thumb.
- `prefers-reduced-motion` — **production must add this**. Disable the draw-on, ring-pulse, count-up, and pop animations under reduced-motion. Tap-scale is borderline OK to keep, but safer to also drop.
- Touch targets: every button is ≥ 36 px on its short axis; sticky CTAs are 46–58 px. WCAG 2.2 minimum (24 × 24 px) is comfortably exceeded.
- EU Accessibility Act (enforced since June 2025) requires this for any consumer-facing Norwegian PWA. Test with VoiceOver and TalkBack before launch.

---

## 13. Files in this bundle

| File                       | Purpose                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| **`Naertur.html`**         | v2 source-of-truth. Loads dependencies from CDN. Open in dev.          |
| **`Naertur-standalone.html`** | v2 with everything inlined to one file (~1.7 MB). Open anywhere offline. |
| `Naertur — Moss v1.html`   | **Reference / rejected.** Old moss aesthetic — kept for comparison.     |
| **`app-trail.jsx`**        | v2 NaerturApp + all 5 screens + `TopoMap` + style helpers + motion keyframes. |
| `app.jsx`                  | v1 NaerturApp (used only by the v1 reference HTML).                    |
| `icons.jsx`                | Shared 24×24 stroke icon set. v2 uses these for tags & transport.      |
| `data.js`                  | NO/EN i18n + tag definitions + 5-hike mock dataset. **Used by both versions.** |
| `ios-frame.jsx`            | iOS device chrome — status bar, dynamic island, home indicator.        |
| `android-frame.jsx`        | Android (Material 3) device chrome.                                    |
| `design-canvas.jsx`        | Figma-style canvas wrapper (pan/zoom, focus mode).                     |
| `tweaks-panel.jsx`         | Floating tweaks UI (language, palette toggles).                        |

To preview the design locally: just open `Naertur-standalone.html` in any browser. To work *on* the design: edit `app-trail.jsx` + open `Naertur.html` (you'll need to serve the folder over HTTP because of font-CORS — `python -m http.server` from the bundle root works fine).

---

## 14. Open questions

These came up in design and were not resolved. Flag with the PM:

1. **Town picker** — `Velg sted` on Welcome has no picker designed. Suggest a bottom-sheet with a search input + a list of ~15 Møre og Romsdal municipalities for MVP.
2. **Empty state on Result** — no candidates after filter combinations. Currently undefined. Suggest: same finding screen but rings stop pulsing, red triangle becomes an outlined diamond, and copy reads `Ingen turer passer / Try widening your filters` with a `Endre filtre` ghost CTA back to Filters.
3. **Network error on the search call** — undefined. Suggest a toast-style overlay on Filters with a `Prøv igjen` button.
4. **Settings surface** — language toggle, units, about / privacy / source attributions. Not designed. Suggest a small gear icon top-right of Welcome opening a 90%-height sheet.
5. **Map tile sourcing** — the v2 topographic SVG is hand-drawn / seeded. For production, decide whether to (a) keep it as a stylized illustration with the trail overlay, or (b) wire it to real Kartverket WMTS tiles. (a) ships faster and works offline; (b) is more useful for navigation.
6. **Reduced-motion fallback** — required, not implemented in the prototype.
7. **Soft-penalty implementation** — wiki specifies tag-weight lowering based on rejection history. Currently must happen client-side until the backend accepts weighted tags in the request. Confirm scope.
8. **Source attribution placement** — the prototype shows a small `SRC → morotur.no/tur/klimpan` row on Detail only. Per the wiki ("show source attribution clearly"), confirm whether a Morotur wordmark/link belongs on the Result hero as well.

---

*Designed against the project's wiki + `schemas.py`. v2 commits to a topographic editorial direction with spring-physics motion to differentiate from the generic outdoor-app aesthetic. Question, not assumption.*
