// NærTur v2 — "Trail Map" design
// Editorial topographic direction, single vermillion accent, spring physics.
// Reuses window.HIKES, window.I18N, window.TAGS from data.js.

const { useState, useEffect, useRef, useMemo } = React;

// ── Palettes ────────────────────────────────────────────────────────────
const TRAIL_PALETTES = {
  trailhead: {
    name: 'Trailhead',
    paper: '#F2EFE7',
    snow: '#FAF8F2',
    card: '#FFFFFF',
    ink: '#141413',
    graphite: '#605C53',
    sub: '#8B867A',
    hairline: '#D9D3C3',
    hairlineSoft: '#E6E1D2',
    vermillion: '#C8242C',
    vermillionInk: '#FAF8F2',
    vermillionTint: 'rgba(200, 36, 44, 0.08)',
    vermillionEdge: 'rgba(200, 36, 44, 0.22)',
    topo: '#B7AC93',
    topoDeep: '#8E826A',
    topoLight: '#E0D7BF',
    good: '#1F5C34',
    caution: '#B7651F',
    danger: '#8B1E2A',
    // for the safety strip backgrounds
    goodTint: 'rgba(31,92,52,0.10)',
    cautionTint: 'rgba(183,101,31,0.10)',
    dangerTint: 'rgba(139,30,42,0.10)',
  },
  nightMap: {
    name: 'Night Map',
    paper: '#0E0D0B',
    snow: '#16140F',
    card: '#1B1813',
    ink: '#F2EFE7',
    graphite: '#A39E91',
    sub: '#6B675D',
    hairline: '#2B2820',
    hairlineSoft: '#1F1C16',
    vermillion: '#E0353D',
    vermillionInk: '#0E0D0B',
    vermillionTint: 'rgba(224, 53, 61, 0.12)',
    vermillionEdge: 'rgba(224, 53, 61, 0.28)',
    topo: '#3A352A',
    topoDeep: '#4E4836',
    topoLight: '#26221A',
    good: '#5C9E6E',
    caution: '#D49555',
    danger: '#D55060',
    goodTint: 'rgba(92,158,110,0.12)',
    cautionTint: 'rgba(212,149,85,0.12)',
    dangerTint: 'rgba(213,80,96,0.12)',
  },
  fjordTrail: {
    name: 'Fjord',
    paper: '#E8EDEC',
    snow: '#F6F8F7',
    card: '#FFFFFF',
    ink: '#0B1820',
    graphite: '#445862',
    sub: '#7A8B92',
    hairline: '#C9D2D2',
    hairlineSoft: '#DDE4E3',
    vermillion: '#B23222',
    vermillionInk: '#F6F8F7',
    vermillionTint: 'rgba(178, 50, 34, 0.08)',
    vermillionEdge: 'rgba(178, 50, 34, 0.22)',
    topo: '#8FA7A8',
    topoDeep: '#5E7A7C',
    topoLight: '#C9D6D5',
    good: '#1F5C5A',
    caution: '#B7651F',
    danger: '#8B1E2A',
    goodTint: 'rgba(31,92,90,0.10)',
    cautionTint: 'rgba(183,101,31,0.10)',
    dangerTint: 'rgba(139,30,42,0.10)',
  },
};

// ── Animation utilities ─────────────────────────────────────────────────

// CSS keyframes injected once
if (typeof document !== 'undefined' && !document.getElementById('trail-anim-css')) {
  const s = document.createElement('style');
  s.id = 'trail-anim-css';
  s.textContent = `
    @keyframes trail-draw { to { stroke-dashoffset: 0; } }
    @keyframes trail-fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes trail-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes trail-pop {
      0%   { transform: scale(0.6); opacity: 0; }
      60%  { transform: scale(1.06); opacity: 1; }
      100% { transform: scale(1); }
    }
    @keyframes trail-ring-pulse {
      0%   { transform: scale(0.5); opacity: 0.7; }
      80%  { opacity: 0.05; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    @keyframes trail-breathe {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-2px); }
    }
    @keyframes trail-shimmer {
      0%   { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
    .ta-tap { transition: transform 180ms cubic-bezier(.3,1.4,.5,1); }
    .ta-tap:active { transform: scale(0.96); }
    .ta-card-tap:active { transform: scale(0.985); }
    .trail-fade-up { animation: trail-fade-up 420ms cubic-bezier(.2,.85,.3,1.1) both; }
    .trail-fade-in { animation: trail-fade-in 380ms ease-out both; }
    .trail-pop { animation: trail-pop 520ms cubic-bezier(.3,1.5,.4,1) both; }
    .trail-app * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    .trail-app button { font-family: inherit; }
  `;
  document.head.appendChild(s);
}

// Hook: count-up for stat numbers
function useCountUp(target, duration = 700, deps = []) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

// ── Topographic map ─────────────────────────────────────────────────────
// A stylized topo card used as the hero on Welcome, Result, and Detail.
// Contour rings + a trail + trailhead/summit markers.

