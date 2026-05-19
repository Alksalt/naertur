# NærTur

## Project Idea

NærTur is a very simple mobile-first hiking picker for Norway.

Core promise:

> One tap. Get a nearby hike that fits today.

The app should help people who want to go outside but do not want to search through many tour lists. It should feel closer to a safe randomizer than a large hiking encyclopedia.

## Product Principles

- Free to use.
- Norwegian and English.
- Built for mobile first.
- No registration.
- No user profiles.
- No social feed.
- No LLM dependency.
- No unnecessary user data storage.
- Local-only preference memory where possible.
- Safety before randomness.

## Basic User Flow

1. User opens the app.
2. App asks for location or lets the user choose a nearby town.
3. User chooses simple filters:
   - difficulty
   - max travel time
   - car or no car
   - length
   - tour type/preferences
4. User taps `Finn tur` / `Find hike`.
5. App returns one suitable hike.
6. User can choose:
   - `Start tur`
   - `Velg en annen`
   - `Ikke min tur`

## Core Filters

These are considered core features, not optional extras:

- `Barnevennlig` / child-friendly
- `Hund ok` / dog-friendly
- `Utsikt` / viewpoint
- `Skog` / forest
- `Fjell` / mountain
- `Vann` / water/lake
- `Foss` / waterfall
- `Rundtur` / loop trail
- `Under 5 km`
- `5-10 km`
- `10+ km`
- `Åpen nå` / season safe
- `Ikke bratt` / avoid steep hikes
- `Kollektiv mulig` / public transport possible
- `Har bil` / has car
- max travel time

## Difficulty

Initial difficulty choices:

- `Enkel`
- `Medium`
- `Krevende`

These can map internally to source-specific gradings such as:

- green
- blue
- red
- black

## Safety Model

Season safety is not just a filter. It is a hard gate.

Recommended safety states:

- `Anbefalt i dag` - can be randomized.
- `Sjekk forhold` - can be shown with warning, but should not be the default random result.
- `Ikke anbefalt nå` - should not be randomized.

Potential blocking reasons:

- outside recommended season
- winter mountain route without winter safety data
- avalanche danger
- flood or landslide warning
- severe weather
- high wind on exposed route
- steep terrain when user asked to avoid steep hikes
- missing safety data for risky terrain

The app should never promise that a route is safe. Better wording is:

> Recommended based on available data. Always check local conditions.

## Randomizer Behavior

Random does not mean careless. The randomizer should work like this:

1. Apply hard filters:
   - safety
   - season
   - difficulty
   - max travel time
   - transport availability
2. Apply user preferences:
   - child-friendly
   - dog-friendly
   - viewpoint
   - forest/mountain/water/waterfall
   - loop
   - length
   - avoid steep
3. Build a candidate pool.
4. Pick randomly from the best candidates.
5. Avoid repeating recently rejected hikes.

When user taps `Ikke min tur`, store only local information:

- rejected hike IDs
- rejected tags this session
- soft penalties for repeated dislikes

Example:

- If the user rejects waterfall hikes several times, lower the weight for `foss`.
- If the user rejects steep hikes, prioritize `Ikke bratt`.
- If the user rejects long hikes, prefer shorter hikes.

This can be done with local storage on the phone/browser. No account needed.

## Data Source Strategy

### Møre og Romsdal MVP

Møre og Romsdal is a good starting region because Morotur provides real tour suggestions, not only raw trail lines.

Useful Morotur data appears to include:

- tour name
- route geometry / GeoJSON
- difficulty
- municipality
- length
- ascent
- highest point
- season
- estimated time
- parking/access text
- route description
- source page URL

Example source page:

- https://morotur.no/tur/klimpan

Morotur also exposes map service layers:

- https://kart.gislink.no/arcgis/rest/services/Friluftsliv/Morotur/MapServer/layers

Relevant layers:

- `Fotturer`
- `Skiturer`
- `Sykkelturer`
- `Padleturer`

For the first version, focus on `Fotturer`.

### Stikk UT

Stikk UT is important inspiration and a possible partner/source, but the app should not scrape Stikk UT.

Clean options:

- deep-link to Stikk UT pages where appropriate
- ask for permission or a partner feed
- use public/open Morotur data where allowed
- show source attribution clearly

Avoid:

- copying check-in functionality
- copying turkode/registration mechanics
- automated scraping of app content without permission
- confusing users into thinking NærTur is Stikk UT

### National Norway Structure

For all of Norway, the architecture should not depend on only one data source.

Use a source-adapter model:

- `morotur_importer`
- `kartverket_turrutebasen_importer`
- `entur_stops_importer`
- `future_stikkut_partner_importer`
- `future_local_source_importer`

Each importer converts external data into the same internal hike model.

Kartverket Turrutebasen is useful nationally, but it is route infrastructure rather than complete tour suggestions:

- https://www.kartverket.no/api-og-data/friluftsliv

It can help with route geometry, hiking route context, parking, viewpoints, toilets and similar infrastructure, but NærTur still needs curated tour suggestions from Morotur, local sources, or partnerships.

## Public Transport

