import { useCallback, useEffect, useRef, useState } from 'react';
import { useTrailTheme } from '../theme';
import { useI18n, TOWNS_MR } from '../../../i18n';
import { Icon } from '../components/Icon';
import { TopoMap } from '../components/TopoMap';
import { Wordmark, FactCell } from '../primitives';
import { primaryCta, ghostCta, iconBox, MONO } from '../styles';
import type { Lang, Location, TrailThemeName } from '../../../types';
import { MOCK_HIKES } from '../../../api/mock';

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
      (pos) => {
        if (!mountedRef.current) return;
        setLocating(false);
        onLocationGranted(L.locOk, undefined, {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              background: C.snow,
              borderRadius: 4,
              border: `1px solid ${C.hairline}`,
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.5,
              color: C.graphite,
            }}
          >
            <span style={{ color: C.vermillion }}>●</span> N 62.47° · Ø 6.15°
          </div>
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

        <div
          className="trail-fade-up"
          style={{
            display: 'flex',
            borderTop: `1px solid ${C.hairline}`,
            borderBottom: `1px solid ${C.hairline}`,
            margin: '20px 0 16px',
            padding: '10px 0',
            animationDelay: '220ms',
          }}
        >
          <FactCell C={C} label={L.factStripHikes} value="124" />
          <FactCell C={C} label={L.factStripSeason} value={lang === 'no' ? 'Åpen' : 'Open'} />
          <FactCell C={C} label={L.factStripAlert} value="0" last />
        </div>

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
            {L.chooseTown}
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
        <TownPicker C={C} onClose={() => setPicker(false)} onPick={(label) => {
          setPicker(false);
          onLocationGranted(label, 'valgt');
        }} />
      )}
    </div>
  );
}

function TownPicker({
  C,
  onClose,
  onPick,
}: {
  C: ReturnType<typeof useTrailTheme>;
  onClose: () => void;
  onPick: (label: string) => void;
}) {
  const { L } = useI18n();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previousActive?.focus?.();
    };
  }, [onClose]);

  const handleTab = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={L.chooseTown}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 10,
      }}
      onClick={onClose}
      onKeyDown={handleTab}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: C.paper,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          padding: '20px 20px 28px',
          maxHeight: '70%',
          overflowY: 'auto',
          borderTop: `1px solid ${C.hairline}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: -0.4,
            }}
          >
            {L.chooseTown}
          </h2>
          <button ref={closeRef} onClick={onClose} aria-label={L.closeLabel} style={iconBox(C)}>
            <Icon name="close" size={18} color={C.ink} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TOWNS_MR.map((t) => (
            <button
              key={t.id}
              onClick={() => onPick(t.label)}
              style={{
                background: C.snow,
                border: `1px solid ${C.hairline}`,
                borderRadius: 4,
                padding: '13px 14px',
                fontFamily: 'inherit',
                fontSize: 14.5,
                color: C.ink,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
