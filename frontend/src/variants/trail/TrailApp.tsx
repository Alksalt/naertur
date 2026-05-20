import { useCallback, useEffect, useRef, useState } from 'react';
import { I18nContext, I18N } from '../../i18n';
import { TRAIL_PALETTES, TrailThemeContext } from './theme';
import { useFilters, useRejected, useLang, useTrailThemeName } from '../../store';
import { Welcome } from './screens/Welcome';
import { Filters } from './screens/Filters';
import { Finding } from './screens/Finding';
import { Result } from './screens/Result';
import { Detail } from './screens/Detail';
import { ErrorBanner } from './ErrorBanner';
import { MockBadge } from '../../components/MockBadge';
import { randomHike, NoCandidatesError, StaleSearchError } from '../../api/client';
import type { Location, Screen, UiSearchResponse } from '../../types';
import './animations.css';

const STATUS_H = 60;
const BOTTOM_H = 34;

export function TrailApp() {
  const [lang, setLang] = useLang();
  const [themeName, setThemeName] = useTrailThemeName();
  const [filters, setFilters] = useFilters();
  const [rejected, setRejected] = useRejected();

  const [screen, setScreen] = useState<Screen>('welcome');
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [coords, setCoords] = useState<Location | null>(null);
  const [result, setResult] = useState<UiSearchResponse | null>(null);
  const [searchError, setSearchError] = useState<'no_candidates' | 'error' | null>(null);
  const [phase, setPhase] = useState<number>(0);
  const searchRunId = useRef(0);

  const palette = TRAIL_PALETTES[themeName] ?? TRAIL_PALETTES.trailhead;
  const L = I18N[lang];

  // Guards async setState across unmount — same pattern as MossApp.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.style.setProperty('--bg', palette.paper);
    document.documentElement.style.setProperty('--ink', palette.ink);
    document.documentElement.style.setProperty('--thumb', palette.vermillion);
    document.documentElement.style.setProperty('--trail-thumb', palette.vermillion);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', palette.vermillion);
    document.body.style.background = palette.paper;
  }, [lang, palette]);

  const runSearch = useCallback(
    async (overrideRejected?: string[]) => {
      const myRun = ++searchRunId.current;
      setScreen('finding');
      setPhase(0);
      setSearchError(null);
      const t1 = setTimeout(() => setPhase(1), 700);
      const t2 = setTimeout(() => setPhase(2), 1300);
      const t3 = setTimeout(() => setPhase(3), 1900);
      const minDelay = new Promise<void>((r) => setTimeout(r, 2200));
      try {
        const [r] = await Promise.all([
          randomHike({
            location: coords ?? undefined,
            difficulty: filters.difficulty,
            maxTravelMinutes: filters.maxTravel,
            transport: filters.transport,
            lengthBucket: filters.length ?? undefined,
            tags: filters.tags,
            avoid: filters.avoid,
            rejectedHikeIds: overrideRejected ?? rejected,
          }),
          minDelay,
        ]);
        if (!mountedRef.current || myRun !== searchRunId.current) return;
        setResult(r);
        setScreen('result');
      } catch (e) {
        if (e instanceof StaleSearchError) return;
        if (!mountedRef.current || myRun !== searchRunId.current) return;
        const msg = e instanceof NoCandidatesError ? 'no_candidates' : 'error';
        setSearchError(msg);
        setScreen('filters');
      } finally {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      }
    },
    [filters, coords, rejected],
  );

  const handleCancelFinding = useCallback(() => {
    searchRunId.current += 1;
    setScreen('filters');
  }, []);

  const handleLocationGranted = useCallback(
    (label: string, _sub?: string, c?: Location) => {
      setLocationLabel(label);
      if (c) setCoords(c);
      setScreen('filters');
    },
    [],
  );

  const handleAnother = useCallback(() => runSearch(), [runSearch]);

  const handleReject = useCallback(() => {
    if (!result) return;
    const next = [...rejected, result.hike.id];
    setRejected(next);
    runSearch(next);
  }, [result, rejected, setRejected, runSearch]);

  const handleClearRejected = useCallback(() => setRejected([]), [setRejected]);

  let body;
  if (screen === 'welcome') {
    body = (
      <Welcome
        statusH={STATUS_H}
        bottomH={BOTTOM_H}
        lang={lang}
        setLang={setLang}
        themeName={themeName}
        setThemeName={setThemeName}
        onLocationGranted={handleLocationGranted}
      />
    );
  } else if (screen === 'filters') {
    body = (
      <>
        <Filters
          statusH={STATUS_H}
          bottomH={BOTTOM_H}
          filters={filters}
          setFilters={setFilters}
          locationLabel={locationLabel}
          rejectedHikeIds={rejected}
          onClearRejected={handleClearRejected}
          onBack={() => setScreen('welcome')}
          onSearch={() => runSearch()}
        />
        {searchError && <ErrorBanner kind={searchError} onDismiss={() => setSearchError(null)} />}
      </>
    );
  } else if (screen === 'finding') {
    body = <Finding phase={phase} onCancel={handleCancelFinding} />;
  } else if (screen === 'result' && result) {
    body = (
      <Result
        statusH={STATUS_H}
        bottomH={BOTTOM_H}
        result={result}
        onBack={() => setScreen('filters')}
        onMoreInfo={() => setScreen('detail')}
        onAnother={handleAnother}
        onReject={handleReject}
      />
    );
  } else if (screen === 'detail' && result) {
    body = <Detail statusH={STATUS_H} hike={result.hike} onBack={() => setScreen('result')} />;
  } else {
    body = (
      <Welcome
        statusH={STATUS_H}
        bottomH={BOTTOM_H}
        lang={lang}
        setLang={setLang}
        themeName={themeName}
        setThemeName={setThemeName}
        onLocationGranted={handleLocationGranted}
      />
    );
  }

  return (
    <TrailThemeContext.Provider value={palette}>
      <I18nContext.Provider value={{ lang, L }}>
        <div
          className="naertur-app"
          style={{
            margin: '0 auto',
            width: '100%',
            maxWidth: 480,
            minHeight: '100dvh',
            height: '100dvh',
            background: palette.paper,
            color: palette.ink,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.02)',
          }}
        >
          {body}
        </div>
        <MockBadge />
      </I18nContext.Provider>
    </TrailThemeContext.Provider>
  );
}