function TopoMap({ palette, hike, drawOn = true, height = 280, showTrail = true, mode = 'hero', children }) {
  const C = palette;
  // Each hike gets a seed so the contour shapes feel unique to it.
  const seed = useMemo(() => {
    if (!hike) return 17;
    let h = 0; for (let i = 0; i < hike.id.length; i++) h = (h * 31 + hike.id.charCodeAt(i)) & 0xffff;
    return h;
  }, [hike?.id]);

  // Generate contour rings — concentric blobs around a focal point
  const rings = useMemo(() => {
    const cx = 220 + (seed % 60) - 30;
    const cy = 130 + ((seed >> 4) % 50) - 25;
    return [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
      const r = 28 + i * 18;
      const wobble = 0.08 + (i * 0.012);
      // Use polar wobble for organic feel
      const points = [];
      for (let a = 0; a < 360; a += 18) {
        const w = 1 + Math.sin((a + seed * 7 + i * 31) * 0.087) * wobble
                    + Math.cos((a + seed * 3 + i * 17) * 0.041) * wobble * 0.6;
        const rad = a * Math.PI / 180;
        points.push([cx + Math.cos(rad) * r * w, cy + Math.sin(rad) * r * w]);
      }
      const path = points.map((p, j) => (j === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + ' Z';
      return { path, i };
    });
  }, [seed]);

  // Trail path — a curve from bottom-left to the summit (focal point)
  const trail = useMemo(() => {
    const cx = 220 + (seed % 60) - 30;
    const cy = 130 + ((seed >> 4) % 50) - 25;
    const sx = 50, sy = 240;
    const m1x = 110 + ((seed >> 2) % 40), m1y = 200;
    const m2x = 160, m2y = 165;
    return { d: `M${sx} ${sy} Q${m1x} ${m1y}, ${m2x} ${m2y} T${cx} ${cy}`, start: [sx, sy], summit: [cx, cy] };
  }, [seed]);

  // Hairline grid lines for the map base
  const gridLines = [];
  for (let x = 0; x <= 400; x += 50) gridLines.push(<line key={'gx'+x} x1={x} y1={0} x2={x} y2={300} stroke={C.hairlineSoft} strokeWidth="0.5" />);
  for (let y = 0; y <= 300; y += 50) gridLines.push(<line key={'gy'+y} x1={0} y1={y} x2={400} y2={y} stroke={C.hairlineSoft} strokeWidth="0.5" />);

  // Trail length approximation (used for stroke-dasharray)
  // Quadratic+T length — just guess a generous total
  const trailLen = 360;

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', background: C.paper }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* base */}
        <rect width="400" height="300" fill={C.paper} />
        {/* grid */}
        <g opacity={mode === 'hero' ? 0.8 : 0.4}>{gridLines}</g>
        {/* contours */}
        <g>
          {rings.map(r => (
            <path key={r.i} d={r.path}
              fill="none"
              stroke={r.i % 4 === 0 ? C.topoDeep : C.topo}
              strokeWidth={r.i % 4 === 0 ? 1.1 : 0.6}
              opacity={mode === 'bg' ? 0.45 : 0.85}
              style={drawOn ? {
                strokeDasharray: 800,
                strokeDashoffset: 800,
                animation: `trail-draw 1100ms ${r.i * 90}ms cubic-bezier(.6,.1,.3,1) forwards`,
              } : null}
            />
          ))}
        </g>
        {/* compass rose */}
        {mode === 'hero' && (
          <g transform="translate(370, 30)" opacity="0.75">
            <circle cx="0" cy="0" r="11" fill={C.snow} stroke={C.hairline} strokeWidth="0.8" />
            <polygon points="0,-7 2.5,0 0,2 -2.5,0" fill={C.vermillion} />
            <polygon points="0,7 2.5,0 0,-2 -2.5,0" fill={C.graphite} opacity="0.4" />
            <text x="0" y="-12.5" textAnchor="middle" fontSize="6" fontWeight="600"
              fill={C.ink} fontFamily="'Bricolage Grotesque', sans-serif">N</text>
          </g>
        )}
        {/* scale bar */}
        {mode === 'hero' && (
          <g transform="translate(20, 270)" opacity="0.7">
            <rect x="0" y="0" width="40" height="2" fill={C.ink} />
            <rect x="40" y="0" width="40" height="2" fill="none" stroke={C.ink} strokeWidth="1" />
            <text x="0" y="-4" fontSize="7" fill={C.graphite} fontFamily="'Bricolage Grotesque', sans-serif"
              fontWeight="500" letterSpacing="0.5">0      1 km</text>
          </g>
        )}
        {/* trail */}
        {showTrail && (
          <>
            <path d={trail.d} fill="none" stroke={C.vermillion} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round"
              style={drawOn ? {
                strokeDasharray: trailLen,
                strokeDashoffset: trailLen,
                animation: `trail-draw 1400ms 700ms cubic-bezier(.6,.1,.3,1) forwards`,
              } : null}
            />
            {/* trailhead — filled triangle */}
            <g transform={`translate(${trail.start[0]}, ${trail.start[1]})`}
               style={drawOn ? { animation: `trail-pop 520ms 1500ms both` } : null}>
              <circle cx="0" cy="0" r="7" fill={C.snow} stroke={C.vermillion} strokeWidth="1.5" />
              <polygon points="0,-3.2 3,2.2 -3,2.2" fill={C.vermillion} />
            </g>
            {/* summit — outlined triangle */}
            <g transform={`translate(${trail.summit[0]}, ${trail.summit[1]})`}
               style={drawOn ? { animation: `trail-pop 520ms 1800ms both` } : null}>
              <polygon points="0,-7 7,5 -7,5" fill={C.snow} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
              <polygon points="0,-7 3,-1.5 -3,-1.5" fill={C.ink} />
            </g>
          </>
        )}
      </svg>
      {children}
    </div>
  );
}

// ── Legend-style stat icons ─────────────────────────────────────────────
function StatIcon({ kind, size = 14, color }) {
  switch (kind) {
    case 'len':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M2 8 H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M3 5 V11 M13 5 V11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'asc':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <polygon points="2,13 8,3 14,13" fill={color} />
        </svg>
      );
    case 'dur':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4" />
          <path d="M8 4 V8 L11 10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'trv':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <polygon points="8,2 14,8 8,14 2,8" stroke={color} strokeWidth="1.4" fill="none" />
        </svg>
      );
    default: return null;
  }
}

// ── Profile glyphs for difficulty ───────────────────────────────────────
function DifficultyGlyph({ level, color, soft }) {
  // simple silhouette suggesting trail steepness
  switch (level) {
    case 'easy':
      return (
        <svg width="56" height="22" viewBox="0 0 56 22" fill="none">
          <path d="M2 18 Q14 12, 28 12 T54 8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="2" y1="20" x2="54" y2="20" stroke={soft} strokeWidth="0.8" />
        </svg>
      );
    case 'medium':
      return (
        <svg width="56" height="22" viewBox="0 0 56 22" fill="none">
          <path d="M2 18 L18 18 L34 6 L48 12 L54 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="2" y1="20" x2="54" y2="20" stroke={soft} strokeWidth="0.8" />
        </svg>
      );
    case 'hard':
      return (
        <svg width="56" height="22" viewBox="0 0 56 22" fill="none">
          <path d="M2 18 L12 18 L18 4 L24 12 L30 2 L42 14 L48 6 L54 18" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="2" y1="20" x2="54" y2="20" stroke={soft} strokeWidth="0.8" />
        </svg>
      );
    default: return null;
  }
}

