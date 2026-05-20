// NærTur — SVG icons and scene illustrations

// ── Inline icon set (24x24 stroke icons matching the brand) ──────────────
function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.7 }) {
  const c = color, sw = strokeWidth;
  const paths = {
    view: <><path d="M3 18l5-8 4 6 3-4 6 6" /><circle cx="17" cy="6" r="2" /></>,
    tree: <><path d="M12 3l5 7h-3l4 6h-4v5h-4v-5H6l4-6H7l5-7z" /></>,
    peak: <><path d="M3 19l6-12 4 7 2-3 6 8H3z" /><path d="M9 7l1.4 2.8" /></>,
    water: <><path d="M3 16c2-1 4 0 6 0s4-1 6-1 4 1 6 1" /><path d="M3 19c2-1 4 0 6 0s4-1 6-1 4 1 6 1" /><path d="M3 13c2-1 4 0 6 0s4-1 6-1 4 1 6 1" /></>,
    falls: <><path d="M5 4v16M5 8c2 0 3 2 5 2s3-1 5-1 3 1 5 1" /><path d="M19 8v16" /><path d="M5 18c2 0 3 2 5 2s3-1 5-1 3 1 5 1" /></>,
    loop: <><path d="M5 14a7 7 0 1014 0 7 7 0 00-14 0z" /><path d="M14 9l3 1 1 3" /></>,
    kid: <><circle cx="12" cy="6" r="2.2" /><path d="M9 21l1-7-3-2 2-3 3 2 3-2 2 3-3 2 1 7" /></>,
    dog: <><path d="M4 11l-1-3 3 1 2-2 2 4h4l2-4 2 2 3-1-1 3v6c0 2-2 4-4 4H8c-2 0-4-2-4-4v-6z" /><circle cx="10" cy="14" r=".7" fill={c} /><circle cx="14" cy="14" r=".7" fill={c} /></>,
    location: <><path d="M12 22s-7-7-7-12a7 7 0 1114 0c0 5-7 12-7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
    car: <><path d="M3 16v-3l2-5h14l2 5v3M3 16h18M3 16v3h3v-3M21 16v3h-3v-3" /><circle cx="7" cy="16" r="1.3" fill={c} stroke="none" /><circle cx="17" cy="16" r="1.3" fill={c} stroke="none" /></>,
    bus: <><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 12h16M8 4v-1M16 4v-1" /><circle cx="8" cy="18" r="1.5" fill={c} stroke="none" /><circle cx="16" cy="18" r="1.5" fill={c} stroke="none" /></>,
    foot: <><path d="M9 4c1.5 0 2.5 1.2 2.5 3s-1 3-2.5 3S6.5 8.8 6.5 7 7.5 4 9 4z" /><circle cx="14" cy="6" r="1.2" /><circle cx="16" cy="9" r="1" /><circle cx="16" cy="13" r="1" /><path d="M6 14c3 0 5 2 5 5l-2 1-4-1z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    ruler: <><path d="M3 14l11-11 7 7L10 21l-7-7z" /><path d="M7 10l3 3M10 7l3 3M13 4l3 3" /></>,
    elev: <><path d="M3 19l6-9 4 5 4-7 4 11H3z" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    arrowL: <><path d="M19 12H5M11 6L5 12l6 6" /></>,
    close: <><path d="M6 6l12 12M18 6L6 18" /></>,
    chevron: <><path d="M9 6l6 6-6 6" /></>,
    check: <><path d="M5 13l4 4 10-10" /></>,
    refresh: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></>,
    thumbDown: <><path d="M7 14V4h2l3 1h5l1 6-3 7-2-1v-3H7z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></>,
    map: <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" /><path d="M9 4v16M15 6v16" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
    leaf: <><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" /><path d="M5 19c4-4 7-7 14-14" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="M15 9l-2 5-5 2 2-5 5-2z" fill={c} /></>,
    flag: <><path d="M5 22V3l5 2 4-2 5 2v12l-5-2-4 2-5-2" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <><path d="M5 12h14" /></>,
    bolt: <><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" /></>,
  };
  const p = paths[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}>
      {p}
    </svg>
  );
}

// ── SVG hero scenes: layered Norwegian landscapes ────────────────────────
// All scenes are 16:9-ish, drawn with gradient layers using brand colors.

