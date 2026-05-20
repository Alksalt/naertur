// Variant-agnostic typeahead picker for Norwegian places (SSR-backed).
// Renders a modal dialog with a combobox + listbox, debounced fetch, ARIA
// roles, ESC-to-dismiss, Tab trap and focus restoration. Visuals are entirely
// controlled by the `slots` prop so each variant (moss / trail) can skin it.
//
// Extracted ESC + Tab-trap + focus-restore patterns from the old TownPicker at
// frontend/src/variants/moss/screens/Welcome.tsx:262-296.

import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Location } from '../types';
import type { Strings } from '../i18n';
import { type PlaceResult, searchPlaces } from '../api/places';

export interface PlacePickerSlots {
  modalChrome: CSSProperties;
  modalSurface: CSSProperties;
  searchInput: CSSProperties;
  resultRow: (active: boolean) => CSSProperties;
  resultName: CSSProperties;
  resultMeta: CSSProperties;
  emptyState: CSSProperties;
  closeBtn: CSSProperties;
  status: CSSProperties;
}

export interface PlacePickerProps {
  open: boolean;
  initialQuery?: string;
  near?: Location;
  onPick: (place: { label: string; location: Location }) => void;
  onClose: () => void;
  slots: PlacePickerSlots;
  L: Strings;
  closeIcon: ReactNode;
}

type Status = 'idle' | 'loading' | 'empty' | 'error' | 'offline';

const DEBOUNCE_MS = 180;
const RESULT_LIMIT = 8;
const LIST_ID = 'place-picker-list';

