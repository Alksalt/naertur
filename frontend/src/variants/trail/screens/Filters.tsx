import { useMemo } from 'react';
import { useTrailTheme } from '../theme';
import { useI18n, TAGS } from '../../../i18n';
import { Icon } from '../components/Icon';
import { DifficultyGlyph } from '../components/DifficultyGlyph';
import { SectionLabel } from '../primitives';
import {
  diffTile,
  iconBox,
  lenTile,
  MONO,
  tagChip,
  transportTile,
} from '../styles';
import { filterCandidates } from '../../../api/mock';
import { isMockMode } from '../../../api/client';
import { DEFAULT_FILTERS, type FilterState } from '../../../store';
import type { Difficulty, LengthBucket, TransportMode } from '../../../types';

interface Props {
  statusH: number;
  bottomH: number;
  filters: FilterState;
  setFilters: (updater: ((f: FilterState) => FilterState) | FilterState) => void;
  locationLabel: string | null;
  rejectedHikeIds: string[];
  onClearRejected: () => void;
  onBack: () => void;
  onSearch: () => void;
}

export function Filters({
  statusH,
  bottomH,
  filters,
  setFilters,
  locationLabel,
  rejectedHikeIds,
  onClearRejected,
  onBack,
  onSearch,
}: Props) {
  const C = useTrailTheme();
  const { L, lang } = useI18n();
  const mockMode = isMockMode();

  const candidateCount = useMemo(
    () =>
      mockMode
        ? filterCandidates({
            difficulty: filters.difficulty,
            maxTravelMinutes: filters.maxTravel,
            transport: filters.transport,
            lengthBucket: filters.length ?? undefined,
            tags: filters.tags,
            avoid: filters.avoid,
            rejectedHikeIds,
          }).length
        : null,
    [mockMode, filters, rejectedHikeIds],
  );

  const togTag = (id: string) =>
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(id) ? f.tags.filter((x) => x !== id) : [...f.tags, id],
    }));
  const togDiff = (id: Difficulty) =>
    setFilters((f) => ({
      ...f,
      difficulty: f.difficulty.includes(id)
        ? f.difficulty.filter((x) => x !== id)
        : [...f.difficulty, id],
    }));
  const setLen = (l: LengthBucket) =>
    setFilters((f) => ({ ...f, length: f.length === l ? null : l }));
  const setTransport = (t: TransportMode) => setFilters((f) => ({ ...f, transport: t }));
  const togAvoidSteep = () =>
    setFilters((f) => ({
      ...f,
      avoid: f.avoid.includes('steep') ? f.avoid.filter((x) => x !== 'steep') : [...f.avoid, 'steep'],
    }));

  const resetLink: React.CSSProperties = {
    background: 'transparent',
    border: 0,
    padding: 0,
    color: C.graphite,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    cursor: 'pointer',
    minHeight: 44,
  };

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
          padding: `${statusH - 14}px 20px 14px`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${C.hairline}`,
          background: C.paper,
        }}
      >
        <button onClick={onBack} aria-label={L.backLabel} className="ta-tap" style={iconBox(C)}>
          <Icon name="arrowL" size={18} color={C.ink} />
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              fontWeight: 600,
              color: C.vermillion,
              letterSpacing: 1,
            }}
          >
            {L.breadcrumbSearch}
          </div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: 1.1,
              marginTop: 2,
            }}
          >
            {L.filters}
          </div>
        </div>
        {locationLabel && (
          <div
            style={{
              padding: '5px 10px',
              background: C.snow,
              borderRadius: 4,
              border: `1px solid ${C.hairline}`,
              fontSize: 12,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Icon name="location" size={11} color={C.vermillion} strokeWidth={2} />
            {locationLabel}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 20px 20px',
          color: C.ink,
        }}
      >
        <SectionLabel num={1} label={L.difficulty} C={C} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((lv) => {
            const active = filters.difficulty.includes(lv);
            return (
              <button
                key={lv}
                onClick={() => togDiff(lv)}
                aria-pressed={active}
                className="ta-tap"
                style={diffTile(C, active)}
              >
                <DifficultyGlyph
                  level={lv}
                  color={active ? C.vermillionInk : C.ink}
                  soft={active ? 'rgba(255,255,255,0.3)' : C.hairline}
                />
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>
                  {lv === 'easy' ? L.easy : lv === 'medium' ? L.medium : L.hard}
                </span>
              </button>
            );
          })}
        </div>

        <SectionLabel num={2} label={L.length} C={C} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {(
            [
              { id: 'under_5km', sub: '<5' },
              { id: '5_10km', sub: '5–10' },
              { id: '10km_plus', sub: '10+' },
            ] as { id: LengthBucket; sub: string }[]
          ).map((o) => {
            const active = filters.length === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setLen(o.id)}
                aria-pressed={active}
                className="ta-tap"
                style={lenTile(C, active)}
              >
                <div
                  style={{
                    fontFamily: '"Bricolage Grotesque"',
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: -0.8,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {o.sub}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: active ? 'rgba(250,248,242,0.7)' : C.graphite,
                    marginTop: 4,
                    letterSpacing: 0.2,
                    fontWeight: 500,
                  }}
                >
                  km
                </div>
              </button>
            );
          })}
        </div>

        <SectionLabel num={3} label={L.transport} C={C} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {(
            [
              { id: 'car', label: L.car, icon: 'car' },
              { id: 'public_transport', label: L.publicTransport, icon: 'bus' },
              { id: 'walk', label: L.walk, icon: 'foot' },
            ] as { id: TransportMode; label: string; icon: string }[]
          ).map((o) => {
            const active = filters.transport === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setTransport(o.id)}
                aria-pressed={active}
                className="ta-tap"
                style={transportTile(C, active)}
              >
                <Icon name={o.icon} size={18} color={active ? C.vermillionInk : C.ink} />
                <span style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{o.label}</span>
              </button>
            );
          })}
        </div>

        <SectionLabel
          num={4}
          label={L.maxTravel}
          right={`${filters.maxTravel} ${L.minutes}`}
          C={C}
        />
        <div style={{ position: 'relative', padding: '4px 0 0', color: C.ink }}>
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={filters.maxTravel}
            onChange={(e) => setFilters((f) => ({ ...f, maxTravel: +e.target.value }))}
            className="trail-range"
            style={
              {
                ['--trail-thumb' as 'color']: C.vermillion,
              } as React.CSSProperties
            }
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: MONO,
              fontSize: 10,
              color: C.sub,
              marginTop: 6,
              letterSpacing: 0.4,
            }}
          >
            <span>15</span>
            <span>30</span>
            <span>60</span>
            <span>90</span>
            <span>120</span>
          </div>
        </div>

        <SectionLabel num={5} label={L.tagsLabel} C={C} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TAGS.map((tag) => {
            const active = filters.tags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => togTag(tag.id)}
                aria-pressed={active}
                className="ta-tap"
                style={tagChip(C, active)}
              >
                <Icon
                  name={tag.icon}
                  size={14}
                  color={active ? C.vermillionInk : C.graphite}
                  strokeWidth={1.8}
                />
                <span>{lang === 'no' ? tag.no : tag.en}</span>
              </button>
            );
          })}
        </div>

        <SectionLabel num={6} label={L.avoid} C={C} />
        <button
          onClick={togAvoidSteep}
          aria-pressed={filters.avoid.includes('steep')}
          className="ta-tap"
          style={tagChip(C, filters.avoid.includes('steep'))}
        >
          <Icon
            name="elev"
            size={14}
            color={filters.avoid.includes('steep') ? C.vermillionInk : C.graphite}
            strokeWidth={1.8}
          />
          <span>{L.avoidSteep}</span>
        </button>

        <div
          style={{
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
            marginTop: 22,
            paddingTop: 16,
            borderTop: `1px solid ${C.hairlineSoft}`,
          }}
        >
          <button onClick={() => setFilters(DEFAULT_FILTERS)} style={resetLink}>
            {L.resetFilters}
          </button>
          {rejectedHikeIds.length > 0 && (
            <button onClick={onClearRejected} style={resetLink}>
              {L.clearRejected(rejectedHikeIds.length)}
            </button>
          )}
        </div>

        {candidateCount === 0 && (
          <div
            role="status"
            style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 4,
              background: C.cautionTint,
              border: `1px solid ${C.caution}`,
              color: C.ink,
              fontSize: 13.5,
              lineHeight: 1.45,
            }}
          >
            {L.filtersNoMatch}
          </div>
        )}

        <div style={{ height: 50 }} />
      </div>

      <div
        style={{
          padding: `14px 20px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.paper} 70%, transparent)`,
          borderTop: `1px solid ${C.hairline}`,
        }}
      >
        <button
          onClick={onSearch}
          disabled={candidateCount === 0}
          className="ta-tap"
          style={{
            height: 58,
            width: '100%',
            border: 0,
            borderRadius: 6,
            background: C.vermillion,
            color: C.vermillionInk,
            fontFamily: 'inherit',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: -0.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            cursor: 'pointer',
            opacity: candidateCount === 0 ? 0.55 : 1,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Icon name="compass" size={18} color={C.vermillionInk} strokeWidth={1.8} />
            {L.findHike}
          </span>
          {candidateCount !== null && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                opacity: 0.85,
                letterSpacing: 0.5,
                padding: '4px 8px',
                background: 'rgba(250,248,242,0.18)',
                borderRadius: 4,
              }}
            >
              {String(candidateCount).padStart(2, '0')} {L.candidates}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
