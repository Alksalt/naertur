// Lifted from design_handoff/app.jsx:956,969.
// When the backend adds new matchReason / rejectedReason keys, extend both
// maps here AND the Strings interface in src/i18n.ts.

import type { Strings } from './i18n';
import type { UiHike } from './types';

const ICONS: Record<string, string> = {
  easy_enough: 'check',
  loop: 'loop',
  view: 'eye',
  within_travel: 'clock',
  forest: 'tree',
  transport_ok: 'bus',
  child: 'kid',
  water: 'water',
};

export function reasonIcon(reason: string): string {
  return ICONS[reason] ?? 'check';
}

export function reasonLabel(reason: string, L: Strings, hike: UiHike): string {
  const m = hike.travelMinutes;
  switch (reason) {
    case 'easy_enough':
      return L.matchEasy;
    case 'loop':
      return L.matchLoop;
    case 'view':
      return L.matchView;
    case 'within_travel':
      return m !== undefined ? `${m} ${L.minutes} ${L.matchTravel}` : L.matchTravel;
    case 'forest':
      return L.matchForest;
    case 'transport_ok':
      return L.matchTransport;
    case 'child':
      return L.matchChild;
    case 'water':
      return L.matchWater;
    default:
      return reason;
  }
}
