import { useTheme } from '../theme';
import { useI18n, TAGS } from '../../../i18n';
import { Icon } from '../components/Icon';
import { HikeScene } from '../components/scenes/HikeScene';
import { Stat, SafetyPill } from '../primitives';
import { glassBtn, glassPill, primaryBtn, secondaryBtn } from '../styles';
import { fmtDistanceKm, fmtDur, hexA } from '../../../format';
import { reasonIcon, reasonLabel } from '../../../reasons';
import { openInMaps } from '../../../maps';
import type { UiSearchResponse } from '../../../types';
import type { SceneKey } from '../components/scenes/HikeScene';

interface Props {
  statusH: number;
  bottomH: number;
  result: UiSearchResponse;
  locationLabel: string | null;
  onBack: () => void;
  onMoreInfo: () => void;
  onAnother: () => void;
  onReject: () => void;
}

export function Result({
  statusH,
  bottomH,
  result,
  locationLabel,
  onBack,
  onMoreInfo,
  onAnother,
  onReject,
}: Props) {
  const C = useTheme();
  const { L, lang } = useI18n();
  const hike = result.hike;
  const safetyStatus = result.safety.status;
  const safetyLabel =
    safetyStatus === 'recommended_today'
      ? L.recommended
      : safetyStatus === 'check_conditions'
        ? L.checkConditions
        : L.notRecommended;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.bg,
        color: C.ink,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', height: 280, overflow: 'hidden', flexShrink: 0 }}>
        <HikeScene scene={hike.scene as SceneKey | undefined} palette={C} />
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
          <button onClick={onBack} aria-label={L.backLabel} style={glassBtn(C)}>
            <Icon name="arrowL" size={18} color={C.ink} />
          </button>
          {(locationLabel || hike.travelMinutes !== undefined) && (
            <div style={{ ...glassPill(C), fontSize: 12.5, padding: '6px 12px', fontWeight: 500 }}>
              <Icon name="location" size={13} color={C.ink} />
              {locationLabel}
              {locationLabel && hike.travelMinutes !== undefined && ' · '}
              {hike.travelMinutes !== undefined && `${hike.travelMinutes} ${L.minutes}`}
            </div>
          )}
          <button
            aria-label={L.openInMaps}
            onClick={() => openInMaps(hike)}
            disabled={!hike.trailhead}
            style={{ ...glassBtn(C), opacity: hike.trailhead ? 1 : 0.4 }}
          >
            <Icon name="map" size={18} color={C.ink} />
          </button>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: 90,
            background: `linear-gradient(to bottom, ${hexA(C.bg, 0)}, ${C.bg})`,
            zIndex: 2,
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 18px',
          marginTop: -32,
          position: 'relative',
          zIndex: 3,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              lineHeight: 1.04,
              letterSpacing: -1,
              fontWeight: 600,
              textWrap: 'balance' as const,
            }}
          >
            {hike.name}
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: C.muted,
            fontSize: 14,
            marginTop: 4,
          }}
        >
          <Icon name="location" size={14} color={C.muted} />
          {hike.municipality ? `${hike.municipality} · ` : ''}
          {L.counties[hike.county] ?? hike.county}
        </div>

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <SafetyPill status={safetyStatus} label={safetyLabel} C={C} />
          <span style={{ fontSize: 12.5, color: C.mutedSoft }}>{L.advisoryShort}</span>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.4,
          }}
        >
          {L.attributionMorotur.split('morotur.no').map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <a
                  href="https://morotur.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.muted, textDecoration: 'underline' }}
                >
                  morotur.no
                </a>
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: '16px 4px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
          }}
        >
          <Stat C={C} label={L.distance}>
            {hike.distanceMeters !== undefined ? (
              <>
                {fmtDistanceKm(hike.distanceMeters)}
                <small> km</small>
              </>
            ) : (
              '—'
            )}
          </Stat>
          <Stat C={C} label={L.ascent}>
            {hike.ascentMeters ? (
              <>
                {hike.ascentMeters}
                <small> m</small>
              </>
            ) : (
              '—'
            )}
          </Stat>
          <Stat C={C} label={L.duration}>
            {hike.durationMinutes !== undefined ? fmtDur(hike.durationMinutes, lang) : '—'}
          </Stat>
          <Stat C={C} label={L.travel} last>
            {hike.travelMinutes !== undefined ? (
              <>
                {hike.travelMinutes}
                <small> {L.minutes}</small>
              </>
            ) : (
              '—'
            )}
          </Stat>
        </div>

        {result.transport?.status === 'unverified_until_entur' && (
          <div
            role="note"
            style={{
              marginTop: 8,
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.4,
            }}
          >
            {L.transportUnverified}
          </div>
        )}

        {result.matchReasons.length > 0 && (
          <div
            style={{
              marginTop: 18,
              padding: '14px 16px',
              background: hexA(C.accent, 0.08),
              border: `1px solid ${hexA(C.accent, 0.18)}`,
              borderRadius: 18,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 0.8,
                fontWeight: 600,
                color: C.accent,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {L.whyThis}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.matchReasons.map((r) => (
                <div
                  key={r}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
                >
                  <Icon name={reasonIcon(r)} size={15} color={C.accent} />
                  <span>{reasonLabel(r, L, hike)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {hike.tags.map((tag) => {
            const tagDef = TAGS.find((x) => x.id === tag);
            if (!tagDef) return null;
            return (
              <span
                key={tag}
                style={{
                  padding: '5px 11px 5px 9px',
                  borderRadius: 999,
                  background: C.chip,
                  fontSize: 12.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: C.ink,
                }}
              >
                <Icon name={tagDef.icon} size={13} color={C.muted} />
                {lang === 'no' ? tagDef.no : tagDef.en}
              </span>
            );
          })}
        </div>

        <button
          onClick={onMoreInfo}
          style={{
            marginTop: 16,
            marginBottom: 14,
            padding: '14px 16px',
            width: '100%',
            background: 'transparent',
            border: `1px dashed ${C.border}`,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: C.ink,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Icon name="info" size={18} color={C.muted} />
          <span style={{ flex: 1 }}>{L.moreInfo}</span>
          <Icon name="chevron" size={16} color={C.muted} />
        </button>

        <div style={{ height: 130 }} />
      </div>

      <div
        style={{
          padding: `12px 18px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.bg} 70%, ${hexA(C.bg, 0)} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <a
          href={hike.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...primaryBtn(C),
            height: 56,
            fontSize: 17,
            background: C.accent,
            color: C.accentInk,
            textDecoration: 'none',
          }}
        >
          <Icon name="flag" size={20} color={C.accentInk} />
          {L.startHike}
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAnother} style={{ ...secondaryBtn(C), flex: 1, height: 48 }}>
            <Icon name="refresh" size={17} color={C.ink} />
            {L.anotherOne}
          </button>
          <button onClick={onReject} style={{ ...secondaryBtn(C), flex: 1, height: 48 }}>
            <Icon name="thumbDown" size={17} color={C.ink} />
            {L.notMine}
          </button>
        </div>
      </div>
    </div>
  );
}
