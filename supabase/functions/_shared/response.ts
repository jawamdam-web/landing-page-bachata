/**
 * Shared response helpers dla Supabase Edge Functions.
 * Standaryzuje format JSON { data } | { error: { code, message } }.
 */

import { CORS_HEADERS } from './cors.ts';

export interface SuccessPayload<T> {
  data: T;
}

export interface ErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

/** JSON success response z CORS headers. */
export function jsonSuccess<T>(data: T, status = 200): Response {
  const body: SuccessPayload<T> = { data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** JSON error response z CORS headers. */
export function jsonError(
  code: string,
  message: string,
  status = 400,
): Response {
  const body: ErrorPayload = { error: { code, message } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
