// Mock pool + client-side filter mirror of POST /api/search/random.
// Merged from the former src/api/{fixtures,mock}.ts.
// 5 real Møre og Romsdal hikes lifted from design_handoff_naertur_frontend/data.js.

import type { SafetyStatus, SearchRequest, UiHike, UiSearchResponse } from '../types';

export interface MockHike extends UiHike {
  safety: SafetyStatus;
  matchReasons: string[];
}

const COUNTY = 'Møre og Romsdal';

export const MOCK_HIKES: MockHike[] = [
  {
    id: 'morotur-1950',
    source: 'morotur',
    sourceId: '1950',
    sourceUrl: 'https://morotur.no/tur/klimpan',
    name: 'Klimpan',
    municipality: 'Vestnes',
    county: COUNTY,
    difficulty: 'easy',
    distanceMeters: 2200,
    ascentMeters: 180,
    durationMinutes: 60,
    travelMinutes: 22,
    tags: ['viewpoint', 'forest', 'loop', 'child'],
    seasonMonths: [4, 5, 6, 7, 8, 9, 10],
    descNo:
      'Kort, fin tur opp til Klimpan med utsikt over Romsdalsfjorden. Stien går gjennom blandingsskog og er greit merket. Egnet for hele familien.',
    descEn:
      'A short, fine walk up to Klimpan with views over Romsdalsfjorden. The path runs through mixed forest and is clearly marked. Suitable for the whole family.',
    matchReasons: ['easy_enough', 'loop', 'view', 'within_travel', 'forest'],
    safety: 'recommended_today',
    scene: 'fjord',
    parkingNo: 'Liten plass ved Tomrefjord',
    parkingEn: 'Small lot at Tomrefjord',
  },
  {
    id: 'morotur-2104',
    source: 'morotur',
    sourceId: '2104',
    sourceUrl: 'https://morotur.no/tur/sukkertoppen',
    name: 'Sukkertoppen',
    municipality: 'Ålesund',
    county: COUNTY,
    difficulty: 'medium',
    distanceMeters: 4800,
    ascentMeters: 314,
    durationMinutes: 110,
    travelMinutes: 12,
    tags: ['viewpoint', 'mountain'],
    seasonMonths: [5, 6, 7, 8, 9, 10],
    descNo:
      'Det mest kjente fjellet i Ålesund. Stien starter ved Fjelltun og fortsetter bratt opp til toppen på 314 moh, med utsikt mot Sunnmørsalpene og havet.',
    descEn:
      'The most famous mountain near Ålesund. The path starts at Fjelltun and climbs steeply to the summit at 314 m, with views toward the Sunnmøre Alps and the sea.',
    matchReasons: ['view', 'within_travel'],
    safety: 'recommended_today',
    scene: 'peak',
    parkingNo: 'Parkering ved Fjelltun',
    parkingEn: 'Parking at Fjelltun',
  },
  {
    id: 'morotur-1788',
    source: 'morotur',
    sourceId: '1788',
    sourceUrl: 'https://morotur.no/tur/rotsethornet',
    name: 'Rotsethornet',
    municipality: 'Volda',
    county: COUNTY,
    difficulty: 'medium',
    distanceMeters: 6200,
    ascentMeters: 659,
    durationMinutes: 180,
    travelMinutes: 38,
    tags: ['viewpoint', 'mountain', 'loop'],
    seasonMonths: [5, 6, 7, 8, 9],
    descNo:
      'Populær rundtur over Rotsethornet (659 moh) med vid utsikt over Voldsfjorden. Kan gås begge veier; sti og varder fra toppen og ned.',
    descEn:
      'Popular loop over Rotsethornet (659 m) with wide views over Voldsfjorden. Can be walked in either direction; path and cairns from the summit.',
    matchReasons: ['loop', 'view', 'within_travel'],
    safety: 'recommended_today',
    scene: 'peak',
    parkingNo: 'Volda sentrum, sti starter ved Rotset',
    parkingEn: 'Volda centre, trail starts at Rotset',
  },
  {
    id: 'morotur-3211',
    source: 'morotur',
    sourceId: '3211',
    sourceUrl: 'https://morotur.no/tur/slogen',
    name: 'Slogen via Patchellhytta',
    municipality: 'Ørsta',
    county: COUNTY,
    difficulty: 'hard',
    distanceMeters: 12400,
    ascentMeters: 1564,
    durationMinutes: 480,
    travelMinutes: 55,
    tags: ['viewpoint', 'mountain'],
    seasonMonths: [6, 7, 8, 9],
    descNo:
      'Krevende klassiker i Sunnmørsalpene. Lang dag med utsatt rygg de siste hundre meterne. Kun erfarne fjellgåere i godt vær.',
    descEn:
      'A demanding classic in the Sunnmøre Alps. A long day with an exposed ridge near the top. Experienced hikers only, in good weather.',
    matchReasons: ['view'],
    safety: 'check_conditions',
    scene: 'alpine',
    parkingNo: 'Urke fergekai',
    parkingEn: 'Urke ferry quay',
  },
  {
    id: 'morotur-2440',
    source: 'morotur',
    sourceId: '2440',
    sourceUrl: 'https://morotur.no/tur/aksla',
    name: 'Aksla',
    municipality: 'Ålesund',
    county: COUNTY,
    difficulty: 'easy',
    distanceMeters: 1200,
    ascentMeters: 120,
    durationMinutes: 30,
    travelMinutes: 8,
    tags: ['viewpoint', 'child'],
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    descNo:
      '418 trappetrinn opp til Fjellstua og det berømte byprospektet over Ålesund. Kort, men bratt — godt for kvelden.',
    descEn:
      '418 steps up to Fjellstua and the famous view over Ålesund. Short but steep — great for the evening.',
    matchReasons: ['easy_enough', 'view', 'within_travel'],
    safety: 'recommended_today',
    scene: 'town',
    parkingNo: 'Ålesund sentrum',
    parkingEn: 'Ålesund centre',
  },
];

