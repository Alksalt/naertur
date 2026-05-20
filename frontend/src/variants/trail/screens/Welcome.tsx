import { useEffect, useMemo, useRef, useState } from 'react';
import { useTrailTheme, type TrailPalette } from '../theme';
import { useI18n } from '../../../i18n';
import { Icon } from '../components/Icon';
import { TopoMap } from '../components/TopoMap';
import { Wordmark } from '../primitives';
import { primaryCta, ghostCta, iconBox, MONO } from '../styles';
import type { Lang, Location, TrailThemeName } from '../../../types';
import { MOCK_HIKES } from '../../../api/mock';
import { PlacePicker, type PlacePickerSlots } from '../../../components/PlacePicker';
import { nearestPlace } from '../../../api/places';

interface Props {
  statusH: number;
  bottomH: number;
  lang: Lang;
  setLang: (l: Lang) => void;
  themeName: TrailThemeName;
  setThemeName: (t: TrailThemeName) => void;
  onLocationGranted: (label: string, sub?: string, coords?: Location) => void;
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
  const C = useTrailTheme();
  const { L } = useI18n();
  const [picker, setPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const heroHike = MOCK_HIKES[0];
  // Memoise the picker slots so PlacePicker only sees a new object identity
  // when the palette changes — not on every Welcome re-render (e.g. locating
  // state flips). Without this, slots is freshly allocated each render and
  // would defeat any future memoisation inside PlacePicker.
  const pickerSlots = useMemo(() => trailPlacePickerSlots(C), [C]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setPicker(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!mountedRef.current) return;
        const coords: Location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        // Reverse-geocode to a human label; fall back to the generic locOk
        // string if the lookup fails / times out / returns nothing.
        let label = L.locOk;
        try {
          const nearest = await nearestPlace(coords.lat, coords.lon);
          if (!mountedRef.current) return;
          if (nearest) label = nearest.name;
        } catch {
          // swallow — fallback label already set
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
      className="trail-app"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: C.paper,
        color: C.ink,
        fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
        fontFeatureSettings: '"ss01" on, "ss02" on, "tnum" on',
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
      <div style={{ position: 'relative', height: '54%', flexShrink: 0 }}>
        <TopoMap palette={C} hike={heroHike} drawOn height="100%" />
        <div
          style={{
            position: 'absolute',
            top: statusH - 18,
            left: 22,
            right: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2,
          }}
        >
          <Wordmark C={C} size={20} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: 80,
            background: `linear-gradient(to bottom, transparent, ${C.paper})`,
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          padding: '4px 22px 0',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          className="trail-fade-up"
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 600,
            color: C.vermillion,
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          {L.breadcrumbMVP}
        </div>

        <h1
          className="trail-fade-up"
          style={{
            margin: 0,
            fontSize: 44,
            lineHeight: 0.95,
            letterSpacing: -1.6,
            fontWeight: 700,
            textWrap: 'balance' as const,
            whiteSpace: 'pre-line',
            animationDelay: '60ms',
          }}
        >
          {L.taglineLead}
          <span
            style={{
              color: C.vermillion,
              fontStyle: 'italic',
              fontFamily: '"Newsreader", serif',
              fontWeight: 500,
              letterSpacing: -1,
            }}
          >
            {L.taglineItalic}
          </span>
        </h1>

        <p
          className="trail-fade-up"
          style={{
            margin: '14px 0 0',
            color: C.graphite,
            fontSize: 15,
            lineHeight: 1.5,
            maxWidth: 320,
            animationDelay: '140ms',
          }}
        >
          {L.welcomeSub}
        </p>

        <div style={{ flex: 1 }} />

        <div style={{ margin: '20px 0 4px', borderTop: `1px solid ${C.hairline}` }} />

        <div
          className="trail-fade-up"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingBottom: bottomH + 14,
            animationDelay: '300ms',
          }}
        >
          <button
            onClick={handleUseLocation}
            disabled={locating}
            className="ta-tap"
            style={primaryCta(C, { accent: true, big: true, height: 58 })}
            aria-label={L.useLocation}
          >
            <Icon name="location" size={18} color={C.vermillionInk} />
            {locating ? L.locating : L.useLocation}
          </button>
          <button onClick={() => setPicker(true)} className="ta-tap" style={ghostCta(C)}>
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
            <div style={{ fontSize: 11.5, color: C.sub, letterSpacing: 0.2, flex: 1 }}>
              {L.privacy}
            </div>
            <button
              onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
              aria-label={L.langSwitchLabel}
              style={{
                ...iconBox(C),
                width: 44,
                height: 44,
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {lang === 'no' ? 'EN' : 'NO'}
            </button>
            <button
              onClick={() =>
                setThemeName(
                  themeName === 'trailhead'
                    ? 'nightMap'
                    : themeName === 'nightMap'
                      ? 'fjordTrail'
                      : 'trailhead',
                )
              }
              aria-label={L.themeSwitchLabel}
              style={{
                ...iconBox(C),
                width: 44,
                height: 44,
                fontSize: 16,
              }}
            >
              {themeName === 'trailhead' ? '☀' : themeName === 'nightMap' ? '☾' : '⌘'}
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

// Trail-variant skin for the variant-agnostic PlacePicker. Mirrors the
// editorial / topographic visual language used by the rest of the trail
// variant: sharp 4-6px radii on the sheet/inputs, MONO meta text, vermillion
// accent on the active row, and the standard `iconBox(C)` for the close
// button. Keep the typography choices in sync with the H1/CTA above so the
// picker reads as one continuous surface rather than a foreign overlay.
function trailPlacePickerSlots(C: TrailPalette): PlacePickerSlots {
  return {
    modalChrome: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 10,
    },
    modalSurface: {
      width: '100%',
      background: C.paper,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      padding: '20px 20px 28px',
      maxHeight: '70%',
      overflowY: 'auto',
      borderTop: `1px solid ${C.hairline}`,
      fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
      color: C.ink,
    },
    searchInput: {
      width: '100%',
      boxSizing: 'border-box',
      height: 44,
      padding: '0 12px',
      border: `1px solid ${C.hairline}`,
      borderRadius: 4,
      background: C.snow,
      color: C.ink,
      fontFamily: MONO,
      fontSize: 14,
      letterSpacing: 0.1,
      outline: 'none',
    },
    resultRow: (active: boolean) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 2,
      width: '100%',
      background: active ? C.vermillion : C.snow,
      color: active ? C.vermillionInk : C.ink,
      border: `1px solid ${active ? C.vermillion : C.hairline}`,
      borderRadius: 4,
      padding: '11px 14px',
      fontFamily: 'inherit',
      fontSize: 14.5,
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'background 140ms, color 140ms, border-color 140ms',
    }),
    resultName: {
      fontSize: 14.5,
      fontWeight: 500,
      letterSpacing: -0.1,
    },
    resultMeta: {
      // Intentionally no `color` — inherit from the parent <button>, whose
      // color is set by `resultRow(active)` above (C.ink when idle,
      // C.vermillionInk when active). Hard-coding C.sub here caused a
      // grey-on-vermillion ~2.5:1 contrast failure on the active row.
      // No opacity either — at 11px the meta is "small text" by WCAG, so it
      // needs 4.5:1. Pure C.ink on C.snow gives ~15:1; pure C.vermillionInk
      // on C.vermillion gives ~5.3:1 — both pass AA. Any opacity drop pulls
      // the active state under 4.5:1.
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    emptyState: {
      marginTop: 12,
      fontFamily: MONO,
      fontSize: 11.5,
      color: C.sub,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    status: {
      marginTop: 12,
      fontFamily: MONO,
      fontSize: 11.5,
      color: C.sub,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    closeBtn: iconBox(C),
  };
}
