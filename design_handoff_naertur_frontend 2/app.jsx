// NærTur — main app component
// All screens are inside a single fixed-size phone viewport.
// We share this component across iOS / Android / Web canvases via the
// `platform` prop, which only changes status-bar padding and CTA shape.

const { useState, useEffect, useRef, useMemo } = React;

// ── Brand palettes (consumed by hero scenes + UI) ────────────────────────
const NAERTUR_PALETTES = {
  moss: {
    name: 'Moss',
    ink: '#1A1F1B',
    bg: '#F4EFE6',
    card: '#FFFEFA',
    border: '#E5DFD2',
    muted: '#6B6E63',
    mutedSoft: '#8E9087',
    primary: '#2D3A2E',
    primaryInk: '#F4EFE6',
    accent: '#D86A2E',
    accentInk: '#FFFEFA',
    good: '#3F6B49',
    caution: '#C77E2A',
    danger: '#9A2B3C',
    chip: '#EFE9DC',
    chipActive: '#2D3A2E',
    chipActiveInk: '#F4EFE6',
    // scene colors
    skyTop: '#E8D9B6',
    skyBot: '#F4EFE6',
    sun: '#E8A65A',
    mountFar: '#7C8978',
    mountMid: '#3E4D3F',
    mountShadow: '#1B231C',
    snow: '#F8F4E8',
    water: '#6C8082',
    waterDeep: '#3D5054',
    waterLine: '#E5DFD2',
    shore: '#2D3A2E',
    town: '#1A1F1B',
  },
  mossDark: {
    name: 'Moss Dark',
    ink: '#F2EDDF',
    bg: '#0F1411',
    card: '#1A201B',
    border: '#2A322B',
    muted: '#9AA098',
    mutedSoft: '#6B7269',
    primary: '#D9C896',
    primaryInk: '#0F1411',
    accent: '#E8884A',
    accentInk: '#0F1411',
    good: '#7BB07F',
    caution: '#E0A559',
    danger: '#D87080',
    chip: '#23291F',
    chipActive: '#D9C896',
    chipActiveInk: '#0F1411',
    skyTop: '#1E2823',
    skyBot: '#0F1411',
    sun: '#E8884A',
    mountFar: '#3A463D',
    mountMid: '#1B2520',
    mountShadow: '#070A08',
    snow: '#D9C896',
    water: '#1F2A2A',
    waterDeep: '#0F1614',
    waterLine: '#2A322B',
    shore: '#0A0F0D',
    town: '#0A0F0D',
  },
  fjord: {
    name: 'Fjord',
    ink: '#0F1A22',
    bg: '#EAF0F2',
    card: '#FFFFFF',
    border: '#D5DEE2',
    muted: '#5E6E78',
    mutedSoft: '#8896A0',
    primary: '#0F2A3C',
    primaryInk: '#EAF0F2',
    accent: '#C04E2E',
    accentInk: '#FFFFFF',
    good: '#34766B',
    caution: '#C77E2A',
    danger: '#A6304A',
    chip: '#DDE6E9',
    chipActive: '#0F2A3C',
    chipActiveInk: '#EAF0F2',
    skyTop: '#C7D6DC',
    skyBot: '#EAF0F2',
    sun: '#E8A65A',
    mountFar: '#6E8088',
    mountMid: '#2F4350',
    mountShadow: '#142028',
    snow: '#FFFFFF',
    water: '#3F6470',
    waterDeep: '#1F3540',
    waterLine: '#D5DEE2',
    shore: '#1F3540',
    town: '#0F1A22',
  },
};

