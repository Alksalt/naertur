import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  searchPlaces as SearchPlacesFn,
  nearestPlace as NearestPlaceFn,
  PlaceResult,
} from '../src/api/places';

// `frontend/src/api/places.ts` reads `import.meta.env.VITE_USE_MOCK` at
// call time, but the module-level `API_BASE` is captured at import. We
// re-import after stubbing env so the live-mode tests pick up the
// (test-default) base URL deterministically. Mirrors the pattern in
// api-client.test.ts.
let searchPlaces: typeof SearchPlacesFn;
let nearestPlace: typeof NearestPlaceFn;

beforeEach(async () => {
  vi.resetModules();
  // Default to mock mode unless a test stubs it off; matches Vite default.
  vi.stubEnv('VITE_USE_MOCK', 'true');
  const fresh = await import('../src/api/places');
  searchPlaces = fresh.searchPlaces;
  nearestPlace = fresh.nearestPlace;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('searchPlaces — short-circuit', () => {
  it('returns [] for a 1-char query and never calls fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const out = await searchPlaces('a', undefined, 8);
    expect(out).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('searchPlaces — live mode (mock disabled)', () => {
  beforeEach(async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    vi.resetModules();
    const fresh = await import('../src/api/places');
    searchPlaces = fresh.searchPlaces;
    nearestPlace = fresh.nearestPlace;
  });

  it('calls fetch with q + limit query params when no `near` is given', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ query: 'hje', results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await searchPlaces('hje', undefined, 8);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('/api/places/search?');
    expect(url).toContain('q=hje');
    expect(url).toContain('limit=8');
    expect(url).not.toContain('lat=');
    expect(url).not.toContain('lon=');
  });

  it('adds lat & lon query params when `near` is provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ query: 'hje', results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await searchPlaces('hje', { lat: 62.74, lon: 7.16 });
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('lat=62.74');
    expect(url).toContain('lon=7.16');
  });

  it('throws on non-200 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('boom', { status: 500 }),
    );
    await expect(searchPlaces('hje')).rejects.toThrow(/Places search failed: 500/);
  });

  it('nearestPlace returns null on non-200 instead of throwing (graceful)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 500 }),
    );
    const out = await nearestPlace(62.74, 7.16);
    expect(out).toBeNull();
  });

  it('nearestPlace returns null on network failure (offline fallback)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const out = await nearestPlace(62.74, 7.16);
    expect(out).toBeNull();
  });
});

describe('searchPlaces — mock mode ranking', () => {
  it("ranks 'hje' so Hjelset comes first", async () => {
    const out = await searchPlaces('hje', undefined, 8);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].name).toBe('Hjelset');
  });

  it('returns 0 results for a string that matches no MR place', async () => {
    const out = await searchPlaces('zxqxq');
    expect(out).toEqual([]);
  });

  it('respects the limit argument', async () => {
    // 'a' is a 1-char short-circuit, but a 2-char fragment hits many places.
    const out = await searchPlaces('a', undefined, 3);
    // 1-char short-circuit → []
    expect(out).toEqual([]);
    const out2 = await searchPlaces('al', undefined, 2);
    expect(out2.length).toBeLessThanOrEqual(2);
  });

  it('folds Norwegian diacritics so an ASCII query matches Å/Ø/Æ names', async () => {
    // 'ales' should match 'Ålesund' via folded ASCII (aalesund / alesund both).
    const out = await searchPlaces('ales');
    const names = out.map((p: PlaceResult) => p.name);
    expect(names).toContain('Ålesund');
  });
});

describe('nearestPlace — mock mode', () => {
  it('returns the nearest mock place when one is within 50 km (Molde area)', async () => {
    const out = await nearestPlace(62.74, 7.23);
    expect(out).not.toBeNull();
    // Hjelset (62.74, 7.32) is closest to (62.74, 7.23) within the mock list.
    expect(out!.kommune).toBe('Molde');
  });

  it('returns null when no mock place is within 50 km (Oslo coords)', async () => {
    const out = await nearestPlace(59.91, 10.74);
    expect(out).toBeNull();
  });
});
