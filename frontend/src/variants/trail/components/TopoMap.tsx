// Topographic-map hero component. Lifted from app-trail.jsx:153-273.
// Concentric contour rings + trail path + trailhead/summit markers,
// procedurally seeded per hike so each card feels unique.

import { useMemo, type ReactNode } from 'react';
import type { TrailPalette } from '../theme';
import type { UiHike } from '../../../types';

type Mode = 'hero' | 'bg';

interface Props {
  palette: TrailPalette;
  hike?: UiHike;
  drawOn?: boolean;
  height?: number | string;
  showTrail?: boolean;
  mode?: Mode;
  children?: ReactNode;
}

export function TopoMap({
  palette,
  hike,
  drawOn = true,
  height = 280,
  showTrail = true,
  mode = 'hero',
  children,
}: Props) {
  const C = palette;
  const hikeId = hike?.id;
  const seed = useMemo(() => {
    if (!hikeId) return 17;
    let h = 0;
    for (let i = 0; i < hikeId.length; i++) h = (h * 31 + hikeId.charCodeAt(i)) & 0xffff;
    return h;
  }, [hikeId]);

  const rings = useMemo(() => {
    const cx = 220 + (seed % 60) - 30;
    const cy = 130 + ((seed >> 4) % 50) - 25;
    return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const r = 28 + i * 18;
      const wobble = 0.08 + i * 0.012;
      const points: [number, number][] = [];
      for (let a = 0; a < 360; a += 18) {
        const w =
          1 +
          Math.sin((a + seed * 7 + i * 31) * 0.087) * wobble +
          Math.cos((a + seed * 3 + i * 17) * 0.041) * wobble * 0.6;
        const rad = (a * Math.PI) / 180;
        points.push([cx + Math.cos(rad) * r * w, cy + Math.sin(rad) * r * w]);
      }
      const path =
        points
          .map((p, j) => (j === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1))
          .join(' ') + ' Z';
      return { path, i };
    });
  }, [seed]);

  const trail = useMemo(() => {
    const cx = 220 + (seed % 60) - 30;
    const cy = 130 + ((seed >> 4) % 50) - 25;
    const sx = 50;
    const sy = 240;
    const m1x = 110 + ((seed >> 2) % 40);
    const m1y = 200;
    const m2x = 160;
    const m2y = 165;
    return {
      d: `M${sx} ${sy} Q${m1x} ${m1y}, ${m2x} ${m2y} T${cx} ${cy}`,
      start: [sx, sy] as [number, number],
      summit: [cx, cy] as [number, number],
    };
  }, [seed]);

  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= 400; x += 50)
    gridLines.push(
      <line key={'gx' + x} x1={x} y1={0} x2={x} y2={300} stroke={C.hairlineSoft} strokeWidth="0.5" />,
    );
  for (let y = 0; y <= 300; y += 50)
    gridLines.push(
      <line key={'gy' + y} x1={0} y1={y} x2={400} y2={y} stroke={C.hairlineSoft} strokeWidth="0.5" />,
    );

  const trailLen = 360;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        background: C.paper,
      }}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      >
        <rect width="400" height="300" fill={C.paper} />
        <g opacity={mode === 'hero' ? 0.8 : 0.4}>{gridLines}</g>
        <g>
          {rings.map((r) => (
            <path
              key={r.i}
              d={r.path}
              fill="none"
              stroke={r.i % 4 === 0 ? C.topoDeep : C.topo}
              strokeWidth={r.i % 4 === 0 ? 1.1 : 0.6}
              opacity={mode === 'bg' ? 0.45 : 0.85}
              style={
                drawOn
                  ? {
                      strokeDasharray: 800,
                      strokeDashoffset: 800,
                      animation: `trail-draw 1100ms ${r.i * 90}ms cubic-bezier(.6,.1,.3,1) forwards`,
                    }
                  : undefined
              }
            />
          ))}
        </g>
        {mode === 'hero' && (
          <g transform="translate(370, 30)" opacity="0.75">
            <circle cx="0" cy="0" r="11" fill={C.snow} stroke={C.hairline} strokeWidth="0.8" />
            <polygon points="0,-7 2.5,0 0,2 -2.5,0" fill={C.vermillion} />
            <polygon points="0,7 2.5,0 0,-2 -2.5,0" fill={C.graphite} opacity="0.4" />
            <text
              x="0"
              y="-12.5"
              textAnchor="middle"
              fontSize="6"
              fontWeight="600"
              fill={C.ink}
              fontFamily="'Bricolage Grotesque', sans-serif"
            >
              N
            </text>
          </g>
        )}
        {mode === 'hero' && (
          <g transform="translate(20, 270)" opacity="0.7">
            <rect x="0" y="0" width="40" height="2" fill={C.ink} />
            <rect x="40" y="0" width="40" height="2" fill="none" stroke={C.ink} strokeWidth="1" />
            <text
              x="0"
              y="-4"
              fontSize="7"
              fill={C.graphite}
              fontFamily="'Bricolage Grotesque', sans-serif"
              fontWeight="500"
              letterSpacing="0.5"
            >
              0 1 km
            </text>
          </g>
        )}
        {showTrail && (
          <>
            <path
              d={trail.d}
              fill="none"
              stroke={C.vermillion}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={
                drawOn
                  ? {
                      strokeDasharray: trailLen,
                      strokeDashoffset: trailLen,
                      animation: 'trail-draw 1400ms 700ms cubic-bezier(.6,.1,.3,1) forwards',
                    }
                  : undefined
              }
            />
            <g
              transform={`translate(${trail.start[0]}, ${trail.start[1]})`}
              style={drawOn ? { animation: 'trail-pop 520ms 1500ms both' } : undefined}
            >
              <circle cx="0" cy="0" r="7" fill={C.snow} stroke={C.vermillion} strokeWidth="1.5" />
              <polygon points="0,-3.2 3,2.2 -3,2.2" fill={C.vermillion} />
            </g>
            <g
              transform={`translate(${trail.summit[0]}, ${trail.summit[1]})`}
              style={drawOn ? { animation: 'trail-pop 520ms 1800ms both' } : undefined}
            >
              <polygon
                points="0,-7 7,5 -7,5"
                fill={C.snow}
                stroke={C.ink}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <polygon points="0,-7 3,-1.5 -3,-1.5" fill={C.ink} />
            </g>
          </>
        )}
      </svg>
      {children}
    </div>
  );
}
