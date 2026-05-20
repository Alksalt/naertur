import type { Palette } from '../theme';
import { hexA } from '../../../format';

export function MapPlaceholder({ palette }: { palette: Palette }) {
  const C = palette;
  return (
    <svg
      viewBox="0 0 320 150"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <rect width="320" height="150" fill={C.chip} />
      <g fill="none" stroke={hexA(C.muted, 0.3)} strokeWidth="1">
        <path d="M40 110 q60 -40 130 -30 t100 60" />
        <path d="M60 110 q50 -30 110 -22 t80 50" />
        <path d="M80 110 q40 -20 90 -14 t60 40" />
        <path d="M100 110 q30 -12 70 -8 t40 30" />
      </g>
      <path
        d="M40 130 q40 -20 80 -30 t100 -40 l30 -10"
        fill="none"
        stroke={C.accent}
        strokeWidth="2.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      <circle cx="40" cy="130" r="5" fill={C.accent} />
      <circle cx="40" cy="130" r="9" fill="none" stroke={C.accent} strokeOpacity="0.4" strokeWidth="1.5" />
      <polygon points="250,80 256,68 262,80" fill={C.ink} />
    </svg>
  );
}
