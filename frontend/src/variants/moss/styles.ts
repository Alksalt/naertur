// Style factories for moss-variant UI primitives.
// Split out from primitives.tsx so that file can stay components-only and
// HMR Fast Refresh boundaries are clean.

import type { CSSProperties } from 'react';
import type { Palette } from './theme';
import { hexA } from '../../format';

export function primaryBtn(C: Palette): CSSProperties {
  return {
    height: 52,
    borderRadius: 16,
    background: C.primary,
    color: C.primaryInk,
    border: 0,
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: -0.1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    cursor: 'pointer',
    width: '100%',
  };
}

export function secondaryBtn(C: Palette): CSSProperties {
  return {
    height: 50,
    borderRadius: 14,
    background: 'transparent',
    color: C.ink,
    border: `1.5px solid ${C.border}`,
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    width: '100%',
  };
}

export function transportBtn(C: Palette, active: boolean): CSSProperties {
  return {
    height: 64,
    borderRadius: 14,
    background: active ? C.chipActive : C.chip,
    color: active ? C.chipActiveInk : C.ink,
    border: 0,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
    transition: 'background 120ms',
    width: '100%',
  };
}

export function tagBtn(C: Palette, active: boolean): CSSProperties {
  return {
    height: 36,
    padding: '0 12px',
    borderRadius: 100,
    background: active ? C.chipActive : C.chip,
    color: active ? C.chipActiveInk : C.ink,
    border: 0,
    fontFamily: 'inherit',
    fontSize: 13.5,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'background 120ms',
  };
}

export function iconBtn(C: Palette): CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: C.chip,
    border: 0,
    color: C.ink,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };
}

export function glassBtn(C: Palette): CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: hexA(C.card, 0.78),
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
    border: 'none',
    color: C.ink,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)',
  };
}

export function glassPill(C: Palette): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: hexA(C.card, 0.78),
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
    color: C.ink,
    borderRadius: 999,
    boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)',
  };
}
