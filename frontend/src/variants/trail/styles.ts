// Trail-variant style factories. Lifted from app-trail.jsx:1208-1283
// with platform-conditional radii collapsed to iOS values (small 5/6 radii).

import type { CSSProperties } from 'react';
import type { TrailPalette } from './theme';

export function primaryCta(C: TrailPalette, opts?: { accent?: boolean; big?: boolean; height?: number }): CSSProperties {
  const accent = opts?.accent ?? false;
  const big = opts?.big ?? false;
  const height = opts?.height ?? 56;
  const bg = accent ? C.vermillion : C.ink;
  const fg = accent ? C.vermillionInk : C.paper;
  return {
    height,
    width: '100%',
    border: 0,
    borderRadius: 6,
    background: bg,
    color: fg,
    fontFamily: 'inherit',
    fontSize: big ? 17 : 15.5,
    fontWeight: 600,
    letterSpacing: -0.1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    cursor: 'pointer',
  };
}

export function ghostCta(C: TrailPalette, height = 50): CSSProperties {
  return {
    height,
    width: '100%',
    border: `1px solid ${C.hairline}`,
    borderRadius: 5,
    background: 'transparent',
    color: C.ink,
    fontFamily: 'inherit',
    fontSize: 14.5,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
  };
}

export function smallGhost(C: TrailPalette): CSSProperties {
  return {
    flex: 1,
    height: 46,
    borderRadius: 5,
    background: C.snow,
    color: C.ink,
    border: `1px solid ${C.hairline}`,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
  };
}

export function iconBox(C: TrailPalette): CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: 5,
    background: C.snow,
    border: `1px solid ${C.hairline}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: C.ink,
  };
}

export function floatBtn(C: TrailPalette): CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: 5,
    background: C.snow,
    border: `1px solid ${C.hairline}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: C.ink,
    boxShadow: '0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)',
  };
}

export function diffTile(C: TrailPalette, active: boolean): CSSProperties {
  return {
    padding: '14px 10px',
    borderRadius: 5,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 7,
    cursor: 'pointer',
    transition: 'background 160ms, color 160ms, border-color 160ms',
    textAlign: 'left',
  };
}

export function lenTile(C: TrailPalette, active: boolean): CSSProperties {
  return {
    padding: '16px 12px',
    borderRadius: 5,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
    transition: 'background 160ms, color 160ms, border-color 160ms',
  };
}

export function transportTile(C: TrailPalette, active: boolean): CSSProperties {
  return {
    padding: '14px 8px',
    borderRadius: 5,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    transition: 'background 160ms, color 160ms, border-color 160ms',
  };
}

export function tagChip(C: TrailPalette, active: boolean): CSSProperties {
  return {
    padding: '7px 11px',
    borderRadius: 4,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'background 160ms, color 160ms, border-color 160ms',
  };
}

export const MONO = "ui-monospace, 'SF Mono', monospace";
