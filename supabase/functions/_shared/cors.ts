/**
 * Shared CORS headers dla Supabase Edge Functions.
 * Używaj w każdej funkcji dla obsługi preflight OPTIONS.
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const;

/** Odpowiedź na preflight OPTIONS request. */
export function corsPreflightResponse(): Response {
  return new Response('ok', { headers: CORS_HEADERS });
}
