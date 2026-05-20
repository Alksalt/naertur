import type { ReactNode } from 'react';
import type { Lang } from './types';

// Lifted from design_handoff/app.jsx:940 — convert "#RRGGBB" to rgba(r,g,b,a).
export function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const parsed =
    h.length === 3
      ? h.split('').map((x) => parseInt(x + x, 16))
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return `rgba(${parsed[0]},${parsed[1]},${parsed[2]},${alpha})`;
}

// Format minutes lang-aware: NO uses "t"/"m", EN uses "h"/"min".
export function fmtDur(mins: number, lang: Lang): ReactNode {
  const isNo = lang === 'no';
  if (mins < 60)
    return (
      <>
        {mins}
        <small>{isNo ? ' m' : ' min'}</small>
      </>
    );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0)
    return (
      <>
        {h}
        <small>{isNo ? ' t' : ' h'}</small>
      </>
    );
  return (
    <>
      {h}
      <small>{isNo ? 't' : 'h'}</small> {m}
      <small>{isNo ? 'm' : 'min'}</small>
    </>
  );
}

export function fmtDistanceKm(meters: number): string {
  return (meters / 1000).toFixed(1).replace('.', ',');
}
