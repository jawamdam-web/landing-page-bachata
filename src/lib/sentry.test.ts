/**
 * Testy dla src/lib/sentry.ts
 *
 * Sprawdza graceful skip gdy brak DSN oraz inicjalizację gdy DSN jest dostępny.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Resetujemy moduł między testami żeby móc testować różne stany DSN
beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('initSentry', () => {
  it('nie crashuje i woła console.warn gdy brak VITE_SENTRY_DSN', async () => {
    // Arrange
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Act
    const { initSentry } = await import('./sentry');
    initSentry();

    // Assert
    expect(warnSpy).toHaveBeenCalledWith(
      'Sentry DSN missing — error tracking disabled',
    );
  });

  it('woła Sentry.init z DSN gdy VITE_SENTRY_DSN jest ustawiony', async () => {
    // Arrange
    const testDsn = 'https://test@sentry.io/123456';
    vi.stubEnv('VITE_SENTRY_DSN', testDsn);

    const initMock = vi.fn();
    vi.doMock('@sentry/react', () => ({
      init: initMock,
      browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
      replayIntegration: vi.fn(() => ({ name: 'Replay' })),
    }));

    // Act
    const { initSentry } = await import('./sentry');
    initSentry();

    // Assert
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: testDsn,
      }),
    );
  });
});
