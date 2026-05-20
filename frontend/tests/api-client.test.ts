import { describe, it, expect } from 'vitest';
import { randomHike, StaleSearchError, sanitizeRejected } from '../src/api/client';
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
