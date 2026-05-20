// NO / EN strings + tag definitions, lifted verbatim from
// design_handoff_naertur_frontend/data.js.
// When the backend gains new match-reason or rejected-reason keys, add them
// here AND in src/reasons.ts to keep label/icon resolution honest.

import { createContext, useContext } from 'react';
import type { Lang } from './types';

export interface Strings {
  tagline: string;
  welcomeSub: string;
  useLocation: string;
  chooseTown: string;
  filters: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  length: string;
  under5: string;
  fiveTen: string;
  tenPlus: string;
  transport: string;
  car: string;
  publicTransport: string;
  walk: string;
  maxTravel: string;
  minutes: string;
  avoid: string;
  findHike: string;
  finding: string;
  findingSub: string;
  recommended: string;
  checkConditions: string;
  notRecommended: string;
  distance: string;
  ascent: string;
  duration: string;
  travel: string;
  whyThis: string;
  startHike: string;
  anotherOne: string;
  notMine: string;
  safetyNote: string;
  attributionMorotur: string;
  source: string;
  openInMaps: string;
  description: string;
  trailhead: string;
  parking: string;
  season: string;
  locating: string;
  locOk: string;
  weatherOk: string;
  seasonOk: string;
  matchEasy: string;
  matchLoop: string;
  matchView: string;
  matchTravel: string;
  matchTransport: string;
  matchForest: string;
  matchWater: string;
  matchChild: string;
  advisoryShort: string;
  privacy: string;
  aboutLine1: string;
  aboutLine2: string;
  tagsLabel: string;
  backLabel: string;
  closeLabel: string;
  avoidSteep: string;
  moreInfo: string;
  elevProfile: string;
  safety: string;
  safetyDetails: Record<string, string>;
  counties: Record<string, string>;
  hikesUnit: string;
  // ErrorBanner copy (shared between moss + trail variants).
  noCandidatesTitle: string;
  noCandidatesBody: string;
  genericErrorTitle: string;
  // Wave 4 / Stream I — Result screen surfaces an Entur-stub warning when
  // backend returns transport.status === 'unverified_until_entur'.
  transportUnverified: string;
  // Mock-mode user-visible badge (frontend/src/components/MockBadge.tsx).
  mockBadge: string;
  // v2-only strings (Trail Map variant uses these; moss variant doesn't reference them).
  taglineLead: string;
  taglineItalic: string;
  factStripHikes: string;
  factStripSeason: string;
  factStripAlert: string;
  searchingMono: string;
  breadcrumbMVP: string;
  breadcrumbRecommended: string;
  breadcrumbSearch: string;
  srcLabel: string;
  pickingHike: string;
  candidates: string;
  compassDirs: [string, string, string, string];
  langSwitchLabel: string;
  themeSwitchLabel: string;
  // Filters screen.
  filtersNoMatch: string;
  resetFilters: string;
  clearRejected: (count: number) => string;
  // Place picker (Welcome screen "Velg sted" replacement).
  choosePlace: string;
  placePickerHint: string;
  placePickerSearching: string;
  placePickerEmpty: string;
  placePickerError: string;
  placePickerOffline: string;
  placeTypeLabels: Record<string, string>;
}

