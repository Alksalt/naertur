// Wave 4 / Stream I — user-visible mock-mode badge.
//
// Surfaces a small fixed-position pill in the corner of the viewport when
// the frontend is running against fixture data (5-hike mock) so users can't
// be fooled into thinking they're seeing the full catalogue. Reads
// isMockMode() from the shared API client so the source-of-truth for "are
// we hitting fixtures or live?" stays in one place. Rendered outside the
// 480px PWA frame so it sits on top of the app shell regardless of which
// variant is active. Non-interactive (pointer-events: none) so it never
// blocks tap targets underneath.
import { isMockMode } from '../api/client';
import { useI18n } from '../i18n';

export function MockBadge() {
  const { L } = useI18n();
  if (!isMockMode()) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 9999,
        pointerEvents: 'none',
        padding: '4px 8px',
        borderRadius: 6,
        background: '#F4D35E',
        color: '#1A1F1B',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.3,
        lineHeight: 1.2,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {L.mockBadge}
    </div>
  );
}
