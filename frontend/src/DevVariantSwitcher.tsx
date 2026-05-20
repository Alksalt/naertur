import { useState } from 'react';
import { setVariantOverride } from './config';
import type { Variant } from './types';

interface Props {
  current: Variant;
}

export function DevVariantSwitcher({ current }: Props) {
  const [copied, setCopied] = useState(false);

  function switchTo(v: Variant | null) {
    setVariantOverride(v);
    window.location.reload();
  }

  function copyShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', current);
    void navigator.clipboard?.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 9999,
        background: '#0E0D0B',
        color: '#F2EFE7',
        padding: '8px 10px',
        borderRadius: 6,
        fontFamily: "ui-monospace, 'SF Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: 0.92,
      }}
    >
      <span style={{ color: '#E0353D' }}>●</span>
      <span style={{ textTransform: 'uppercase' }}>{current}</span>
      <span style={{ width: 1, height: 16, background: '#A39E91', opacity: 0.4 }} />
      <button onClick={() => switchTo('moss')} style={chipBtn(current === 'moss')}>
        Moss
      </button>
      <button onClick={() => switchTo('trail')} style={chipBtn(current === 'trail')}>
        Trail
      </button>
      <button onClick={() => switchTo(null)} style={chipBtn(false)} title="Clear override (reroll on env=random)">
        Random
      </button>
      <span style={{ width: 1, height: 16, background: '#A39E91', opacity: 0.4 }} />
      <button onClick={copyShareUrl} style={chipBtn(false)} title="Copy share URL with ?variant=">
        {copied ? '✓' : '↗ URL'}
      </button>
    </div>
  );
}

function chipBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? '#E0353D' : 'transparent',
    color: active ? '#0E0D0B' : '#F2EFE7',
    border: `1px solid ${active ? '#E0353D' : '#A39E91'}`,
    borderRadius: 4,
    padding: '3px 7px',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.4,
    cursor: 'pointer',
  };
}