function SceneFjord({ palette }) {
  const p = palette;
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
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
      {/* Sun */}
      <circle cx="290" cy="78" r="22" fill={p.sun} opacity="0.85" />
      {/* Far range */}
      <path d="M0 150 L40 130 L80 145 L130 115 L180 135 L230 110 L280 140 L330 125 L400 150 L400 260 L0 260 Z" fill={p.mountFar} opacity="0.55" />
      {/* Mid range */}
      <path d="M0 175 L50 150 L100 165 L150 140 L220 155 L260 135 L320 160 L400 145 L400 260 L0 260 Z" fill={p.mountMid} />
      {/* Water */}
      <rect x="0" y="190" width="400" height="50" fill="url(#water-fjord)" />
      {/* Reflection lines */}
      <g stroke={p.waterLine} strokeWidth="1" opacity="0.5">
        <line x1="40" y1="200" x2="90" y2="200" />
        <line x1="140" y1="208" x2="200" y2="208" />
        <line x1="240" y1="200" x2="290" y2="200" />
        <line x1="80" y1="218" x2="160" y2="218" />
        <line x1="240" y1="222" x2="320" y2="222" />
      </g>
      {/* Near shore */}
      <path d="M0 240 L100 232 L200 238 L300 230 L400 240 L400 260 L0 260 Z" fill={p.shore} />
    </svg>
  );
}

function ScenePeak({ palette }) {
  const p = palette;
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="sky-peak" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBot} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky-peak)" />
      <circle cx="80" cy="60" r="18" fill={p.sun} opacity="0.85" />
      {/* Back peaks */}
      <path d="M0 200 L60 110 L120 170 L180 90 L250 160 L320 100 L400 180 L400 260 L0 260 Z" fill={p.mountFar} opacity="0.7" />
      {/* Front peak (the hike) */}
      <path d="M40 260 L160 70 L260 200 L260 260 Z" fill={p.mountMid} />
      {/* Snow cap */}
      <path d="M152 90 L160 70 L170 92 L165 96 L160 92 L155 96 Z" fill={p.snow} />
      {/* Ridge shadow */}
      <path d="M160 70 L260 200 L240 200 L160 92 Z" fill={p.mountShadow} opacity="0.4" />
      {/* Foreground */}
      <path d="M0 230 L80 215 L200 225 L300 218 L400 230 L400 260 L0 260 Z" fill={p.shore} />
    </svg>
  );
}

function SceneAlpine({ palette }) {
  const p = palette;
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="sky-alp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBot} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky-alp)" />
      {/* Wisps of cloud */}
      <ellipse cx="120" cy="60" rx="40" ry="6" fill={p.snow} opacity="0.35" />
      <ellipse cx="300" cy="80" rx="55" ry="7" fill={p.snow} opacity="0.3" />
      {/* Three jagged peaks */}
      <path d="M0 210 L50 130 L100 180 L150 60 L210 170 L260 90 L320 175 L400 110 L400 260 L0 260 Z" fill={p.mountFar} opacity="0.65" />
      <path d="M-20 240 L60 150 L130 220 L200 100 L280 220 L360 130 L420 240 L420 260 L-20 260 Z" fill={p.mountMid} />
      {/* Snow caps */}
      <path d="M196 110 L200 100 L205 112 L201 116 Z" fill={p.snow} />
      <path d="M276 220 L195 130 L185 140 L260 235 Z" fill={p.snow} opacity="0.25" />
      {/* Foreground */}
      <path d="M0 240 L100 232 L200 245 L300 230 L400 240 L400 260 L0 260 Z" fill={p.shore} />
    </svg>
  );
}

function SceneTown({ palette }) {
  const p = palette;
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="sky-tw" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBot} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#sky-tw)" />
      <circle cx="320" cy="80" r="14" fill={p.sun} opacity="0.6" />
      {/* Hill */}
      <path d="M0 200 L120 110 L240 180 L400 130 L400 260 L0 260 Z" fill={p.mountMid} />
      <path d="M120 110 L240 180 L120 180 Z" fill={p.mountShadow} opacity="0.3" />
      {/* Town silhouette */}
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

function HikeScene({ scene, palette }) {
  const C = palette;
  if (scene === 'peak') return <ScenePeak palette={C} />;
  if (scene === 'alpine') return <SceneAlpine palette={C} />;
  if (scene === 'town') return <SceneTown palette={C} />;
  return <SceneFjord palette={C} />;
}

// ── Wordmark — "NærTur" with a small peak glyph ──────────────────────────
function NaerturMark({ color, size = 22, peakColor }) {
  const pc = peakColor || color;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M2 20 L9 8 L13 14 L16 10 L22 20 Z" fill={pc} />
        <path d="M16 10 L18 12.5" stroke={color} strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span style={{
        fontFamily: '"Schibsted Grotesk", system-ui',
        fontWeight: 600, fontSize: size, letterSpacing: -0.5, color,
        lineHeight: 1,
      }}>NærTur</span>
    </span>
  );
}

Object.assign(window, { Icon, HikeScene, NaerturMark, SceneFjord, ScenePeak, SceneAlpine, SceneTown });
