import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveVariant,
  setVariantOverride,
  getVariantOverride,
  OVERRIDE_KEY,
} from '../src/config';

function setLocation(search: string) {
  window.history.replaceState({}, '', `/${search}`);
}

describe('resolveVariant priority chain', () => {
  beforeEach(() => {
    setLocation('');
    window.localStorage.clear();
  });

  it('URL query beats localStorage override', () => {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify('moss'));
    setLocation('?variant=trail');
    expect(resolveVariant()).toBe('trail');
  });

  it('localStorage override beats env default', () => {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify('trail'));
    expect(resolveVariant()).toBe('trail');
  });

  it('falls back to env default (moss) when nothing is pinned', () => {
    expect(resolveVariant()).toBe('moss');
  });

  it('ignores garbage URL values', () => {
    setLocation('?variant=invalid');
    expect(resolveVariant()).toBe('moss');
  });

  it('ignores garbage localStorage values', () => {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify('garbage'));
    expect(resolveVariant()).toBe('moss');
  });

  it('survives malformed JSON in localStorage', () => {
    window.localStorage.setItem(OVERRIDE_KEY, '{not json');
    expect(resolveVariant()).toBe('moss');
  });
});

describe('setVariantOverride / getVariantOverride', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a valid variant', () => {
    setVariantOverride('trail');
    expect(getVariantOverride()).toBe('trail');
  });

  it('null clears the override', () => {
    setVariantOverride('trail');
    setVariantOverride(null);
    expect(getVariantOverride()).toBe(null);
    expect(window.localStorage.getItem(OVERRIDE_KEY)).toBe(null);
  });
});
