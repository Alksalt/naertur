import type { Location } from './types';

export function mapsHrefFor(hike: { trailhead?: Location; name: string }): string | null {
  if (!hike.trailhead) return null;
  const { lat, lon } = hike.trailhead;
  return `https://www.google.com/maps?q=${lat},${lon}(${encodeURIComponent(hike.name)})`;
}

export function openInMaps(hike: { trailhead?: Location; name: string }): void {
  const href = mapsHrefFor(hike);
  if (!href) return;
  window.open(href, '_blank', 'noopener,noreferrer');
}
