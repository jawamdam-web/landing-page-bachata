import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Supabase client tests.
 *
 * Używamy dynamicznych importów (`await import(...)`) zamiast static, żeby
 * móc:
 *   1. stubować `import.meta.env` przed pierwszym evaluation modułu,
 *   2. resetować cache modułów między testami (każdy test = świeży moduł).
 *
 * Defaultowe wartości env dla testów: zdrowy lokalny stack supabase.
 * Test fail-fast nadpisuje je pustym stringiem.
 */
const VALID_URL = 'http://127.0.0.1:54321';
const VALID_ANON_KEY = 'test-anon-key';

describe('supabase client (singleton + fail-fast)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', VALID_URL);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', VALID_ANON_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('eksportuje singleton — wielokrotny import zwraca tę samą instancję', async () => {
    const first = await import('./supabase');
    const second = await import('./supabase');

    expect(first.supabase).toBe(second.supabase);
  });

  it('zwraca obiekt z metodami klienta Supabase (auth + from)', async () => {
    const { supabase } = await import('./supabase');

    expect(supabase).toBeDefined();
    expect(typeof supabase.auth.getSession).toBe('function');
    expect(typeof supabase.from).toBe('function');
  });

  it('fail-fast: rzuca Error gdy VITE_SUPABASE_URL jest pusty', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');

    await expect(import('./supabase')).rejects.toThrow(
      /VITE_SUPABASE_URL.*VITE_SUPABASE_ANON_KEY/s,
    );
  });

  it('fail-fast: rzuca Error gdy VITE_SUPABASE_ANON_KEY jest pusty', async () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    await expect(import('./supabase')).rejects.toThrow(
      /VITE_SUPABASE_URL.*VITE_SUPABASE_ANON_KEY/s,
    );
  });

  it('error message zawiera instrukcję uruchomienia lokalnego stacku', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');

    await expect(import('./supabase')).rejects.toThrow(/bunx supabase start/);
  });
});
