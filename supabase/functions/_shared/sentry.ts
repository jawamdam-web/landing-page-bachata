/**
 * Sentry wrapper dla Supabase Edge Functions (Deno runtime).
 *
 * UWAGA: @sentry/deno ma ograniczone wsparcie w Supabase Edge Functions
 * (Deno 1.45.x). Implementujemy minimalne stub z console.error fallback
 * i TODO na pełną integrację po upgrade Deno 2.x.
 *
 * TODO: Po upgrade Supabase do Deno 2.x zastąpić stub pełnym:
 *   import * as Sentry from 'npm:@sentry/deno'
 *   Sentry.init({ dsn: Deno.env.get('SENTRY_DSN'), defaultIntegrations: false })
 *
 * withSentry(handler):
 * - Jeśli brak SENTRY_DSN → no-op wrapper (nie crashuje bez klucza).
 * - Jeśli throw → loguje przez console.error + re-throw.
 * - Izolacja per-request przez scope (gotowe pod Deno 2).
 */

type Handler = (req: Request) => Promise<Response>;

export function withSentry(handler: Handler): Handler {
  const dsn = Deno.env.get('SENTRY_DSN');

  if (!dsn) {
    // No-op wrapper — brak DSN nie powinien crashować Edge Function
    return handler;
  }

  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (err) {
      // Minimalne logowanie dopóki @sentry/deno nie jest stabilny w Deno 1.45.x
      // TODO: zastąpić Sentry.withScope + captureException po upgrade Deno 2.x
      console.error('[sentry] Uncaught error in Edge Function:', err);
      throw err;
    }
  };
}
