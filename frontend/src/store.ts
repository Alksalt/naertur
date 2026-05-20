// Consolidated localStorage hook + app-specific stores.
// Merged from the former src/hooks/useLocalStorage.ts + src/store/persistence.ts.

import { useCallback, useEffect, useState } from 'react';
import { detectInitialLang } from './i18n';
import type { Difficulty, Lang, LengthBucket, ThemeName, TrailThemeName, TransportMode } from './types';

function read<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return initial;
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => read(key, initial));

  useEffect(() => {
    try {
      const serialised = JSON.stringify(state);
      // Skip no-op writes — React 18 StrictMode double-invokes effects in
      // dev; without this guard every key would re-write to localStorage on
      // every render.
      if (window.localStorage.getItem(key) === serialised) return;
      window.localStorage.setItem(key, serialised);
    } catch {
      // Quota exceeded or private-browsing — drop silently.
    }
  }, [key, state]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => (typeof value === 'function' ? (value as (p: T) => T)(prev) : value));
  }, []);

  return [state, setValue];
}

export interface FilterState {
  difficulty: Difficulty[];
  length: LengthBucket | null;
  transport: TransportMode;
  maxTravel: number;
  tags: string[];
  avoid: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  difficulty: ['easy', 'medium'],
  length: null,
  transport: 'car',
  maxTravel: 45,
  tags: ['viewpoint'],
  avoid: [],
};

const KEYS = {
  filters: 'naertur.filters.v1',
  rejected: 'naertur.rejected.v1',
  lang: 'naertur.lang.v1',
  theme: 'naertur.theme.v1',
  trailTheme: 'naertur.trail.theme.v1',
} as const;

export function useFilters() {
  return useLocalStorage<FilterState>(KEYS.filters, DEFAULT_FILTERS);
}

export function useRejected() {
  return useLocalStorage<string[]>(KEYS.rejected, []);
}

export function useLang() {
  return useLocalStorage<Lang>(KEYS.lang, detectInitialLang());
}

export function useThemeName() {
  return useLocalStorage<ThemeName>(KEYS.theme, 'moss');
}

export function useTrailThemeName() {
  return useLocalStorage<TrailThemeName>(KEYS.trailTheme, 'trailhead');
}
