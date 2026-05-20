import { useTheme } from '../theme';
import { useI18n } from '../../../i18n';
import { Icon } from '../components/Icon';
import { HikeScene } from '../components/scenes/HikeScene';
import { MapPlaceholder } from '../components/MapPlaceholder';
import { SectionH } from '../primitives';
import { glassBtn, glassPill, secondaryBtn } from '../styles';
import { hexA } from '../../../format';
import { openInMaps } from '../../../maps';
import type { UiHike } from '../../../types';
import type { SceneKey } from '../components/scenes/HikeScene';

interface Props {
  statusH: number;
  hike: UiHike;
  onBack: () => void;
}

const MONTHS_NO = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
const MONTHS_EN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function Detail({ statusH, hike, onBack }: Props) {
  const C = useTheme();
  const { L, lang } = useI18n();
  const months = lang === 'no' ? MONTHS_NO : MONTHS_EN;
  const seasonMonths = hike.seasonMonths ?? [];

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
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', flexShrink: 0 }}>
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
          <div style={{ ...glassPill(C), fontSize: 12.5, padding: '6px 12px', fontWeight: 500 }}>
            {hike.name}
          </div>
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
            height: 80,
            background: `linear-gradient(to bottom, ${hexA(C.bg, 0)}, ${C.bg})`,
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 24px' }}>
        <SectionH C={C}>{L.description}</SectionH>
        <p style={{ margin: '0 0 16px', lineHeight: 1.55, fontSize: 15, color: C.ink }}>
          {lang === 'no'
            ? (hike.descNo ?? hike.descEn ?? '')
            : (hike.descEn ?? hike.descNo ?? '')}
        </p>

        <SectionH C={C}>{L.elevProfile}</SectionH>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 12,
            marginBottom: 18,
          }}
        >
          <svg viewBox="0 0 320 80" width="100%" height="80" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="elev-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={C.accent} stopOpacity="0.35" />
                <stop offset="1" stopColor={C.accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 70 L40 55 L80 45 L130 25 L180 18 L220 30 L260 40 L300 55 L320 65 L320 80 L0 80 Z"
              fill="url(#elev-fill)"
            />
            <path
              d="M0 70 L40 55 L80 45 L130 25 L180 18 L220 30 L260 40 L300 55 L320 65"
              fill="none"
              stroke={C.accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="180" cy="18" r="3" fill={C.accent} />
            {hike.ascentMeters !== undefined && (
              <text
                x="178"
                y="13"
                fill={C.ink}
                fontSize="9"
                textAnchor="middle"
                style={{ fontFamily: 'Schibsted Grotesk' }}
              >
                {hike.ascentMeters} m
              </text>
            )}
          </svg>
        </div>

        <SectionH C={C}>{L.trailhead}</SectionH>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            height: 150,
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <MapPlaceholder palette={C} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: 12,
              background: `linear-gradient(to top, ${hexA(C.card, 0.92)}, ${hexA(C.card, 0)})`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>
                {lang === 'no' ? (hike.parkingNo ?? hike.parkingEn ?? '') : (hike.parkingEn ?? hike.parkingNo ?? '')}
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>{L.parking}</div>
            </div>
            <button
              onClick={() => openInMaps(hike)}
              disabled={!hike.trailhead}
              style={{
                ...secondaryBtn(C),
                height: 36,
                padding: '0 12px',
                fontSize: 13,
                width: 'auto',
                opacity: hike.trailhead ? 1 : 0.4,
              }}
            >
              <Icon name="map" size={14} color={C.ink} />
              {L.openInMaps}
            </button>
          </div>
        </div>

        <SectionH C={C}>{L.season}</SectionH>
        <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
          {months.map((m, i) => {
            const open = seasonMonths.includes(i + 1);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: '8px 0 6px',
                  textAlign: 'center',
                  background: open ? hexA(C.good, 0.18) : C.chip,
                  color: open ? C.good : C.mutedSoft,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  borderRadius: 4,
                  textTransform: 'capitalize',
                }}
              >
                {m}
              </div>
            );
          })}
        </div>

        <SectionH C={C}>{L.safety}</SectionH>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
          }}
        >
          {Object.entries(L.safetyDetails).map(([k, v]) => (
            <div
              key={k}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14 }}
            >
              <Icon name="check" size={15} color={C.good} strokeWidth={2.4} />
              <span>{v}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 8,
              paddingTop: 10,
              borderTop: `1px solid ${C.border}`,
              fontSize: 12,
              color: C.mutedSoft,
              lineHeight: 1.45,
            }}
          >
            {L.safetyNote}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.45,
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
        </div>

        <a
          href={hike.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: C.chip,
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: C.muted,
            textDecoration: 'none',
          }}
        >
          <Icon name="info" size={16} color={C.muted} />
          <span style={{ flex: 1 }}>
            {L.source}:{' '}
            <span style={{ color: C.ink }}>{hike.sourceUrl.replace(/^https?:\/\//, '')}</span>
          </span>
          <Icon name="chevron" size={14} color={C.muted} />
        </a>
      </div>
    </div>
  );
}
