// NO / EN strings + tag definitions, lifted verbatim from
// design_handoff_naertur_frontend/data.js.
// When the backend gains new match-reason or rejected-reason keys, add them
// here AND in src/reasons.ts to keep label/icon resolution honest.

import { createContext, useContext } from 'react';
import type { Lang } from './types';

export interface Strings {
  appName: string;
  tagline: string;
  welcomeSub: string;
  useLocation: string;
  chooseTown: string;
  locationAround: string;
  near: string;
  edit: string;
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
  preferences: string;
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
  source: string;
  openInMaps: string;
  description: string;
  trailhead: string;
  parking: string;
  season: string;
  monthsOpen: string;
  backToResult: string;
  rejectedTitle: string;
  rejectedSub: string;
  locating: string;
  locOk: string;
  weatherOk: string;
  seasonOk: string;
  noWarnings: string;
  matchEasy: string;
  matchLoop: string;
  matchView: string;
  matchTravel: string;
  matchTransport: string;
  matchForest: string;
  matchWater: string;
  matchChild: string;
  advisoryShort: string;
  locDenied: string;
  or: string;
  skipLocation: string;
  settings: string;
  privacy: string;
  aboutLine1: string;
  aboutLine2: string;
  tagsLabel: string;
  backLabel: string;
  closeLabel: string;
  avoidSteep: string;
  seasonOpen: string;
  seasonClosed: string;
  moreInfo: string;
  elevProfile: string;
  safety: string;
  safetyDetails: Record<string, string>;
  counties: Record<string, string>;
  hikesUnit: string;
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
}

export const I18N: Record<Lang, Strings> = {
  no: {
    appName: 'NærTur',
    tagline: 'Én tapp. Få en nær tur som passer i dag.',
    welcomeSub:
      'Vi finner én tur for deg — basert på vær, sesong og hva du har lyst på i dag.',
    useLocation: 'Bruk min posisjon',
    chooseTown: 'Velg sted',
    locationAround: 'Søker rundt',
    near: 'nær',
    edit: 'Endre',
    filters: 'Filtre',
    difficulty: 'Vanskelighet',
    easy: 'Enkel',
    medium: 'Medium',
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
    preferences: 'Tema',
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
      'Anbefalt basert på tilgjengelige data. Sjekk alltid lokale forhold.',
    source: 'Kilde',
    openInMaps: 'Åpne i kart',
    description: 'Om turen',
    trailhead: 'Startpunkt',
    parking: 'Parkering',
    season: 'Sesong',
    monthsOpen: 'Sesong',
    backToResult: 'Tilbake',
    rejectedTitle: 'Forsto. Finner noe annet.',
    rejectedSub: 'Vi prøver en ny tur basert på det du har sagt nei til.',
    locating: 'Finner posisjon',
    locOk: 'Posisjon funnet',
    weatherOk: 'God værmelding',
    seasonOk: 'Innenfor sesong',
    noWarnings: 'Ingen aktive farevarsler',
    matchEasy: 'Lett nok',
    matchLoop: 'Rundtur som du ønsket',
    matchView: 'Utsikt på toppen',
    matchTravel: 'innenfor reisetiden',
    matchTransport: 'Tilgjengelig med kollektiv',
    matchForest: 'Skogstur',
    matchWater: 'Ved vann',
    matchChild: 'Barnevennlig',
    advisoryShort: 'Innenfor sesong · Ingen farevarsler',
    locDenied: 'Ingen posisjon',
    or: 'eller',
    skipLocation: 'Hopp over',
    settings: 'Innstillinger',
    privacy: 'Vi lagrer ingenting om deg.',
    aboutLine1: 'Gratis. Ingen konto.',
    aboutLine2: 'Lokal-først.',
    tagsLabel: 'Hva slags tur',
    backLabel: 'Tilbake',
    closeLabel: 'Lukk',
    avoidSteep: 'Ikke bratt',
    seasonOpen: 'Åpen nå',
    seasonClosed: 'Utenfor sesong',
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
  },
  en: {
    appName: 'NærTur',
    tagline: 'One tap. A nearby hike that fits today.',
    welcomeSub:
      'We pick one hike for you — based on weather, season and what you feel like today.',
    useLocation: 'Use my location',
    chooseTown: 'Choose a place',
    locationAround: 'Searching around',
    near: 'near',
    edit: 'Edit',
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
    preferences: 'Theme',
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
      'Recommended based on available data. Always check local conditions.',
    source: 'Source',
    openInMaps: 'Open in maps',
    description: 'About the hike',
    trailhead: 'Trailhead',
    parking: 'Parking',
    season: 'Season',
    monthsOpen: 'In season',
    backToResult: 'Back',
    rejectedTitle: 'Got it. Finding another.',
    rejectedSub: 'Trying a new hike based on what you said no to.',
    locating: 'Getting location',
    locOk: 'Location found',
    weatherOk: 'Good forecast',
    seasonOk: 'In season',
    noWarnings: 'No active warnings',
    matchEasy: 'Easy enough',
    matchLoop: 'Loop trail, as asked',
    matchView: 'View at the top',
    matchTravel: 'within travel time',
    matchTransport: 'Reachable by bus',
    matchForest: 'Forest walk',
    matchWater: 'By water',
    matchChild: 'Child-friendly',
    advisoryShort: 'In season · No active warnings',
    locDenied: 'No location',
    or: 'or',
    skipLocation: 'Skip',
    settings: 'Settings',
    privacy: 'We store nothing about you.',
    aboutLine1: 'Free. No account.',
    aboutLine2: 'Local-first.',
    tagsLabel: 'What kind of hike',
    backLabel: 'Back',
    closeLabel: 'Close',
    avoidSteep: 'Avoid steep',
    seasonOpen: 'Open now',
    seasonClosed: 'Out of season',
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
  { id: 'water', no: 'Vann', en: 'Lake', icon: 'water' },
  { id: 'waterfall', no: 'Foss', en: 'Waterfall', icon: 'falls' },
  { id: 'loop', no: 'Rundtur', en: 'Loop', icon: 'loop' },
  { id: 'child', no: 'Barnevennlig', en: 'Kid-friendly', icon: 'kid' },
  { id: 'dog', no: 'Hund ok', en: 'Dog ok', icon: 'dog' },
];

// Hardcoded list per the handoff's open question #14.1 — small picker list
// for the Welcome screen "Velg sted" fallback when geolocation is denied.
export const TOWNS_MR: { id: string; label: string }[] = [
  { id: 'alesund', label: 'Ålesund' },
  { id: 'molde', label: 'Molde' },
  { id: 'kristiansund', label: 'Kristiansund' },
  { id: 'volda', label: 'Volda' },
  { id: 'orsta', label: 'Ørsta' },
  { id: 'vestnes', label: 'Vestnes' },
  { id: 'sunndal', label: 'Sunndal' },
  { id: 'stranda', label: 'Stranda' },
  { id: 'ulstein', label: 'Ulstein' },
  { id: 'surnadal', label: 'Surnadal' },
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