export const I18N: Record<Lang, Strings> = {
  no: {
    tagline: 'Én tapp. Få en nær tur som passer i dag.',
    welcomeSub:
      'Vi finner én tur for deg — basert på vær, sesong og hva du har lyst på i dag.',
    useLocation: 'Bruk min posisjon',
    chooseTown: 'Velg sted',
    filters: 'Filtre',
    difficulty: 'Vanskelighet',
    easy: 'Enkel',
    medium: 'Middels',
    hard: 'Krevende',
    length: 'Lengde',
    under5: 'Under 5 km',
    fiveTen: '5–10 km',
    tenPlus: '10+ km',
    transport: 'Transport',
    car: 'Bil',
    publicTransport: 'Kollektiv',
    walk: 'Til fots',
    maxTravel: 'Maks reisetid',
    minutes: 'min',
    avoid: 'Unngå',
    findHike: 'Finn tur',
    finding: 'Finner din tur',
    findingSub: 'Sjekker vær, sesong og reisetid',
    recommended: 'Anbefalt i dag',
    checkConditions: 'Sjekk forhold',
    notRecommended: 'Ikke anbefalt nå',
    distance: 'Lengde',
    ascent: 'Stigning',
    duration: 'Tid',
    travel: 'Reisetid',
    whyThis: 'Hvorfor denne turen',
    startHike: 'Start tur',
    anotherOne: 'Velg en annen',
    notMine: 'Ikke min tur',
    safetyNote:
      'Anbefalingen er basert på tilgjengelige data. Sjekk alltid yr.no for vær og varsom.no for skred før du går.',
    attributionMorotur: 'Tur-data fra morotur.no — Møre og Romsdal fylkeskommune',
    source: 'Kilde',
    openInMaps: 'Åpne i kart',
    description: 'Om turen',
    trailhead: 'Startpunkt',
    parking: 'Parkering',
    season: 'Sesong',
    locating: 'Finner posisjon',
    locOk: 'Posisjon funnet',
    weatherOk: 'God værmelding',
    seasonOk: 'Innenfor sesong',
    matchEasy: 'Lett nok',
    matchLoop: 'Rundtur som du ønsket',
    matchView: 'Utsikt på toppen',
    matchTravel: 'innenfor reisetiden',
    matchTransport: 'Tilgjengelig med kollektiv',
    matchForest: 'Skogstur',
    matchWater: 'Ved vann',
    matchChild: 'Barnevennlig',
    advisoryShort: 'Innenfor sesong · Ingen farevarsler',
    privacy: 'Filtre og avviste turer lagres lokalt på telefonen. Ingenting sendes til oss.',
    aboutLine1: 'Gratis. Ingen konto.',
    aboutLine2: 'Lokal-først.',
    tagsLabel: 'Hva slags tur',
    backLabel: 'Tilbake',
    closeLabel: 'Lukk',
    avoidSteep: 'Ikke bratt',
    moreInfo: 'Mer info',
    elevProfile: 'Høydeprofil',
    safety: 'Sikkerhet',
    safetyDetails: {
      inside_season: 'Innenfor sesong',
      no_active_warning: 'Ingen aktive farevarsler',
      weather_ok: 'Stabilt vær neste 24 t',
      not_steep: 'Ikke spesielt bratt',
      access_ok: 'Tilkomst åpen',
    },
    counties: { 'Møre og Romsdal': 'Møre og Romsdal' },
    hikesUnit: 'turer',
    noCandidatesTitle: 'Fant ingen turer som passer.',
    noCandidatesBody: 'Prøv færre filtre, åpne for mer vanskelighet, eller lengre reisetid.',
    genericErrorTitle: 'Noe gikk galt. Prøv igjen.',
    transportUnverified: 'Reisetid er anslått. Vi har ikke koblet til Entur ennå.',
    mockBadge: 'PRØVEDATA · 5 turer',
    taglineLead: 'Én tapp.\nÉn tur. ',
    taglineItalic: 'I dag.',
    factStripHikes: 'TURER',
    factStripSeason: 'SESONG',
    factStripAlert: 'VARSEL',
    searchingMono: 'SØKER',
    breadcrumbMVP: 'NÆRTUR · MØRE OG ROMSDAL · MVP',
    breadcrumbRecommended: 'ANBEFALT TUR',
    breadcrumbSearch: 'SØKEPARAMETRE',
    srcLabel: 'SRC →',
    pickingHike: 'Velger tur',
    candidates: 'KANDIDATER',
    compassDirs: ['N', 'Ø', 'S', 'V'],
    langSwitchLabel: 'Switch to English',
    themeSwitchLabel: 'Bytt tema',
    filtersNoMatch: 'Ingen turer passet — løs opp filtrene eller tøm avviste turer.',
    resetFilters: 'Tilbakestill filtre',
    clearRejected: (n: number) => `Tøm avviste turer (${n})`,
    choosePlace: 'Velg sted',
    placePickerHint: 'Skriv inn et stedsnavn',
    placePickerSearching: 'Søker...',
    placePickerEmpty: 'Ingen treff. Prøv et annet navn.',
    placePickerError: 'Søk feilet. Prøv igjen.',
    placePickerOffline: 'Du er offline. Bruk GPS eller koble til internett.',
    // Keys match the exact `place_type` values stored in `places.place_type`
    // (Kartverket-derived, PascalCase, sometimes with parenthetical suffix).
    // Source of truth: `SELECT DISTINCT place_type FROM places`. PlacePicker
    // renders `p.placeType` raw if the key is missing (defensive fallback).
    placeTypeLabels: {
      Tettsted: 'Tettsted',
      By: 'By',
      'Bygdelag (bygd)': 'Bygd',
      Grend: 'Grend',
      Gard: 'Gård',
      Boligfelt: 'Boligfelt',
      Tettbebyggelse: 'Tett bebyggelse',
    },
  },
  en: {
    tagline: 'One tap. A nearby hike that fits today.',
    welcomeSub:
      'We pick one hike for you — based on weather, season and what you feel like today.',
    useLocation: 'Use my location',
    chooseTown: 'Choose a place',
    filters: 'Filters',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    length: 'Length',
    under5: 'Under 5 km',
    fiveTen: '5–10 km',
    tenPlus: '10+ km',
    transport: 'Transport',
    car: 'Car',
    publicTransport: 'Public',
    walk: 'On foot',
    maxTravel: 'Max travel',
    minutes: 'min',
    avoid: 'Avoid',
    findHike: 'Find hike',
    finding: 'Finding your hike',
    findingSub: 'Checking weather, season and travel time',
    recommended: 'Recommended today',
    checkConditions: 'Check conditions',
    notRecommended: 'Not recommended now',
    distance: 'Length',
    ascent: 'Ascent',
    duration: 'Time',
    travel: 'Travel',
    whyThis: 'Why this hike',
    startHike: 'Start hike',
    anotherOne: 'Pick another',
    notMine: 'Not my hike',
    safetyNote:
      'Recommendation based on available data. Always check yr.no for weather and varsom.no for avalanche warnings before you go.',
    attributionMorotur: 'Hike data from morotur.no — Møre og Romsdal County',
    source: 'Source',
    openInMaps: 'Open in maps',
    description: 'About the hike',
    trailhead: 'Trailhead',
    parking: 'Parking',
    season: 'Season',
    locating: 'Getting location',
    locOk: 'Location found',
    weatherOk: 'Good forecast',
    seasonOk: 'In season',
    matchEasy: 'Easy enough',
    matchLoop: 'Loop trail, as asked',
    matchView: 'View at the top',
    matchTravel: 'within travel time',
    matchTransport: 'Reachable by public transport',
    matchForest: 'Forest walk',
    matchWater: 'By water',
    matchChild: 'Child-friendly',
    advisoryShort: 'In season · No active warnings',
    privacy: 'Filters and rejected hikes are stored locally on your phone. Nothing is sent to us.',
    aboutLine1: 'Free. No account.',
    aboutLine2: 'Local-first.',
    tagsLabel: 'What kind of hike',
    backLabel: 'Back',
    closeLabel: 'Close',
    avoidSteep: 'Avoid steep',
    moreInfo: 'More info',
    elevProfile: 'Elevation',
    safety: 'Safety',
    safetyDetails: {
      inside_season: 'In season',
      no_active_warning: 'No active warnings',
      weather_ok: 'Stable weather next 24 h',
      not_steep: 'Not steep',
      access_ok: 'Access open',
    },
    counties: { 'Møre og Romsdal': 'Møre og Romsdal' },
    hikesUnit: 'hikes',
    noCandidatesTitle: 'No hikes match your filters.',
    noCandidatesBody: 'Try fewer filters, open up difficulty, or a longer travel time.',
    genericErrorTitle: 'Something went wrong. Try again.',
    transportUnverified: 'Travel time is estimated. Entur is not connected yet.',
    mockBadge: 'DEMO DATA · 5 hikes',
    taglineLead: 'One tap.\nOne hike. ',
    taglineItalic: 'Today.',
    factStripHikes: 'HIKES',
    factStripSeason: 'SEASON',
    factStripAlert: 'ALERT',
    searchingMono: 'SEARCHING',
    breadcrumbMVP: 'NÆRTUR · MØRE OG ROMSDAL · MVP',
    breadcrumbRecommended: 'RECOMMENDED HIKE',
    breadcrumbSearch: 'SEARCH PARAMETERS',
    srcLabel: 'SRC →',
    pickingHike: 'Picking hike',
    candidates: 'CANDIDATES',
    compassDirs: ['N', 'E', 'S', 'W'],
    langSwitchLabel: 'Bytt til norsk',
    themeSwitchLabel: 'Switch theme',
    filtersNoMatch: 'No hikes match — loosen filters or clear rejected hikes.',
    resetFilters: 'Reset filters',
    clearRejected: (n: number) => `Clear rejected (${n})`,
    choosePlace: 'Choose a place',
    placePickerHint: 'Type a place name',
    placePickerSearching: 'Searching...',
    placePickerEmpty: 'No matches. Try a different name.',
    placePickerError: 'Search failed. Try again.',
    placePickerOffline: "You're offline. Use GPS or reconnect to search places.",
    // See NO comment above — keys match DB place_type exactly.
    placeTypeLabels: {
      Tettsted: 'Urban area',
      By: 'Town',
      'Bygdelag (bygd)': 'Village',
      Grend: 'Hamlet',
      Gard: 'Farm',
      Boligfelt: 'Housing area',
      Tettbebyggelse: 'Built-up area',
    },
  },
};

