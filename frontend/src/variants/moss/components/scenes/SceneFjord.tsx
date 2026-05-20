import type { Palette } from '../../theme';

export function SceneFjord({ palette }: { palette: Palette }) {
  const p = palette;
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky-fjord" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBot} />
        </linearGradient>
        <linearGradient id="water-fjord" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.water} />
          <stop offset="1" stopColor={p.waterDeep} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky-fjord)" />
      <circle cx="290" cy="78" r="22" fill={p.sun} opacity="0.85" />
      <path
        d="M0 150 L40 130 L80 145 L130 115 L180 135 L230 110 L280 140 L330 125 L400 150 L400 260 L0 260 Z"
        fill={p.mountFar}
        opacity="0.55"
      />
      <path
        d="M0 175 L50 150 L100 165 L150 140 L220 155 L260 135 L320 160 L400 145 L400 260 L0 260 Z"
        fill={p.mountMid}
      />
      <rect x="0" y="190" width="400" height="50" fill="url(#water-fjord)" />
      <g stroke={p.waterLine} strokeWidth="1" opacity="0.5">
        <line x1="40" y1="200" x2="90" y2="200" />
        <line x1="140" y1="208" x2="200" y2="208" />
        <line x1="240" y1="200" x2="290" y2="200" />
        <line x1="80" y1="218" x2="160" y2="218" />
        <line x1="240" y1="222" x2="320" y2="222" />
      </g>
      <path
        d="M0 240 L100 232 L200 238 L300 230 L400 240 L400 260 L0 260 Z"
        fill={p.shore}
      />
    </svg>
  );
}
