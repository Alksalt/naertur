# Handoff — NærTur frontend (mobile-first PWA)

> Reference design for the NærTur "one tap, get a nearby hike" picker — Norwegian-first, mobile-focused, with Android/iOS/web variants.
> Source repo this design pairs with: [`Alksalt/naertur`](https://github.com/Alksalt/naertur) (FastAPI + PostGIS backend).

---

## 1. About the design files

The files in this bundle are **design references created in HTML/React** — interactive prototypes showing intended look-and-feel and behavior. **They are not production code to copy directly.**

Your job is to **recreate these designs in the NærTur target environment** (mobile-first PWA per the project's wiki) using whatever framework you and the team have chosen — likely React + Vite, Next.js, SvelteKit, or a PWA-friendly framework of your choice. Reuse the visual language and copy verbatim, but rewrite the components against your stack's idioms, routing, and state management.

The HTML prototype runs by:
1. Open `Naertur.html` — a `<DesignCanvas>` wraps three rows of artboards (iPhone full flow, Android full flow, Web frame).
2. Each artboard mounts a fresh `<NaerturApp>` at a chosen `initialScreen`. Clicking inside a phone navigates that instance only.
3. A tweaks panel (right-bottom) controls language (NO/EN) and theme palette.

---

## 2. Fidelity

**High-fidelity.** Colors, spacing, typography, and copy are final. Match pixel-for-pixel where reasonable. Where icons are SVG path-defined in `icons.jsx`, you can either:
- Replace with your icon library equivalents (Lucide, Phosphor, Heroicons), OR
- Lift the 24×24 stroke SVG paths verbatim — they are intentionally simple and on-brand.

---

## 3. Product context (from the project wiki)

NærTur's promise: **"Én tapp. Få en nær tur som passer i dag."** ("One tap. Get a nearby hike that fits today.")

- Free to use. Norwegian + English. **No registration, no accounts, no user profiles.**
- Mobile-first PWA. Local-first preference storage.
- Safety before randomness — the app should never claim a route is safe.
- MVP scoped to **Møre og Romsdal** with Morotur as the data source.

The frontend has **5 primary screens** plus a transient rejected/finding state.

---

## 4. Screens

### 4.1 Welcome (`screen = 'welcome'`)

**Purpose:** First-run / cold-open. Get permission for location (or town picker), then push to filters.

**Layout (mobile, 402 × 874 reference dims):**

```
┌────────────────────────────────────┐
│ ◀ status bar (60px top safe)       │
│  NærTur (wordmark)     v0.1 · MVP  │  ← row at top: 42px, padded 22
│                                    │
│        [Fjord SVG hero scene]      │  ← 52% of height (≈455px)
│          (gradient fades into bg)  │
│                                    │
│ Én tapp. Få en nær tur             │  ← H1, 36px / 1.02 / -1.2 letter-sp
│ som passer i dag.                  │
│                                    │
│ Vi finner én tur for deg —         │  ← muted body, 15.5px / 1.45, max 320
│ basert på vær, sesong og hva       │
│ du har lyst på i dag.              │
│                                    │
│ [🌿 Gratis. Ingen konto.]          │  ← chip badges, 12.5px
│ [⚡ Lokal-først.]                  │
│                                    │
│   ───── flex spacer ─────          │
│                                    │
│ ┌────────────────────────────────┐ │
│ │  📍  Bruk min posisjon         │ │  ← primary CTA, 52px, primary fg
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │      Velg sted                 │ │  ← secondary, 50px, 1.5px border
│ └────────────────────────────────┘ │
│  Vi lagrer ingenting om deg.       │  ← privacy footer, 12.5px muted
│ ─── home indicator (34px safe) ─── │
└────────────────────────────────────┘
```

**Components:**
- **Hero scene** — `<SceneFjord>` SVG with layered far-range, mid-range, water with reflection lines, and shore silhouette. Gradient mask fades the last 110px into the bg color so the headline reads cleanly.
- **Wordmark `<NaerturMark>`** — small SVG glyph (3 layered peak triangles in accent color) + "NærTur" at 22px, Schibsted Grotesk 600, -0.5 letter-spacing.
- **CTA primary:** 52px tall, `border-radius: 16` on iOS / `border-radius: 100` (pill) on Android. Background `--primary` (#2D3A2E), text `--primary-ink` (#F4EFE6). Includes a 20px location icon left of label. Material Android adds `box-shadow: 0 2px 6px rgba(45,58,46,.25)`.
- **CTA secondary:** Transparent bg, 1.5px solid `--border`, same radius rules. 50px tall, 15px / 500.

**Interactions:** Tapping either CTA pushes `screen = 'filters'` and stores `location = { label, sub }`. In the real app, the first one triggers `navigator.geolocation`; the second opens a municipality picker (not designed yet — see open questions).

---

### 4.2 Filters (`screen = 'filters'`)

**Purpose:** Pick difficulty, length, transport, max travel, tags, and avoids before tapping "Finn tur".

**Layout:**

```
┌────────────────────────────────────┐
│ status bar (60px)                  │
│ ◀  Filtre              📍 Ålesund  │  ← mini header, 17/600 title
├────────────────────────────────────┤
│ VANSKELIGHET                       │  ← section labels: 12px, .2 sp,
│ ┌──────────┬──────────┬──────────┐ │     uppercase, muted, 500
│ │  Enkel   │  Medium  │ Krevende │ │  ← Segment: 36px, 12px chip bg,
│ └──────────┴──────────┴──────────┘ │     active = card bg + 600 weight,
│                                    │     2px inner card shadow
│ LENGDE                             │
│ ┌──────────┬──────────┬──────────┐ │
│ │Under 5 km│ 5–10 km  │ 10+ km   │ │  ← same Segment pattern
│ └──────────┴──────────┴──────────┘ │
│                                    │
│ TRANSPORT                          │
│ ┌────────┬────────┬────────┐       │
│ │  🚗     │  🚌     │  👣     │       │  ← 64px tall icon+label tiles
│ │  Bil   │Kollektiv│ Til fots│       │     active = chipActive bg + ink
│ └────────┴────────┴────────┘       │
│                                    │
│ MAKS REISETID            45 MIN    │
│ ──────●────────────                │  ← native range, accent thumb
│ 15        60        120            │
│                                    │
│ HVA SLAGS TUR                      │
│ [👁 Utsikt] [🌲 Skog] [⛰ Fjell]    │  ← tag chips, 36px pill, 13.5/500
│ [💧 Vann] [🌊 Foss] [↻ Rundtur]    │     active = chipActive
│ [👶 Barnevennlig] [🐕 Hund ok]     │
│                                    │
│ UNNGÅ                              │
│ [📈 Ikke bratt]                    │
│                                    │
│ ─── (fades into bottom CTA) ───    │
│ ┌────────────────────────────────┐ │
│ │ 🧭 Finn tur            3 turer │ │  ← 56px sticky CTA + count
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Components:**
- **MiniHeader** — back arrow in a 36×36 chip-bg rounded-12 button on the left, 17/600 title, optional right slot (the location pill: chip bg, 13px / 5 padding, ⟨icon location 13px⟩ + label).
- **Segment** — see `Segment` in `app.jsx`. 4px padding, chip background, 9px inner radius. Active button has the card background + shadow `0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)`. 120ms transition on bg/color/shadow.
- **Transport tile** — 64px tall, flex column, icon 20px + 13/500 label, 14px radius. Active = `chipActive` background, `chipActiveInk` foreground.
- **Travel-time slider** — native `<input type="range">` with `accent-color: var(--primary)`. Custom thumb (22px circle, 4px white ring, soft shadow) defined in the root stylesheet — re-implement equivalent in your stack.
- **Tag chip** — pill (100 radius), 36px tall, 13.5/500, 12px padding. Icon 16px to the left. Active state swaps to chipActive.
- **Sticky CTA** — wrapped in a 14/18/(34+14) padded container with a `linear-gradient(to top, bg 60%, transparent)` mask so content can scroll under it.

**State:**
```ts
difficulty: ('easy' | 'medium' | 'hard')[]   // multi-select; default ['easy', 'medium']
length: 'under_5km' | '5_10km' | '10km_plus' | null  // single, nullable
transport: 'car' | 'public_transport' | 'walk'       // single, default 'car'
maxTravel: number                            // 15..120, step 5, default 45
tags: string[]                               // multi-select; default ['viewpoint']
avoid: string[]                              // multi-select; default []
```

**Candidate count:** Compute live (filter the local hike pool) and display in the right side of the CTA: `{n} {turer|hikes}`.

---

### 4.3 Finding (`screen = 'finding'`)

**Purpose:** Transient loading state while the backend search runs. Animates a checklist of safety/sanity checks so users feel the app is being deliberate.

**Layout:** Full-bleed primary color (`#2D3A2E` light, accent gold in dark). Centered:

```
                  ┌─────────┐
                  │   N     │
                  │  /|\    │  ← Compass, 180×180, ring + needle SVG
                  │ W-O-Ø   │     (animates: rotate 360° / 3.5s loop)
                  │  \|/    │     Accent triangle (north arrow) + muted south.
                  │   S     │     Cardinal letters at -78px translateY.
                  └─────────┘
                              
              Finner din tur…           ← 24/600/-0.6, white
       Sjekker vær, sesong og reisetid  ← 14, white 65% opacity

       ✓ Posisjon funnet                ← checklist, animated reveal
       ✓ Innenfor sesong                 ← items fade 0.3 → 1 opacity
       ✓ God værmelding                  ← circle: muted→accent on done
```

**Behavior in production:**
- Show this screen while the `POST /api/search/random` call is in-flight.
- Reveal each checklist item at ~600ms intervals (0, 600, 1200ms).
- When the response returns, transition to Result. If the call is fast, hold for at least ~1.5s so the animation reads.
- If the call errors or the candidate pool is empty, show an error/empty variant (not yet designed — show a banner with retry).

---

### 4.4 Result (`screen = 'result'`)

**Purpose:** The hero screen. Show one hike, give the user three actions: Start, Velg en annen, Ikke min tur.

**Layout:**

```
┌────────────────────────────────────┐
│ [scene hero, 280px tall]           │
│ ◀          Ålesund · 22 min   🗺   │  ← glass pills floating over hero
│                                    │     36×36 circle, blur+saturate
│   (fjord/peak/alpine SVG scene)    │     bg = card@78% alpha
│                                    │
│   ───gradient fade to bg───        │
│                                    │
│ Klimpan                            │  ← H1, 34/600/-1
│ 📍 Vestnes · Møre og Romsdal       │  ← 14px muted
│                                    │
│ [● Anbefalt i dag] Innenfor sesong │  ← safety pill: good@13% bg,
│                    · Ingen…        │     good fg, dot, 13.5/600
│                                    │
│ ┌────┬────┬────┬────┐              │  ← Stats card, 18px radius
│ │LEN.│STIG│TID │REI.│              │     1px border, card bg, padded
│ │2,2 │180 │ 1t │ 22 │              │     4-col grid, dividers between
│ │ km │ m  │    │min │              │     19/600/-0.5, tabular-nums
│ └────┴────┴────┴────┘              │     small (unit) at 0.55em / 0.55 op
│                                    │
│ ┌──────────────────────────────┐   │  ← Why-this-hike card,
│ │ HVORFOR DENNE TUREN          │   │     accent@8% bg, accent@18% border
│ │ ✓ Lett nok                   │   │     11/600 accent uppercase label
│ │ ↻ Rundtur som du ønsket      │   │     6px stack of icon + reason
│ │ 👁 Utsikt på toppen          │   │
│ │ ⏱ 22 min innenfor reisetiden │   │
│ │ 🌲 Skogstur                  │   │
│ └──────────────────────────────┘   │
│                                    │
│ [👁 Utsikt] [🌲 Skog] [↻ Rundtur]  │  ← tags as small pills
│                                    │
│ ┌──────────────────────────────┐   │  ← "Mer info" dashed-border row
│ │ ⓘ  Mer info               ›  │   │     14/500, link to detail
│ └──────────────────────────────┘   │
│                                    │
│ ─── (sticky actions area) ───      │
│ ┌────────────────────────────────┐ │
│ │ ⚐  Start tur                   │ │  ← 56px ACCENT-colored primary
│ └────────────────────────────────┘ │
│ ┌──────────┐  ┌─────────────────┐  │
│ │↻ Velg en │  │ 👎 Ikke min tur │  │  ← 48px secondaries, 50/50 split
│ │  annen   │  │                 │  │
│ └──────────┘  └─────────────────┘  │
└────────────────────────────────────┘
```

**Key components:**
- **Hero with glass pills** — Hero is 280px tall, position relative. Three controls float over the top of it (back arrow, location/travel pill, map). All use `glassBtn`/`glassPill` styles: bg `card@78% alpha`, `backdrop-filter: blur(10px) saturate(160%)`, soft drop shadow. The pill includes location icon + label.
- **Hero → content fade** — bottom 90px of hero is `linear-gradient(to bottom, transparent, var(--bg))` so the title pulls cleanly into bg.
- **Title block** — H1 at 34/600/-1, balance text-wrapping. Below: location icon + municipality + county at 14/muted.
- **Safety pill** — Background = safety color at 13% alpha, foreground = safety color. 6/12 padding, 999 radius, 13.5/600 with a 7px solid dot left of the label. Colors:
  - `recommended_today` → `--good` `#3F6B49`
  - `check_conditions`  → `--caution` `#C77E2A`
  - `not_recommended_now` → `--danger` `#9A2B3C`
  - Companion gray text after the pill: short version of `safety.reasons`.
- **Stats card** — 18px radius, 1px border, 16/4 padding, 4-column grid with `border-right` dividers. Each `Stat` shows a small uppercase label (10.5/600/.6sp muted) above a 19/600/-0.5 value. Use `tabular-nums`. Number units (`km`, `m`, `min`) are inside `<small>` at 0.55em / 55% opacity.
- **Why this card** — Accent-tinted (8% bg, 18% border), 18 radius, 14/16 padding, 11/600 uppercase accent label, then a vertical stack of icon + reason rows at 14px.
- **Tags row** — small pills (5/11/5 padding, 999 radius, 12.5px), icon 13px left.
- **"Mer info" link** — full-width row with 1px dashed border, 14/16 padding, 16 radius, 14/500 label, icon + chevron. Navigates to Detail.
- **Sticky actions** — same gradient-faded sticky pattern as filters. Primary uses `--accent` (`#D86A2E`) not `--primary` to signal commitment.

---

### 4.5 Detail (`screen = 'detail'`)

**Purpose:** Deep-link target with full description, elevation, map, season strip, safety facts, and source attribution.

**Sections (in order):**
1. **Mini hero** (200px tall, same hero treatment as Result but with the hike name in the center glass pill)
2. **Om turen** — body paragraph at 15/1.55
3. **Høydeprofil** — elevation chart in a card. SVG path (line + filled gradient under), accent color, single annotated summit point with `{ascentMeters} m` label.
4. **Startpunkt** — map placeholder card (150px tall) with stylized topographic contours + dashed trail + trailhead pin (accent) + summit marker. Bottom overlay with parking label + "Åpne i kart" pill button.
5. **Sesong** — 12-cell month strip. Each cell is `flex: 1`, 8/0/6 padding, 11/600/.2sp uppercase month abbreviation. In-season months use `good@18%` bg + `good` text. Out-of-season uses chip bg + mutedSoft.
6. **Sikkerhet** — card with bullet list of safety check passes (each with a 15px check icon in `--good`), then a divider, then the standard disclaimer: *"Anbefalt basert på tilgjengelige data. Sjekk alltid lokale forhold."*
7. **Kilde** — small bar showing the source URL (e.g. `morotur.no/tur/klimpan`). Link must open in new tab in production.

---

## 5. Interactions, transitions, and state machine

```
welcome ──(tap CTA)──▶ filters
filters ──(Finn tur)──▶ finding ──(~1.85s timer or API response)──▶ result
result  ──(Velg en annen)──▶ finding (increment hikeIdx) ──▶ result
result  ──(Ikke min tur)──▶ finding (rejected.push(id), hikeIdx++) ──▶ result
result  ──(Mer info)──▶ detail
detail  ──(◀ back)──▶ result
result  ──(◀ back)──▶ filters
filters ──(◀ back)──▶ welcome
```

**Persistence:**
- `rejected: string[]` — hike IDs the user dismissed this session. Wiki says: **store locally only.** Use `localStorage` keyed by something stable; do not send to server beyond the per-request `rejectedHikeIds` payload.
- `tags`, `difficulty`, `length`, `transport`, `maxTravel` — also persist to localStorage so repeat sessions skip re-entering preferences (wiki: "Local-only preference memory where possible").
- Per the wiki, soft-penalty weights for rejected tags should also live locally: if a user rejects waterfall hikes repeatedly, lower the `foss` weight in their next search payload.

**Animations:**
- Filter segments and chips: 120ms ease on background/color.
- Finding compass: `transform: rotate(360deg)` on a 3.5s `cubic-bezier(0.5, 0.1, 0.5, 0.9)` infinite loop.
- Checklist items: opacity 0.3 → 1 with a 220ms transition as `findingPhase` advances; the indicator circle morphs from muted to accent background in the same window.
- Result → Detail: slide-up in iOS feel, shared-element fade for the hero in Android. Up to you to match platform expectations.

---

## 6. Design tokens

### 6.1 Palettes

All three palettes are defined in `app.jsx` as `NAERTUR_PALETTES`. They include both **UI tokens** and **scene-illustration colors** (so the hero SVGs recolor with the theme).

#### Moss (default, light)

| Token            | Value      | Use                                           |
| ---------------- | ---------- | --------------------------------------------- |
| `--ink`          | `#1A1F1B`  | Primary text                                  |
| `--bg`           | `#F4EFE6`  | Page background (warm birch)                  |
| `--card`         | `#FFFEFA`  | Card surface                                  |
| `--border`       | `#E5DFD2`  | Card borders, dividers                        |
| `--muted`        | `#6B6E63`  | Secondary text                                |
| `--mutedSoft`    | `#8E9087`  | Tertiary text (smaller, less important)       |
| `--primary`      | `#2D3A2E`  | Primary CTAs ("Bruk min posisjon", "Finn tur")|
| `--primaryInk`   | `#F4EFE6`  | Foreground on primary                         |
| `--accent`       | `#D86A2E`  | Highlight, "Why this" tint, "Start tur" CTA   |
| `--accentInk`    | `#FFFEFA`  | Foreground on accent                          |
| `--good`         | `#3F6B49`  | Safety: recommended                           |
| `--caution`      | `#C77E2A`  | Safety: check conditions                      |
| `--danger`       | `#9A2B3C`  | Safety: not recommended                       |
| `--chip`         | `#EFE9DC`  | Inactive chips, segment track, slider track   |
| `--chipActive`   | `#2D3A2E`  | Selected chip background                      |
| `--chipActiveInk`| `#F4EFE6`  | Selected chip foreground                      |

#### Moss (Dark) — full inverse palette in `NAERTUR_PALETTES.mossDark`. `--bg` = `#0F1411`, `--primary` shifts to a warm cream `#D9C896` for contrast, `--accent` brightens to `#E8884A`.

#### Fjord — cool blue-grey variant. `--primary` = `#0F2A3C`, `--accent` = `#C04E2E` (clay red). Use when a colder/coastal feel is preferred.

### 6.2 Typography

**Family:** [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk) (Google Fonts). Weights used: 400, 500, 600, 700. Norwegian-origin sans, slightly humanist — fits the product. Fall back to `ui-sans-serif, system-ui, sans-serif`.

| Role                | Size | Line | Weight | Letter-sp |
| ------------------- | ---- | ---- | ------ | --------- |
| Welcome H1          | 36   | 1.02 | 600    | -1.2      |
| Result/Detail H1    | 34   | 1.04 | 600    | -1.0      |
| Web hero H1         | 64   | 0.98 | 600    | -2.0      |
| Header title (mini) | 17   | —    | 600    | -0.3      |
| Body                | 15.5 | 1.45 | 400    | 0         |
| Body (description)  | 15   | 1.55 | 400    | 0         |
| Stat value          | 19   | —    | 600    | -0.5      |
| Section label       | 12   | —    | 500    | 0.2 + UC  |
| "Why this" label    | 11   | —    | 600    | 0.8 + UC  |
| Stat label          | 10.5 | —    | 600    | 0.6 + UC  |
| Chip / tag          | 13.5 | —    | 500    | 0         |
| Caption / footer    | 12.5 | —    | 400    | 0         |
| Privacy footer      | 12.5 | —    | 400    | 0         |

All numeric values (stats, slider readout, travel time) use `font-variant-numeric: tabular-nums` for alignment. Body has `font-feature-settings: "ss01" on, "ss02" on` for Schibsted's stylistic alternates (slightly more refined `a` and `g`).

### 6.3 Radii

| Token         | Value | Use                                  |
| ------------- | ----- | ------------------------------------ |
| Card large    | 18    | Stats card, Why-this card            |
| Card medium   | 16    | Primary CTA (iOS), info row          |
| Card small    | 14    | Secondary CTA, elev/map cards        |
| Segment outer | 12    | Filter segments                      |
| Segment inner | 9     | Active segment pill                  |
| Icon button   | 12    | Header chip-bg back button           |
| Chip / tag    | 999   | All chips, tags, badges, safety pill |
| iOS primary   | 16    | Big CTA buttons                      |
| Android primary| 100  | Big CTA buttons (Material pill)      |

### 6.4 Shadows

Used sparingly; the design relies on layout and color rather than depth.

| Use                          | Shadow                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| Active segment button        | `0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)`                  |
| Floating glass pill / button | `0 1px 2px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)`                 |
| Android primary CTA          | `0 2px 6px rgba(primary, .25)`                                          |
| Slider thumb                 | `0 1px 3px rgba(0,0,0,.18), 0 0 0 4px rgba(255,255,255,.7)`             |
| Browser-window mock          | `0 30px 60px rgba(0,0,0,0.08)`                                          |

### 6.5 Spacing

The design doesn't use a strict 4/8 grid — values are picked by eye. Common values you'll see:

- Outer page padding: 18–22px
- Section vertical spacing: 14–18px gap between header label and content
- Stack gap within a section: 8–10px
- Sticky CTA bottom inset: `34 (safe area) + 14`px (iOS) / `24 + 14`px (Android)
- Status bar safe area: 60px (iOS) / 56px (Android)

---

## 7. Hero illustrations

The fjord/peak/alpine/town scenes are **inline SVG** with palette-driven fills. See `icons.jsx` → `SceneFjord`, `ScenePeak`, `SceneAlpine`, `SceneTown`. Each is a 400×260 viewBox with 5–6 layered paths:
- sky (vertical gradient)
- sun (single circle)
- far range (low-opacity polygon)
- mid range (full polygon)
- water OR foreground hill (depending on scene)
- shore line (foreground silhouette)

In production these illustrations can stay as **stylized SVGs** (matches the "no LLM, no scraping" minimal aesthetic and works offline) OR be replaced with **real photography per hike**. If photography: aim for moody Nordic light, low saturation, layered depth (sky / mountain / water / foreground). Crop to 16:7 (welcome) and 16:9 (result/detail). Always darken the bottom 90px with a gradient so the title reads.

The hike picker should select scene by **dominant terrain tag**:
- `mountain` + alpine difficulty → `alpine`
- `mountain` → `peak`
- `water` / `waterfall` → `fjord`
- otherwise → `fjord` (the warmest, most general)
- urban / town start → `town`

---

## 8. Copy reference (Norwegian primary, English secondary)

All strings live in `data.js` → `window.I18N.no` and `window.I18N.en`. Lift these verbatim:

| Key (selection)   | NO                                        | EN                                              |
| ----------------- | ----------------------------------------- | ----------------------------------------------- |
| `tagline`         | Én tapp. Få en nær tur som passer i dag.  | One tap. A nearby hike that fits today.         |
| `welcomeSub`      | Vi finner én tur for deg…                 | We pick one hike for you…                       |
| `useLocation`     | Bruk min posisjon                         | Use my location                                 |
| `chooseTown`      | Velg sted                                 | Choose a place                                  |
| `findHike`        | Finn tur                                  | Find hike                                       |
| `recommended`     | Anbefalt i dag                            | Recommended today                               |
| `checkConditions` | Sjekk forhold                             | Check conditions                                |
| `notRecommended`  | Ikke anbefalt nå                          | Not recommended now                             |
| `startHike`       | Start tur                                 | Start hike                                      |
| `anotherOne`      | Velg en annen                             | Pick another                                    |
| `notMine`         | Ikke min tur                              | Not my hike                                     |
| `safetyNote`      | Anbefalt basert på tilgjengelige data.…   | Recommended based on available data.…           |
| `privacy`         | Vi lagrer ingenting om deg.               | We store nothing about you.                     |

**Tag labels** in `data.js` → `window.TAGS`:

| ID         | NO            | EN              | Icon name |
| ---------- | ------------- | --------------- | --------- |
| viewpoint  | Utsikt        | Viewpoint       | view      |
| forest     | Skog          | Forest          | tree      |
| mountain   | Fjell         | Mountain        | peak      |
| water      | Vann          | Lake            | water     |
| waterfall  | Foss          | Waterfall       | falls     |
| loop       | Rundtur       | Loop            | loop      |
| child      | Barnevennlig  | Kid-friendly    | kid       |
| dog        | Hund ok       | Dog ok          | dog       |

Default language detection: `navigator.language.startsWith('no')` → NO, else EN. Allow override in settings (not designed yet — assume a footer toggle).

---

## 9. API contract (per the project schema)

From `app/schemas.py` in the backend:

```ts
POST /api/search/random
Request:
{
  location?: { lat: number, lon: number },
  language: 'no' | 'en',
  difficulty: ('easy' | 'medium' | 'hard' | 'expert')[],
  maxTravelMinutes?: number,        // 1..240
  transport: 'car' | 'public_transport' | 'walk',
  lengthBucket?: 'under_5km' | '5_10km' | '10km_plus',
  tags: string[],
  avoid: string[],
  rejectedHikeIds: UUID[]
}

Response:
{
  hike: { id, source, sourceId, sourceUrl, name, municipality, county,
          difficulty, distanceMeters, durationMinutes, ascentMeters,
          tags, trailhead: { lat, lon } },
  safety: { status, reasons, advisory },
  transport: { mode, estimatedMinutes, status, reasons },
  matchReasons: string[],
  rejectedReasons: string[]
}
```

Both `matchReasons` and `rejected_reasons` are arrays of short string keys. The frontend translates them with `reasonLabel(reasonKey, L, hike)` in `app.jsx`. Add new keys to both `data.js` `I18N` blocks AND `reasonLabel`/`reasonIcon` maps when the backend introduces them.

For the **Detail** screen, the project schema also exposes `/api/hikes/{id}` returning `HikeDetail` (extends `HikeSummary` with `summary`, `description`, `municipalities`, `seasonMonths`, `routeGeojson`, `transportNotes`). Fetch this when the user taps "Mer info".

---

## 10. Mock hike data (in `data.js`)

The prototype uses 5 real Møre og Romsdal hikes as fixture data. Drop these once the real Morotur import is wired:

| ID            | Name                       | Municipality | Diff   | km   | m up | min  | Travel |
| ------------- | -------------------------- | ------------ | ------ | ---- | ---- | ---- | ------ |
| morotur-1950  | Klimpan                    | Vestnes      | easy   | 2.2  | 180  | 60   | 22 min |
| morotur-2104  | Sukkertoppen               | Ålesund      | medium | 4.8  | 314  | 110  | 12 min |
| morotur-1788  | Rotsethornet               | Volda        | medium | 6.2  | 659  | 180  | 38 min |
| morotur-3211  | Slogen via Patchellhytta   | Ørsta        | hard   | 12.4 | 1564 | 480  | 55 min |
| morotur-2440  | Aksla                      | Ålesund      | easy   | 1.2  | 120  | 30   | 8 min  |

Slogen is intentionally `safety: 'check_conditions'` in the mock so you can see the amber pill state. The descriptions in NO/EN are placeholder but factually plausible.

---

## 11. Platform notes (iOS vs Android vs Web)

The prototype uses the same `<NaerturApp>` component for all three. The differences are minimal and codified in two places:

1. **Frame chrome** (status bar, dynamic island vs hole punch, home indicator vs gesture pill) — handled by the `IOSDevice` / `AndroidDevice` wrappers. In production these come for free from the OS.
2. **Button shapes** — passed through the `platform` prop:
   - iOS: 16-radius CTAs, 14-radius secondaries
   - Android: 100-radius pill CTAs with subtle drop shadow (matches Material 3 "filled button" spec)
3. **Status-bar / safe-area insets** — iOS uses 60px top + 34px bottom; Android uses 56 + 24. In a PWA, use `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` with reasonable fallbacks. Apple PWAs need `<meta name="apple-mobile-web-app-status-bar-style" content="default">`.
4. **Web (desktop)** — same mobile UI, centered on the page with the welcome scene as a softened background. Don't expand the layout horizontally — the wiki explicitly says mobile-first PWA. A desktop user gets a phone-shaped experience with the fjord backdrop. See `WebFrame` + `WebCopy` in `Naertur.html` for the marketing surround we used for the bottom row.

---

## 12. Accessibility

- All chips/segments/tags are real `<button>`s — keep that. Don't substitute `<div onClick>`.
- The native `<input type="range">` is keyboard-accessible by default; styled thumb still works with focus rings (add a 3px outline-offset focus state).
- Safety pill: never rely on color alone — the dot + word "Anbefalt / Sjekk forhold / Ikke anbefalt" must always appear together.
- Hero illustrations are decorative — give them `aria-hidden="true"` or `role="presentation"`.
- The "Vi lagrer ingenting" privacy line should be a real link/dialog in production explaining the local-only data flow (per wiki's Privacy section).

---

## 13. Files in this bundle

| File                | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `Naertur.html`      | Root file — design canvas, tweaks panel, web frame, font loading.      |
| `app.jsx`           | The `NaerturApp` component + all 5 screens + style helpers.            |
| `icons.jsx`         | 24×24 stroke `Icon` set + the four hero scene SVGs + `NaerturMark`.    |
| `data.js`           | NO/EN i18n strings + tag definitions + 5-hike mock dataset.            |
| `ios-frame.jsx`     | iOS 26 device chrome (status bar, dynamic island, home indicator, kbd).|
| `android-frame.jsx` | Android (Material 3) device chrome.                                    |
| `tweaks-panel.jsx`  | The floating tweaks UI (language + theme).                             |
| `design-canvas.jsx` | The Figma-style canvas that holds all the artboards.                   |
| `image-slot.js`     | Unused in current design but available for swapping in real photos.    |

To preview locally: open `Naertur.html` in a browser (no build step). The prototype is fully static — Babel transforms JSX at runtime via `@babel/standalone`.

---

## 14. Open questions (carried from the wiki + this design)

These came up during design and were not resolved. Flag them with the PM/team:

1. **Town picker UI** — the welcome screen has a "Velg sted" button but no picker is designed. A list of Møre og Romsdal municipalities? Or a search input? (For MVP, hard-coded list of ~10 towns is fine.)
2. **Error / empty states** — what happens when no candidates match? The design currently has no empty state. Suggest: same Finding screen layout but the compass stops and shows a "Ingen turer passer" message with "Endre filtre" CTA.
3. **Offline / PWA install** — designed for online use; offline behavior not specified. Worth caching the last 10 results and the static shell.
4. **Settings screen** — language toggle, units (km vs mi — though Norway is all-metric), about page. Not designed yet — small icon top-right of welcome?
5. **Yellow safety status display** — the wiki asks whether `check_conditions` hikes should appear by default or be opt-in. Currently the mock includes one and displays the amber pill. Confirm with PM before launch.
6. **Local soft-penalty implementation** — wiki describes lowering tag weights based on rejection history. Where does this live? Best fit is the frontend (no server-side user model), which means the rejection logic is sent in the request as adjusted `tags` weights — but the API doesn't currently accept weights, only a flat array. Backend change needed.
7. **Source attribution** — currently shown only as a small text row on the Detail screen. Wiki says "show source attribution clearly". Confirm whether a Morotur logo/link belongs on the Result screen as well.

---

*Designed with the project's wiki and `schemas.py` as the source of truth. Question, not assumption.*
