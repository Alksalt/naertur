// Lifted from app-trail.jsx:1018-1056.
// Stylized elevation profile with summit marker + animated stroke draw.

import type { TrailPalette } from '../theme';
import type { UiHike } from '../../../types';

export function ElevationChart({ palette, hike }: { palette: TrailPalette; hike: UiHike }) {
  const C = palette;
  const gradId = `elev-${hike.id}`;
  return (
    <svg viewBox="0 0 320 100" width="100%" height="100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={C.vermillion} stopOpacity="0.18" />
          <stop offset="1" stopColor={C.vermillion} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke={C.hairline} strokeWidth="0.5">
        <line x1="0" y1="25" x2="320" y2="25" />
        <line x1="0" y1="50" x2="320" y2="50" />
        <line x1="0" y1="75" x2="320" y2="75" />
      </g>
      <path
        d="M0 88 L40 75 L80 60 L130 38 L180 22 L220 35 L260 50 L300 70 L320 80 L320 100 L0 100 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M0 88 L40 75 L80 60 L130 38 L180 22 L220 35 L260 50 L300 70 L320 80"
        fill="none"
        stroke={C.vermillion}
        strokeWidth="1.8"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 700,
          strokeDashoffset: 700,
          animation: 'trail-draw 1200ms 200ms cubic-bezier(.4,.1,.3,1) forwards',
        }}
      />
      <circle cx="180" cy="22" r="3" fill={C.vermillion} />
      <line
        x1="180"
        y1="22"
        x2="180"
        y2="6"
        stroke={C.vermillion}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {hike.ascentMeters !== undefined && (
        <text
          x="180"
          y="4"
          fontSize="9"
          fill={C.ink}
          textAnchor="middle"
          fontFamily="'Bricolage Grotesque'"
          fontWeight="600"
        >
          ▲ {hike.ascentMeters}m
        </text>
      )}
    </svg>
  );
}
