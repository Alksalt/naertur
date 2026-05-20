import type { Location } from '../types';

export interface PlaceResult {
  id: string;
  name: string;
  placeType: string;
  kommune?: string;
  fylke: string;
  location: Location;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

function isMockMode(): boolean {
  // Read at call time so a .env flip + Vite restart takes effect without
  // a module bundle re-eval — matches the Wave-3 pattern used in client.ts.
  return (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';
}

// Mock fallback: ~20 MR places for offline dev. Use real-ish coords.
const MOCK_PLACES: PlaceResult[] = [
  { id: 'mock-alesund', name: 'Ålesund', placeType: 'By', kommune: 'Ålesund', fylke: 'Møre og Romsdal', location: { lat: 62.4722, lon: 6.1549 } },
  { id: 'mock-molde', name: 'Molde', placeType: 'By', kommune: 'Molde', fylke: 'Møre og Romsdal', location: { lat: 62.7372, lon: 7.1607 } },
  { id: 'mock-kristiansund', name: 'Kristiansund', placeType: 'By', kommune: 'Kristiansund', fylke: 'Møre og Romsdal', location: { lat: 63.1109, lon: 7.7281 } },
  { id: 'mock-hjelset', name: 'Hjelset', placeType: 'Tettsted', kommune: 'Molde', fylke: 'Møre og Romsdal', location: { lat: 62.74, lon: 7.32 } },
  { id: 'mock-volda', name: 'Volda', placeType: 'Tettsted', kommune: 'Volda', fylke: 'Møre og Romsdal', location: { lat: 62.1467, lon: 6.0731 } },
  { id: 'mock-orsta', name: 'Ørsta', placeType: 'Tettsted', kommune: 'Ørsta', fylke: 'Møre og Romsdal', location: { lat: 62.1986, lon: 6.1287 } },
  { id: 'mock-vestnes', name: 'Vestnes', placeType: 'Tettsted', kommune: 'Vestnes', fylke: 'Møre og Romsdal', location: { lat: 62.6189, lon: 7.0833 } },
  { id: 'mock-vatne', name: 'Vatne', placeType: 'Tettsted', kommune: 'Ålesund', fylke: 'Møre og Romsdal', location: { lat: 62.55, lon: 6.50 } },
  { id: 'mock-bud', name: 'Bud', placeType: 'Tettsted', kommune: 'Hustadvika', fylke: 'Møre og Romsdal', location: { lat: 62.91, lon: 6.91 } },
  { id: 'mock-aukra', name: 'Aukra', placeType: 'Tettsted', kommune: 'Aukra', fylke: 'Møre og Romsdal', location: { lat: 62.79, lon: 6.85 } },
  { id: 'mock-andalsnes', name: 'Åndalsnes', placeType: 'By', kommune: 'Rauma', fylke: 'Møre og Romsdal', location: { lat: 62.5667, lon: 7.6892 } },
  { id: 'mock-surnadal', name: 'Surnadal', placeType: 'Tettsted', kommune: 'Surnadal', fylke: 'Møre og Romsdal', location: { lat: 62.9778, lon: 8.6892 } },
  { id: 'mock-sunndal', name: 'Sunndalsøra', placeType: 'Tettsted', kommune: 'Sunndal', fylke: 'Møre og Romsdal', location: { lat: 62.6747, lon: 8.5664 } },
  { id: 'mock-tustna', name: 'Tustna', placeType: 'Tettsted', kommune: 'Aure', fylke: 'Møre og Romsdal', location: { lat: 63.20, lon: 8.20 } },
  { id: 'mock-eide', name: 'Eide', placeType: 'Tettsted', kommune: 'Hustadvika', fylke: 'Møre og Romsdal', location: { lat: 62.92, lon: 7.41 } },
  { id: 'mock-bo', name: 'Bø', placeType: 'Gard', kommune: 'Volda', fylke: 'Møre og Romsdal', location: { lat: 62.15, lon: 6.10 } },
  { id: 'mock-stranda', name: 'Stranda', placeType: 'Tettsted', kommune: 'Stranda', fylke: 'Møre og Romsdal', location: { lat: 62.31, lon: 6.93 } },
  { id: 'mock-fosnavag', name: 'Fosnavåg', placeType: 'By', kommune: 'Herøy', fylke: 'Møre og Romsdal', location: { lat: 62.34, lon: 5.64 } },
  { id: 'mock-ulsteinvik', name: 'Ulsteinvik', placeType: 'By', kommune: 'Ulstein', fylke: 'Møre og Romsdal', location: { lat: 62.34, lon: 5.86 } },
  { id: 'mock-haram', name: 'Haram', placeType: 'Tettsted', kommune: 'Ålesund', fylke: 'Møre og Romsdal', location: { lat: 62.62, lon: 6.34 } },
];

function foldAscii(s: string): string {
  return s.toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'aa');
}

function haversineKm(a: Location, b: Location): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function searchMock(q: string, near: Location | undefined, limit: number): PlaceResult[] {
  if (q.length < 2) return [];
  const qNorm = q.trim().toLowerCase();
  const qAscii = foldAscii(qNorm);
  const scored = MOCK_PLACES.map((p) => {
    const nameLower = p.name.toLowerCase();
    const nameAscii = foldAscii(nameLower);
    let textScore = 0;
    if (nameLower === qNorm || nameAscii === qAscii) textScore = 1.0;
    else if (nameLower.startsWith(qNorm) || nameAscii.startsWith(qAscii)) textScore = 0.85;
    else if (nameLower.includes(qNorm) || nameAscii.includes(qAscii)) textScore = 0.55;
    else return null;
    const proximityScore = near ? Math.max(0, 1 - haversineKm(near, p.location) / 300) : 0.5;
    return { score: 0.65 * textScore + 0.35 * proximityScore, place: p };
  })
    .filter((x): x is { score: number; place: PlaceResult } => x !== null)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((x) => x.place);
  return scored;
}

function nearestMock(lat: number, lon: number): PlaceResult | null {
  const here: Location = { lat, lon };
  const withDist = MOCK_PLACES.map((p) => ({ p, d: haversineKm(here, p.location) })).filter(
    ({ d }) => d <= 50, // 50 km cap, same as backend
  );
  if (withDist.length === 0) return null;
  withDist.sort((a, b) => a.d - b.d);
  return withDist[0].p;
}

export async function searchPlaces(
  q: string,
  near?: Location,
  limit = 8,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  if (q.trim().length < 2) return [];
  if (isMockMode()) {
    return searchMock(q, near, limit);
  }
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (near) {
    params.set('lat', String(near.lat));
    params.set('lon', String(near.lon));
  }
  const r = await fetch(`${API_BASE}/api/places/search?${params}`, { signal });
  if (!r.ok) throw new Error(`Places search failed: ${r.status}`);
  const body = await r.json();
  return body.results ?? [];
}

export async function nearestPlace(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<PlaceResult | null> {
  if (isMockMode()) {
    return nearestMock(lat, lon);
  }
  try {
    const r = await fetch(`${API_BASE}/api/places/nearest?lat=${lat}&lon=${lon}`, { signal });
    if (!r.ok) return null;
    const body = await r.json();
    return body.nearest ?? null;
  } catch {
    return null; // offline / 5xx → graceful fallback
  }
}
