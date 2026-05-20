# NærTur Backend

FastAPI + PostGIS backend for the NærTur hiking picker MVP.

The first backend slice imports real Morotur `Fotturer`, normalizes them into a national-ready hike model, evaluates season + MET weather safety, and returns one randomized candidate for the mobile/web frontend.

## Local Setup

```bash
uv sync
docker compose up -d db
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Import a small real sample:

```bash
uv run python -m app.cli import-morotur --route-id 1950
```

Import a batch from Morotur `Fotturer`:

```bash
uv run python -m app.cli import-morotur --limit 50
```

Try search:

```bash
curl -X POST http://127.0.0.1:8000/api/search/random \
  -H 'Content-Type: application/json' \
  -d '{
    "location": {"lat": 63.034478, "lon": 7.669680},
    "difficulty": ["easy", "medium"],
    "maxTravelMinutes": 45,
    "transport": "car",
    "lengthBucket": "under_5km",
    "tags": ["viewpoint"],
    "avoid": ["steep"],
    "rejectedHikeIds": []
  }'
```

## Notes

- No account/user table is created.
- Rejected hike IDs are request input only and should be stored by the frontend locally.
- MET Locationforecast requires a descriptive `User-Agent`; set `MET_USER_AGENT` to a real contact email before first run (values containing `example.com` are rejected).
- NVE avalanche safety is wired for Møre og Romsdal regions (Sunnmøre, Romsdal, Trollheimen, Indre Fjordane); trailheads outside these boxes degrade to `check_conditions`.
- Entur public transport is still stubbed (`transport.status="unverified_until_entur"` for `public_transport` mode).

## Frontend

A mobile-first PWA lives under [`frontend/`](frontend/README.md). It ships with **two complete design variants** — Moss (warm fjord scenes) and Trail Map (editorial topographic) — switchable via env (`VITE_VARIANT=moss|trail|random`), URL (`?variant=…`), or an in-dev switcher. Set `VITE_VARIANT=random` for a per-page-load coin flip A/B. It ships with a 5-hike mock pool so you can run it without the backend; flip `VITE_USE_MOCK=false` in `frontend/.env` to call this API instead.

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

See `frontend/README.md` for env flags, scripts, and the design-handoff reference.

