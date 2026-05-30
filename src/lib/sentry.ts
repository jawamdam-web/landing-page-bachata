/**
 * Sentry React SDK — init z graceful skip gdy brak DSN.
 *
 * Zasady:
 * - Jeśli brak VITE_SENTRY_DSN → loguje ostrzeżenie i nie inicjalizuje.
 * - browserTracingIntegration z niskim sample rate (0.1) — nie obciąża użytkownika.
 * - replayIntegration tylko dla sesji z błędem (replaysOnErrorSampleRate: 1.0).
 * - Maskowanie wszystkich danych (maskAllText, blockAllMedia) — GDPR.
 * - tracePropagationTargets: tylko Supabase domain.
 */

import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Sanity check formatu — pusty string lub literalny "undefined" z buildu
  // nie powinny trafić do Sentry.init().
  if (!dsn || !dsn.startsWith('https://') || !dsn.includes('@')) {
    if (import.meta.env.DEV) {
      console.warn('Sentry DSN missing — error tracking disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    // replays* na root level (nie w replayIntegration) — zgodnie z typami SDK v9
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    tracePropagationTargets: [/^https:\/\/.*\.supabase\.co/],
    beforeSend(event) {
      // Maskuj email użytkownika przed wysyłką — GDPR
      if (event.user?.email) {
        event.user.email = event.user.email.replace(
          /^(.{2}).*(@.*)$/,
          '$1***$2',
        );
      }
      return event;
    },
  });

  initialized = true;
}

export { Sentry };
