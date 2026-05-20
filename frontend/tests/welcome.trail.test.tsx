import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

describe('Welcome screen — trail variant', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('naertur.lang.v1', JSON.stringify('no'));
    window.localStorage.setItem('naertur.variant.override', JSON.stringify('trail'));
  });

  it('renders the split H1 with the vermillion italic "I dag." accent', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Én tapp/);
    // The italic accent phrase is its own span — check both its text content
    // and its presence as part of the H1.
    expect(screen.getByText(/I dag\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bruk min posisjon/ })).toBeInTheDocument();
  });

  it('renders the editorial breadcrumb in mono', () => {
    render(<App />);
    expect(screen.getByText(/NÆRTUR · MØRE OG ROMSDAL · MVP/)).toBeInTheDocument();
  });

  it('exposes the "Velg sted" place picker button (PlacePicker integration)', () => {
    // After the F-trail wave the old TownPicker invocation was replaced with
    // the variant-agnostic PlacePicker; the ghost CTA now reads `L.choosePlace`
    // (Velg sted / Choose a place) instead of the legacy `L.chooseTown`.
    render(<App />);
    expect(screen.getByRole('button', { name: /Velg sted/ })).toBeInTheDocument();
  });
});
