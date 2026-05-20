import { useMemo } from 'react';
import { resolveVariant } from './config';
import { MossApp } from './variants/moss/MossApp';
import { TrailApp } from './variants/trail/TrailApp';
import { DevVariantSwitcher } from './DevVariantSwitcher';
import './styles.css';

export function App() {
  // Resolved once per mount. The "random" mode rerolls per page load
  // (config.resolveVariant returns a fresh roll each call), so a browser
  // refresh flips the coin again. The dev switcher's "reload" buttons
  // achieve the same thing by setting localStorage + window.location.reload.
  const variant = useMemo(() => resolveVariant(), []);

  const body = variant === 'trail' ? <TrailApp /> : <MossApp />;

  return (
    <>
      {body}
      {import.meta.env.DEV && <DevVariantSwitcher current={variant} />}
    </>
  );
}
