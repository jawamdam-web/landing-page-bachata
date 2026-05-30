import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookieConsent } from './useCookieConsent';

const STORAGE_KEY = 'bachatanapoli.cookie-consent';

describe('useCookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initial state gdy brak localStorage = { analytics: null, timestamp: null }', () => {
    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.consent).toEqual({
      analytics: null,
      timestamp: null,
    });
  });

  it('acceptAll() zapisuje { analytics: true, timestamp: <number> } w localStorage', () => {
    const before = Date.now();
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptAll();
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      analytics: unknown;
      timestamp: unknown;
    };
    expect(stored.analytics).toBe(true);
    expect(typeof stored.timestamp).toBe('number');
    expect(stored.timestamp as number).toBeGreaterThanOrEqual(before);
  });

  it('acceptAll() aktualizuje stan hooka na { analytics: true }', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptAll();
    });

    expect(result.current.consent.analytics).toBe(true);
    expect(result.current.consent.timestamp).not.toBeNull();
  });

  it('acceptEssentialOnly() zapisuje { analytics: false, timestamp: <number> } w localStorage', () => {
    const before = Date.now();
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptEssentialOnly();
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      analytics: unknown;
      timestamp: unknown;
    };
    expect(stored.analytics).toBe(false);
    expect(typeof stored.timestamp).toBe('number');
    expect(stored.timestamp as number).toBeGreaterThanOrEqual(before);
  });

  it('acceptEssentialOnly() aktualizuje stan hooka na { analytics: false }', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptEssentialOnly();
    });

    expect(result.current.consent.analytics).toBe(false);
    expect(result.current.consent.timestamp).not.toBeNull();
  });

  it('po zapisaniu decyzji (analytics: true) nowy renderHook czyta z localStorage', () => {
    // Arrange: zapisz decyzję w storage
    const saved = { analytics: true, timestamp: 1234567890 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    // Act: nowy mount (symulacja reload)
    const { result } = renderHook(() => useCookieConsent());

    // Assert: hook zwraca zapisaną decyzję
    expect(result.current.consent.analytics).toBe(true);
    expect(result.current.consent.timestamp).toBe(1234567890);
  });

  it('po zapisaniu decyzji (analytics: false) nowy renderHook czyta z localStorage', () => {
    const saved = { analytics: false, timestamp: 9999999999 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.consent.analytics).toBe(false);
    expect(result.current.consent.timestamp).toBe(9999999999);
  });

  it('uszkodzone dane w localStorage → zwraca initial state', () => {
    localStorage.setItem(STORAGE_KEY, 'INVALID_JSON{{{');

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.consent).toEqual({
      analytics: null,
      timestamp: null,
    });
  });
});