Use Entur for public transport.

Relevant sources:

- Journey Planner API: https://developer.entur.org/pages-journeyplanner-journeyplanner/
- Stops and timetable data: https://developer.entur.org/stops-and-timetable-data/

Recommended approach:

1. Import Entur stop data regularly.
2. Precompute nearest stops to each trailhead.
3. During search, first narrow hike candidates locally.
4. Call Entur Journey Planner only for the best candidates.
5. Keep hikes where:
   - public transport route exists
   - total travel time is within max travel time
   - final walk from stop is acceptable
   - return trip is possible

Do not call Entur for every hike on every search.

## Weather And Safety APIs

Potential safety sources:

- MET Locationforecast: https://api.met.no/weatherapi/locationforecast/2.0/documentation
- NVE avalanche warning API: https://api.nve.no/doc/snoeskredvarsel/
- NVE flood warning API: https://api.nve.no/doc/flomvarsling/
- Varsom/Regobs context: https://www.varsom.no/en/about/regobs/

Use live data for:

- heavy rain
- strong wind
- freezing conditions
- avalanche danger
- flood/landslide warnings
- winter conditions

Cache safety checks per hike/area for a short period, for example 30-60 minutes.

## Technical Architecture

Recommended stack:

- mobile-first PWA frontend
- small backend API
- PostgreSQL + PostGIS
- importer jobs
- safety cache
- transport adapter
- local browser storage for dislikes/preferences

High-level architecture:

```text
Mobile PWA
  |
  | POST /search
  v
NærTur API
  |
  +-- PostGIS hike database
  +-- Randomizer
  +-- Safety engine
  +-- Entur adapter
  +-- Weather/NVE cache
  |
Nightly import jobs
  |
  +-- Morotur
  +-- Kartverket Turrutebasen
  +-- Entur stops
  +-- future partner/local sources
```

## Normalized Data Model

Example internal model:

```ts
type Hike = {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  titleNo: string;
  titleEn?: string;
  municipality: string;
  county: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  distanceMeters?: number;
  durationMinutes?: number;
  ascentMeters?: number;
  highestPointMeters?: number;
  seasonStart?: string;
  seasonEnd?: string;
  routeGeometry: unknown;
  trailhead: {
    lat: number;
    lon: number;
  };
  isLoop?: boolean;
  tags: string[];
  sourceUpdatedAt?: string;
};
```

Example tags:

```text
child_friendly
dog_ok
viewpoint
forest
mountain
water
waterfall
loop
not_steep
public_transport_possible
parking
```

## Search API Shape

Example request:

```json
{
  "location": {
    "lat": 62.4722,
    "lon": 6.1549
  },
  "language": "no",
  "difficulty": ["easy", "medium"],
  "maxTravelMinutes": 45,
  "transport": "public_transport",
  "lengthBucket": "under_5km",
  "tags": ["child_friendly", "viewpoint", "loop"],
  "avoid": ["steep"],
  "rejectedHikeIds": ["morotur-1950"]
}
```

Example response:

```json
{
  "hike": {
    "id": "morotur-1950",
    "title": "Klimpan",
    "difficulty": "easy",
    "distanceMeters": 2200,
    "durationMinutes": 60,
    "sourceUrl": "https://morotur.no/tur/klimpan"
  },
  "safety": {
    "status": "recommended_today",
    "reasons": ["inside_season", "no_active_warning"]
  },
  "transport": {
    "mode": "public_transport",
    "estimatedMinutes": 38
  }
}
```

## Privacy

NærTur should avoid persistent user data.

Recommended privacy rules:

- no account
- no server-side user profile
- no social graph
- no analytics at first
- no LLM calls
- no saved exact location unless user explicitly asks
- dislikes stored locally only
- server logs should not keep exact coordinates

If public transport search uses Entur, coordinates may be sent to Entur for route planning. This should be stated plainly in privacy text.

## MVP Plan

Version 1 should focus on:

- Møre og Romsdal only
- Morotur `Fotturer`
- Norwegian and English UI
- mobile-first PWA
- current-location or choose-town mode
- simple filters
- random safe hike
- `Ikke min tur`
- source link back to Morotur/Stikk UT where appropriate
- Entur public transport support
- MET/NVE safety checks

Do not start nationwide. Build the structure for nationwide, but validate the idea in one region first.

## Open Questions

- What exact licence and usage terms apply to Morotur API/data in production?
- Should NærTur show full Morotur descriptions or only summaries plus source links?
- Should users be able to choose municipality instead of GPS?
- What is the acceptable final walk distance from a bus stop to trailhead?
- How strict should `barnevennlig` be?
- How should `hund ok` handle leash rules and protected areas?
- Should yellow safety status be shown at all, or only after explicit user opt-in?
- Should the app start as web/PWA before native app?

## Current Recommendation

Start with Møre og Romsdal using Morotur as the main tour source.

Build NærTur with a national-ready source adapter structure from day one, but only enable one high-quality region first. The biggest risk is not the UI or randomizer. The biggest risk is reliable, legally usable, safety-aware tour data across all of Norway.
