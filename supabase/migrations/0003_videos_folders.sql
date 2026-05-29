-- =============================================================================
-- Migration 0003 — videos + folders + video_folders (m:n junction)
-- =============================================================================
--
-- Cel:
--   1. Tabela public.videos — metadane filmów per user z trzema źródłami.
--   2. Tabela public.folders — foldery per user (max name 100 znaków).
--   3. Tabela public.video_folders — junction m:n (film może być w wielu folderach).
--   4. RLS: każda tabela izolowana per user_id = auth.uid().
--   5. Reusable trigger touch_updated_at() z migracji 0002 (już istnieje) —
--      montowany na videos i folders.
--   6. Indeksy dla typowych query patterns (list views, uniqueness).
--
-- Konwencje (spójne z migracjami 0001/0002):
--   - ENABLE ROW LEVEL SECURITY zaraz po CREATE TABLE.
--   - Policies używają (select auth.uid()) — subquery cache per-statement.
--   - source CHECK IN ('youtube_link','youtube_upload','meta_embed').
--   - UNIQUE INDEX na (user_id, source, source_id) — brak duplikatów per user.
--   - UNIQUE INDEX na (user_id, lower(name)) — foldery case-insensitive per user.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: public.videos
-- -----------------------------------------------------------------------------
create table public.videos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  source         text not null check (source in ('youtube_link', 'youtube_upload', 'meta_embed')),
  source_url     text not null,
  source_id      text not null,
  title          text not null,
  notes          text,
  thumbnail_url  text,
  embed_html     text,
  duration_seconds integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.videos is
  'Metadane filmów użytkownika. Trzy źródła: youtube_link, youtube_upload, meta_embed. Brak binarnych danych — tylko URL/embed.';
comment on column public.videos.source is
  'Typ źródła: youtube_link (paste linku YT), youtube_upload (upload na konto YT usera), meta_embed (FB/IG public embed).';
comment on column public.videos.source_id is
  'ID zasobu: YT video ID (youtube_link/youtube_upload) lub FB post ID (meta_embed). Wyekstrahowane z source_url.';
comment on column public.videos.embed_html is
  'Surowy HTML embeda — wypełniany tylko dla meta_embed (FB/IG). NULL dla pozostałych źródeł.';

-- RLS
alter table public.videos enable row level security;

create policy "videos: owner can select"
  on public.videos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "videos: owner can insert"
  on public.videos for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "videos: owner can update"
  on public.videos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "videos: owner can delete"
  on public.videos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Indeksy
-- UNIQUE: jeden film per (user, source, source_id) — brak duplikatów per user.
create unique index videos_user_source_source_id_uidx
  on public.videos (user_id, source, source_id);

-- Composite dla typowego list view (wszystkie filmy usera, sortowane).
create index videos_user_created_at_idx
  on public.videos (user_id, created_at desc);

-- Trigger updated_at (touch_updated_at z migracji 0002 już istnieje).
create trigger videos_set_updated_at
  before update on public.videos
  for each row
  execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Table: public.folders
-- -----------------------------------------------------------------------------
create table public.folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.folders is
  'Foldery użytkownika do organizacji filmów. Unikalne case-insensitive per user.';

-- RLS
alter table public.folders enable row level security;

create policy "folders: owner can select"
  on public.folders for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "folders: owner can insert"
  on public.folders for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "folders: owner can update"
  on public.folders for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "folders: owner can delete"
  on public.folders for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Indeksy
-- UNIQUE case-insensitive: "Zumba" i "zumba" to ten sam folder per user.
create unique index folders_user_name_ci_uidx
  on public.folders (user_id, lower(name));

create trigger folders_set_updated_at
  before update on public.folders
  for each row
  execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Table: public.video_folders (junction m:n)
-- -----------------------------------------------------------------------------
create table public.video_folders (
  video_id   uuid not null references public.videos (id) on delete cascade,
  folder_id  uuid not null references public.folders (id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (video_id, folder_id)
);

comment on table public.video_folders is
  'Junction m:n: film może być w wielu folderach, folder może mieć wiele filmów.';

-- RLS — dostęp przez ownership video (video.user_id = auth.uid()).
alter table public.video_folders enable row level security;

create policy "video_folders: owner can select"
  on public.video_folders for select to authenticated
  using (
    video_id in (
      select id from public.videos where user_id = (select auth.uid())
    )
  );

create policy "video_folders: owner can insert"
  on public.video_folders for insert to authenticated
  with check (
    video_id in (
      select id from public.videos where user_id = (select auth.uid())
    )
  );

create policy "video_folders: owner can delete"
  on public.video_folders for delete to authenticated
  using (
    video_id in (
      select id from public.videos where user_id = (select auth.uid())
    )
  );

-- Indeks dla filtered list view (filmy w folderze).
create index video_folders_folder_video_idx
  on public.video_folders (folder_id, video_id);

-- =============================================================================
-- KONIEC migracji 0003.
-- Następna migracja (IU-10): share_tokens dla publicznych linków.
-- =============================================================================
