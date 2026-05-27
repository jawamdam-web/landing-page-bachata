/**
 * Supabase client — singleton dla całej aplikacji.
 *
 * Plik eksportuje JEDNĄ instancję `supabase` zainicjalizowaną z env vars
 * `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Brak któregokolwiek = throw
 * (fail-fast) — bez tych zmiennych aplikacja nie ma sensu istnieć.
 *
 * UWAGA: nie importuj tego pliku na top-level w `main.tsx` — wymuś leniwy
 * import w hookach/komponentach, żeby dev server (`bun run dev`) nie crashował
 * od razu gdy `.env.local` nie jest jeszcze skonfigurowany (np. świeży clone
 * przed odpaleniem `bunx supabase start`).
 *
 * Konfiguracja:
 * - `auth.persistSession: true` — sesja w localStorage (default)
 * - `auth.autoRefreshToken: true` — odświeżanie JWT w tle (default)
 * - `auth.detectSessionInUrl: true` — parse OAuth callback z URL (default)
 * - Brak `@supabase/ssr` — Vite SPA = client-only, używamy `@supabase/supabase-js`
 *
 * Service role key (`SUPABASE_SERVICE_ROLE_KEY`) NIGDY nie wchodzi tu —
 * używaj go WYŁĄCZNIE w Edge Functions (po stronie serwera, bypass RLS).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase env vars are missing. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY in .env.local. ' +
      'For local dev run `bunx supabase start` and copy values from ' +
      '`bunx supabase status` (API URL + anon key). ' +
      'See README.md → "Local Supabase setup".',
  );
}

/**
 * Typowany Supabase client — singleton.
 *
 * Generic `<Database>` zostanie zasilony przez `bun gen-db-types` po
 * pierwszej business-table migracji. Do tego czasu typy tabel są puste
 * (`Record<string, never>`) — query buildery działają, ale zwracają `unknown`.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
