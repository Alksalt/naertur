import { useTrailTheme } from '../theme';
import { useI18n, TAGS } from '../../../i18n';
import { Icon } from '../components/Icon';
import { TopoMap } from '../components/TopoMap';
import { SafetyStrip, StatBlock } from '../primitives';
import { fmtMinShort, todayStamp } from '../utils';
import { floatBtn, primaryCta, smallGhost, MONO } from '../styles';
import { reasonLabel } from '../../../reasons';
import { useCountUp } from '../hooks/useCountUp';
import type { UiSearchResponse } from '../../../types';

interface Props {
  statusH: number;
  bottomH: number;
  result: UiSearchResponse;
  onBack: () => void;
  onMoreInfo: () => void;
  onAnother: () => void;
  onReject: () => void;
}

export function Result({
  statusH,
  bottomH,
  result,
  onBack,
  onMoreInfo,
  onAnother,
  onReject,
}: Props) {
  const C = useTrailTheme();
  const { L, lang } = useI18n();
  const hike = result.hike;
  const safetyStatus = result.safety.status;
  const safetyLabel =
    safetyStatus === 'recommended_today'
      ? L.recommended
      : safetyStatus === 'check_conditions'
        ? L.checkConditions
        : L.notRecommended;

  const km = useCountUp(hike.distanceMeters !== undefined ? hike.distanceMeters / 1000 : 0);
  const asc = useCountUp(hike.ascentMeters ?? 0);
  const dur = useCountUp(hike.durationMinutes ?? 0);
  const trv = useCountUp(hike.travelMinutes ?? 0);

  return (
    <div
      className="trail-app"
      key={hike.id}
      style={{
        position: 'relative',
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
          height: 270,
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
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              color: C.ink,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: C.vermillion }}>●</span>
            {hike.id.toUpperCase().replace('-', ' / ')}
          </div>
          <button aria-label={L.openInMaps} className="ta-tap" style={floatBtn(C)}>
            <Icon name="map" size={17} color={C.ink} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <SafetyStrip
        C={C}
        status={safetyStatus}
        label={safetyLabel}
        advisory={L.advisoryShort}
        timestamp={todayStamp(lang)}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 0' }}>
        <div className="trail-fade-up">
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.2,
              color: C.vermillion,
            }}
          >
            {L.breadcrumbRecommended} · {(hike.municipality ?? '').toUpperCase()}
          </div>
          <h1
            style={{
              margin: '6px 0 0',
              fontSize: 38,
              lineHeight: 0.96,
              letterSpacing: -1.4,
              fontWeight: 700,
              textWrap: 'balance' as const,
            }}
          >
            {hike.name}
          </h1>
          <div style={{ marginTop: 8, color: C.graphite, fontSize: 14, fontWeight: 500 }}>
            {hike.municipality} kommune · {L.counties[hike.county] ?? hike.county}
          </div>
        </div>

        <div
          className="trail-fade-up"
          style={{
            marginTop: 18,
            padding: '14px 0',
            borderTop: `1px solid ${C.hairline}`,
            borderBottom: `1px solid ${C.hairline}`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 4,
            animationDelay: '80ms',
          }}
        >
          <StatBlock C={C} kind="len" label={L.distance} value={km.toFixed(1).replace('.', ',')} unit="km" />
          <StatBlock C={C} kind="asc" label={L.ascent} value={Math.round(asc)} unit="m" />
          <StatBlock C={C} kind="dur" label={L.duration} value={fmtMinShort(Math.round(dur), lang)} />
          <StatBlock C={C} kind="trv" label={L.travel} value={Math.round(trv)} unit={L.minutes} last />
        </div>

        {result.matchReasons.length > 0 && (
          <div className="trail-fade-up" style={{ marginTop: 22, animationDelay: '180ms' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: C.vermillion,
                  letterSpacing: 0.6,
                }}
              >
                ×{result.matchReasons.length}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.9,
                  textTransform: 'uppercase',
                  color: C.ink,
                }}
              >
                {L.whyThis}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {result.matchReasons.map((r, i) => (
                <div
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    padding: '10px 0',
                    borderTop: i > 0 ? `1px solid ${C.hairlineSoft}` : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.vermillion,
                      letterSpacing: 0.4,
                      width: 22,
                      flexShrink: 0,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.ink, lineHeight: 1.4 }}>
                    {reasonLabel(r, L, hike)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="trail-fade-up" style={{ marginTop: 18, animationDelay: '240ms' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {hike.tags.map((t) => {
              const tagDef = TAGS.find((x) => x.id === t);
              if (!tagDef) return null;
              return (
                <span
                  key={t}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 3,
                    border: `1px solid ${C.hairline}`,
                    background: C.snow,
                    fontFamily: MONO,
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    color: C.graphite,
                    textTransform: 'uppercase',
                  }}
                >
                  {lang === 'no' ? tagDef.no : tagDef.en}
                </span>
              );
            })}
          </div>
        </div>

        <button
          onClick={onMoreInfo}
          className="ta-tap ta-card-tap"
          style={{
            marginTop: 18,
            padding: '14px 16px',
            width: '100%',
            background: C.snow,
            border: `1px solid ${C.hairline}`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: C.ink,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
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
            ↗
          </span>
          <span style={{ flex: 1 }}>{L.moreInfo}</span>
          <span
            style={{ fontFamily: MONO, fontSize: 10, color: C.sub, letterSpacing: 0.4 }}
          >
            {lang === 'no' ? 'BESKRIVELSE · KART · SESONG' : 'DESCRIPTION · MAP · SEASON'}
          </span>
        </button>

        <div style={{ height: 140 }} />
      </div>

      <div
        style={{
          padding: `12px 20px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.paper} 70%, transparent)`,
          borderTop: `1px solid ${C.hairline}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <a
          href={hike.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ta-tap"
          style={{
            ...primaryCta(C, { accent: true, big: true, height: 58 }),
            justifyContent: 'flex-start',
            padding: '0 20px',
            textDecoration: 'none',
          }}
        >
          <Icon name="flag" size={18} color={C.vermillionInk} strokeWidth={1.8} />
          <span>{L.startHike}</span>
          {hike.travelMinutes !== undefined && (
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: MONO,
                fontSize: 11,
                opacity: 0.85,
                letterSpacing: 0.4,
                padding: '3px 8px',
                background: 'rgba(250,248,242,0.18)',
                borderRadius: 4,
              }}
            >
              ↗ {hike.travelMinutes} {L.minutes}
            </span>
          )}
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAnother} className="ta-tap" style={smallGhost(C)}>
            <Icon name="refresh" size={15} color={C.ink} strokeWidth={1.8} />
            {L.anotherOne}
          </button>
          <button onClick={onReject} className="ta-tap" style={smallGhost(C)}>
            <Icon name="close" size={15} color={C.ink} strokeWidth={2} />
            {L.notMine}
          </button>
        </div>
      </div>
    </div>
  );
}
