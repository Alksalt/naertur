import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  randomHike as RandomHikeFn,
  sanitizeRejected as SanitizeRejectedFn,
  StaleSearchError as StaleSearchErrorClass,
} from '../src/api/client';
import type { SearchRequest } from '../src/types';

const baseReq: SearchRequest = {
  location: { lat: 62.5, lon: 7.0 },
  difficulty: ['easy', 'medium'],
  maxTravelMinutes: 60,
  transport: 'car',
  tags: [],
  avoid: [],
  rejectedHikeIds: [],
};

// `frontend/src/api/client.ts` keeps a module-level `generation` counter
// that is incremented by every randomHike call across the suite. When
// welcome.moss.test.tsx and welcome.trail.test.tsx happen to mount <App />
// in the same Vitest worker (and a future change wires randomHike into
// App's mount path), generation can be non-zero by the time these tests
// run — which makes the burst-race assertions flaky.
//
// `vi.resetModules()` plus a dynamic re-import gives each test a brand-new
// module instance, resetting generation to 0. We rebind the locals via
// dynamic import inside beforeEach so the tests below always see fresh
// exports.
let randomHike: typeof RandomHikeFn;
let sanitizeRejected: typeof SanitizeRejectedFn;
let StaleSearchError: typeof StaleSearchErrorClass;

beforeEach(async () => {
  vi.resetModules();
  const fresh = await import('../src/api/client');
  randomHike = fresh.randomHike;
  sanitizeRejected = fresh.sanitizeRejected;
  StaleSearchError = fresh.StaleSearchError;
});

describe('sanitizeRejected', () => {
  it('keeps valid UUIDs (case-insensitive)', () => {
    const ids = [
      '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      '7C9E6679-7425-40DE-944B-E07FC1F90AE7',
    ];
    expect(sanitizeRejected(ids)).toEqual(ids);
  });

  it('drops mock-shape IDs that would fail Pydantic UUID coercion', () => {
    expect(sanitizeRejected(['morotur-1950', 'morotur-2104'])).toEqual([]);
  });

  it('drops empty strings, whitespace, and partial UUIDs', () => {
    expect(
      sanitizeRejected(['', '   ', '7c9e6679', '7c9e6679-7425-40de-944b']),
    ).toEqual([]);
  });

  it('preserves order while filtering', () => {
    const a = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
    const b = '11111111-2222-3333-4444-555555555555';
    expect(sanitizeRejected([a, 'morotur-1950', b])).toEqual([a, b]);
  });
});

describe('randomHike — generation guard', () => {
  it('throws StaleSearchError when a newer call supersedes the in-flight one', async () => {
    const first = randomHike(baseReq);
    const second = randomHike(baseReq);
    await expect(first).rejects.toBeInstanceOf(StaleSearchError);
    await expect(second).resolves.toMatchObject({ hike: expect.any(Object) });
  });

  it('the last call in a burst is the one that resolves', async () => {
    const calls = [randomHike(baseReq), randomHike(baseReq), randomHike(baseReq)];
    const settled = await Promise.allSettled(calls);
    expect(settled[0].status).toBe('rejected');
    expect(settled[1].status).toBe('rejected');
    expect(settled[2].status).toBe('fulfilled');
  });
});
