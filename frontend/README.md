# NærTur Frontend

Mobile-first PWA for the NærTur hike randomizer. React + Vite + TypeScript, served as a static SPA with a service worker for offline shell.

Ships **two design variants** that share a single backend + data layer:

- **Moss** — warm fjord-scene illustration aesthetic, Schibsted Grotesk.
- **Trail Map** — editorial topographic-map aesthetic, Bricolage Grotesque + Newsreader italic, vermillion red on warm paper, spring-physics motion.

See the [Variants](#variants) section for how to switch between them.

## Local setup

Prerequisites: Node 20 or newer.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite serves on `http://localhost:5173`. The default `.env` ships with `VITE_USE_MOCK=true` — the app runs entirely against the bundled 5-hike mock pool, so the backend does not need to be up.

## Scripts

| Command         | What it does                                                                    |
| --------------- | ------------------------------------------------------------------------------- |
| `npm run dev`   | Vite dev server with HMR on port 5173                                            |
| `npm run build` | Type-check (tsc) + production bundle in `dist/` including manifest + sw         |
| `npm run preview` | Serve the built `dist/` locally to sanity-check the production bundle          |
| `npm test`      | Run Vitest once (used in CI / pre-commit)                                       |
| `npm run test:watch` | Vitest in watch mode                                                       |
| `npm run lint`  | ESLint over the source                                                           |
| `npm run format`| Prettier write over `src/` and `tests/`                                          |

## Environment flags

| Variable             | Default                    | Effect                                                                  |
| -------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `VITE_USE_MOCK`      | `true`                     | When `true`, all searches resolve from `src/api/mock.ts` (no backend needed). Set to `false` to call the FastAPI backend. |
| `VITE_API_BASE_URL`  | `http://localhost:8000`    | Base URL of the FastAPI backend. Only consulted when `VITE_USE_MOCK=false`. |
| `VITE_VARIANT`       | `moss`                     | Default design variant. One of `moss`, `trail`, `random`. `random` rerolls every page load (coin flip per refresh). |

## Variants

The frontend ships two complete designs and resolves which one to render at runtime via this priority:

1. **URL query**: `?variant=moss` or `?variant=trail`. Wins over everything; lets you share a stable link to a specific variant.
2. **localStorage override**: set by the in-dev variant switcher (bottom-left of the screen when running `npm run dev`).
3. **`VITE_VARIANT` env**: `moss` / `trail` / `random`. `random` is a per-page-load coin flip — best for live A/B with visitors.
4. Falls back to `moss`.

The dev switcher (only shown in dev) has buttons to pin a variant, reset to env-default (random), and copy a share URL. Pinning persists in localStorage until you reset.

In Trail variant, theme cycles through Trailhead (light, default), Night Map (dark), and Fjord — tap the moon/sun chip on the Welcome footer. Moss variant cycles Moss → Moss Dark → Fjord. Both use the same Norwegian/English toggle.

## Flipping to the live backend

1. In a separate terminal, start the backend per the root README (docker DB → alembic upgrade → import a few Morotur routes → uvicorn). Confirm `http://localhost:8000/api/health` responds.
2. In `frontend/.env`, set `VITE_USE_MOCK=false`.
3. Restart `npm run dev`.

The backend's CORS allowlist already includes `http://localhost:5173`. The backend now serializes responses with camelCase aliases (`response_model_by_alias=True` on the search route + `populate_by_name=True` on the Pydantic models), so the wire format is camelCase end-to-end — no client-side adapter needed.

## Project layout

```
frontend/
├── public/                # Static assets served from /
├── src/
│   ├── main.tsx           # ReactDOM mount
│   ├── App.tsx            # Variant resolver → renders MossApp or TrailApp
│   ├── DevVariantSwitcher.tsx  # Dev-only floating switcher
│   ├── config.ts          # Variant resolution (URL > localStorage > env > default)
│   ├── styles.css         # Reset, font wiring, range slider, prefers-reduced-motion
│   ├── types.ts           # Shared TS types (mirrors app/schemas.py)
│   ├── i18n.ts            # NO/EN strings, tag definitions, town list
│   ├── store.ts           # localStorage hooks (filters, rejected, lang, theme)
│   ├── format.tsx         # fmtDur (lang-aware), hexA, fmtDistanceKm
│   ├── reasons.ts         # matchReason → icon/label mapping
│   ├── api/
│   │   ├── client.ts      # randomHike + generation guard
│   │   └── mock.ts        # 5-hike fixtures + filter + pick
│   └── variants/
│       ├── moss/          # Variant 1: fjord scenes + Schibsted Grotesk
│       │   ├── MossApp.tsx
│       │   ├── theme.ts, primitives.tsx, styles.ts, ErrorBanner.tsx
│       │   ├── components/{Icon,NaerturMark,MapPlaceholder,scenes/}
│       │   └── screens/{Welcome,Filters,Finding,Result,Detail}.tsx
│       └── trail/         # Variant 2: topographic maps + Bricolage + vermillion
│           ├── TrailApp.tsx
│           ├── theme.ts, primitives.tsx, styles.ts, ErrorBanner.tsx
│           ├── animations.css, hooks/useCountUp.ts, utils.ts
│           ├── components/{Icon,Wordmark,DifficultyGlyph,StatIcon,TopoMap,ElevationChart}
│           └── screens/{Welcome,Filters,Finding,Result,Detail}.tsx
└── tests/                 # Vitest + RTL — one welcome smoke per variant
```

## Design handoffs

Two interactive React/HTML prototypes ship next to the frontend:

- `../design_handoff_naertur_frontend/` — **Moss** variant. Open `Naertur.html` in a browser.
- `../design_handoff_naertur_frontend 2/` — **Trail Map** variant. Open `Naertur.html` or the inlined `Naertur-standalone.html`. (Ignore `Naertur — Moss v1.html` — that's the rejected early iteration.)

Both handoffs document tokens, screens, and motion in their respective `README.md`. The implementations in `src/variants/{moss,trail}/` lift JSX structure + inline styles directly from the handoffs and rewrite in TypeScript.

Note: the moss handoff's API contract section is stale (lists a `language` field on `SearchRequest` and `expert` as a difficulty option). The cleaned-up backend dropped both — see `../app/schemas.py` for the authoritative shape; `src/types.ts` mirrors that.

## PWA

`vite-plugin-pwa` is configured with sane defaults:

- Manifest at `/manifest.webmanifest` (NærTur, theme color `#2D3A2E`, standalone display).
- Service worker (`/sw.js`) precaches the built static shell — HTML, JS, CSS, fonts, and the four hero SVGs. API responses are **not** cached.
- Auto-update on visit (no install banner UI yet — handoff §14.3 carries that as an open question).
- Manifest icons reference `/icon.svg` and `/icon-maskable.svg`. PNG icons can be added later if a specific target browser refuses SVG.

To verify PWA wiring: build (`npm run build`), preview (`npm run preview`), open DevTools → Application → Manifest, and confirm the service worker is registered under Application → Service Workers.

## Known deferrals

These were intentionally left for follow-up waves (see the project wiki + the handoff's open-questions section):

- Real map tiles. The Detail screen renders a stylized topo SVG.
- "Åpne i kart" / "Open in maps" deep links. Button is rendered, no action wired.
- Soft-penalty weighting for rejected tags — needs an API change to accept tag weights.
- Smart offline cache of past results. Currently only the static shell is cached.
- Settings / About page beyond the language + theme toggle on Welcome.
- E2E tests with Playwright.

## Data, privacy

The frontend stores up to six things in `localStorage`:

- `naertur.filters.v1` — last-used difficulty, length, transport, maxTravel, tags, avoid.
- `naertur.rejected.v1` — hike IDs the user has dismissed this session.
- `naertur.lang.v1` — language preference.
- `naertur.theme.v1` — moss-variant theme name.
- `naertur.trail.theme.v1` — trail-variant theme name (separate so the two variants remember their own palette).
- `naertur.variant.override` — set only if you used the dev switcher; otherwise absent.

No personally identifying data is collected, no analytics calls are made, and no third-party scripts are loaded beyond Google Fonts.
