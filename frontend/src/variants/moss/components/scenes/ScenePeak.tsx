import type { Palette } from '../../theme';

export function ScenePeak({ palette }: { palette: Palette }) {
  const p = palette;
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky-peak" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBot} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky-peak)" />
      <circle cx="80" cy="60" r="18" fill={p.sun} opacity="0.85" />
      <path
        d="M0 200 L60 110 L120 170 L180 90 L250 160 L320 100 L400 180 L400 260 L0 260 Z"
        fill={p.mountFar}
        opacity="0.7"
      />
      <path d="M40 260 L160 70 L260 200 L260 260 Z" fill={p.mountMid} />
      <path d="M152 90 L160 70 L170 92 L165 96 L160 92 L155 96 Z" fill={p.snow} />
      <path d="M160 70 L260 200 L240 200 L160 92 Z" fill={p.mountShadow} opacity="0.4" />
      <path
        d="M0 230 L80 215 L200 225 L300 218 L400 230 L400 260 L0 260 Z"
        fill={p.shore}
      />
    </svg>
  );
}
