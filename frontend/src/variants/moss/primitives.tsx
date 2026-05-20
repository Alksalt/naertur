// Moss-variant named primitives (components only — style factories live in
// styles.ts to keep this file Fast Refresh-clean).

import type { ReactNode } from 'react';
import type { Palette } from './theme';
import { hexA } from '../../format';
import { Icon } from './components/Icon';
import { iconBtn } from './styles';

export function Section({
  label,
  children,
  C,
}: {
  label: ReactNode;
  children: ReactNode;
  C: Palette;
}) {
  return (
    <div style={{ marginTop: 14, marginBottom: 4 }}>
      <div
        style={{
          fontSize: 12,
          color: C.muted,
          marginBottom: 8,
          letterSpacing: 0.2,
          fontWeight: 500,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function SectionH({ children, C }: { children: ReactNode; C: Palette }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: C.muted,
        marginBottom: 8,
        marginTop: 18,
        letterSpacing: 0.5,
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

export interface SegmentOption {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function Segment({ options, C }: { options: SegmentOption[]; C: Palette }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        padding: 4,
        background: C.chip,
        borderRadius: 12,
      }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          onClick={o.onClick}
          aria-pressed={o.active}
          style={{
            flex: 1,
            height: 36,
            border: 0,
            borderRadius: 9,
            background: o.active ? C.card : 'transparent',
            color: o.active ? C.ink : C.muted,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: o.active ? 600 : 500,
            letterSpacing: -0.1,
            cursor: 'pointer',
            boxShadow: o.active
              ? '0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)'
              : 'none',
            transition: 'background 120ms, color 120ms, box-shadow 120ms',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({
  icon,
  children,
  C,
}: {
  icon: string;
  children: ReactNode;
  C: Palette;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 11px 5px 9px',
        borderRadius: 999,
        background: C.chip,
        color: C.ink,
        fontSize: 12.5,
        fontWeight: 500,
      }}
    >
      <Icon name={icon} size={13} color={C.muted} />
      {children}
    </div>
  );
}

export function Stat({
  label,
  children,
  C,
  last,
}: {
  label: string;
  children: ReactNode;
  C: Palette;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: '4px 14px',
        textAlign: 'left',
        borderRight: last ? 'none' : `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: 0.6,
          fontWeight: 600,
          color: C.mutedSoft,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: -0.5,
          fontFeatureSettings: '"tnum" on',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function MiniHeader({
  title,
  onBack,
  right,
  C,
  statusH,
  backLabel,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  C: Palette;
  statusH: number;
  backLabel: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: `${Math.max(statusH - 16, 14)}px 18px 12px`,
        background: C.bg,
        position: 'relative',
        zIndex: 4,
      }}
    >
      {onBack && (
        <button onClick={onBack} aria-label={backLabel} style={iconBtn(C)}>
          <Icon name="arrowL" size={20} color={C.ink} />
        </button>
      )}
      <div style={{ flex: 1, fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{title}</div>
      {right}
    </div>
  );
}

export function SafetyPill({
  status,
  label,
  C,
}: {
  status: 'recommended_today' | 'check_conditions' | 'not_recommended_now';
  label: string;
  C: Palette;
}) {
  const color =
    status === 'recommended_today' ? C.good : status === 'check_conditions' ? C.caution : C.danger;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 12px 6px 10px',
        borderRadius: 999,
        background: hexA(color, 0.13),
        color,
        fontSize: 13.5,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      {label}
    </div>
  );
}