export function filterCandidates(req: SearchRequest): MockHike[] {
  return MOCK_HIKES.filter((h) => {
    if (req.difficulty.length > 0 && !req.difficulty.includes(h.difficulty)) return false;
    if (req.maxTravelMinutes !== undefined && (h.travelMinutes ?? 0) > req.maxTravelMinutes)
      return false;
    if (req.lengthBucket === 'under_5km' && (h.distanceMeters ?? 0) >= 5000) return false;
    if (
      req.lengthBucket === '5_10km' &&
      ((h.distanceMeters ?? 0) < 5000 || (h.distanceMeters ?? 0) > 10000)
    )
      return false;
    if (req.lengthBucket === '10km_plus' && (h.distanceMeters ?? 0) < 10000) return false;
    if (req.tags.length > 0 && !req.tags.some((t) => h.tags.includes(t))) return false;
    if (req.rejectedHikeIds.includes(h.id)) return false;
    return true;
  });
}

export function pickRandom(req: SearchRequest): UiSearchResponse | null {
  const pool = filterCandidates(req);
  if (pool.length === 0) return null;
  const hike = pool[Math.floor(Math.random() * pool.length)];
  return {
    hike,
    safety: {
      status: hike.safety,
      reasons:
        hike.safety === 'recommended_today'
          ? ['inside_season', 'no_active_warning']
          : ['inside_season'],
      advisory: 'Recommended based on available data. Always check local conditions.',
    },
    transport: {
      mode: req.transport,
      estimatedMinutes: hike.travelMinutes,
      status: req.transport === 'public_transport' ? 'unverified_until_entur' : 'estimated',
      reasons: [],
    },
    matchReasons: hike.matchReasons,
    rejectedReasons: [],
  };
}
