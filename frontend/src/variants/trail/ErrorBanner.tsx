import { useTrailTheme } from './theme';
import { useI18n } from '../../i18n';
import { MONO } from './styles';

interface Props {
  kind: 'no_candidates' | 'error';
  onDismiss: () => void;
}

export function ErrorBanner({ kind, onDismiss }: Props) {
  const C = useTrailTheme();
  const { L, lang } = useI18n();
  const noCand = kind === 'no_candidates';
  const message = noCand
    ? lang === 'no'
      ? 'Ingen turer passet. Prøv andre filtre.'
      : 'No hikes matched. Try other filters.'
    : lang === 'no'
      ? 'Noe gikk galt. Prøv igjen.'
      : 'Something went wrong. Try again.';
  return (
    <div
      role="alert"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        top: 84,
        background: C.danger,
        color: C.vermillionInk,
        padding: '12px 14px',
        borderRadius: 6,
        fontSize: 13.5,
        lineHeight: 1.4,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6, opacity: 0.85 }}>
        {noCand ? '00' : 'ERR'}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        aria-label={L.closeLabel}
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.18)',
          color: C.vermillionInk,
          border: 0,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
