import { useTheme } from '../theme';
import { useI18n } from '../../../i18n';
import { Icon } from '../components/Icon';
import { hexA } from '../../../format';

interface Props {
  phase: number; // 0..2
  onCancel?: () => void;
}

export function Finding({ phase, onCancel }: Props) {
  const C = useTheme();
  const { L } = useI18n();

  const lines = [
    { id: 0, t: L.locOk, icon: 'location' },
    { id: 1, t: L.seasonOk, icon: 'leaf' },
    { id: 2, t: L.weatherOk, icon: 'sun' },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: C.primary,
        color: C.primaryInk,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      {onCancel && (
        <button
          autoFocus
          onClick={onCancel}
          aria-label={L.backLabel}
          style={{
            position: 'absolute',
            top: 22,
            left: 18,
            width: 44,
            height: 44,
            borderRadius: 22,
            border: `1px solid ${hexA(C.primaryInk, 0.25)}`,
            background: hexA(C.primaryInk, 0.08),
            color: C.primaryInk,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Icon name="arrowL" size={18} color={C.primaryInk} />
        </button>
      )}
      <div style={{ position: 'relative', width: 180, height: 180 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `1.5px solid ${hexA(C.primaryInk, 0.25)}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: '50%',
            border: `1px solid ${hexA(C.primaryInk, 0.15)}`,
          }}
        />
        <div
          className="moss-compass-spin"
          style={{
            position: 'absolute',
            inset: 0,
            animation: 'naertur-spin 3.5s cubic-bezier(.5,.1,.5,.9) infinite',
          }}
        >
          <svg viewBox="0 0 100 100" width="180" height="180" aria-hidden="true">
            <polygon points="50,16 56,50 50,52 44,50" fill={C.accent} />
            <polygon points="50,84 44,50 50,48 56,50" fill={hexA(C.primaryInk, 0.5)} />
            <circle cx="50" cy="50" r="3" fill={C.primaryInk} />
          </svg>
        </div>
        {L.compassDirs.map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              top: '50%',
              left: '50%',
              transform: `translate(-50%,-50%) rotate(${i * 90}deg) translateY(-78px) rotate(${-i * 90}deg)`,
              fontSize: 11,
              fontWeight: 600,
              color: hexA(C.primaryInk, 0.6),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: 0.5,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 36, fontSize: 24, fontWeight: 600, letterSpacing: -0.6 }}>
        {L.finding}…
      </div>
      <div style={{ color: hexA(C.primaryInk, 0.65), fontSize: 14, marginTop: 6 }}>
        {L.findingSub}
      </div>

      <div
        style={{
          marginTop: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minWidth: 220,
        }}
      >
        {lines.map((line, i) => {
          const done = phase >= i;
          return (
            <div
              key={line.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: done ? 1 : 0.3,
                transition: 'opacity 220ms',
                fontSize: 14,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: done ? C.accent : hexA(C.primaryInk, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 220ms',
                }}
              >
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