export function PlacePicker({
  open,
  initialQuery = '',
  near,
  onPick,
  onClose,
  slots,
  L,
  closeIcon,
}: PlacePickerProps) {
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [status, setStatus] = useState<Status>('idle');

  // IME composition flag — when true we skip dispatching searches mid-compose
  // so e.g. typing æ/ø/å in Norwegian doesn't fire partial-character queries.
  const composingRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // ESC dismiss + initial focus + focus restoration on unmount.
  // Direct port of Welcome.tsx:262-275 — kept here so the component is
  // self-contained and the host variant doesn't need to wire it.
  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;
    // Defer the focus call so that React has committed the DOM and the input
    // (autoFocus) hasn't already claimed focus a tick later.
    queueMicrotask(() => inputRef.current?.focus());
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previousActive?.focus?.();
    };
  }, [open, onClose]);

  // Live online/offline tracking. Without this, the offline banner only
  // appears when the user types a new query while offline — if they were
  // already typing when the connection dropped, the popup happily keeps
  // showing "Searching…" forever. Listening for window-level `offline` /
  // `online` flips the status immediately, and dropping back to `idle` on
  // reconnect lets the next keystroke (or the in-flight debounced effect)
  // run a fresh search.
  useEffect(() => {
    if (!open) return;
    const handleOffline = () => setStatus('offline');
    const handleOnline = () => setStatus('idle');
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [open]);

  // Debounced search effect. We hold the timeout in a closure-stable ref so
  // re-renders mid-debounce don't lose the in-flight handle. Each fire creates
  // a fresh AbortController whose signal is passed to searchPlaces and which
  // is aborted on rapid retype or unmount.
  useEffect(() => {
    if (!open) return;
    // <2 chars → reset and skip fetch. Matches the backend short-circuit at
    // app/services/places.py and the api client at api/places.ts:97.
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setActiveIndex(-1);
      setStatus('idle');
      return;
    }
    // Offline guard — `navigator.onLine` is `true` by default in jsdom; tests
    // toggle it via Object.defineProperty before typing.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setResults([]);
      setActiveIndex(-1);
      setStatus('offline');
      return;
    }
    // Skip while the IME is composing — we'll fire once compositionend lands
    // because that updates the input value and re-runs this effect.
    if (composingRef.current) return;

    const ac = new AbortController();
    const handle = setTimeout(async () => {
      setStatus('loading');
      try {
        const out = await searchPlaces(trimmed, near, RESULT_LIMIT, ac.signal);
        if (ac.signal.aborted) return;
        setResults(out);
        setActiveIndex(out.length > 0 ? 0 : -1);
        setStatus(out.length === 0 ? 'empty' : 'idle');
      } catch (err) {
        if (ac.signal.aborted) return;
        // AbortError is expected on rapid retype; don't surface it.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
        setActiveIndex(-1);
        setStatus('error');
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(handle);
      ac.abort();
    };
  }, [open, query, near]);

  // Tab trap — keep focus inside the dialog. Ported from Welcome.tsx:279-296.
  const handleTab = useCallback((e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const handleInputKey = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      // Don't react to navigation keys while the IME is composing — the IME
      // own them for candidate selection (this is the standard pattern for
      // Japanese / Chinese / Korean / dead-key European input).
      if (composingRef.current) return;
      if (results.length === 0 && e.key !== 'Escape') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (results.length === 0 ? -1 : (i + 1) % results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) =>
          results.length === 0 ? -1 : (i - 1 + results.length) % results.length,
        );
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && results[activeIndex]) {
          e.preventDefault();
          const p = results[activeIndex];
          onPick({ label: p.name, location: p.location });
        }
      }
      // Escape is handled by the window-level listener above so the input
      // doesn't need to duplicate it.
    },
    [results, activeIndex, onPick],
  );

  if (!open) return null;

  const statusText = (() => {
    switch (status) {
      case 'loading':
        return L.placePickerSearching;
      case 'empty':
        return L.placePickerEmpty;
      case 'error':
        return L.placePickerError;
      case 'offline':
        return L.placePickerOffline;
      default:
        return '';
    }
  })();

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={L.choosePlace}
      onClick={onClose}
      onKeyDown={handleTab}
      style={slots.modalChrome}
    >
      <div onClick={(e) => e.stopPropagation()} style={slots.modalSurface}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{L.choosePlace}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={L.closeLabel}
            style={slots.closeBtn}
            type="button"
          >
            {closeIcon}
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKey}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            // Sync the value once composition lands — Safari sometimes
            // dispatches compositionend after a final input event with the
            // committed value, and sometimes not, so we read it directly.
            setQuery((e.target as HTMLInputElement).value);
          }}
          placeholder={L.placePickerHint}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          // Reflect *popup visibility*, not just results presence. The popup
          // also shows status messages (Searching… / No matches / Offline /
          // error) once the query is long enough to trigger the backend, so
          // expanded=true any time the user can perceive popup content.
          aria-expanded={results.length > 0 || (query.trim().length >= 2 && status !== 'idle')}
          aria-controls={LIST_ID}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex] ? `place-row-${activeIndex}` : undefined
          }
          style={slots.searchInput}
        />

        <ul
          id={LIST_ID}
          role="listbox"
          aria-label={L.choosePlace}
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '12px 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          {results.map((p, i) => {
            const typeLabel = L.placeTypeLabels[p.placeType] ?? p.placeType;
            const meta = [p.kommune, typeLabel].filter(Boolean).join(' · ');
            return (
              <li key={p.id} style={{ listStyle: 'none' }}>
                <button
                  id={`place-row-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  type="button"
                  // `onMouseMove` instead of `onMouseEnter` so the active
                  // index only follows actual pointer motion. With
                  // `onMouseEnter`, a stationary cursor that happens to be
                  // over a row would steal aria-activedescendant from a row
                  // the user is selecting with the keyboard.
                  onMouseMove={() => setActiveIndex(i)}
                  onClick={() => onPick({ label: p.name, location: p.location })}
                  style={slots.resultRow(i === activeIndex)}
                >
                  <span style={slots.resultName}>{p.name}</span>
                  {meta && <span style={slots.resultMeta}>{meta}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {statusText && (
          <div role="status" aria-live="polite" style={slots.status}>
            {statusText}
          </div>
        )}

        {results.length === 0 && status === 'idle' && query.trim().length < 2 && (
          <div style={slots.emptyState} aria-hidden="true">
            {L.placePickerHint}
          </div>
        )}
      </div>
    </div>
  );
}
