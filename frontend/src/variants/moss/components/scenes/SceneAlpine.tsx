import type { Palette } from '../../theme';

export function SceneAlpine({ palette }: { palette: Palette }) {
  const p = palette;
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky-alp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBot} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky-alp)" />
      <ellipse cx="120" cy="60" rx="40" ry="6" fill={p.snow} opacity="0.35" />
      <ellipse cx="300" cy="80" rx="55" ry="7" fill={p.snow} opacity="0.3" />
      <path
        d="M0 210 L50 130 L100 180 L150 60 L210 170 L260 90 L320 175 L400 110 L400 260 L0 260 Z"
        fill={p.mountFar}
        opacity="0.65"
      />
      <path
        d="M-20 240 L60 150 L130 220 L200 100 L280 220 L360 130 L420 240 L420 260 L-20 260 Z"
        fill={p.mountMid}
      />
      <path d="M196 110 L200 100 L205 112 L201 116 Z" fill={p.snow} />
      <path d="M276 220 L195 130 L185 140 L260 235 Z" fill={p.snow} opacity="0.25" />
      <path
        d="M0 240 L100 232 L200 245 L300 230 L400 240 L400 260 L0 260 Z"
        fill={p.shore}
      />
    </svg>
  );
}
