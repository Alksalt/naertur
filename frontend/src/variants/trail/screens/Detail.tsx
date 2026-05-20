import { useTrailTheme } from '../theme';
import { useI18n } from '../../../i18n';
import { Icon } from '../components/Icon';
import { TopoMap } from '../components/TopoMap';
import { ElevationChart } from '../components/ElevationChart';
import { SectionLabel } from '../primitives';
import { floatBtn, MONO } from '../styles';
import { fmtDistanceKm } from '../../../format';
import type { UiHike } from '../../../types';

interface Props {
  statusH: number;
  hike: UiHike;
  onBack: () => void;
}

const MONTHS_NO = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
const MONTHS_EN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function Detail({ statusH, hike, onBack }: Props) {
  const C = useTrailTheme();
  const { L, lang } = useI18n();
  const months = lang === 'no' ? MONTHS_NO : MONTHS_EN;
  const seasonMonths = hike.seasonMonths ?? [];

  return (
    <div
      className="trail-app"
      style={{
        width: '100%',
        height: '100%',
        background: C.paper,
        color: C.ink,
        fontFamily: '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
        fontFeatureSettings: '"ss01" on, "ss02" on, "tnum" on',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 200,
          flexShrink: 0,
          borderBottom: `1px solid ${C.hairline}`,
        }}
      >
        <TopoMap palette={C} hike={hike} drawOn height="100%" />
        <div
          style={{
            position: 'absolute',
            top: statusH - 16,
            left: 16,
            right: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 3,
          }}
        >
          <button onClick={onBack} aria-label={L.backLabel} className="ta-tap" style={floatBtn(C)}>
            <Icon name="arrowL" size={17} color={C.ink} strokeWidth={1.8} />
          </button>
          <div
            style={{
              padding: '6px 11px',
              background: C.snow,
              borderRadius: 4,
              border: `1px solid ${C.hairline}`,
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: -0.2,
            }}
          >
            {hike.name}
          </div>
          <button aria-label={L.openInMaps} className="ta-tap" style={floatBtn(C)}>
            <Icon name="map" size={17} color={C.ink} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px' }}>
        <SectionLabel num={1} label={L.description} C={C} />
        <p style={{ margin: 0, lineHeight: 1.6, fontSize: 15.5, color: C.ink }}>
          {lang === 'no'
            ? (hike.descNo ?? hike.descEn ?? '')
            : (hike.descEn ?? hike.descNo ?? '')}
        </p>

        {hike.ascentMeters !== undefined && (
          <SectionLabel
            num={2}
            label={L.elevProfile}
            right={`${hike.ascentMeters} m ${lang === 'no' ? 'stigning' : 'ascent'}`}
            C={C}
          />
        )}
        <div style={{ background: C.snow, border: `1px solid ${C.hairline}`, padding: 16, position: 'relative' }}>
          <ElevationChart palette={C} hike={hike} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontFamily: MONO,
              fontSize: 9.5,
              color: C.sub,
              letterSpacing: 0.5,
            }}
          >
            <span>0 KM</span>
            <span style={{ color: C.vermillion }}>SUMMIT</span>
            <span>
              {hike.distanceMeters !== undefined ? fmtDistanceKm(hike.distanceMeters) : '—'} KM
            </span>
          </div>
        </div>

        <SectionLabel num={3} label={L.trailhead} C={C} />
        <div
          style={{
            border: `1px solid ${C.hairline}`,
            height: 140,
            position: 'relative',
            overflow: 'hidden',
            background: C.snow,
          }}
        >
          <TopoMap palette={C} hike={hike} drawOn={false} height={140} mode="bg" />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: 12,
              background: `linear-gradient(to top, ${C.snow}f0, transparent)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: C.vermillion,
                  letterSpacing: 0.6,
                }}
              >
                {L.parking.toUpperCase()}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>
                {lang === 'no'
                  ? (hike.parkingNo ?? hike.parkingEn ?? '')
                  : (hike.parkingEn ?? hike.parkingNo ?? '')}
              </div>
            </div>
            <button
              style={{
                padding: '7px 12px',
                border: `1px solid ${C.hairline}`,
                background: C.card,
                borderRadius: 4,
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                color: C.ink,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              ↗ {L.openInMaps}
            </button>
          </div>
        </div>

        <SectionLabel num={4} label={L.season} C={C} />
        <div style={{ display: 'flex', gap: 2 }}>
          {months.map((m, i) => {
            const open = seasonMonths.includes(i + 1);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: '10px 0 7px',
                  textAlign: 'center',
                  background: open ? C.vermillion : C.snow,
                  color: open ? C.vermillionInk : C.sub,
                  fontFamily: MONO,
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  border: `1px solid ${open ? C.vermillion : C.hairline}`,
                }}
              >
                {m}
              </div>
            );
          })}
        </div>

        <SectionLabel num={5} label={L.safety} C={C} />
        <div style={{ border: `1px solid ${C.hairline}`, background: C.snow }}>
          {Object.entries(L.safetyDetails).map(([k, v], i) => (
            <div
              key={k}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderTop: i > 0 ? `1px solid ${C.hairlineSoft}` : 'none',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: C.good,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="check" size={11} color={C.vermillionInk} strokeWidth={2.8} />
              </span>
              <span style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 8,
            padding: '10px 0',
            fontSize: 12,
            color: C.sub,
            lineHeight: 1.45,
            borderTop: `1px dashed ${C.hairline}`,
          }}
        >
          {L.safetyNote}
        </div>

        <a
          href={hike.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 16,
            padding: '11px 14px',
            background: C.snow,
            border: `1px solid ${C.hairline}`,
            fontSize: 12,
            color: C.graphite,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              color: C.vermillion,
              letterSpacing: 0.5,
            }}
          >
            {L.srcLabel}
          </span>
          <span style={{ color: C.ink, fontWeight: 500 }}>{hike.sourceUrl}</span>
        </a>
      </div>
    </div>
  );
}