// ── App component ───────────────────────────────────────────────────────
function NaerturApp({ platform = 'ios', t, lang, palette, statusH = 60, bottomH = 34, initialScreen = 'welcome' }) {
  const C = palette;
  const L = t;

  // Persistent UI state (lives in a single object so screen transitions don't reset filters)
  const [screen, setScreen] = useState(initialScreen); // welcome | filters | finding | result | detail | rejected
  const [difficulty, setDifficulty] = useState(['easy', 'medium']);
  const [length, setLength] = useState(null);
  const [transport, setTransport] = useState('car');
  const [maxTravel, setMaxTravel] = useState(45);
  const [tags, setTags] = useState(['viewpoint']);
  const [avoid, setAvoid] = useState([]);
  const [location, setLocation] = useState(null); // {label, sub} once granted
  const [hikeIdx, setHikeIdx] = useState(0);
  const [rejected, setRejected] = useState([]);
  const [findingPhase, setFindingPhase] = useState(0);

  // candidate pool — apply (very) lightweight client-side filtering for the demo
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

  // Finding animation — three short phases then jump to result.
  // When this is the artboard's initial screen (preview), we animate the
  // checklist but stay on this screen so the user can see the state.
  useEffect(() => {
    if (screen !== 'finding') return;
    const isPreview = initialScreen === 'finding';
    setFindingPhase(0);
    const t1 = setTimeout(() => setFindingPhase(1), 600);
    const t2 = setTimeout(() => setFindingPhase(2), 1200);
    const t3 = isPreview ? null : setTimeout(() => setScreen('result'), 1850);
    return () => { clearTimeout(t1); clearTimeout(t2); if (t3) clearTimeout(t3); };
  }, [screen, initialScreen]);

  function startSearch() {
    setHikeIdx(0);
    setScreen('finding');
  }

  function pickAnother() {
    setHikeIdx(i => i + 1);
    setScreen('finding');
  }

  function rejectCurrent() {
    setRejected(r => [...r, hike.id]);
    setHikeIdx(i => i + 1);
    setScreen('finding');
  }

  // ── shared styles ──────────────────────────────────────────────────────
  const baseStyle = {
    position: 'relative', width: '100%', height: '100%',
    background: C.bg, color: C.ink,
    fontFamily: '"Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFeatureSettings: '"ss01" on, "ss02" on',
  };

  // ── header (small) ─────────────────────────────────────────────────────
  function MiniHeader({ title, onBack, right }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: `${statusH - 16}px 18px 12px`,
        background: C.bg, position: 'relative', zIndex: 4,
      }}>
        {onBack ? (
          <button onClick={onBack} style={iconBtn(C)}>
            <Icon name="arrowL" size={20} color={C.ink} />
          </button>
        ) : (
          <NaerturMark color={C.ink} peakColor={C.accent} size={20} />
        )}
        <div style={{ flex: 1, fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{title}</div>
        {right}
      </div>
    );
  }

  // ── WELCOME ────────────────────────────────────────────────────────────
  function Welcome() {
    return (
      <div style={baseStyle}>
        {/* Hero scene */}
        <div style={{ height: '52%', position: 'relative', overflow: 'hidden' }}>
          <HikeScene scene="fjord" palette={C} />
          {/* Gradient fade into bg */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -1, height: 110,
            background: `linear-gradient(to bottom, ${hexA(C.bg, 0)}, ${C.bg})`,
          }} />
          {/* Status-bar-safe wordmark */}
          <div style={{
            position: 'absolute', top: statusH - 18, left: 22, right: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <NaerturMark color={C.ink} peakColor={C.accent} size={22} />
            <div style={{
              padding: '5px 10px', borderRadius: 999, background: hexA(C.card, 0.7),
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              fontSize: 12, color: C.muted, letterSpacing: 0.1, whiteSpace: 'nowrap',
            }}>v0.1 · MVP</div>
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: '4px 22px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h1 style={{
            margin: 0, fontSize: 36, lineHeight: 1.02, letterSpacing: -1.2,
            fontWeight: 600, textWrap: 'balance',
          }}>{L.tagline}</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 15.5, lineHeight: 1.45, maxWidth: 320 }}>
            {L.welcomeSub}
          </p>
          {/* Bullet badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge C={C} icon="leaf">{L.aboutLine1}</Badge>
            <Badge C={C} icon="bolt">{L.aboutLine2}</Badge>
          </div>

          <div style={{ flex: 1 }} />

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: bottomH + 14 }}>
            <button onClick={() => {
              setLocation({ label: 'Ålesund', sub: '6,5 km nord' });
              setScreen('filters');
            }} style={primaryBtn(C, platform)}>
              <Icon name="location" size={20} color={C.primaryInk} />
              {L.useLocation}
            </button>
            <button onClick={() => {
              setLocation({ label: 'Volda', sub: 'valgt' });
              setScreen('filters');
            }} style={secondaryBtn(C, platform)}>
              {L.chooseTown}
            </button>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: C.mutedSoft, marginTop: 2 }}>
              {L.privacy}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FILTERS ────────────────────────────────────────────────────────────
  function Filters() {
    const togTag = (id) => setTags(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const togDiff = (id) => setDifficulty(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    return (
      <div style={baseStyle}>
        <MiniHeader title={L.filters} onBack={() => setScreen('welcome')}
          right={
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px 5px 8px', borderRadius: 999,
              background: C.chip, fontSize: 12.5, color: C.muted,
            }}>
              <Icon name="location" size={13} color={C.muted} />
              <span style={{ color: C.ink, fontWeight: 500 }}>{location?.label || 'Ålesund'}</span>
            </div>
          }
        />
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 18px 24px' }}>
          {/* Difficulty */}
          <Section label={L.difficulty} C={C}>
            <Segment C={C} options={[
              { id: 'easy',   label: L.easy,   active: difficulty.includes('easy'),   onClick: () => togDiff('easy') },
              { id: 'medium', label: L.medium, active: difficulty.includes('medium'), onClick: () => togDiff('medium') },
              { id: 'hard',   label: L.hard,   active: difficulty.includes('hard'),   onClick: () => togDiff('hard') },
            ]} />
          </Section>

          {/* Length */}
          <Section label={L.length} C={C}>
            <Segment C={C} options={[
              { id: 'under_5km',  label: L.under5,  active: length === 'under_5km',  onClick: () => setLength(length === 'under_5km' ? null : 'under_5km') },
              { id: '5_10km',    label: L.fiveTen, active: length === '5_10km',    onClick: () => setLength(length === '5_10km' ? null : '5_10km') },
              { id: '10km_plus', label: L.tenPlus, active: length === '10km_plus', onClick: () => setLength(length === '10km_plus' ? null : '10km_plus') },
            ]} />
          </Section>

          {/* Transport */}
          <Section label={L.transport} C={C}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'car', label: L.car, icon: 'car' },
                { id: 'public_transport', label: L.publicTransport, icon: 'bus' },
                { id: 'walk', label: L.walk, icon: 'foot' },
              ].map(o => (
                <button key={o.id} onClick={() => setTransport(o.id)} style={{
                  ...transportBtn(C, transport === o.id),
                }}>
                  <Icon name={o.icon} size={20} color={transport === o.id ? C.chipActiveInk : C.ink} />
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Max travel */}
          <Section label={
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>{L.maxTravel}</span>
              <span style={{ color: C.muted, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                {maxTravel} {L.minutes}
              </span>
            </span>
          } C={C}>
            <input type="range" min="15" max="120" step="5" value={maxTravel}
              onChange={e => setMaxTravel(+e.target.value)}
              style={{ width: '100%', accentColor: C.primary, height: 6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.mutedSoft, marginTop: 2 }}>
              <span>15</span><span>60</span><span>120</span>
            </div>
          </Section>

          {/* Tags */}
          <Section label={L.tagsLabel} C={C}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {window.TAGS.map(tag => {
                const active = tags.includes(tag.id);
                return (
                  <button key={tag.id} onClick={() => togTag(tag.id)} style={tagBtn(C, active)}>
                    <Icon name={tag.icon} size={16} color={active ? C.chipActiveInk : C.ink} />
                    <span>{lang === 'no' ? tag.no : tag.en}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Avoid */}
          <Section label={L.avoid} C={C}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAvoid(a => a.includes('steep') ? a.filter(x => x !== 'steep') : [...a, 'steep'])}
                style={tagBtn(C, avoid.includes('steep'))}>
                <Icon name="elev" size={16} color={avoid.includes('steep') ? C.chipActiveInk : C.ink} />
                <span>{L.avoidSteep}</span>
              </button>
            </div>
          </Section>
        </div>

        {/* Sticky CTA */}
        <div style={{
          padding: `14px 18px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.bg} 60%, ${hexA(C.bg, 0)} 100%)`,
        }}>
          <button onClick={startSearch} style={{ ...primaryBtn(C, platform), height: 56, fontSize: 17 }}>
            <Icon name="compass" size={22} color={C.primaryInk} />
            {L.findHike}
            <span style={{
              marginLeft: 'auto', fontSize: 12, opacity: 0.7, fontVariantNumeric: 'tabular-nums',
            }}>{candidates.length} {lang === 'no' ? 'turer' : 'hikes'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── FINDING ────────────────────────────────────────────────────────────
  function Finding() {
    const lines = [
      { id: 0, t: L.locOk,     icon: 'location' },
      { id: 1, t: L.seasonOk,  icon: 'leaf' },
      { id: 2, t: L.weatherOk, icon: 'sun' },
    ];
    return (
      <div style={{ ...baseStyle, background: C.primary, color: C.primaryInk, alignItems: 'center', justifyContent: 'center' }}>
        {/* Compass-on-paper graphic */}
        <div style={{ position: 'relative', width: 180, height: 180 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1.5px solid ${hexA(C.primaryInk, 0.25)}`,
          }} />
          <div style={{
            position: 'absolute', inset: 14, borderRadius: '50%',
            border: `1px solid ${hexA(C.primaryInk, 0.15)}`,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            animation: 'naertur-spin 3.5s cubic-bezier(.5,.1,.5,.9) infinite',
          }}>
            <svg viewBox="0 0 100 100" width="180" height="180">
              <polygon points="50,16 56,50 50,52 44,50" fill={C.accent} />
              <polygon points="50,84 44,50 50,48 56,50" fill={hexA(C.primaryInk, 0.5)} />
              <circle cx="50" cy="50" r="3" fill={C.primaryInk} />
            </svg>
          </div>
          {/* Cardinals */}
          {['N','Ø','S','V'].map((d, i) => (
            <div key={d} style={{
              position: 'absolute', width: 20, height: 20, top: '50%', left: '50%',
              transform: `translate(-50%,-50%) rotate(${i*90}deg) translateY(-78px) rotate(${-i*90}deg)`,
              fontSize: 11, fontWeight: 600, color: hexA(C.primaryInk, 0.6),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: 0.5,
            }}>{d}</div>
          ))}
        </div>
        <div style={{
          marginTop: 36, fontSize: 24, fontWeight: 600, letterSpacing: -0.6,
        }}>{L.finding}…</div>
        <div style={{ color: hexA(C.primaryInk, 0.65), fontSize: 14, marginTop: 6 }}>{L.findingSub}</div>

        {/* Checklist */}
        <div style={{
          marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10,
          minWidth: 220,
        }}>
          {lines.map((line, i) => {
            const done = findingPhase >= i;
            return (
              <div key={line.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: done ? 1 : 0.3, transition: 'opacity 220ms',
                fontSize: 14,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: done ? C.accent : hexA(C.primaryInk, 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 220ms',
                }}>
                  {done && <Icon name="check" size={14} color={C.accentInk} strokeWidth={2.4} />}
                </div>
                <span>{line.t}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────
  function Result() {
    const safety = hike.safety;
    const safetyLabel = safety === 'recommended_today' ? L.recommended
                      : safety === 'check_conditions' ? L.checkConditions
                      : L.notRecommended;
    const safetyColor = safety === 'recommended_today' ? C.good
                      : safety === 'check_conditions' ? C.caution : C.danger;

    return (
      <div style={baseStyle}>
        {/* Hero with scene */}
        <div style={{ position: 'relative', height: 280, overflow: 'hidden', flexShrink: 0 }}>
          <HikeScene scene={hike.scene} palette={C} />
          {/* status-bar safe overlay row */}
          <div style={{
            position: 'absolute', top: statusH - 16, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3,
          }}>
            <button onClick={() => setScreen('filters')} style={glassBtn(C)}>
              <Icon name="arrowL" size={18} color={C.ink} />
            </button>
            <div style={{
              ...glassPill(C),
              fontSize: 12.5, padding: '6px 12px', fontWeight: 500,
            }}>
              <Icon name="location" size={13} color={C.ink} />
              {location?.label || 'Ålesund'} · {hike.travelMinutes} {L.minutes}
            </div>
            <button style={glassBtn(C)}>
              <Icon name="map" size={18} color={C.ink} />
            </button>
          </div>
          {/* fade */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -1, height: 90,
            background: `linear-gradient(to bottom, ${hexA(C.bg, 0)}, ${C.bg})`,
            zIndex: 2,
          }} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 18px', marginTop: -32, position: 'relative', zIndex: 3 }}>
          {/* Title block */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <h1 style={{
              margin: 0, fontSize: 34, lineHeight: 1.04, letterSpacing: -1,
              fontWeight: 600, textWrap: 'balance',
            }}>{hike.name}</h1>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: C.muted, fontSize: 14, marginTop: 4,
          }}>
            <Icon name="location" size={14} color={C.muted} />
            {hike.municipality} · {L.counties['Møre og Romsdal']}
          </div>

          {/* Safety pill */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 12px 6px 10px', borderRadius: 999,
              background: hexA(safetyColor, 0.13), color: safetyColor,
              fontSize: 13.5, fontWeight: 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: safetyColor }} />
              {safetyLabel}
            </div>
            <span style={{ fontSize: 12.5, color: C.mutedSoft }}>{L.advisoryShort}</span>
          </div>

          {/* Stats card */}
          <div style={{
            marginTop: 18, background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 18, padding: '16px 4px', display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
          }}>
            <Stat C={C} label={L.distance}>{(hike.distanceMeters/1000).toFixed(1).replace('.', ',')}<small> km</small></Stat>
            <Stat C={C} label={L.ascent}>{hike.ascentMeters}<small> m</small></Stat>
            <Stat C={C} label={L.duration}>{fmtDur(hike.durationMinutes, lang)}</Stat>
            <Stat C={C} label={L.travel} last>{hike.travelMinutes}<small> {L.minutes}</small></Stat>
          </div>

          {/* Why this hike */}
          <div style={{
            marginTop: 18, padding: '14px 16px',
            background: hexA(C.accent, 0.08),
            border: `1px solid ${hexA(C.accent, 0.18)}`,
            borderRadius: 18,
          }}>
            <div style={{
              fontSize: 11, letterSpacing: 0.8, fontWeight: 600,
              color: C.accent, textTransform: 'uppercase', marginBottom: 8,
            }}>{L.whyThis}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hike.matchReasons.map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <Icon name={reasonIcon(r)} size={15} color={C.accent} />
                  <span>{reasonLabel(r, L, hike)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {hike.tags.map(tag => {
              const tagDef = window.TAGS.find(x => x.id === tag);
              if (!tagDef) return null;
              return (
                <span key={tag} style={{
                  padding: '5px 11px 5px 9px', borderRadius: 999,
                  background: C.chip, fontSize: 12.5,
                  display: 'inline-flex', alignItems: 'center', gap: 5, color: C.ink,
                }}>
                  <Icon name={tagDef.icon} size={13} color={C.muted} />
                  {lang === 'no' ? tagDef.no : tagDef.en}
                </span>
              );
            })}
          </div>

          {/* More info link */}
          <button onClick={() => setScreen('detail')} style={{
            marginTop: 16, marginBottom: 14, padding: '14px 16px', width: '100%',
            background: 'transparent', border: `1px dashed ${C.border}`, borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 10,
            color: C.ink, fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <Icon name="info" size={18} color={C.muted} />
            <span>{L.moreInfo}</span>
            <Icon name="chevron" size={16} color={C.muted} />
          </button>

          <div style={{ height: 130 }} />
        </div>

        {/* Sticky actions */}
        <div style={{
          padding: `12px 18px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.bg} 70%, ${hexA(C.bg, 0)} 100%)`,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <button style={{ ...primaryBtn(C, platform), height: 56, fontSize: 17, background: C.accent, color: C.accentInk }}>
            <Icon name="flag" size={20} color={C.accentInk} />
            {L.startHike}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={pickAnother} style={{ ...secondaryBtn(C, platform), flex: 1, height: 48 }}>
              <Icon name="refresh" size={17} color={C.ink} />
              {L.anotherOne}
            </button>
            <button onClick={rejectCurrent} style={{ ...secondaryBtn(C, platform), flex: 1, height: 48 }}>
              <Icon name="thumbDown" size={17} color={C.ink} />
              {L.notMine}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAIL ─────────────────────────────────────────────────────────────
  function Detail() {
    const monthsNo = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
    const monthsEn = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const months = lang === 'no' ? monthsNo : monthsEn;
    return (
      <div style={baseStyle}>
        <div style={{ position: 'relative', height: 200, overflow: 'hidden', flexShrink: 0 }}>
          <HikeScene scene={hike.scene} palette={C} />
          <div style={{
            position: 'absolute', top: statusH - 16, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3,
          }}>
            <button onClick={() => setScreen('result')} style={glassBtn(C)}>
              <Icon name="arrowL" size={18} color={C.ink} />
            </button>
            <div style={{ ...glassPill(C), fontSize: 12.5, padding: '6px 12px', fontWeight: 500 }}>
              {hike.name}
            </div>
            <button style={glassBtn(C)}>
              <Icon name="map" size={18} color={C.ink} />
            </button>
          </div>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: -1, height: 80,
            background: `linear-gradient(to bottom, ${hexA(C.bg, 0)}, ${C.bg})`,
          }} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 24px' }}>
          {/* Description */}
          <SectionH C={C}>{L.description}</SectionH>
          <p style={{ margin: '0 0 16px', lineHeight: 1.55, fontSize: 15, color: C.ink }}>
            {lang === 'no' ? hike.descNo : hike.descEn}
          </p>

          {/* Elevation profile (svg) */}
          <SectionH C={C}>{L.elevProfile}</SectionH>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: 12, marginBottom: 18,
          }}>
            <svg viewBox="0 0 320 80" width="100%" height="80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="elev-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={C.accent} stopOpacity="0.35" />
                  <stop offset="1" stopColor={C.accent} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 70 L40 55 L80 45 L130 25 L180 18 L220 30 L260 40 L300 55 L320 65 L320 80 L0 80 Z" fill="url(#elev-fill)" />
              <path d="M0 70 L40 55 L80 45 L130 25 L180 18 L220 30 L260 40 L300 55 L320 65"
                fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="180" cy="18" r="3" fill={C.accent} />
              <text x="178" y="13" fill={C.ink} fontSize="9" textAnchor="middle"
                style={{ fontFamily: 'Schibsted Grotesk' }}>{hike.ascentMeters} m</text>
            </svg>
          </div>

          {/* Map placeholder */}
          <SectionH C={C}>{L.trailhead}</SectionH>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
            height: 150, marginBottom: 14, position: 'relative', overflow: 'hidden',
          }}>
            <MapPlaceholder C={C} />
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12,
              background: `linear-gradient(to top, ${hexA(C.card, 0.92)}, ${hexA(C.card, 0)})`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            }}>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{hike.parkingNo && lang === 'no' ? hike.parkingNo : hike.parkingEn}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{L.parking}</div>
              </div>
              <button style={{ ...secondaryBtn(C, platform), height: 36, padding: '0 12px', fontSize: 13 }}>
                <Icon name="map" size={14} color={C.ink} />
                {L.openInMaps}
              </button>
            </div>
          </div>

          {/* Season */}
          <SectionH C={C}>{L.season}</SectionH>
          <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
            {months.map((m, i) => {
              const open = hike.seasonMonths.includes(i+1);
              return (
                <div key={m} style={{
                  flex: 1, padding: '8px 0 6px', textAlign: 'center',
                  background: open ? hexA(C.good, 0.18) : C.chip,
                  color: open ? C.good : C.mutedSoft,
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
                  borderRadius: 4, textTransform: 'capitalize',
                }}>{m}</div>
              );
            })}
          </div>

          {/* Safety */}
          <SectionH C={C}>{L.safety}</SectionH>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: 14, marginBottom: 14,
          }}>
            {Object.entries(L.safetyDetails).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14 }}>
                <Icon name="check" size={15} color={C.good} strokeWidth={2.4} />
                <span>{v}</span>
              </div>
            ))}
            <div style={{
              marginTop: 8, paddingTop: 10,
              borderTop: `1px solid ${C.border}`,
              fontSize: 12, color: C.mutedSoft, lineHeight: 1.45,
            }}>{L.safetyNote}</div>
          </div>

          {/* Source */}
          <div style={{
            background: C.chip, borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13, color: C.muted,
          }}>
            <Icon name="info" size={16} color={C.muted} />
            <span style={{ flex: 1 }}>{L.source}: <span style={{ color: C.ink }}>{hike.sourceUrl}</span></span>
          </div>
        </div>
      </div>
    );
  }

  // ── Router ─────────────────────────────────────────────────────────────
  let content;
  if (screen === 'welcome') content = <Welcome />;
  else if (screen === 'filters') content = <Filters />;
  else if (screen === 'finding') content = <Finding />;
  else if (screen === 'result') content = <Result />;
  else if (screen === 'detail') content = <Detail />;
  return content;
}

// ── helper components ───────────────────────────────────────────────────
function Section({ label, children, C }) {
  return (
    <div style={{ marginTop: 14, marginBottom: 4 }}>
      <div style={{
        fontSize: 12, color: C.muted, marginBottom: 8,
        letterSpacing: 0.2, fontWeight: 500, textTransform: 'uppercase',
      }}>{label}</div>
      {children}
    </div>
  );
}

function SectionH({ children, C }) {
  return (
    <div style={{
      fontSize: 12, color: C.muted, marginBottom: 8, marginTop: 18,
      letterSpacing: 0.5, fontWeight: 600, textTransform: 'uppercase',
    }}>{children}</div>
  );
}

function Segment({ options, C }) {
  return (
    <div style={{
      display: 'flex', gap: 0, padding: 4, background: C.chip,
      borderRadius: 12,
    }}>
      {options.map(o => (
        <button key={o.id} onClick={o.onClick} style={{
          flex: 1, height: 36, border: 0, borderRadius: 9,
          background: o.active ? C.card : 'transparent',
          color: o.active ? C.ink : C.muted,
          fontFamily: 'inherit', fontSize: 14, fontWeight: o.active ? 600 : 500,
          letterSpacing: -0.1, cursor: 'pointer',
          boxShadow: o.active ? '0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)' : 'none',
          transition: 'background 120ms, color 120ms, box-shadow 120ms',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function Badge({ icon, children, C }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 11px 5px 9px', borderRadius: 999,
      background: C.chip, color: C.ink, fontSize: 12.5, fontWeight: 500,
    }}>
      <Icon name={icon} size={13} color={C.muted} />
      {children}
    </div>
  );
}

function Stat({ label, children, C, last }) {
  return (
    <div style={{
      padding: '4px 14px', textAlign: 'left',
      borderRight: last ? 'none' : `1px solid ${C.border}`,
    }}>
      <div style={{
        fontSize: 10.5, letterSpacing: 0.6, fontWeight: 600,
        color: C.mutedSoft, textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: 19, fontWeight: 600, letterSpacing: -0.5,
        fontFeatureSettings: '"tnum" on',
      }}>{children}</div>
    </div>
  );
}

function MapPlaceholder({ C }) {
  // Topographic-ish stylized map
  return (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="320" height="150" fill={C.chip} />
      {/* contour rings */}
      <g fill="none" stroke={hexA(C.muted, 0.3)} strokeWidth="1">
        <path d="M40 110 q60 -40 130 -30 t100 60" />
        <path d="M60 110 q50 -30 110 -22 t80 50" />
        <path d="M80 110 q40 -20 90 -14 t60 40" />
        <path d="M100 110 q30 -12 70 -8 t40 30" />
      </g>
      {/* trail */}
      <path d="M40 130 q40 -20 80 -30 t100 -40 l30 -10"
        fill="none" stroke={C.accent} strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" />
      {/* trailhead pin */}
      <circle cx="40" cy="130" r="5" fill={C.accent} />
      <circle cx="40" cy="130" r="9" fill="none" stroke={C.accent} strokeOpacity="0.4" strokeWidth="1.5" />
      {/* summit */}
      <polygon points="250,80 256,68 262,80" fill={C.ink} />
    </svg>
  );
}

// ── style factories ─────────────────────────────────────────────────────
function primaryBtn(C, platform) {
  return {
    height: 52, borderRadius: platform === 'android' ? 100 : 16,
    background: C.primary, color: C.primaryInk, border: 0,
    fontFamily: 'inherit', fontSize: 16, fontWeight: 600, letterSpacing: -0.1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    cursor: 'pointer',
    boxShadow: platform === 'android' ? `0 2px 6px ${hexA(C.primary, 0.25)}` : 'none',
  };
}

function secondaryBtn(C, platform) {
  return {
    height: 50, borderRadius: platform === 'android' ? 100 : 14,
    background: 'transparent', color: C.ink,
    border: `1.5px solid ${C.border}`,
    fontFamily: 'inherit', fontSize: 15, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    cursor: 'pointer',
  };
}

function transportBtn(C, active) {
  return {
    height: 64, borderRadius: 14,
    background: active ? C.chipActive : C.chip,
    color: active ? C.chipActiveInk : C.ink,
    border: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    cursor: 'pointer', transition: 'background 120ms',
  };
}

function tagBtn(C, active) {
  return {
    height: 36, padding: '0 12px', borderRadius: 100,
    background: active ? C.chipActive : C.chip,
    color: active ? C.chipActiveInk : C.ink,
    border: 0, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    cursor: 'pointer', transition: 'background 120ms',
  };
}

function iconBtn(C) {
  return {
    width: 36, height: 36, borderRadius: 12,
    background: C.chip, border: 0, color: C.ink,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  };
}

function glassBtn(C) {
  return {
    width: 36, height: 36, borderRadius: '50%',
    background: hexA(C.card, 0.78),
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
    border: 'none', color: C.ink,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)',
  };
}

function glassPill(C) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: hexA(C.card, 0.78),
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
    color: C.ink, borderRadius: 999,
    boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)',
  };
}

// ── helpers ─────────────────────────────────────────────────────────────
function hexA(hex, a) {
  // Convert #RRGGBB to rgba(r,g,b,a)
  const h = hex.replace('#', '');
  const n = h.length === 3
    ? h.split('').map(x => parseInt(x+x, 16))
    : [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  return `rgba(${n[0]},${n[1]},${n[2]},${a})`;
}

function fmtDur(mins, lang) {
  if (mins < 60) return <>{mins}<small> {lang === 'no' ? 'min' : 'min'}</small></>;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (m === 0) return <>{h}<small> t</small></>;
  return <>{h}<small>t</small> {m}<small>m</small></>;
}

function reasonIcon(r) {
  return ({
    easy_enough: 'check',
    loop: 'loop',
    view: 'eye',
    within_travel: 'clock',
    forest: 'tree',
    transport_ok: 'bus',
    child: 'kid',
    water: 'water',
  }[r] || 'check');
}

function reasonLabel(r, L, h) {
  const m = h.travelMinutes;
  return ({
    easy_enough: L.matchEasy,
    loop: L.matchLoop,
    view: L.matchView,
    within_travel: `${m} ${L.minutes} ${L.matchTravel}`,
    forest: L.matchForest,
    transport_ok: L.matchTransport,
    child: L.matchChild,
    water: 'By water',
  }[r] || r);
}

Object.assign(window, { NaerturApp, NAERTUR_PALETTES });
