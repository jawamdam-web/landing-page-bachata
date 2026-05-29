-- =============================================================================
-- Migration 0004 — patch video_folders RLS: dodaj weryfikację folder_id ownership
-- =============================================================================
--
-- Problem (P2-security):
--   INSERT/DELETE policy na video_folders weryfikowała wyłącznie video_id ownership,
--   ale nie sprawdzała czy folder_id należy do tego samego usera.
--   User A mógł INSERT do video_folders z własnym video_id i cudzym folder_id.
--
-- Naprawa:
--   DROP starych policies i CREATE nowych z dodatkowym warunkiem:
--     AND folder_id IN (SELECT id FROM public.folders WHERE user_id = (SELECT auth.uid()))
--
-- Konwencje (spójne z 0003):
--   - (SELECT auth.uid()) zamiast auth.uid() — subquery cache per-statement.
-- =============================================================================

-- DROP starych policies INSERT i DELETE
drop policy if exists "video_folders: owner can insert" on public.video_folders;
drop policy if exists "video_folders: owner can delete" on public.video_folders;

-- Nowa policy INSERT — weryfikuje ownership zarówno video_id jak i folder_id
create policy "video_folders: owner can insert"
  on public.video_folders for insert to authenticated
  with check (
    video_id in (
      select id from public.videos where user_id = (select auth.uid())
    )
    and
    folder_id in (
      select id from public.folders where user_id = (select auth.uid())
    )
  );

-- Nowa policy DELETE — analogicznie weryfikuje oba powiązane rekordy
create policy "video_folders: owner can delete"
  on public.video_folders for delete to authenticated
  using (
    video_id in (
      select id from public.videos where user_id = (select auth.uid())
    )
    and
    folder_id in (
      select id from public.folders where user_id = (select auth.uid())
    )
  );

-- =============================================================================
-- KONIEC migracji 0004.
-- =============================================================================
