-- =============================================================================
-- Migration 0002 — profiles + handle_new_user trigger
-- =============================================================================
--
-- Cel:
--   1. Tabela public.profiles (1:1 z auth.users via shared `id`).
--   2. RLS: user widzi/edytuje TYLKO swój profil (id = auth.uid()).
--   3. Trigger handle_new_user() na INSERT do auth.users → auto-create profile
--      z metadanymi Google (display_name, avatar_url) lub email-derived defaults.
--   4. Trigger touch_updated_at() — utrzymuje profiles.updated_at na UPDATE.
--
-- Konwencje (z migracji 0001 — RLS-on-default):
--   - ENABLE ROW LEVEL SECURITY zaraz po CREATE TABLE.
--   - Policies używają (select auth.uid()) — subquery cache per-statement.
--   - Policies używają auth.uid() (UUID immutable), nie auth.email().
--   - Funkcje SECURITY DEFINER mają `set search_path = ''` + fully-qualified
--     nazwy (public.profiles, auth.users) — ochrona przed search_path hijacking.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: public.profiles
-- -----------------------------------------------------------------------------
-- `id` jest jednocześnie PK i FK do auth.users.id — model jeden-do-jednego.
-- ON DELETE CASCADE: usunięcie użytkownika w auth.users kasuje jego profil.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil użytkownika 1:1 z auth.users. Auto-tworzony przez trigger handle_new_user na sign-up.';
comment on column public.profiles.display_name is
  'Nazwa wyświetlana. Default: full_name/name z Google metadata lub część emaila przed @.';
comment on column public.profiles.avatar_url is
  'URL awatara z Google OAuth (raw_user_meta_data.avatar_url/picture). NULL dla email signup.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- SELECT: tylko własny profil.
create policy "profiles: owner can select"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- UPDATE: tylko własny profil (using + with check, żeby nie dało się przepisać
-- `id` na cudze ani zaktualizować cudzego rekordu).
create policy "profiles: owner can update"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Brak INSERT policy dla authenticated — INSERT robi WYŁĄCZNIE trigger
-- handle_new_user (SECURITY DEFINER, bypass RLS). User nie tworzy profilu sam.
-- Brak DELETE policy — profil znika tylko przez ON DELETE CASCADE z auth.users.

-- -----------------------------------------------------------------------------
-- Function: public.handle_new_user()
-- -----------------------------------------------------------------------------
-- Trigger AFTER INSERT na auth.users. Tworzy odpowiadający wiersz profiles.
--
-- display_name fallback chain:
--   1. raw_user_meta_data ->> 'full_name' (Google)
--   2. raw_user_meta_data ->> 'name'      (Google alternatywne pole)
--   3. część emaila przed '@'             (email signup / brak metadata)
--   4. 'Użytkownik'                       (ostateczny fallback gdy email NULL)
--
-- avatar_url:
--   raw_user_meta_data ->> 'avatar_url' lub 'picture' (Google) — NULL gdy brak.
--
-- SECURITY DEFINER: musi pisać do public.profiles przy ENABLED RLS (brak INSERT
-- policy dla authenticated). set search_path = '' + fully-qualified nazwy.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  resolved_display_name text;
begin
  resolved_display_name := coalesce(
    nullif(meta ->> 'full_name', ''),
    nullif(meta ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Użytkownik'
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    resolved_display_name,
    coalesce(nullif(meta ->> 'avatar_url', ''), nullif(meta ->> 'picture', ''))
  );

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Trigger fn (AFTER INSERT auth.users): auto-tworzy public.profiles z Google metadata lub email-derived display_name.';

-- Trigger musi siedzieć na auth.users — dlatego SECURITY DEFINER fn (właściciel
-- = superuser migracji ma prawo do auth schema).
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Function + trigger: public.touch_updated_at()
-- -----------------------------------------------------------------------------
-- Utrzymuje profiles.updated_at = now() przy każdym UPDATE. BEFORE UPDATE,
-- żeby zmodyfikować NEW przed zapisem. SECURITY INVOKER — nie eskaluje uprawnień.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.touch_updated_at() is
  'Trigger fn (BEFORE UPDATE): ustawia updated_at = now(). Reusable dla tabel z kolumną updated_at.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

-- =============================================================================
-- KONIEC migracji 0002.
-- Następna migracja (IU-6+): public.videos + public.folders.
-- =============================================================================
