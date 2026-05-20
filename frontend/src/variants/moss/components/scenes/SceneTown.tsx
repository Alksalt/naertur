import type { Palette } from '../../theme';

export function SceneTown({ palette }: { palette: Palette }) {
  const p = palette;
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky-tw" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBot} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky-tw)" />
      <circle cx="320" cy="80" r="14" fill={p.sun} opacity="0.6" />
      <path d="M0 200 L120 110 L240 180 L400 130 L400 260 L0 260 Z" fill={p.mountMid} />
      <path d="M120 110 L240 180 L120 180 Z" fill={p.mountShadow} opacity="0.3" />
      <g fill={p.town}>
        <rect x="40" y="195" width="14" height="22" />
        <polygon points="40,195 47,188 54,195" />
        <rect x="60" y="190" width="18" height="27" />
        <polygon points="60,190 69,182 78,190" />
        <rect x="86" y="200" width="12" height="17" />
        <polygon points="86,200 92,194 98,200" />
        <rect x="106" y="195" width="16" height="22" />
        <polygon points="106,195 114,187 122,195" />
        <rect x="130" y="200" width="12" height="17" />
        <rect x="160" y="200" width="14" height="17" />
        <polygon points="160,200 167,194 174,200" />
        <rect x="190" y="205" width="10" height="12" />
        <rect x="210" y="200" width="14" height="17" />
        <polygon points="210,200 217,193 224,200" />
      </g>
      <rect x="0" y="217" width="400" height="43" fill={p.shore} />
    </svg>
  );
}
