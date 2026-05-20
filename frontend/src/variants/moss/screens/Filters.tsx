import { useMemo } from 'react';
import { useTheme } from '../theme';
import { useI18n, TAGS } from '../../../i18n';
import { Icon } from '../components/Icon';
import { MiniHeader, Section, Segment } from '../primitives';
import { primaryBtn, tagBtn, transportBtn } from '../styles';
import { hexA } from '../../../format';
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
  const C = useTheme();
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
    color: C.muted,
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
      <MiniHeader
        title={L.filters}
        onBack={onBack}
        C={C}
        statusH={statusH}
        backLabel={L.backLabel}
        right={
          locationLabel ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px 5px 8px',
                borderRadius: 999,
                background: C.chip,
                fontSize: 12.5,
                color: C.muted,
              }}
            >
              <Icon name="location" size={13} color={C.muted} />
              <span style={{ color: C.ink, fontWeight: 500 }}>{locationLabel}</span>
            </div>
          ) : null
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 18px 24px' }}>
        <Section label={L.difficulty} C={C}>
          <Segment
            C={C}
            options={[
              { id: 'easy', label: L.easy, active: filters.difficulty.includes('easy'), onClick: () => togDiff('easy') },
              { id: 'medium', label: L.medium, active: filters.difficulty.includes('medium'), onClick: () => togDiff('medium') },
              { id: 'hard', label: L.hard, active: filters.difficulty.includes('hard'), onClick: () => togDiff('hard') },
            ]}
          />
        </Section>

        <Section label={L.length} C={C}>
          <Segment
            C={C}
            options={[
              { id: 'under_5km', label: L.under5, active: filters.length === 'under_5km', onClick: () => setLen('under_5km') },
              { id: '5_10km', label: L.fiveTen, active: filters.length === '5_10km', onClick: () => setLen('5_10km') },
              { id: '10km_plus', label: L.tenPlus, active: filters.length === '10km_plus', onClick: () => setLen('10km_plus') },
            ]}
          />
        </Section>

        <Section label={L.transport} C={C}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(
              [
                { id: 'car', label: L.car, icon: 'car' },
                { id: 'public_transport', label: L.publicTransport, icon: 'bus' },
                { id: 'walk', label: L.walk, icon: 'foot' },
              ] as { id: TransportMode; label: string; icon: string }[]
            ).map((o) => (
              <button
                key={o.id}
                onClick={() => setTransport(o.id)}
                aria-pressed={filters.transport === o.id}
                style={transportBtn(C, filters.transport === o.id)}
              >
                <Icon name={o.icon} size={20} color={filters.transport === o.id ? C.chipActiveInk : C.ink} />
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section
          label={
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>{L.maxTravel}</span>
              <span style={{ color: C.muted, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                {filters.maxTravel} {L.minutes}
              </span>
            </span>
          }
          C={C}
        >
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={filters.maxTravel}
            onChange={(e) => setFilters((f) => ({ ...f, maxTravel: +e.target.value }))}
            style={
              {
                width: '100%',
                accentColor: C.primary,
                height: 6,
                ['--thumb' as 'color']: C.primary,
              } as React.CSSProperties
            }
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: C.mutedSoft,
              marginTop: 2,
            }}
          >
            <span>15</span>
            <span>60</span>
            <span>120</span>
          </div>
        </Section>

        <Section label={L.tagsLabel} C={C}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map((tag) => {
              const active = filters.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => togTag(tag.id)}
                  aria-pressed={active}
                  style={tagBtn(C, active)}
                >
                  <Icon name={tag.icon} size={16} color={active ? C.chipActiveInk : C.ink} />
                  <span>{lang === 'no' ? tag.no : tag.en}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section label={L.avoid} C={C}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={togAvoidSteep}
              aria-pressed={filters.avoid.includes('steep')}
              style={tagBtn(C, filters.avoid.includes('steep'))}
            >
              <Icon
                name="elev"
                size={16}
                color={filters.avoid.includes('steep') ? C.chipActiveInk : C.ink}
              />
              <span>{L.avoidSteep}</span>
            </button>
          </div>
        </Section>

        <div
          style={{
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${C.border}`,
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
              borderRadius: 12,
              background: hexA(C.caution, 0.12),
              border: `1px solid ${hexA(C.caution, 0.3)}`,
              color: C.ink,
              fontSize: 13.5,
              lineHeight: 1.45,
            }}
          >
            {L.filtersNoMatch}
          </div>
        )}
      </div>

      <div
        style={{
          padding: `14px 18px ${bottomH + 14}px`,
          background: `linear-gradient(to top, ${C.bg} 60%, ${hexA(C.bg, 0)} 100%)`,
        }}
      >
        <button
          onClick={onSearch}
          disabled={candidateCount === 0}
          style={{
            ...primaryBtn(C),
            height: 56,
            fontSize: 17,
            opacity: candidateCount === 0 ? 0.55 : 1,
          }}
        >
          <Icon name="compass" size={22} color={C.primaryInk} />
          {L.findHike}
          {candidateCount !== null && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                opacity: 0.7,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {candidateCount} {L.hikesUnit}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
