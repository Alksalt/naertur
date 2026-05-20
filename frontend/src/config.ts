// Variant resolver. Resolution order:
//   1. URL query: ?variant=moss|trail
//   2. localStorage override (set by DevVariantSwitcher)
//   3. Env: VITE_VARIANT=moss|trail|random
//   4. Default: moss
//
// `random` rerolls on every page load — no persistence — so every refresh
// flips a coin between the two variants. This is for live A/B with visitors.

import type { Variant, VariantMode } from './types';

const OVERRIDE_KEY = 'naertur.variant.override';
const VALID: Variant[] = ['moss', 'trail'];

function fromUrl(): Variant | null {
  if (typeof window === 'undefined') return null;
  try {
    const q = new URLSearchParams(window.location.search).get('variant');
    return q && (VALID as string[]).includes(q) ? (q as Variant) : null;
  } catch {
    return null;
  }
}

function fromOverride(): Variant | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    if (raw === null) return null;
    const v = JSON.parse(raw);
    return typeof v === 'string' && (VALID as string[]).includes(v) ? (v as Variant) : null;
  } catch {
    return null;
  }
}

function fromEnv(): VariantMode {
  const v = (import.meta.env.VITE_VARIANT ?? 'moss') as string;
  if (v === 'moss' || v === 'trail' || v === 'random') return v;
  return 'moss';
}

export function resolveVariant(): Variant {
  const url = fromUrl();
  if (url) return url;
  const override = fromOverride();
  if (override) return override;
  const env = fromEnv();
  if (env === 'random') {
    const rolled: Variant = Math.random() < 0.5 ? 'moss' : 'trail';
    if (import.meta.env.DEV) {
      console.log(`[NærTur] random → ${rolled}`);
    }
    return rolled;
  }
  return env;
}

export function setVariantOverride(v: Variant | null): void {
  try {
    if (v === null) window.localStorage.removeItem(OVERRIDE_KEY);
    else window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(v));
  } catch {
    // private browsing / quota — silently ignore.
  }
}

export function getVariantOverride(): Variant | null {
  return fromOverride();
}

export { OVERRIDE_KEY };
