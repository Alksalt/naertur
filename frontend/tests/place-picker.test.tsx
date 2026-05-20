import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { PlacePicker, type PlacePickerSlots } from '../src/components/PlacePicker';
import { I18N } from '../src/i18n';
import type { PlaceResult } from '../src/api/places';

// Mock the API module so we can drive results deterministically. Both
// exports are stubbed because PlacePicker only uses searchPlaces but the
// module re-exports nearestPlace alongside it, and a real import would
// otherwise pull in the mock-mode short-circuit branch.
vi.mock('../src/api/places', () => ({
  searchPlaces: vi.fn(),
  nearestPlace: vi.fn(),
}));

import { searchPlaces } from '../src/api/places';
const searchPlacesMock = vi.mocked(searchPlaces);

// Minimal style slots — every CSSProperties is an empty object. Tests assert
// on ARIA, text, and call-shape so we don't need real visuals.
const emptyStyle: CSSProperties = {};
const slots: PlacePickerSlots = {
  modalChrome: emptyStyle,
  modalSurface: emptyStyle,
  searchInput: emptyStyle,
  resultRow: () => emptyStyle,
  resultName: emptyStyle,
  resultMeta: emptyStyle,
  emptyState: emptyStyle,
  closeBtn: emptyStyle,
  status: emptyStyle,
};

const L = I18N.no;

const sampleResults: PlaceResult[] = [
  {
    id: 'hjelset-1',
    name: 'Hjelset',
    placeType: 'Tettsted',
    kommune: 'Molde',
    fylke: 'Møre og Romsdal',
    location: { lat: 62.74, lon: 7.32 },
  },
  {
    id: 'molde-1',
    name: 'Molde',
    placeType: 'By',
    kommune: 'Molde',
    fylke: 'Møre og Romsdal',
    location: { lat: 62.7372, lon: 7.1607 },
  },
];

function renderPicker(overrides: Partial<Parameters<typeof PlacePicker>[0]> = {}) {
  const onPick = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <PlacePicker
      open
      onPick={onPick}
      onClose={onClose}
      slots={slots}
      L={L}
      closeIcon={<span aria-hidden="true">×</span>}
      {...overrides}
    />,
  );
  return { ...utils, onPick, onClose };
}

beforeEach(() => {
  searchPlacesMock.mockReset();
  // Default navigator.onLine to true; specific tests override.
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PlacePicker', () => {
  it('renders a combobox with the expected ARIA attributes', () => {
    renderPicker();
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-controls', 'place-picker-list');
    expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
    // The listbox always exists alongside the combobox — even when empty —
    // because aria-controls must resolve to a live element on the page.
    expect(screen.getByRole('listbox', { name: L.choosePlace })).toBeInTheDocument();
  });

  it('debounces input and calls searchPlaces after 180ms with the typed query', async () => {
    vi.useFakeTimers();
    searchPlacesMock.mockResolvedValue(sampleResults);
    renderPicker();
    const combobox = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(combobox, { target: { value: 'Hje' } });

    // Before the debounce window elapses, no fetch should fire.
    expect(searchPlacesMock).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(180);
    });
    expect(searchPlacesMock).toHaveBeenCalledTimes(1);
    expect(searchPlacesMock.mock.calls[0][0]).toBe('Hje');
    // Flush microtasks so the rendered list reflects the resolved promise.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Hjelset');
    expect(options[1]).toHaveTextContent('Molde');
  });

  it('ArrowDown advances activeIndex and updates aria-activedescendant + aria-selected', async () => {
    vi.useFakeTimers();
    searchPlacesMock.mockResolvedValue(sampleResults);
    renderPicker();
    const combobox = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(combobox, { target: { value: 'Hje' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(180);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // After the fetch resolves, activeIndex auto-lands on 0.
    expect(combobox).toHaveAttribute('aria-activedescendant', 'place-row-0');
    let options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');

    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(combobox).toHaveAttribute('aria-activedescendant', 'place-row-1');
    options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('Enter on the active row invokes onPick with the matching place', async () => {
    vi.useFakeTimers();
    searchPlacesMock.mockResolvedValue(sampleResults);
    const { onPick } = renderPicker();
    const combobox = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(combobox, { target: { value: 'Hje' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(180);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Move to row 1 (Molde), then commit with Enter.
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    fireEvent.keyDown(combobox, { key: 'Enter' });

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith({
      label: sampleResults[1].name,
      location: sampleResults[1].location,
    });
  });

  it('Escape on the window triggers onClose', () => {
    const { onClose } = renderPicker();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the offline message and never calls searchPlaces when navigator.onLine is false', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    renderPicker();
    const combobox = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(combobox, { target: { value: 'Hje' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchPlacesMock).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(L.placePickerOffline);
  });
});
