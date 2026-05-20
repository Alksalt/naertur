// Lifted from app-trail.jsx:131-150. EaseOut cubic over 700ms.
// Honors prefers-reduced-motion by jumping straight to the target.
// Restarts on target/duration change — caller's stat updates re-animate.

import { useEffect, useState } from 'react';

export function useCountUp(target: number, duration = 700): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setV(target);
      return;
    }
    let raf = 0;
    let start: number | undefined;
    const tick = (t: number) => {
      if (start === undefined) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}
