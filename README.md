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
    "language": "no",
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
- MET Locationforecast requires a descriptive `User-Agent`; set `MET_USER_AGENT` before production use.
- Entur and NVE are intentionally deferred until after this backend slice is stable.

