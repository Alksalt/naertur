// Brand palettes — lifted verbatim from
// design_handoff_naertur_frontend/app.jsx → NAERTUR_PALETTES.
// Each palette carries both UI tokens and the scene-illustration colors,
// so the hero SVGs recolor when the theme changes.

import { createContext, useContext } from 'react';
import type { ThemeName } from '../../types';

export interface Palette {
  name: string;
  ink: string;
  bg: string;
  card: string;
  border: string;
  muted: string;
  mutedSoft: string;
  primary: string;
  primaryInk: string;
  accent: string;
  accentInk: string;
  good: string;
  caution: string;
  danger: string;
  chip: string;
  chipActive: string;
  chipActiveInk: string;
  // Scene colors
  skyTop: string;
  skyBot: string;
  sun: string;
  mountFar: string;
  mountMid: string;
  mountShadow: string;
  snow: string;
  water: string;
  waterDeep: string;
  waterLine: string;
  shore: string;
  town: string;
}

export const NAERTUR_PALETTES: Record<ThemeName, Palette> = {
  moss: {
    name: 'Moss',
    ink: '#1A1F1B',
    bg: '#F4EFE6',
    card: '#FFFEFA',
    border: '#E5DFD2',
    muted: '#5A5D52',
    mutedSoft: '#8E9087',
    primary: '#2D3A2E',
    primaryInk: '#F4EFE6',
    accent: '#D86A2E',
    accentInk: '#FFFEFA',
    good: '#3F6B49',
    caution: '#C77E2A',
    danger: '#9A2B3C',
    chip: '#EFE9DC',
    chipActive: '#2D3A2E',
    chipActiveInk: '#F4EFE6',
    skyTop: '#E8D9B6',
    skyBot: '#F4EFE6',
    sun: '#E8A65A',
    mountFar: '#7C8978',
    mountMid: '#3E4D3F',
    mountShadow: '#1B231C',
    snow: '#F8F4E8',
    water: '#6C8082',
    waterDeep: '#3D5054',
    waterLine: '#E5DFD2',
    shore: '#2D3A2E',
    town: '#1A1F1B',
  },
  mossDark: {
    name: 'Moss Dark',
    ink: '#F2EDDF',
    bg: '#0F1411',
    card: '#1A201B',
    border: '#2A322B',
    muted: '#9AA098',
    mutedSoft: '#6B7269',
    primary: '#D9C896',
    primaryInk: '#0F1411',
    accent: '#E8884A',
    accentInk: '#0F1411',
    good: '#7BB07F',
    caution: '#E0A559',
    danger: '#D87080',
    chip: '#23291F',
    chipActive: '#D9C896',
    chipActiveInk: '#0F1411',
    skyTop: '#1E2823',
    skyBot: '#0F1411',
    sun: '#E8884A',
    mountFar: '#3A463D',
    mountMid: '#1B2520',
    mountShadow: '#070A08',
    snow: '#D9C896',
    water: '#1F2A2A',
    waterDeep: '#0F1614',
    waterLine: '#2A322B',
    shore: '#0A0F0D',
    town: '#0A0F0D',
  },
  fjord: {
    name: 'Fjord',
    ink: '#0F1A22',
    bg: '#EAF0F2',
    card: '#FFFFFF',
    border: '#D5DEE2',
    muted: '#4D5A63',
    mutedSoft: '#8896A0',
    primary: '#0F2A3C',
    primaryInk: '#EAF0F2',
    accent: '#C04E2E',
    accentInk: '#FFFFFF',
    good: '#34766B',
    caution: '#C77E2A',
    danger: '#A6304A',
    chip: '#DDE6E9',
    chipActive: '#0F2A3C',
    chipActiveInk: '#EAF0F2',
    skyTop: '#C7D6DC',
    skyBot: '#EAF0F2',
    sun: '#E8A65A',
    mountFar: '#6E8088',
    mountMid: '#2F4350',
    mountShadow: '#142028',
    snow: '#FFFFFF',
    water: '#3F6470',
    waterDeep: '#1F3540',
    waterLine: '#D5DEE2',
    shore: '#1F3540',
    town: '#0F1A22',
  },
};

export const ThemeContext = createContext<Palette>(NAERTUR_PALETTES.moss);

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
