import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme';
import { useI18n, TOWNS_MR } from '../../../i18n';
import { Icon } from '../components/Icon';
import { NaerturMark } from '../components/NaerturMark';
import { HikeScene } from '../components/scenes/HikeScene';
import { Badge } from '../primitives';
import { primaryBtn, secondaryBtn, iconBtn } from '../styles';
import { hexA } from '../../../format';
import type { Lang, Location, ThemeName } from '../../../types';

interface Props {
  statusH: number;
  bottomH: number;
  lang: Lang;
  setLang: (l: Lang) => void;
  themeName: ThemeName;
  setThemeName: (t: ThemeName) => void;
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
  const C = useTheme();
  const { L } = useI18n();
  const [picker, setPicker] = useState(false);
  const [locating, setLocating] = useState(false);

  // Prevent setState-after-unmount when navigator.geolocation resolves after
  // the user has already moved on (e.g., tapped "Velg sted" mid-permission).
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
        <TownPicker
          C={C}
          onClose={() => setPicker(false)}
          onPick={(label) => {
            setPicker(false);
            onLocationGranted(label, 'valgt');
          }}
        />
      )}
    </div>
  );
}

function TownPicker({
  C,
  onClose,
  onPick,
}: {
  C: ReturnType<typeof useTheme>;
  onClose: () => void;
  onPick: (label: string) => void;
}) {
  const { L } = useI18n();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);

  // Focus management — initial focus on close button + ESC to dismiss + restore.
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

  // Tab trap — keep focus inside the picker.
  const handleTab = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={L.chooseTown}
      style={{
        position: 'absolute',
        inset: 0,
        background: hexA(C.ink, 0.4),
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
          background: C.bg,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: '20px 18px 28px',
          maxHeight: '70%',
          overflowY: 'auto',
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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{L.chooseTown}</h2>
          <button ref={closeRef} onClick={onClose} aria-label={L.closeLabel} style={iconBtn(C)}>
            <Icon name="close" size={18} color={C.ink} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TOWNS_MR.map((t, i) => (
            <button
              key={t.id}
              ref={i === 0 ? firstItemRef : undefined}
              onClick={() => onPick(t.label)}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '14px 16px',
                fontFamily: 'inherit',
                fontSize: 15,
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
