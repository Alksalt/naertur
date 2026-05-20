// 24×24 stroke icon set, paths lifted verbatim from
// design_handoff_naertur_frontend/icons.jsx.

import type { ReactElement } from 'react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const PATHS: Record<string, ReactElement> = {
  view: (
    <>
      <path d="M3 18l5-8 4 6 3-4 6 6" />
      <circle cx="17" cy="6" r="2" />
    </>
  ),
  tree: <path d="M12 3l5 7h-3l4 6h-4v5h-4v-5H6l4-6H7l5-7z" />,
  peak: (
    <>
      <path d="M3 19l6-12 4 7 2-3 6 8H3z" />
      <path d="M9 7l1.4 2.8" />
    </>
  ),
  water: (
    <>
      <path d="M3 16c2-1 4 0 6 0s4-1 6-1 4 1 6 1" />
      <path d="M3 19c2-1 4 0 6 0s4-1 6-1 4 1 6 1" />
      <path d="M3 13c2-1 4 0 6 0s4-1 6-1 4 1 6 1" />
    </>
  ),
  falls: (
    <>
      <path d="M5 4v16M5 8c2 0 3 2 5 2s3-1 5-1 3 1 5 1" />
      <path d="M19 8v16" />
      <path d="M5 18c2 0 3 2 5 2s3-1 5-1 3 1 5 1" />
    </>
  ),
  loop: (
    <>
      <path d="M5 14a7 7 0 1014 0 7 7 0 00-14 0z" />
      <path d="M14 9l3 1 1 3" />
    </>
  ),
  kid: (
    <>
      <circle cx="12" cy="6" r="2.2" />
      <path d="M9 21l1-7-3-2 2-3 3 2 3-2 2 3-3 2 1 7" />
    </>
  ),
  dog: (
    <>
      <path d="M4 11l-1-3 3 1 2-2 2 4h4l2-4 2 2 3-1-1 3v6c0 2-2 4-4 4H8c-2 0-4-2-4-4v-6z" />
      <circle cx="10" cy="14" r=".7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  location: (
    <>
      <path d="M12 22s-7-7-7-12a7 7 0 1114 0c0 5-7 12-7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  car: (
    <>
      <path d="M3 16v-3l2-5h14l2 5v3M3 16h18M3 16v3h3v-3M21 16v3h-3v-3" />
      <circle cx="7" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="16" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="14" rx="2" />
      <path d="M4 12h16M8 4v-1M16 4v-1" />
      <circle cx="8" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  foot: (
    <>
      <path d="M9 4c1.5 0 2.5 1.2 2.5 3s-1 3-2.5 3S6.5 8.8 6.5 7 7.5 4 9 4z" />
      <circle cx="14" cy="6" r="1.2" />
      <circle cx="16" cy="9" r="1" />
      <circle cx="16" cy="13" r="1" />
      <path d="M6 14c3 0 5 2 5 5l-2 1-4-1z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  ruler: (
    <>
      <path d="M3 14l11-11 7 7L10 21l-7-7z" />
      <path d="M7 10l3 3M10 7l3 3M13 4l3 3" />
    </>
  ),
  elev: <path d="M3 19l6-9 4 5 4-7 4 11H3z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowL: <path d="M19 12H5M11 6L5 12l6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 13l4 4 10-10" />,
  refresh: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  thumbDown: <path d="M7 14V4h2l3 1h5l1 6-3 7-2-1v-3H7z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </>
  ),
  map: (
    <>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
      <path d="M9 4v16M15 6v16" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
      <path d="M5 19c4-4 7-7 14-14" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 5-5 2 2-5 5-2z" fill="currentColor" />
    </>
  ),
  flag: <path d="M5 22V3l5 2 4-2 5 2v12l-5-2-4 2-5-2" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  bolt: <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />,
};

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.7 }: IconProps) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', color }}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
