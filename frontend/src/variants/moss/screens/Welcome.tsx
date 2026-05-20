import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../theme';
import { useI18n } from '../../../i18n';
import { Icon } from '../components/Icon';
import { NaerturMark } from '../components/NaerturMark';
import { HikeScene } from '../components/scenes/HikeScene';
import { Badge } from '../primitives';
import { primaryBtn, secondaryBtn, iconBtn } from '../styles';
import { hexA } from '../../../format';
import { PlacePicker, type PlacePickerSlots } from '../../../components/PlacePicker';
import { nearestPlace } from '../../../api/places';
import type { Lang, ThemeName } from '../../../types';

interface Props {
  statusH: number;
  bottomH: number;
  lang: Lang;
  setLang: (l: Lang) => void;
  themeName: ThemeName;
  setThemeName: (t: ThemeName) => void;
  onLocationGranted: (label: string, sub?: string, coords?: { lat: number; lon: number }) => void;
}

export function Welcome({
  statusH,
  bottomH,
  lang,
  setLang,
  themeName,
  setThemeName,
  onLocationGranted,
}: Props) {
  const C = useTheme();
  const { L } = useI18n();
  const [picker, setPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  // Memoise the picker slots so PlacePicker only sees a new object identity
  // when the palette changes — not on every Welcome re-render (e.g. locating
  // state flips). Without this, slots is freshly allocated each render and
  // would defeat any future memoisation inside PlacePicker.
  const pickerSlots = useMemo(() => mossPlacePickerSlots(C), [C]);

  // Prevent setState-after-unmount when navigator.geolocation resolves after
  // the user has already moved on (e.g., tapped "Velg sted" mid-permission).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setPicker(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!mountedRef.current) return;
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        let label = L.locOk;
        try {
          const place = await nearestPlace(coords.lat, coords.lon);
          if (place) label = place.name;
        } catch {
          // offline / 5xx — keep the generic locOk label; coords still flow.
        }
        if (!mountedRef.current) return;
        setLocating(false);
        onLocationGranted(label, undefined, coords);
      },
      () => {
        if (!mountedRef.current) return;
        setLocating(false);
        setPicker(true);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: C.bg,
        color: C.ink,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* `inert` blocks keyboard + AT access to background content when the
          town picker is open — `aria-modal` alone is not reliably honoured.
          The cast is because React 18's type defs don't yet include `inert`. */}
      <div
        style={{ display: 'contents' }}
        {...(picker ? ({ inert: '' } as Record<string, string>) : {})}
      >
      <div style={{ height: '52%', position: 'relative', overflow: 'hidden' }}>
        <HikeScene scene="fjord" palette={C} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: 110,
            background: `linear-gradient(to bottom, ${hexA(C.bg, 0)}, ${C.bg})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: statusH - 18,
            left: 22,
            right: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <NaerturMark color={C.ink} peakColor={C.accent} size={22} />
          <div
            style={{
              padding: '5px 10px',
              borderRadius: 999,
              background: hexA(C.card, 0.7),
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              fontSize: 12,
              color: C.muted,
              letterSpacing: 0.1,
              whiteSpace: 'nowrap',
            }}
          >
            v0.1 · MVP
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '4px 22px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 36,
            lineHeight: 1.02,
            letterSpacing: -1.2,
            fontWeight: 600,
            textWrap: 'balance' as const,
          }}
        >
          {L.tagline}
        </h1>
        <p style={{ margin: 0, color: C.muted, fontSize: 15.5, lineHeight: 1.45, maxWidth: 320 }}>
          {L.welcomeSub}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge C={C} icon="leaf">
            {L.aboutLine1}
          </Badge>
          <Badge C={C} icon="bolt">
            {L.aboutLine2}
          </Badge>
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingBottom: bottomH + 14,
          }}
        >
          <button
            onClick={handleUseLocation}
            disabled={locating}
            style={primaryBtn(C)}
            aria-label={L.useLocation}
          >
            <Icon name="location" size={20} color={C.primaryInk} />
            {locating ? L.locating : L.useLocation}
          </button>
          <button onClick={() => setPicker(true)} style={secondaryBtn(C)}>
            {L.choosePlace}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12.5, color: C.mutedSoft, flex: 1 }}>{L.privacy}</div>
            <button
              onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
              aria-label={L.langSwitchLabel}
              style={{
                ...iconBtn(C),
                width: 44,
                height: 44,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {lang === 'no' ? 'EN' : 'NO'}
            </button>
            <button
              onClick={() =>
                setThemeName(
                  themeName === 'moss' ? 'mossDark' : themeName === 'mossDark' ? 'fjord' : 'moss',
                )
              }
              aria-label={L.themeSwitchLabel}
              style={{
                ...iconBtn(C),
                width: 44,
                height: 44,
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {themeName === 'moss' ? '☀' : themeName === 'mossDark' ? '☾' : '⌘'}
            </button>
          </div>
        </div>
      </div>
      </div>

      {picker && (
        <PlacePicker
          open
          onClose={() => setPicker(false)}
          onPick={({ label, location }) => {
            setPicker(false);
            onLocationGranted(label, undefined, location);
          }}
          slots={pickerSlots}
          L={L}
          closeIcon={<Icon name="close" size={18} color={C.ink} />}
        />
      )}
    </div>
  );
}

// Replicates the visuals of the previous inline TownPicker — kept as a factory
// so each invocation gets a fresh slots object (theme palettes can flip live
// when the user toggles light/dark/fjord).
function mossPlacePickerSlots(C: ReturnType<typeof useTheme>): PlacePickerSlots {
  return {
    modalChrome: {
      position: 'absolute',
      inset: 0,
      background: hexA(C.ink, 0.4),
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 10,
    },
    modalSurface: {
      width: '100%',
      background: C.bg,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: '20px 18px 28px',
      maxHeight: '70%',
      overflowY: 'auto',
    },
    searchInput: {
      width: '100%',
      padding: '12px 14px',
      background: C.card,
      border: '1px solid ' + C.border,
      borderRadius: 12,
      fontSize: 15,
      color: C.ink,
      fontFamily: 'inherit',
      marginBottom: 10,
      outline: 'none',
    },
    resultRow: (active: boolean) => ({
      background: active ? C.card : 'transparent',
      border: '1px solid ' + (active ? C.primary : C.border),
      borderRadius: 12,
      padding: '14px 16px',
      fontFamily: 'inherit',
      fontSize: 15,
      color: C.ink,
      textAlign: 'left',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      width: '100%',
    }),
    resultName: { fontWeight: 500 },
    resultMeta: { fontSize: 12, color: C.muted },
    emptyState: { fontSize: 13, color: C.muted, padding: '10px 4px' },
    closeBtn: iconBtn(C),
    status: { fontSize: 13, color: C.muted, padding: '8px 4px' },
  };
}
