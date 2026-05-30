/**
 * Testy dla src/lib/analytics.ts
 *
 * Weryfikuje consent guard i trackEvent behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isAnalyticsEnabled, trackEvent, initAnalytics } from './analytics';

const CONSENT_KEY = 'bachatanapoli.cookie-consent';

beforeEach(() => {
  localStorage.clear();
  // Wyczyść wstrzyknięty skrypt jeśli istnieje
  const existing = document.getElementById('plausible-analytics');
  existing?.remove();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('isAnalyticsEnabled', () => {
  it('zwraca false gdy brak klucza w localStorage', () => {
    // Arrange — localStorage jest pusty (beforeEach)

    // Act
    const result = isAnalyticsEnabled();

    // Assert
    expect(result).toBe(false);
  });

  it('zwraca false gdy analytics = false w localStorage', () => {
    // Arrange
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ analytics: false, necessary: true }),
    );

    // Act
    const result = isAnalyticsEnabled();

    // Assert
    expect(result).toBe(false);
  });

  it('zwraca true gdy analytics = true w localStorage', () => {
    // Arrange
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ analytics: true, necessary: true }),
    );

    // Act
    const result = isAnalyticsEnabled();

    // Assert
    expect(result).toBe(true);
  });

  it('zwraca false gdy localStorage zawiera nieprawidłowy JSON', () => {
    // Arrange
    localStorage.setItem(CONSENT_KEY, 'invalid-json');

    // Act
    const result = isAnalyticsEnabled();

    // Assert
    expect(result).toBe(false);
  });
});

describe('trackEvent', () => {
  it('jest no-op gdy analytics = false w localStorage', () => {
    // Arrange
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false }));
    const plausibleMock = vi.fn();
    (window as { plausible?: unknown }).plausible = plausibleMock;

    // Act
    trackEvent('test_event', { source: 'hero' });

    // Assert
    expect(plausibleMock).not.toHaveBeenCalled();
  });

  it('jest no-op gdy brak consent w localStorage', () => {
    // Arrange — localStorage pusty
    const plausibleMock = vi.fn();
    (window as { plausible?: unknown }).plausible = plausibleMock;

    // Act
    trackEvent('test_event');

    // Assert
    expect(plausibleMock).not.toHaveBeenCalled();
  });

  it('woła window.plausible z poprawnym eventem gdy analytics = true', () => {
    // Arrange
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true }));
    const plausibleMock = vi.fn();
    (window as { plausible?: unknown }).plausible = plausibleMock;

    // Act
    trackEvent('signup_click', { source: 'hero_cta' });

    // Assert
    expect(plausibleMock).toHaveBeenCalledWith('signup_click', {
      props: { source: 'hero_cta' },
    });
  });

  it('woła window.plausible bez props gdy nie przekazano props', () => {
    // Arrange
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true }));
    const plausibleMock = vi.fn();
    (window as { plausible?: unknown }).plausible = plausibleMock;

    // Act
    trackEvent('page_view');

    // Assert
    expect(plausibleMock).toHaveBeenCalledWith('page_view', undefined);
  });
});

describe('initAnalytics', () => {
  it('nie wstrzykuje skryptu gdy brak zgody', () => {
    // Arrange
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false }));

    // Act
    initAnalytics();

    // Assert
    const script = document.getElementById('plausible-analytics');
    expect(script).toBeNull();
  });

  it('wstrzykuje skrypt gdy zgoda = true', () => {
    // Arrange
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true }));

    // Act
    initAnalytics();

    // Assert
    const script = document.getElementById('plausible-analytics');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('data-domain')).toBeTruthy();
  });
});
