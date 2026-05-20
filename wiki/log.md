# NærTur — Project Log

A reverse-chronological log of decisions, findings, and unresolved questions. Newest entry on top.

## 2026-05-20 — Late night: Trail accent swap (Vermillion → Brick)

Small colour-only refactor per `design_handoff_naertur_frontend 3/README.md` §5.1: stakeholder feedback flagged `#C8242C` vermillion as "fine on small accent marks, too shouty when it carried a 58px full-width CTA." Default accent softened to **Brick `#A04A3E`** (dark variant `#C56858`).

Token name `vermillion` kept — only the four `vermillion*` slot *values* swapped, so every CTA, trail line, search ring, accent text, section number, range thumb, and in-season month cell recoloured automatically with no call-site edits.

**Files:**
- `frontend/src/variants/trail/theme.ts` — `trailhead`, `nightMap`, and `fjordTrail` palettes updated (base + tint @8–12% + edge @20–26%).
- `frontend/src/DevVariantSwitcher.tsx` — hardcoded `#E0353D` chip → `#C56858`.

**Untouched:** Moss variant (different design direction; handoff prescribes nothing for it), all topo/safety/paper tokens.

**Verification:** `npm run lint` clean · `npm run build` 256.35 KiB / unchanged · `tests/welcome.trail.test.tsx` + `tests/place-picker.test.tsx` 9/9 pass. The two pre-existing `tests/api-client.test.ts` failures (undici can't parse relative `/api/...` in node when `VITE_API_BASE_URL=''`) are unrelated to colour — to be revisited separately.

The other five accent presets from the handoff (`terracotta`, `moss`, `slate`, `ink`, `vermillion`) are not implemented as a runtime overlay — would require a separate `ACCENT_PRESETS` + `applyAccent` layer per the handoff. Logged as deferred since the user asked for a small refactor.

## 2026-05-20 — Night: place picker + 4 review-fix waves + Morotur email sent

### What shipped today (Waves 1–4)

**Wave 1 — clean-up after the morning review.** Test-DB destruction fixed (`tests/db.py` + `naertur_test` isolation), safety null-guard on `hike.geometry`, broader exception catching in safety, NVE bbox overlap closed (Sunnmøre vs. Romsdal at lat 62.55), admin import rate-limited, county hardcode dropped (3 sites → 1 constant + spatial bbox), `luftig` no longer auto-tags `steep`. End-to-end safety integration test (`tests/test_search_route_safety.py`) added — proves the brand promise across 30 calls.

**Wave 2 — UX/copy polish.** Privacy footer rewritten to be truthful, ErrorBanner copy moved into i18n, 16 orphan keys removed; "tema" → "filtre", "Medium" → "Middels", "Vann/Lake" → "Vann/Water"; `safetyNote` now names yr.no + varsom.no; Morotur attribution chip on Result + Detail (both variants).

**Wave 3 — biggest user-visible bug fixed.** The "Something went wrong" banner I'd been hitting was React's `SyntheticEvent` being passed as `overrideRejected` to `runSearch` and then `.filter()`'d as if it were an array — two `onSearch={() => runSearch()}` wrappers in MossApp.tsx:151 + TrailApp.tsx:147 fixed it. Plus `autoFocus` on Finding cancel for SR users. Morotur HTML scraper for ascent/highest_point fixed (regex targeted `fact__title` CSS class but live markup is `<dt>/<dd>`).

**Place picker feature (the user's #1 priority).** Replaced the 10-town hardcoded list with a SSR-backed typeahead that covers all of MR — **3345 places imported** from Kartverket (Tettsted 60, By 6, Bygdelag 171, Boligfelt 160, Grend 136, Gard 2767, Tettbebyggelse 45). Used Kartverket's `/stedsnavn/v1` REST API. Walked the alphabet because SSR rejects `sok=*`; deduped by `stedsnummer`. The agent built it discovered the live API uses `fnr` (not `fylkesnummer`), lowercase navneobjekttype codes, and `øst` (Norwegian glyph) for longitude — documented in `app/services/ssr.py`. New `Place` model + Alembic 0004 + GiST/btree indexes. New `/api/places/search` (text + proximity blend, 0.65/0.35) and `/api/places/nearest` (50 km cap). Shared `PlacePicker` React component with `slots` prop so both variants skin it. GPS path now reverse-geocodes the user's coords to a real place name.

**Ascent-aware randomizer.** New scoring bonus matches hike ascent to requested difficulty bands (easy 0–250 m, medium 200–600 m, hard 500+). Easy-only request paired with > 400 m climb is penalised −10 (and now actually evicted from the top-10 pool per the J-stream test).

**Wave 4 — 6-reviewer pass + 5-stream fix wave.**
- Trail PlacePicker active-row meta was unreadable grey-on-vermillion (~2.5:1). Fixed by removing the meta `color` override so it inherits the active button color → 5.28:1 (passes WCAG AA).
- `aria-expanded` on combobox now reflects loading/empty/offline states too, not just `results > 0`.
- Trail Result no longer renders literal "undefined kommune" when municipality is null.
- `placeTypeLabels` i18n keys realigned to actual DB values (PascalCase: `Tettsted`, `By`, `Bygdelag (bygd)`, `Gard`, `Grend`, `Boligfelt`, `Tettbebyggelse`).
- SSR pagination off-by-one (`>=` → `>`), happy-path savepoint, throttle on last page — all addressed in `app/services/ssr.py`.
- **`POST /api/admin/refetch-elevation`** added; ran live → backfilled 42 NULL hikes; ascent populated **51/51**.
- Entur stub now surfaces on Result for `public_transport` (informational chip, not alarmist).
- **MockBadge** shows "PRØVEDATA · 5 turer" / "DEMO DATA · 5 hikes" when `VITE_USE_MOCK=true` so a deploy mis-flip can't silently serve fake data.
- Polish: `useMemo` on picker slots, online/offline window listeners, `TOWNS_MR` dead export removed, empty-ascent guard (`—` instead of bare "m"), `onMouseEnter` → `onMouseMove` on rows.

### Morotur permission email

- Drafted in `wiki/morotur-permission-email.md` in the morning, polished by a final-read agent (5 edits applied: corrected API endpoint, soft-deadline → three-option close, "ingen analyse" → "ingen tredjeparts sporing" since localStorage exists, em-dash in attribution, "formell bruksavtale på deres mal").
- Created as Gmail draft via MCP; user reviewed and sent on 2026-05-20 to `petter.jenset@mrfylke.no`, cc `post@mrfylke.no`. Awaiting reply (expect 2–6 weeks for public-sector inbox).

### Final state (this commit)

- `uv run pytest -q`: **90 passed** (was 61 morning; +29 across wave fixes + new features).
- `cd frontend && npm test`: **36 passed** (was 17; +19).
- `npm run build`: 256.39 KiB / 76.95 KiB gzipped, 11 PWA precache entries. Clean.
- `npm run lint`: clean.
- Dev DB: 51 hikes (all with ascent populated), 3345 places, 51 places' worth of source_records pending audit.
- Backend running at `http://127.0.0.1:8000`; frontend at `http://localhost:5173`.

### Verdict shift

Morning: **alpha-internal-only** (4 blockers, see earlier sections).
End of day: **friend-of-a-friend / link-share-on-Facebook**. The single remaining gate to a wider share is Petter's reply to the Morotur email.

### Notable architectural / pattern decisions worth re-using

- **Per-row savepoint loop** for any importer (Morotur + SSR both use it). Failures get recorded as `failed` in `source_records` without aborting the batch.
- **SSR alphabet-walk dedupe.** `sok=*` is forbidden by Kartverket; walking `a*…å*` with stedsnummer dedupe is the way.
- **Spatial bbox filter** (`±2°lat × ±3°lon` via `ST_Within` + `ST_MakeEnvelope`) replaces a `county = ?` hardcode for national-readiness without touching importer code.
- **`slots` prop on shared components.** PlacePicker carries 200+ lines of debounce/IME/keyboard/ARIA logic that both variants share; the variant injects only the visual chrome via a `slots` factory built inline from its `C` palette.
- **Test-DB isolation via advisory lock + `DATABASE_URL` env shuffle** (`tests/db.py`). Avoids the catastrophic case where pytest TRUNCATEs the dev DB (the morning's hardest-to-debug regression).
- **Generation counter + AbortController** for stale-search guards. PlacePicker uses AbortController; randomHike uses a module-level generation counter. Same idea, different surface.

### Still open (queued for next wave)

- `/about` route with data sources + privacy + scope + contact mailto.
- CI workflow (no `.github/workflows/` yet). ~30-line yaml with postgis service container.
- Kartverket DEM ingestion — replaces the Morotur HTML scraper, unlocks per-vertex elevation and slope-derived `steep` tag. ~1–2 days.
- Vestland places import (`fnr=14`) — covers Stryn and adjacent hiking gateways. No code change required, just a different admin endpoint call.
- Petter Jenset's reply. Until then, NO public Facebook share; friend-of-a-friend testing is fine with attribution + safetyNote already on every card.

## 2026-05-20 — Evening: frontend MVP + two hardening waves

### Frontend MVP shipped

Whole `frontend/` tree introduced. Mobile-first React 18 + Vite 6 + TypeScript-strict + vite-plugin-pwa, served as a static SPA with a service worker for offline shell. Three notable decisions:

- **Two complete design variants in one bundle** — Moss (warm fjord-scene illustration, Schibsted Grotesk) and Trail Map (editorial topographic, vermillion red on warm paper, Bricolage Grotesque + Newsreader italic, spring-physics motion). Resolver order: URL `?variant=` > localStorage override > env `VITE_VARIANT` > default `moss`. `random` rerolls per page load (coin flip per refresh), for live A/B with visitors. Dev switcher chip in bottom-left during `npm run dev` only.
- **Variants share data + state layer**, fork only at visual layer. `src/{config,store,api/client,api/mock,format,reasons,i18n,types,styles.css}` are shared. Each `variants/{moss,trail}/` owns its theme, primitives, styles, ErrorBanner, components, and 5 screens — but the same backend search, same filter persistence, same rejected-hike list.
- **5-hike mock pool** at `src/api/mock.ts` lets the app run without the backend; flip `VITE_USE_MOCK=false` to call FastAPI.

Bundle: 250 KB JS / 74.63 KB gzipped, 71 modules. 11 PWA precache entries. Service worker auto-updates on visit.

### Wave 2A — 5-agent review of the frontend (Sonnet + Opus reviewers)

Found ~5 bugs, ~5 UX gaps, ~6 design drifts, plus ~8 stay-simple subtractions. Notable:

- `useLocalStorage` re-wrote on every render under React 18 StrictMode (no-op write guard added).
- Concurrent search race in `randomHike` — generation counter + typed `StaleSearchError` now discards stale results.
- `rejectedHikeIds` shipped mock IDs (`morotur-1950`) to a Pydantic-UUID backend on the live path — `sanitizeRejected()` filters to UUID-shape.
- `fmtDur` sub-60 minutes always said "min" regardless of language — now branches on `lang`.
- Both TownPicker dialogs missed focus restore + ESC handler — fixed.
- Compass cardinals hardcoded `['N','Ø','S','V']` — i18n'd via `L.compassDirs`.
- Hardcoded scene/parking/season copy moved to `src/api/mock.ts` only; the shared `UiHike` no longer carries scene/parking on the wire.

### Wave 2B — 5-agent broader hardening (backend included)

A second 5-agent pass widened the lens to find the same bug *class* in adjacent code, not just verify the prior wave.

**Backend** — admin route still emitted `route_ids` because `response_model_by_alias=True` was missing on the import endpoint. Service-layer model construction was inconsistent (camelCase `sourceId=` mixed with snake_case `name=`) — switched all to snake_case attribute names. `MoroturImporter.import_routes` now returns `"route_ids"` not `"routeIds"` (aligned with internal contract; aliases are wire-only).

**Frontend a11y** — `inert` wrapper on background when TownPicker is open (both variants); aria-labels for lang/theme/close all i18n'd via `L.langSwitchLabel`/`themeSwitchLabel`/`closeLabel`; `muted` text contrast in moss + fjord palettes failed WCAG AA — darkened both (`#6B6E63→#5A5D52`, `#5E6E78→#4D5A63`). ErrorBanner dismiss button 28→36px.

**Frontend hooks** — `runSearch` could `setState` after unmount (`StaleSearchError` only handled concurrent supersession, not unmount mid-flight) — added `mountedRef` pattern in both Apps. `useCountUp` lost its `eslint-disable react-hooks/exhaustive-deps` — deps now `[target, duration]`; callers drop the redundant `[hike.id]` arg. `TopoMap` `useMemo` deps narrowed from `[hike]` (object identity) to `[hikeId]` (string).

**Frontend motion** — moss compass `naertur-spin infinite` got `.moss-compass-spin` className and is now `animation: none !important` under `prefers-reduced-motion: reduce` (was only collapsing to 0.01ms × 1 cycle, which snapped to keyframe-final state). Deleted unused `trail-breathe` keyframe.

**Tests** — added `tests/config.test.ts` (8 tests covering resolver priority chain) and `tests/api-client.test.ts` (6 tests covering `StaleSearchError` + `sanitizeRejected`). Updated 2 backend tests that referenced the old `routeIds` dict key (one was skipped, the other passed by `populate_by_name` accident).

### Final state (pushed)

- `uv run pytest -q`: **45 passed, 3 skipped** (3 DB-only tests skip in CI).
- `npm run lint`: clean.
- `npm test`: **17 tests pass** (was 3, added 14).
- `npm run build`: 71 modules, 250 KB / 74.63 KB gzipped, 11 PWA precache entries.

### Still open

- Real map tiles + "Åpne i kart" deep links — Detail uses stylized SVG / topo maps.
- Soft-penalty rejection weighting — needs backend tag-weight support.
- Settings/About page beyond the lang + theme toggle.
- E2E tests with Playwright.
- iconBtn/iconBox at 36px passes WCAG AA but not AAA — design choice deferred.
- The privacy footer copy ("Vi lagrer ingenting om deg") — flagged as technically false (localStorage exists) but kept this wave.
- Hardcoded `"Møre og Romsdal"` at three backend sites — still the largest piece of pre-national-expansion debt.

### Notable architectural choices worth re-using

- **Variant resolver pattern**: env > URL > localStorage > default, with a `random` env flag that rerolls on every page load. Lets a single bundle ship multiple complete designs for live A/B without server-side routing. Generalises to feature-flagged UX experiments.
- **Generation-counter concurrent-call guard**: module-level `let generation = 0; const myGen = ++generation; ... if (myGen !== generation) throw StaleSearchError();`. Cleaner than AbortController for fetch-replaceable workloads; surfaces as a typed error the caller catches.
- **`display: contents` + `inert` wrapper** for modal background suppression: keeps the existing flex layout but lets `aria-modal` actually be honoured by AT (which it isn't, on its own).
- **Procedural topo-map seeding**: djb2-style hash of `hike.id` → deterministic concentric contour rings. Each hike's "map" feels custom; zero asset weight.

## 2026-05-20 — Brainstorm + agent review wave

### Decisions made today

- **Radical simplification of v1.** Ship with 3-4 filters max: difficulty, max travel time, has-car / no-car, length bucket. The 17-filter list in `wiki/naertur.md` is aspirational, not v1. Every additional filter must be earned by an actual user complaint.
- **NVE avalanche integration is a launch gate, not a nice-to-have.** "Safety before randomness" is the brand promise; shipping with MET-only safety in a country with annual avalanche deaths is reputationally and ethically risky.
- **Morotur permission must precede any public mention.** Email Petter Jenset (`petter.jenset@mrfylke.no`, to be verified) at Møre og Romsdal fylkeskommune *before* launch — see `wiki/morotur-permission-email.md` (drafted in parallel today).
- **Defer Entur, bilingual UI, soft dislike-decay, offline maps to post-v1.** Frontend itself deferred from this hardening wave per user direction.
- **PWA over native for v1.** Friction of App Store kills viral spread; PWA wins for "tap-a-link-in-a-Facebook-group" launch. iOS install-prompt caveats noted (no auto-prompt, 7-day storage TTL on inactive PWAs, geolocation re-prompt every session).
- **"Free forever, promote myself" framing needs reconciliation.** The two goals (portfolio piece vs. real product I maintain) require different commitments. Don't promise "free forever" as a hard guarantee — promise "no ads, no paid features now" and keep options open.
- **Hosting target: Hetzner CX22 (~€4/mo)** for 0-1000 DAU year one. Fly.io is the next step. Supabase free tier dies under viral spike (5 GB egress).

### Code review findings (severities)

#### BLOCKER

- `app/api/routes/admin.py:13-16` + `app/core/config.py:17` — admin import endpoint is unauthenticated when `admin_import_token` is unset (the default). Anyone can hammer Morotur 500x via this route.

#### SHOULD-FIX before launch

- `app/services/met.py` — no retry, no 429 handling, new `httpx.AsyncClient` per call. MET will rate-limit eventually.
- `app/core/config.py:14` — `met_user_agent` default `local-dev@example.com` will get blocked by MET.
- `app/services/search.py:99-103` — `matches_tags` uses AND-semantics (`issubset`); two tag preferences = zero results.
- `app/services/normalization.py:112-113` — `not_steep` tagged by *absence* of negative keywords (false-positive factory; an empty-description mountain route gets the tag).
- `app/services/normalization.py:86` — typo `spiecial_conditions` silently skips that field.
- `app/main.py` — no `CORSMiddleware`; frontend will be blocked.
- `app/api/routes/search.py` — no rate limit; one search calls MET up to 25 times (`search_safety_candidate_limit=25`).
- `app/services/safety.py:51` — `SafetySnapshot.payload` stores full ~20-50 KB MET forecast; table will balloon.

#### NICE-TO-HAVE

- `app/db/models.py` — geometry columns have `spatial_index=False`, but the Alembic migration creates GIST indexes separately, so this is intentional (no double-create). Verified, not a bug.

### Implementation gaps vs. the vision in `wiki/naertur.md`

- NVE avalanche/flood: completely absent (only MET is wired).
- Entur public transport: `transport.status="unverified_until_entur"` is hardcoded; no Entur client.
- `language` field on `SearchRequest`: accepted but never read.
- Soft dislike penalty: `rejected_hike_ids` is hard SQL `NOT IN` only; no scoring penalty, no decay.
- Frontend: doesn't exist (no PWA, no HTML, no `frontend/` directory).
- Database: empty; no import has ever run.

### Research findings

#### Competitive landscape

- Stikk UT (gamified check-in for Møre og Romsdal + Heim, 44k participants summer 2025) — *not* a randomizer; complement, not competitor.
- UT.no (DNT national catalogue) — Norwegian-only UI, browse-heavy, no GPX export in app.
- Outly — login friction, small Norway coverage.
- Norgeskart Friluftsliv (Kartverket) — map viewer, not a hike picker; recent crash complaints.
- AllTrails — aggressive monetization ($35 → $80/yr), Peak tier locks old features.
- Komoot — pay-per-region, ownership change.
- **The unclaimed gap**: all competitors assume you know where you want to go. "One-tap random nearby safe hike" is genuinely open in Norway.

#### Morotur data licensing

- No published license on morotur.no.
- Møre og Romsdal fylkeskommune operates it; volunteer-submitted content.
- Practical risk: scraping works but traction triggers a cease-and-desist email at IP-block speed.
- Clean path: written permission via the drafted email.
- Backup: Kartverket Turrutebasen is NLOD 2.0 (clearly free) but has only geometry, not curated tours — would need to write descriptions ourselves.

#### Hosting & rate-limit reality

- Hetzner CX22 (€3.79/mo) carries 0-1000 DAU.
- 10k viral users break: MET (20 req/sec total per app — must cache by rounded lat/lon/hour), Entur (only call for top 1-3 candidates), egress on map tiles.
- `.no` domain requires Norwegian org-nr; use `.app` or `.com`.

#### PWA vs native

- PWA wins for viral link-share flow.
- iOS Safari has no auto install-prompt; "Add to Home Screen" is 4+ taps in Apple's menu.
- iOS clears PWA storage after ~7 days of inactivity.
- Cache API ~50 MB cap.
- Right tactic: deliver value before nagging to install.

#### Solo-dev / portfolio framing

- The motivation cliff hits at ~month 4 when novelty fades.
- Decide commitment: portfolio piece (ship polished v1, write a LinkedIn post, move on) vs. real product (drop "free forever" as a hard guarantee).
- Norwegian indie examples worth studying: Yr (NRK side project), rusletur.no.
- Hidden costs: domains, MET User-Agent enforcement, abuse without rate limits.

### Open questions

1. Morotur written permission — sent? response?
2. NVE region bounding-box precision — coarse boxes ok for v1 or do we need full polygons via Kartverket's region data?
3. MET rate-limit headroom under viral spike — what cache-grid resolution actually keeps us under 20 req/sec at 1k concurrent users?
4. Motivation framing — "real product" or "portfolio piece"? Affects how long-term we engineer.
5. Frontend stack choice — Vite + React + Tailwind likely, but not committed.
6. Hosting choice between Hetzner CX22 and Fly.io.

### Next-wave candidates

- Frontend PWA scaffold (result screen first, no filter screen).
- Morotur API real-world quirks (after Agent B smoke test surfaces them).
- Entur stub interface (no live calls yet, just the typed contract).
- Soft dislike penalty: client-side spec.
- NVE region polygon precision via Kartverket data.
- Hosting deploy config.
- A short `tech/postgis-spatial-search.md` page in the alt-wiki (geospatial filter strategy).
- A `growth/free-app-launch-norway.md` page in the alt-wiki.

### Update — afternoon: Wave 1 (architecture review fix-ups) applied

Status after the afternoon wave (this is current state, the section above is morning snapshot).

**Morning code-review items now DONE**:

- BLOCKER: admin auth fail-closed (`admin.py` raises 403 when token unset OR mismatched, plus `tests/test_admin_auth.py`).
- MET retry + 429 handling (single retry on `Retry-After` < 5s, otherwise typed `MetUnavailable`).
- MET User-Agent validator (rejects empty/whitespace and any value containing `example.com`).
- `matches_tags` AND→OR (intersection > 0, not subset).
- `infer_tags` requires affirmative signal for `not_steep`; typo `spiecial_conditions` → `special_conditions`.
- CORS middleware wired with env-driven `cors_allowed_origins`.
- Rate limit on `/api/search/random` (slowapi, 30/min per IP).
- `search_safety_candidate_limit` lowered 25 → 10.
- `SafetySnapshot.payload` trimmed (12-hour MET window + slimmed NVE).

**Implementation gaps now closed**:

- NVE avalanche gate: wired with Sunnmøre / Romsdal / Trollheimen / Indre Fjordane bounding boxes. Region IDs verified against the live `/Region` endpoint (3022 = Trollheimen, 3023 = Romsdal, 3024 = Sunnmøre, 3027 = Indre Fjordane).
- `language` field on `SearchRequest`: deleted (was accepted-but-ignored).
- Database: importer works end-to-end after Wave 2 fixed greenlet-lazy-load + None-in-seasons + per-route savepoints. Live smoke test: 296/300 routes imported.

**Architecture review (3 parallel reviewers) further found**:

- Per-request `SearchService()` instantiation in `search.py:20` cascade-built fresh `MetClient`/`NveClient` per request, negating the shared `httpx.AsyncClient` fix → fixed via FastAPI lifespan singleton on `app.state.search_service`.
- `MoroturClient` created a new `httpx.AsyncClient` per call (600 TCP setups per 300-route import) → fixed via single client + `async with` in `admin.py` and `cli.py`.
- Holistic Opus review surfaced one footgun: `.env.example` shipped `contact@example.com` which the new validator rejects → fixed. Plus minor docs orphans in `README.md`, `wiki/naertur.md` (now updated).

**Subtractions in the cleanup pass (~250 lines removed)**:

- `language` field + `Language` literal.
- `HikeDetail` schema + `/api/hikes/{id}` route + `get_hike_detail` service.
- `expert` difficulty + `DIFFICULTY_BY_GRADE` + dead `summary` arg on `normalize_difficulty`. `"svart"` remapped to `"hard"`.
- `MoroturRouteSummary` dataclass (`discover_routes` returns `list[int]`).
- `WeatherRisk` + `AvalancheRisk` dataclasses (services return `SafetyResult` directly).
- `quality_score` column + calculation (Alembic migration `0002_drop_quality_score` with verified up/down).

**Still open from morning**:

- Entur public transport: stub remains.
- Soft dislike penalty: not implemented (client-side anyway per plan).
- Frontend: still doesn't exist.
- Morotur permission email: drafted in `wiki/morotur-permission-email.md`, not yet sent.
- Hardcoded `"Møre og Romsdal"` county at three sites (`search.py:54`, `morotur.py:160`, `models.py:29`) — flagged by all three architecture reviewers as the single largest piece of pre-national-expansion debt; deliberately deferred.

**New `wiki/log.md` open items**:

- `safety.py` has crossed ~300 lines; consider splitting if it grows further.
- `_weather_from_outcome` and `_avalanche_from_outcome` share structure (`isinstance BaseException` / `isinstance dict` / fallback) — could collapse into one parameterised helper.
- Test brittleness: `tests/test_admin_auth.py` uses `TestClient(app)` without `with`, so the lifespan never executes; future tests that hit `/api/search/random` via TestClient must use `with TestClient(app) as c:`.
