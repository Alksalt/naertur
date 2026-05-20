// Trail-variant palettes. Lifted verbatim from
// design_handoff_naertur_frontend 2/app-trail.jsx:7-125.
// Vermillion red on warm paper, with editorial / topographic tokens.

import { createContext, useContext } from 'react';
import type { TrailThemeName } from '../../types';

export interface TrailPalette {
  name: string;
  paper: string;
  snow: string;
  card: string;
  ink: string;
  graphite: string;
  sub: string;
  hairline: string;
  hairlineSoft: string;
  vermillion: string;
  vermillionInk: string;
  vermillionTint: string;
  vermillionEdge: string;
  topo: string;
  topoDeep: string;
  topoLight: string;
  good: string;
  caution: string;
  danger: string;
  goodTint: string;
  cautionTint: string;
  dangerTint: string;
}

export const TRAIL_PALETTES: Record<TrailThemeName, TrailPalette> = {
  trailhead: {
    name: 'Trailhead',
    paper: '#F2EFE7',
    snow: '#FAF8F2',
    card: '#FFFFFF',
    ink: '#141413',
    graphite: '#605C53',
    sub: '#8B867A',
    hairline: '#D9D3C3',
    hairlineSoft: '#E6E1D2',
    vermillion: '#A04A3E',
    vermillionInk: '#FAF8F2',
    vermillionTint: 'rgba(160, 74, 62, 0.08)',
    vermillionEdge: 'rgba(160, 74, 62, 0.20)',
    topo: '#B7AC93',
    topoDeep: '#8E826A',
    topoLight: '#E0D7BF',
    good: '#1F5C34',
    caution: '#B7651F',
    danger: '#8B1E2A',
    goodTint: 'rgba(31,92,52,0.10)',
    cautionTint: 'rgba(183,101,31,0.10)',
    dangerTint: 'rgba(139,30,42,0.10)',
  },
  nightMap: {
    name: 'Night Map',
    paper: '#0E0D0B',
    snow: '#16140F',
    card: '#1B1813',
    ink: '#F2EFE7',
    graphite: '#A39E91',
    sub: '#6B675D',
    hairline: '#2B2820',
    hairlineSoft: '#1F1C16',
    vermillion: '#C56858',
    vermillionInk: '#0E0D0B',
    vermillionTint: 'rgba(197, 104, 88, 0.12)',
    vermillionEdge: 'rgba(197, 104, 88, 0.26)',
    topo: '#3A352A',
    topoDeep: '#4E4836',
    topoLight: '#26221A',
    good: '#5C9E6E',
    caution: '#D49555',
    danger: '#D55060',
    goodTint: 'rgba(92,158,110,0.12)',
    cautionTint: 'rgba(212,149,85,0.12)',
    dangerTint: 'rgba(213,80,96,0.12)',
  },
  fjordTrail: {
    name: 'Fjord',
    paper: '#E8EDEC',
    snow: '#F6F8F7',
    card: '#FFFFFF',
    ink: '#0B1820',
    graphite: '#445862',
    sub: '#7A8B92',
    hairline: '#C9D2D2',
    hairlineSoft: '#DDE4E3',
    vermillion: '#A04A3E',
    vermillionInk: '#F6F8F7',
    vermillionTint: 'rgba(160, 74, 62, 0.08)',
    vermillionEdge: 'rgba(160, 74, 62, 0.20)',
    topo: '#8FA7A8',
    topoDeep: '#5E7A7C',
    topoLight: '#C9D6D5',
    good: '#1F5C5A',
    caution: '#B7651F',
    danger: '#8B1E2A',
    goodTint: 'rgba(31,92,90,0.10)',
    cautionTint: 'rgba(183,101,31,0.10)',
    dangerTint: 'rgba(139,30,42,0.10)',
  },
};

export const TrailThemeContext = createContext<TrailPalette>(TRAIL_PALETTES.trailhead);

export function useTrailTheme(): TrailPalette {
  return useContext(TrailThemeContext);
}
