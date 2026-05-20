import type { SearchRequest, UiSearchResponse } from '../types';
import { pickRandom } from './mock';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export class NoCandidatesError extends Error {
  constructor() {
    super('No candidates matched the current filters.');
    this.name = 'NoCandidatesError';
  }
}

export class StaleSearchError extends Error {
  constructor() {
    super('A newer search superseded this one.');
    this.name = 'StaleSearchError';
  }
}

// Module-level generation counter. Each randomHike invocation captures its
// generation; any later call increments. A finishing call that no longer
// owns the latest generation throws StaleSearchError so the caller can
// discard the result instead of overwriting a fresher one.
let generation = 0;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sanitizeRejected(ids: string[]): string[] {
  // Backend expects UUIDs. Mock-mode IDs (`morotur-1950`) are valid as
  // strings but would fail Pydantic's UUID coercion when we flip to live.
  // Filter to UUID-shape so the rest of the search still goes through.
  return ids.filter((id) => typeof id === 'string' && UUID_RE.test(id));
}

export async function randomHike(req: SearchRequest): Promise<UiSearchResponse> {
  const myGen = ++generation;

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350));
    if (myGen !== generation) throw new StaleSearchError();
    const result = pickRandom(req);
    if (result === null) throw new NoCandidatesError();
    return result;
  }

  const liveReq: SearchRequest = {
    ...req,
    rejectedHikeIds: sanitizeRejected(req.rejectedHikeIds),
  };

  const response = await fetch(`${API_BASE}/api/search/random`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(liveReq),
  });

  if (myGen !== generation) throw new StaleSearchError();
  if (response.status === 404) throw new NoCandidatesError();
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as UiSearchResponse;
}
