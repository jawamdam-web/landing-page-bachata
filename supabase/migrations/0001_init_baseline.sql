-- =============================================================================
-- Migration 0001 — init baseline
-- =============================================================================
--
-- Cel: zero business tables. Tylko fundament:
--   1. Włącz extensions używane w całym projekcie (pgcrypto, uuid-ossp).
--   2. Utwórz schema `private` na helpery RLS (nie eksponowana przez PostgREST).
--   3. Helper `private.is_owner(uuid)` — wzorzec do reuse w policies.
--
-- KONWENCJA PROJEKTU — MANDATORY RLS-on-default
-- -----------------------------------------------------------------------------
-- Każda nowa tabela w `public` schema, która przechowuje dane użytkowników
-- (lub jest powiązana z `auth.users`), MUSI spełniać poniższe warunki —
-- bez wyjątków. Brak któregokolwiek = security review FAIL i blokada merge.
--
--   1. `ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;` (zaraz po `CREATE TABLE`)
--   2. Minimum 1 explicit policy per akcja (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
--      lub świadomy `REVOKE ALL` jeśli tabela jest service-role-only (np. audit log).
--   3. Policies używają `(SELECT auth.uid())`, **nie** `auth.uid()` bezpośrednio —
--      subquery jest cache'owana per-statement i daje ~50× lepszy throughput
--      przy bulk operacjach (źródło: Supabase RLS performance guide).
--   4. Policies używają `auth.uid()` (UUID, immutable), **nie** `auth.email()`
--      ani `auth.jwt() -> 'email'` — email jest mutowalny i pozwala na
--      hijacking po zmianie emaila ofiary.
--   5. Service role key (`SUPABASE_SERVICE_ROLE_KEY`) wolno używać TYLKO
--      w Edge Functions (bypass RLS). Nigdy w kliencie/froncie.
--
-- Wzorzec policy (do kopiowania w kolejnych migracjach):
--
--   create policy "owners can select"
--     on public.<table> for select to authenticated
--     using ((select auth.uid()) = user_id);
--
--   create policy "owners can insert"
--     on public.<table> for insert to authenticated
--     with check ((select auth.uid()) = user_id);
--
--   create policy "owners can update"
--     on public.<table> for update to authenticated
--     using ((select auth.uid()) = user_id)
--     with check ((select auth.uid()) = user_id);
--
--   create policy "owners can delete"
--     on public.<table> for delete to authenticated
--     using ((select auth.uid()) = user_id);
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
-- pgcrypto: `gen_random_uuid()` (PK default), `gen_random_bytes()` (share tokens IU-10+).
-- uuid-ossp: dodatkowe funkcje uuid (v1/v3/v5) — przydatne np. dla deterministic ids.
-- Instalowane w `extensions` schema (nie `public`) zgodnie z Supabase best practice.
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- -----------------------------------------------------------------------------
-- private schema — helpery niepubliczne
-- -----------------------------------------------------------------------------
-- Schema `private` NIE jest eksponowana przez PostgREST (patrz config.toml:
-- `[api] schemas = ["public", "graphql_public"]`). Trzymamy tu funkcje
-- używane WYŁĄCZNIE wewnętrznie w policies/triggerach.
create schema if not exists private;

-- Zabieramy domyślny `USAGE` dla `public` (anon/authenticated) — żeby
-- przypadkowa funkcja `private.foo()` nie była wywoływalna z PostgREST.
revoke usage on schema private from public;
revoke all on all functions in schema private from public;

-- -----------------------------------------------------------------------------
-- Helper: private.is_owner(record_user_id uuid)
-- -----------------------------------------------------------------------------
-- Reusable predicate dla RLS policies typu "owner only".
-- Używaj zamiast `(select auth.uid()) = user_id` gdy chcesz mieć
-- jeden punkt zmiany (np. dodać sprawdzenie roli admin w przyszłości).
--
-- SECURITY INVOKER (default) — funkcja działa z uprawnieniami wywołującego.
-- NIE jest to escalator — zwraca tylko boolean na podstawie auth.uid().
create or replace function private.is_owner(record_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select (select auth.uid()) = record_user_id;
$$;

comment on function private.is_owner(uuid) is
  'RLS helper: true gdy zalogowany użytkownik jest właścicielem rekordu. Używaj w policies typu "owners only".';

-- -----------------------------------------------------------------------------
-- KONIEC migracji 0001.
-- Następna migracja (IU-4+): public.profiles z trigger handle_new_user.
-- =============================================================================