// ── Main app ────────────────────────────────────────────────────────────
function NaerturApp({ platform = 'ios', t, lang, palette, statusH = 60, bottomH = 34, initialScreen = 'welcome' }) {
  const C = palette;
  const L = t;

  const [screen, setScreen] = useState(initialScreen);
  const [difficulty, setDifficulty] = useState(['easy', 'medium']);
  const [length, setLength] = useState(null);
  const [transport, setTransport] = useState('car');
  const [maxTravel, setMaxTravel] = useState(45);
  const [tags, setTags] = useState(['viewpoint']);
  const [avoid, setAvoid] = useState([]);
  const [location] = useState({ label: 'Ålesund', sub: '6,5 km nord' });
  const [hikeIdx, setHikeIdx] = useState(0);
  const [rejected, setRejected] = useState([]);
  const [findingPhase, setFindingPhase] = useState(0);

  // Filter candidates client-side
  const candidates = useMemo(() => {
    return window.HIKES.filter(h => {
      if (!difficulty.includes(h.difficulty)) return false;
      if (h.travelMinutes > maxTravel) return false;
      if (length === 'under_5km' && h.distanceMeters >= 5000) return false;
      if (length === '5_10km' && (h.distanceMeters < 5000 || h.distanceMeters > 10000)) return false;
      if (length === '10km_plus' && h.distanceMeters < 10000) return false;
      if (tags.length && !tags.some(t => h.tags.includes(t))) return false;
      if (rejected.includes(h.id)) return false;
      return true;
    });
  }, [difficulty, length, maxTravel, tags, rejected]);
  const hike = candidates[hikeIdx % Math.max(candidates.length, 1)] || window.HIKES[0];

  useEffect(() => {
    if (screen !== 'finding') return;
    const isPreview = initialScreen === 'finding';
    setFindingPhase(0);
    const t1 = setTimeout(() => setFindingPhase(1), 700);
    const t2 = setTimeout(() => setFindingPhase(2), 1300);
    const t3 = setTimeout(() => setFindingPhase(3), 1900);
    const t4 = isPreview ? null : setTimeout(() => setScreen('result'), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); if (t4) clearTimeout(t4); };
  }, [screen, initialScreen]);

  const startSearch = () => { setHikeIdx(0); setScreen('finding'); };
  const pickAnother = () => { setHikeIdx(i => i + 1); setScreen('finding'); };
  const rejectCurrent = () => { setRejected(r => [...r, hike.id]); setHikeIdx(i => i + 1); setScreen('finding'); };

  // ── shared root style ────────────────────────────────────────────────
  const root = {
    position: 'relative', width: '100%', height: '100%',
    background: C.paper, color: C.ink,
    fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
    fontFeatureSettings: '"ss01" on, "ss02" on, "tnum" on',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontVariationSettings: '"wdth" 100',
  };

  // ── Small components scoped to the app ───────────────────────────────
  function SectionLabel({ num, label, right }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        marginTop: 18, marginBottom: 10,
      }}>
        <span style={{
          fontFamily: 'ui-monospace, SF Mono, monospace', fontSize: 10.5, fontWeight: 600,
          color: C.vermillion, letterSpacing: 0.6,
        }}>{String(num).padStart(2, '0')}</span>
        <span style={{
          height: 1, background: C.hairline, flex: '0 0 14px', alignSelf: 'center',
        }} />
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 0.9,
          textTransform: 'uppercase', color: C.ink,
        }}>{label}</span>
        {right && <span style={{ marginLeft: 'auto', fontSize: 11, color: C.graphite, fontVariantNumeric: 'tabular-nums' }}>{right}</span>}
      </div>
    );
  }

  function PrimaryCTA({ children, onClick, accent = false, height = 56, big = false }) {
    const bg = accent ? C.vermillion : C.ink;
    const fg = accent ? C.vermillionInk : C.paper;
    return (
      <button onClick={onClick} className="ta-tap" style={{
        height, width: '100%', border: 0,
        borderRadius: platform === 'android' ? 10 : 6,
        background: bg, color: fg,
        fontFamily: 'inherit', fontSize: big ? 17 : 15.5,
        fontWeight: 600, letterSpacing: -0.1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: 'pointer',
        boxShadow: platform === 'android' ? `0 2px 6px ${C.vermillionEdge}` : 'none',
      }}>{children}</button>
    );
  }

  function GhostCTA({ children, onClick, height = 50 }) {
    return (
      <button onClick={onClick} className="ta-tap" style={{
        height, width: '100%',
        border: `1px solid ${C.hairline}`,
        borderRadius: platform === 'android' ? 8 : 5,
        background: 'transparent', color: C.ink,
        fontFamily: 'inherit', fontSize: 14.5, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer',
      }}>{children}</button>
    );
  }

  // ── WELCOME ──────────────────────────────────────────────────────────
  function Welcome() {
    return (
      <div className="trail-app" style={root}>
        {/* Hero topo map */}
        <div style={{ position: 'relative', height: '54%', flexShrink: 0 }}>
          <TopoMap palette={C} hike={hike} drawOn={true} height="100%" />
          {/* Top row */}
          <div style={{
            position: 'absolute', top: statusH - 18, left: 22, right: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Wordmark C={C} size={20} />
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', background: C.snow, borderRadius: 4,
              border: `1px solid ${C.hairline}`,
              fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 600,
              letterSpacing: 0.5, color: C.graphite,
            }}>
              <span style={{ color: C.vermillion }}>●</span> N 62.47° · Ø 6.15°
            </div>
          </div>
          {/* Bottom edge fade */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -1, height: 80,
            background: `linear-gradient(to bottom, transparent, ${C.paper})`,
          }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '4px 22px 0', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
          {/* Section breadcrumb */}
          <div className="trail-fade-up" style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 600,
            color: C.vermillion, letterSpacing: 1, marginBottom: 10,
          }}>NÆRTUR · MØRE OG ROMSDAL · MVP</div>

          <h1 className="trail-fade-up" style={{
            margin: 0, fontSize: 44, lineHeight: 0.95, letterSpacing: -1.6,
            fontWeight: 700, textWrap: 'balance',
            animationDelay: '60ms',
          }}>{lang === 'no' ? 'Én tapp.\nÉn tur. ' : 'One tap.\nOne hike. '}<span style={{
            color: C.vermillion, fontStyle: 'italic',
            fontFamily: '"Newsreader", serif', fontWeight: 500, letterSpacing: -1,
          }}>{lang === 'no' ? 'I dag.' : 'Today.'}</span></h1>

          <p className="trail-fade-up" style={{
            margin: '14px 0 0', color: C.graphite, fontSize: 15, lineHeight: 1.5,
            maxWidth: 320, animationDelay: '140ms',
          }}>{L.welcomeSub}</p>

          <div style={{ flex: 1 }} />

          {/* Stat strip — gives the welcome a "field guide" feel */}
          <div className="trail-fade-up" style={{
            display: 'flex', borderTop: `1px solid ${C.hairline}`,
            borderBottom: `1px solid ${C.hairline}`,
            margin: '20px 0 16px', padding: '10px 0',
            animationDelay: '220ms',
          }}>
            <FactCell C={C} label={lang === 'no' ? 'TURER' : 'HIKES'} value="124" />
            <FactCell C={C} label={lang === 'no' ? 'SESONG' : 'SEASON'} value={lang === 'no' ? 'Åpen' : 'Open'} />
            <FactCell C={C} label={lang === 'no' ? 'VARSEL' : 'ALERT'} value="0" last />
          </div>

          {/* CTAs */}
          <div className="trail-fade-up" style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            paddingBottom: bottomH + 14, animationDelay: '300ms',
          }}>
            <PrimaryCTA accent={true} big={true} onClick={() => setScreen('filters')}>
              <Icon name="location" size={18} color={C.vermillionInk} />
              {L.useLocation}
            </PrimaryCTA>
            <GhostCTA onClick={() => setScreen('filters')}>
              {L.chooseTown}
            </GhostCTA>
            <div style={{ textAlign: 'center', fontSize: 11.5, color: C.sub, marginTop: 4, letterSpacing: 0.2 }}>
              {L.privacy}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FILTERS ──────────────────────────────────────────────────────────
  function Filters() {
    const togTag = (id) => setTags(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const togDiff = (id) => setDifficulty(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    return (
      <div className="trail-app" style={root}>
        {/* Header */}
        <div style={{
          padding: `${statusH - 14}px 20px 14px`,
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: `1px solid ${C.hairline}`, background: C.paper,
        }}>
          <button onClick={() => setScreen('welcome')} className="ta-tap" style={iconBox(C)}>
            <Icon name="arrowL" size={18} color={C.ink} strokeWidth={1.7} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9.5, fontWeight: 600,
              color: C.vermillion, letterSpacing: 1 }}>SØKEPARAMETRE</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 2 }}>
              {L.filters}
            </div>
          </div>
          <div style={{
            padding: '5px 10px', background: C.snow, borderRadius: 4,
            border: `1px solid ${C.hairline}`,
            fontSize: 12, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <Icon name="location" size={11} color={C.vermillion} strokeWidth={2} />
            {location.label}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
          {/* 01 Difficulty */}
          <SectionLabel num={1} label={L.difficulty} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['easy', 'medium', 'hard'].map(lv => {
              const active = difficulty.includes(lv);
              return (
                <button key={lv} onClick={() => togDiff(lv)} className="ta-tap" style={diffTile(C, active, platform)}>
                  <DifficultyGlyph level={lv} color={active ? C.vermillionInk : C.ink} soft={active ? 'rgba(255,255,255,0.3)' : C.hairline} />
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>
                    {lv === 'easy' ? L.easy : lv === 'medium' ? L.medium : L.hard}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 02 Length */}
          <SectionLabel num={2} label={L.length} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { id: 'under_5km', label: L.under5, sub: '<5' },
              { id: '5_10km', label: L.fiveTen, sub: '5–10' },
              { id: '10km_plus', label: L.tenPlus, sub: '10+' },
            ].map(o => {
              const active = length === o.id;
              return (
                <button key={o.id} onClick={() => setLength(active ? null : o.id)} className="ta-tap" style={lenTile(C, active, platform)}>
                  <div style={{ fontFamily: '"Bricolage Grotesque"', fontSize: 22, fontWeight: 700, letterSpacing: -0.8,
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{o.sub}</div>
                  <div style={{ fontSize: 11, color: active ? 'rgba(250,248,242,0.7)' : C.graphite, marginTop: 4, letterSpacing: 0.2, fontWeight: 500 }}>km</div>
                </button>
              );
            })}
          </div>

          {/* 03 Transport */}
          <SectionLabel num={3} label={L.transport} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { id: 'car', label: L.car, icon: 'car' },
              { id: 'public_transport', label: L.publicTransport, icon: 'bus' },
              { id: 'walk', label: L.walk, icon: 'foot' },
            ].map(o => {
              const active = transport === o.id;
              return (
                <button key={o.id} onClick={() => setTransport(o.id)} className="ta-tap" style={transportTile(C, active, platform)}>
                  <Icon name={o.icon} size={18} color={active ? C.vermillionInk : C.ink} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{o.label}</span>
                </button>
              );
            })}
          </div>

          {/* 04 Max travel */}
          <SectionLabel num={4} label={L.maxTravel} right={`${maxTravel} ${L.minutes}`} />
          <div style={{ position: 'relative', padding: '4px 0 0' }}>
            <input type="range" min="15" max="120" step="5" value={maxTravel}
              onChange={e => setMaxTravel(+e.target.value)}
              className="trail-range"
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'ui-monospace, monospace',
              fontSize: 10, color: C.sub, marginTop: 6, letterSpacing: 0.4 }}>
              <span>15</span><span>30</span><span>60</span><span>90</span><span>120</span>
            </div>
          </div>

          {/* 05 Tags */}
          <SectionLabel num={5} label={L.tagsLabel} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {window.TAGS.map(tag => {
              const active = tags.includes(tag.id);
              return (
                <button key={tag.id} onClick={() => togTag(tag.id)} className="ta-tap" style={tagChip(C, active, platform)}>
                  <Icon name={tag.icon} size={14} color={active ? C.vermillionInk : C.graphite} strokeWidth={1.8} />
                  <span>{lang === 'no' ? tag.no : tag.en}</span>
                </button>
              );
            })}
          </div>

          {/* 06 Avoid */}
          <SectionLabel num={6} label={L.avoid} />
          <button onClick={() => setAvoid(a => a.includes('steep') ? a.filter(x => x !== 'steep') : [...a, 'steep'])}
            className="ta-tap" style={tagChip(C, avoid.includes('steep'), platform)}>
            <Icon name="elev" size={14} color={avoid.includes('steep') ? C.vermillionInk : C.graphite} strokeWidth={1.8} />
            <span>{L.avoidSteep}</span>
          </button>

          <div style={{ height: 90 }} />
        </div>

        {/* Sticky CTA */}
        <div style={{
          padding: `14px 20px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.paper} 70%, transparent)`,
          borderTop: `1px solid ${C.hairline}`,
        }}>
          <button onClick={startSearch} className="ta-tap" style={{
            height: 58, width: '100%', border: 0,
            borderRadius: platform === 'android' ? 10 : 6,
            background: C.vermillion, color: C.vermillionInk,
            fontFamily: 'inherit', fontSize: 16, fontWeight: 600, letterSpacing: -0.2,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', cursor: 'pointer',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Icon name="compass" size={18} color={C.vermillionInk} strokeWidth={1.8} />
              {L.findHike}
            </span>
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600,
              opacity: 0.85, letterSpacing: 0.5,
              padding: '4px 8px', background: 'rgba(250,248,242,0.18)',
              borderRadius: 4,
            }}>{String(candidates.length).padStart(2, '0')} {lang === 'no' ? 'KANDIDATER' : 'CANDIDATES'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── FINDING ──────────────────────────────────────────────────────────
  function Finding() {
    const items = [
      { k: 'loc', label: L.locOk },
      { k: 'season', label: L.seasonOk },
      { k: 'weather', label: L.weatherOk },
      { k: 'pick', label: lang === 'no' ? 'Velger tur' : 'Picking hike' },
    ];
    return (
      <div className="trail-app" style={root}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <TopoMap palette={C} hike={hike} drawOn={false} height="100%" mode="bg" showTrail={false} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at center, ${C.paper}d4, ${C.paper})`,
          }} />
        </div>
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Pulsing rings + trailhead triangle */}
          <div style={{ position: 'relative', width: 140, height: 140, display: 'flex',
            alignItems: 'center', justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                border: `1.5px solid ${C.vermillion}`,
                animation: `trail-ring-pulse 2400ms ${i * 800}ms cubic-bezier(.3,.6,.6,1) infinite`,
              }} />
            ))}
            {/* Static center cross */}
            <div style={{
              width: 50, height: 50, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                position: 'absolute', width: 1, height: 32, background: C.vermillion,
              }} />
              <div style={{
                position: 'absolute', width: 32, height: 1, background: C.vermillion,
              }} />
              <svg width="20" height="20" viewBox="0 0 20 20">
                <polygon points="10,2 18,17 2,17" fill={C.vermillion} stroke={C.paper} strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div style={{ marginTop: 40, textAlign: 'center', maxWidth: 280 }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 600,
              color: C.vermillion, letterSpacing: 1.2, marginBottom: 10 }}>
              {lang === 'no' ? 'SØKER' : 'SEARCHING'} · {String(Math.min(findingPhase + 1, 4))}/04
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.05 }}>
              {L.finding}<span style={{ color: C.vermillion }}>.</span>
            </div>
            <div style={{ marginTop: 10, color: C.graphite, fontSize: 14, lineHeight: 1.45 }}>
              {L.findingSub}
            </div>
          </div>

          {/* Checklist as horizontal strip */}
          <div style={{ marginTop: 28, width: '100%', maxWidth: 320,
            display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((line, i) => {
              const done = findingPhase > i;
              const active = findingPhase === i;
              return (
                <div key={line.k} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: done || active ? C.snow : 'transparent',
                  border: `1px solid ${done || active ? C.hairline : 'transparent'}`,
                  opacity: done ? 1 : active ? 1 : 0.4,
                  transition: 'background 320ms, opacity 320ms, border-color 320ms',
                  borderRadius: 6,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: done ? C.vermillion : 'transparent',
                    border: done ? 'none' : `1.5px solid ${active ? C.vermillion : C.graphite}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 220ms, border 220ms',
                    position: 'relative',
                  }}>
                    {done && <Icon name="check" size={11} color={C.vermillionInk} strokeWidth={2.6} />}
                    {active && !done && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.vermillion,
                        animation: 'trail-fade-in 1s ease-in-out infinite alternate' }} />
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: done ? 500 : 400,
                    color: done ? C.ink : C.graphite }}>{line.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────
  function Result() {
    const safety = hike.safety;
    const sLabel = safety === 'recommended_today' ? L.recommended
                 : safety === 'check_conditions' ? L.checkConditions : L.notRecommended;
    const sColor = safety === 'recommended_today' ? C.good
                 : safety === 'check_conditions' ? C.caution : C.danger;
    const sTint  = safety === 'recommended_today' ? C.goodTint
                 : safety === 'check_conditions' ? C.cautionTint : C.dangerTint;

    // count-up numbers (reset on hike change)
    const km = useCountUp(hike.distanceMeters / 1000, 700, [hike.id]);
    const asc = useCountUp(hike.ascentMeters, 700, [hike.id]);
    const dur = useCountUp(hike.durationMinutes, 700, [hike.id]);
    const trv = useCountUp(hike.travelMinutes, 700, [hike.id]);

    return (
      <div className="trail-app" style={root} key={hike.id}>
        {/* Topo hero */}
        <div style={{ position: 'relative', height: 270, flexShrink: 0, borderBottom: `1px solid ${C.hairline}` }}>
          <TopoMap palette={C} hike={hike} drawOn={true} height="100%" />
          {/* Top bar */}
          <div style={{
            position: 'absolute', top: statusH - 16, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3,
          }}>
            <button onClick={() => setScreen('filters')} className="ta-tap" style={floatBtn(C)}>
              <Icon name="arrowL" size={17} color={C.ink} strokeWidth={1.8} />
            </button>
            <div style={{
              padding: '6px 11px', background: C.snow, borderRadius: 4,
              border: `1px solid ${C.hairline}`,
              fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600,
              letterSpacing: 0.5, color: C.ink,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: C.vermillion }}>●</span> {hike.id.toUpperCase().replace('-', ' / ')}
            </div>
            <button className="ta-tap" style={floatBtn(C)}>
              <Icon name="map" size={17} color={C.ink} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Safety strip — full-bleed, editorial */}
        <div className="trail-fade-in" style={{
          padding: '11px 20px',
          background: sTint,
          borderBottom: `1px solid ${C.hairline}`,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13.5,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: sColor,
            boxShadow: `0 0 0 4px ${sTint}`,
          }} />
          <span style={{ fontWeight: 700, color: sColor, letterSpacing: -0.1 }}>{sLabel}</span>
          <span style={{ color: C.graphite, fontSize: 12.5 }}>· {L.advisoryShort}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace',
            fontSize: 10, fontWeight: 600, color: C.graphite, letterSpacing: 0.4 }}>
            {todayStamp(lang)}
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 0' }}>
          {/* Title block */}
          <div className="trail-fade-up">
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 600,
              letterSpacing: 1.2, color: C.vermillion }}>
              {(lang === 'no' ? 'ANBEFALT TUR · ' : 'YOUR HIKE · ') + (hike.municipality || '').toUpperCase()}
            </div>
            <h1 style={{
              margin: '6px 0 0', fontSize: 38, lineHeight: 0.96, letterSpacing: -1.4,
              fontWeight: 700, textWrap: 'balance',
            }}>{hike.name}</h1>
            <div style={{ marginTop: 8, color: C.graphite, fontSize: 14, fontWeight: 500 }}>
              {hike.municipality} kommune · Møre og Romsdal
            </div>
          </div>

          {/* Stats — legend-style row */}
          <div className="trail-fade-up" style={{
            marginTop: 18, padding: '14px 0',
            borderTop: `1px solid ${C.hairline}`, borderBottom: `1px solid ${C.hairline}`,
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4,
            animationDelay: '80ms',
          }}>
            <StatBlock C={C} kind="len" label={L.distance} value={km.toFixed(1).replace('.', ',')} unit="km" />
            <StatBlock C={C} kind="asc" label={L.ascent} value={Math.round(asc)} unit="m" />
            <StatBlock C={C} kind="dur" label={L.duration} value={fmtMinShort(Math.round(dur), lang)} unit="" />
            <StatBlock C={C} kind="trv" label={L.travel} value={Math.round(trv)} unit="min" last />
          </div>

          {/* Why this hike — numbered editorial list */}
          <div className="trail-fade-up" style={{ marginTop: 22, animationDelay: '180ms' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 600,
                color: C.vermillion, letterSpacing: 0.6 }}>×{hike.matchReasons.length}</span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.9,
                textTransform: 'uppercase', color: C.ink }}>{L.whyThis}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {hike.matchReasons.map((r, i) => (
                <div key={r} style={{
                  display: 'flex', alignItems: 'baseline', gap: 12,
                  padding: '10px 0', borderTop: i > 0 ? `1px solid ${C.hairlineSoft}` : 'none',
                }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11,
                    fontWeight: 600, color: C.vermillion, letterSpacing: 0.4,
                    width: 22, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.ink, lineHeight: 1.4 }}>
                    {reasonLabel(r, L, hike)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags as small flag-style chips */}
          <div className="trail-fade-up" style={{ marginTop: 18, animationDelay: '240ms' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {hike.tags.map(t => {
                const tagDef = window.TAGS.find(x => x.id === t);
                if (!tagDef) return null;
                return (
                  <span key={t} style={{
                    padding: '4px 9px', borderRadius: 3,
                    border: `1px solid ${C.hairline}`, background: C.snow,
                    fontFamily: 'ui-monospace, monospace', fontSize: 10.5, fontWeight: 600,
                    letterSpacing: 0.4, color: C.graphite, textTransform: 'uppercase',
                  }}>{lang === 'no' ? tagDef.no : tagDef.en}</span>
                );
              })}
            </div>
          </div>

          {/* More info row */}
          <button onClick={() => setScreen('detail')} className="ta-tap ta-card-tap" style={{
            marginTop: 18, padding: '14px 16px', width: '100%',
            background: C.snow, border: `1px solid ${C.hairline}`, borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 12,
            color: C.ink, fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 600,
              color: C.vermillion, letterSpacing: 0.5 }}>↗</span>
            <span style={{ flex: 1 }}>{L.moreInfo}</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10,
              color: C.sub, letterSpacing: 0.4 }}>{lang === 'no' ? 'BESKRIVELSE · KART · SESONG' : 'DESCRIPTION · MAP · SEASON'}</span>
          </button>

          <div style={{ height: 140 }} />
        </div>

        {/* Sticky actions */}
        <div style={{
          padding: `12px 20px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.paper} 70%, transparent)`,
          borderTop: `1px solid ${C.hairline}`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <PrimaryCTA accent={true} big={true} height={58}>
            <Icon name="flag" size={18} color={C.vermillionInk} strokeWidth={1.8} />
            {L.startHike}
            <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace',
              fontSize: 11, opacity: 0.85, letterSpacing: 0.4,
              padding: '3px 8px', background: 'rgba(250,248,242,0.18)', borderRadius: 4 }}>
              ↗ {hike.travelMinutes} {L.minutes}
            </span>
          </PrimaryCTA>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={pickAnother} className="ta-tap" style={smallGhost(C, platform)}>
              <Icon name="refresh" size={15} color={C.ink} strokeWidth={1.8} />
              {L.anotherOne}
            </button>
            <button onClick={rejectCurrent} className="ta-tap" style={smallGhost(C, platform)}>
              <Icon name="close" size={15} color={C.ink} strokeWidth={2} />
              {L.notMine}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAIL ───────────────────────────────────────────────────────────
  function Detail() {
    const monthsNo = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
    const monthsEn = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const months = lang === 'no' ? monthsNo : monthsEn;
    return (
      <div className="trail-app" style={root}>
        <div style={{ position: 'relative', height: 200, flexShrink: 0, borderBottom: `1px solid ${C.hairline}` }}>
          <TopoMap palette={C} hike={hike} drawOn={true} height="100%" />
          <div style={{
            position: 'absolute', top: statusH - 16, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3,
          }}>
            <button onClick={() => setScreen('result')} className="ta-tap" style={floatBtn(C)}>
              <Icon name="arrowL" size={17} color={C.ink} strokeWidth={1.8} />
            </button>
            <div style={{
              padding: '6px 11px', background: C.snow, borderRadius: 4,
              border: `1px solid ${C.hairline}`, fontSize: 12.5, fontWeight: 600,
              letterSpacing: -0.2,
            }}>{hike.name}</div>
            <button className="ta-tap" style={floatBtn(C)}>
              <Icon name="map" size={17} color={C.ink} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px' }}>
          {/* Description */}
          <SectionLabel num={1} label={L.description} />
          <p style={{ margin: 0, lineHeight: 1.6, fontSize: 15.5, color: C.ink }}>
            {lang === 'no' ? hike.descNo : hike.descEn}
          </p>

          {/* Elevation profile */}
          <SectionLabel num={2} label={L.elevProfile} right={`${hike.ascentMeters} m ${lang === 'no' ? 'stigning' : 'ascent'}`} />
          <div style={{
            background: C.snow, border: `1px solid ${C.hairline}`,
            padding: 16, position: 'relative',
          }}>
            <svg viewBox="0 0 320 100" width="100%" height="100" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`elev-${hike.id}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={C.vermillion} stopOpacity="0.18" />
                  <stop offset="1" stopColor={C.vermillion} stopOpacity="0" />
                </linearGradient>
              </defs>
              <g stroke={C.hairline} strokeWidth="0.5">
                <line x1="0" y1="25" x2="320" y2="25" />
                <line x1="0" y1="50" x2="320" y2="50" />
                <line x1="0" y1="75" x2="320" y2="75" />
              </g>
              <path d="M0 88 L40 75 L80 60 L130 38 L180 22 L220 35 L260 50 L300 70 L320 80 L320 100 L0 100 Z"
                fill={`url(#elev-${hike.id})`} />
              <path d="M0 88 L40 75 L80 60 L130 38 L180 22 L220 35 L260 50 L300 70 L320 80"
                fill="none" stroke={C.vermillion} strokeWidth="1.8" strokeLinejoin="round"
                style={{
                  strokeDasharray: 700, strokeDashoffset: 700,
                  animation: 'trail-draw 1200ms 200ms cubic-bezier(.4,.1,.3,1) forwards',
                }} />
              {/* summit marker */}
              <circle cx="180" cy="22" r="3" fill={C.vermillion} />
              <line x1="180" y1="22" x2="180" y2="6" stroke={C.vermillion} strokeWidth="1" strokeDasharray="2 2" />
              <text x="180" y="4" fontSize="9" fill={C.ink} textAnchor="middle"
                fontFamily="'Bricolage Grotesque'" fontWeight="600">▲ {hike.ascentMeters}m</text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              marginTop: 6, fontFamily: 'ui-monospace, monospace',
              fontSize: 9.5, color: C.sub, letterSpacing: 0.5 }}>
              <span>0 KM</span><span style={{ color: C.vermillion }}>SUMMIT</span><span>{(hike.distanceMeters/1000).toFixed(1).replace('.', ',')} KM</span>
            </div>
          </div>

          {/* Trailhead / map */}
          <SectionLabel num={3} label={L.trailhead} />
          <div style={{
            border: `1px solid ${C.hairline}`, height: 140,
            position: 'relative', overflow: 'hidden', background: C.snow,
          }}>
            <TopoMap palette={C} hike={hike} drawOn={false} height={140} mode="bg" />
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              padding: 12, background: `linear-gradient(to top, ${C.snow}f0, transparent)`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            }}>
              <div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9.5,
                  fontWeight: 600, color: C.vermillion, letterSpacing: 0.6 }}>{L.parking.toUpperCase()}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                  {lang === 'no' ? hike.parkingNo : hike.parkingEn}
                </div>
              </div>
              <button style={{
                padding: '7px 12px', border: `1px solid ${C.hairline}`,
                background: C.card, borderRadius: 4, fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                ↗ {L.openInMaps}
              </button>
            </div>
          </div>

          {/* Season */}
          <SectionLabel num={4} label={L.season} />
          <div style={{ display: 'flex', gap: 2 }}>
            {months.map((m, i) => {
              const open = hike.seasonMonths.includes(i + 1);
              return (
                <div key={m} style={{
                  flex: 1, padding: '10px 0 7px', textAlign: 'center',
                  background: open ? C.vermillion : C.snow,
                  color: open ? C.vermillionInk : C.sub,
                  fontFamily: 'ui-monospace, monospace', fontSize: 9.5, fontWeight: 600,
                  letterSpacing: 0.6, textTransform: 'uppercase',
                  border: `1px solid ${open ? C.vermillion : C.hairline}`,
                }}>{m}</div>
              );
            })}
          </div>

          {/* Safety details */}
          <SectionLabel num={5} label={L.safety} />
          <div style={{ border: `1px solid ${C.hairline}`, background: C.snow }}>
            {Object.entries(L.safetyDetails).map(([k, v], i, arr) => (
              <div key={k} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px',
                borderTop: i > 0 ? `1px solid ${C.hairlineSoft}` : 'none',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: C.good, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="check" size={11} color={C.vermillionInk} strokeWidth={2.8} />
                </span>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 8, padding: '10px 0', fontSize: 12, color: C.sub, lineHeight: 1.45,
            borderTop: `1px dashed ${C.hairline}`,
          }}>{L.safetyNote}</div>

          {/* Source — small editorial footnote */}
          <div style={{
            marginTop: 16, padding: '11px 14px',
            background: C.snow, border: `1px solid ${C.hairline}`,
            fontSize: 12, color: C.graphite,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 600,
              color: C.vermillion, letterSpacing: 0.5 }}>SRC →</span>
            <span style={{ color: C.ink, fontWeight: 500 }}>{hike.sourceUrl}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── router ───────────────────────────────────────────────────────────
  if (screen === 'welcome') return <Welcome />;
  if (screen === 'filters') return <Filters />;
  if (screen === 'finding') return <Finding />;
  if (screen === 'result')  return <Result />;
  if (screen === 'detail')  return <Detail />;
  return null;
}

// ── Sub-components & helpers ────────────────────────────────────────────
function Wordmark({ C, size = 22 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 24 24">
        <polygon points="2,20 9,7 13,14 16,9 22,20" fill={C.ink} />
        <polygon points="9,7 12,12 6,12" fill={C.vermillion} />
      </svg>
      <span style={{
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontWeight: 700, fontSize: size, letterSpacing: -0.8, color: C.ink, lineHeight: 1,
        fontVariationSettings: '"wdth" 90',
      }}>NÆRTUR</span>
    </span>
  );
}

function FactCell({ C, label, value, last }) {
  return (
    <div style={{
      flex: 1, padding: '2px 0 0', borderRight: last ? 'none' : `1px solid ${C.hairlineSoft}`,
      textAlign: 'left', paddingLeft: 2,
    }}>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 9, fontWeight: 600,
        color: C.sub, letterSpacing: 0.7,
      }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, marginTop: 2,
        fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function StatBlock({ C, kind, label, value, unit, last }) {
  return (
    <div style={{
      padding: '0 10px', borderRight: last ? 'none' : `1px solid ${C.hairlineSoft}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'ui-monospace, monospace', fontSize: 9.5, fontWeight: 600,
        color: C.graphite, letterSpacing: 0.6, marginBottom: 6,
      }}>
        <StatIcon kind={kind} size={11} color={C.vermillion} />
        <span style={{ textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums', color: C.ink,
      }}>
        {value}{unit && <span style={{ fontSize: 12, fontWeight: 500, color: C.graphite, marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Style factories ─────────────────────────────────────────────────────
function iconBox(C) {
  return {
    width: 36, height: 36, borderRadius: 5,
    background: C.snow, border: `1px solid ${C.hairline}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, color: C.ink,
  };
}

function floatBtn(C) {
  return {
    width: 36, height: 36, borderRadius: 5,
    background: C.snow, border: `1px solid ${C.hairline}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: C.ink,
    boxShadow: '0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)',
  };
}

function diffTile(C, active, platform) {
  return {
    padding: '14px 10px', borderRadius: platform === 'android' ? 8 : 5,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7,
    cursor: 'pointer', transition: 'background 160ms, color 160ms, border-color 160ms',
    textAlign: 'left',
  };
}

function lenTile(C, active, platform) {
  return {
    padding: '16px 12px', borderRadius: platform === 'android' ? 8 : 5,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    cursor: 'pointer', transition: 'background 160ms, color 160ms, border-color 160ms',
  };
}

function transportTile(C, active, platform) {
  return {
    padding: '14px 8px', borderRadius: platform === 'android' ? 8 : 5,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    cursor: 'pointer', transition: 'background 160ms, color 160ms, border-color 160ms',
  };
}

function tagChip(C, active, platform) {
  return {
    padding: '7px 11px', borderRadius: platform === 'android' ? 100 : 4,
    background: active ? C.vermillion : C.snow,
    color: active ? C.vermillionInk : C.ink,
    border: `1px solid ${active ? C.vermillion : C.hairline}`,
    fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    cursor: 'pointer', transition: 'background 160ms, color 160ms, border-color 160ms',
  };
}

function smallGhost(C, platform) {
  return {
    flex: 1, height: 46, borderRadius: platform === 'android' ? 8 : 5,
    background: C.snow, color: C.ink,
    border: `1px solid ${C.hairline}`,
    fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    cursor: 'pointer',
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────
function fmtMinShort(m, lang) {
  if (m < 60) return m;
  const h = Math.floor(m / 60), r = m % 60;
  return r === 0 ? `${h}t` : `${h}t${r}`;
}

function reasonLabel(r, L, h) {
  return ({
    easy_enough:   L.matchEasy,
    loop:          L.matchLoop,
    view:          L.matchView,
    within_travel: `${h.travelMinutes} ${L.minutes} ${L.matchTravel}`,
    forest:        L.matchForest,
    transport_ok:  L.matchTransport,
    child:         L.matchChild,
    water:         'By water',
  }[r] || r);
}

function todayStamp(lang) {
  const d = new Date();
  const m = (lang === 'no'
    ? ['JAN','FEB','MAR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DES']
    : ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  )[d.getMonth()];
  return `${String(d.getDate()).padStart(2, '0')} ${m} · 14:32`;
}

// ── Range slider style — global so this file ships its own thumb ────────
if (typeof document !== 'undefined' && !document.getElementById('trail-range-css')) {
  const s = document.createElement('style');
  s.id = 'trail-range-css';
  s.textContent = `
    .trail-range { -webkit-appearance: none; appearance: none; background: transparent; height: 28px; cursor: pointer; }
    .trail-range::-webkit-slider-runnable-track {
      height: 2px; background: currentColor; opacity: .18; border-radius: 2px;
    }
    .trail-range::-moz-range-track { height: 2px; background: currentColor; opacity: .18; border-radius: 2px; }
    .trail-range::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 18px; height: 18px; border-radius: 50%;
      background: #C8242C; border: 2.5px solid #FAF8F2;
      box-shadow: 0 0 0 1px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.18);
      margin-top: -8px;
    }
    .trail-range::-moz-range-thumb {
      width: 18px; height: 18px; border-radius: 50%;
      background: #C8242C; border: 2.5px solid #FAF8F2;
      box-shadow: 0 0 0 1px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.18);
    }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { NaerturApp, TRAIL_PALETTES, TopoMap, Wordmark });
