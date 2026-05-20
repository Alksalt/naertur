// Mirror of /Users/alt/work_dir/apps/naertur/app/schemas.py.
// Wire format is camelCase (the backend serialises with aliases).
// Keep this file in sync when the backend schema changes.

export type Difficulty = 'easy' | 'medium' | 'hard';
export type LengthBucket = 'under_5km' | '5_10km' | '10km_plus';
export type TransportMode = 'car' | 'public_transport' | 'walk';
export type SafetyStatus = 'recommended_today' | 'check_conditions' | 'not_recommended_now';

export interface Location {
  lat: number;
  lon: number;
}

export interface SearchRequest {
  location?: Location;
  difficulty: Difficulty[];
  maxTravelMinutes?: number;
  transport: TransportMode;
  lengthBucket?: LengthBucket;
  tags: string[];
  avoid: string[];
  rejectedHikeIds: string[];
}

export interface HikeSummary {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  name: string;
  municipality?: string;
  county: string;
  difficulty: Difficulty;
  distanceMeters?: number;
  durationMinutes?: number;
  ascentMeters?: number;
  tags: string[];
  trailhead?: Location;
}

export interface SafetyResult {
  status: SafetyStatus;
  reasons: string[];
  advisory: string;
}

export interface TransportResult {
  mode: TransportMode;
  estimatedMinutes?: number;
  status: string;
  reasons: string[];
}

export interface SearchResponse {
  hike: HikeSummary;
  safety: SafetyResult;
  transport: TransportResult;
  matchReasons: string[];
  rejectedReasons: string[];
}

// UI-only extension — the mock fixture carries fields the backend doesn't
// (description, scene key, season months, parking labels) so the Detail
// screen can render without a separate HikeDetail call. When wired to the
// real backend, these stay undefined and the Detail screen degrades.
export interface UiHikeExtras {
  travelMinutes?: number;
  descNo?: string;
  descEn?: string;
  scene?: 'fjord' | 'peak' | 'alpine' | 'town';
  parkingNo?: string;
  parkingEn?: string;
  seasonMonths?: number[];
}

export type UiHike = HikeSummary & UiHikeExtras;

export interface UiSearchResponse extends Omit<SearchResponse, 'hike'> {
  hike: UiHike;
}

export type Lang = 'no' | 'en';
export type ThemeName = 'moss' | 'mossDark' | 'fjord';
export type Screen = 'welcome' | 'filters' | 'finding' | 'result' | 'detail';

// Two design variants ship in the same bundle. `random` rerolls per page
// load. See src/config.ts for the resolver.
export type Variant = 'moss' | 'trail';
export type VariantMode = 'moss' | 'trail' | 'random';

// Trail-variant theme names (separate from ThemeName which is moss's).
export type TrailThemeName = 'trailhead' | 'nightMap' | 'fjordTrail';