export interface TagDef {
  id: string;
  no: string;
  en: string;
  icon: string;
}

export const TAGS: TagDef[] = [
  { id: 'viewpoint', no: 'Utsikt', en: 'Viewpoint', icon: 'view' },
  { id: 'forest', no: 'Skog', en: 'Forest', icon: 'tree' },
  { id: 'mountain', no: 'Fjell', en: 'Mountain', icon: 'peak' },
  { id: 'water', no: 'Vann', en: 'Water', icon: 'water' },
  { id: 'waterfall', no: 'Foss', en: 'Waterfall', icon: 'falls' },
  { id: 'loop', no: 'Rundtur', en: 'Loop', icon: 'loop' },
  { id: 'child', no: 'Barnevennlig', en: 'Kid-friendly', icon: 'kid' },
  { id: 'dog', no: 'Hund tillatt', en: 'Dogs allowed', icon: 'dog' },
];

export const I18nContext = createContext<{ lang: Lang; L: Strings }>({
  lang: 'no',
  L: I18N.no,
});

export function useI18n(): { lang: Lang; L: Strings } {
  return useContext(I18nContext);
}

export function detectInitialLang(): Lang {
  if (typeof navigator === 'undefined') return 'no';
  return navigator.language?.toLowerCase().startsWith('no') ? 'no' : 'en';
}
