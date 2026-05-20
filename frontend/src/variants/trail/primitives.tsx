// Trail-variant named primitives. Lifted from app-trail.jsx (SectionLabel,
// Wordmark, FactCell, StatBlock) + the SafetyStrip pattern used inline on
// Result.

import type { ReactNode } from 'react';
import type { TrailPalette } from './theme';
import { MONO } from './styles';
import { StatIcon } from './components/StatIcon';

export function SectionLabel({
  num,
  label,
  right,
  C,
}: {
  num: number;
  label: string;
  right?: ReactNode;
  C: TrailPalette;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginTop: 18,
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10.5,
          fontWeight: 600,
          color: C.vermillion,
          letterSpacing: 0.6,
        }}
      >
        {String(num).padStart(2, '0')}
      </span>
      <span
        style={{
          height: 1,
          background: C.hairline,
          flex: '0 0 14px',
          alignSelf: 'center',
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.9,
          textTransform: 'uppercase',
          color: C.ink,
        }}
      >
        {label}
      </span>
      {right && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: C.graphite,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {right}
        </span>
      )}
    </div>
  );
}

export function Wordmark({ C, size = 22 }: { C: TrailPalette; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="2,20 9,7 13,14 16,9 22,20" fill={C.ink} />
        <polygon points="9,7 12,12 6,12" fill={C.vermillion} />
      </svg>
      <span
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: size,
          letterSpacing: -0.8,
          color: C.ink,
          lineHeight: 1,
          fontVariationSettings: '"wdth" 90',
        }}
      >
        NÆRTUR
      </span>
    </span>
  );
}

export function FactCell({
  C,
  label,
  value,
  last,
}: {
  C: TrailPalette;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: '2px 0 0',
        borderRight: last ? 'none' : `1px solid ${C.hairlineSoft}`,
        textAlign: 'left',
        paddingLeft: 2,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          fontWeight: 600,
          color: C.sub,
          letterSpacing: 0.7,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: -0.5,
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function StatBlock({
  C,
  kind,
  label,
  value,
  unit,
  last,
}: {
  C: TrailPalette;
  kind: 'len' | 'asc' | 'dur' | 'trv';
  label: string;
  value: string | number;
  unit?: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: '0 10px',
        borderRight: last ? 'none' : `1px solid ${C.hairlineSoft}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: MONO,
          fontSize: 9.5,
          fontWeight: 600,
          color: C.graphite,
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        <StatIcon kind={kind} size={11} color={C.vermillion} />
        <span style={{ textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -0.8,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: C.ink,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 12, fontWeight: 500, color: C.graphite, marginLeft: 2 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function SafetyStrip({
  C,
  status,
  label,
  advisory,
  timestamp,
}: {
  C: TrailPalette;
  status: 'recommended_today' | 'check_conditions' | 'not_recommended_now';
  label: string;
  advisory: string;
  timestamp: string;
}) {
  const sColor = status === 'recommended_today' ? C.good : status === 'check_conditions' ? C.caution : C.danger;
  const sTint = status === 'recommended_today' ? C.goodTint : status === 'check_conditions' ? C.cautionTint : C.dangerTint;
  return (
    <div
      className="trail-fade-in"
      style={{
        padding: '11px 20px',
        background: sTint,
        borderBottom: `1px solid ${C.hairline}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13.5,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: sColor,
          boxShadow: `0 0 0 4px ${sTint}`,
        }}
      />
      <span style={{ fontWeight: 700, color: sColor, letterSpacing: -0.1 }}>{label}</span>
      <span style={{ color: C.graphite, fontSize: 12.5 }}>· {advisory}</span>
      <span
        style={{
          marginLeft: 'auto',
          fontFamily: MONO,
          fontSize: 10,
          fontWeight: 600,
          color: C.graphite,
          letterSpacing: 0.4,
        }}
      >
        {timestamp}
      </span>
    </div>
  );
}

