import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

describe('Welcome screen — moss variant', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('naertur.lang.v1', JSON.stringify('no'));
    window.localStorage.setItem('naertur.variant.override', JSON.stringify('moss'));
  });

  it('renders the Norwegian tagline and both location CTAs', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Én tapp/);
    expect(screen.getByRole('button', { name: /Bruk min posisjon/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Velg sted/ })).toBeInTheDocument();
  });
});
