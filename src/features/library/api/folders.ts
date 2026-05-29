/**
 * Folders API — cienka typowana warstwa nad Supabase.
 *
 * Konwencje (spójne z videos.ts i auth.ts):
 * - Każda funkcja rzuca przy błędzie Supabase.
 * - RLS izoluje foldery per user_id — wołający nie przekazuje userId.
 * - Foldery sortowane name ASC (alfabetycznie) dla spójnego UX.
 *
 * Kody błędów PostgreSQL:
 * - 23505 — unique_violation (duplicate folder name, case-insensitive)
 */

import { supabase } from '@/lib/supabase';
import type { Folder, VideoFolder } from '../types';

/** Rzuca przy błędzie Supabase — zachowuje oryginalny obiekt błędu z `.code`. */
function throwIfError(error: { message: string; code?: string } | null): void {
  if (error) {
    const err = new Error(error.message) as Error & { code?: string };
    err.code = error.code;
    throw err;
  }
}

/**
 * Sprawdza czy błąd to unique_violation PostgreSQL (kod 23505).
 * Używa `.code` z PostgrestError — stabilny PG error code.
 */
export function isDuplicateFolderError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === '23505'
  );
}

/**
 * Zwraca wszystkie foldery zalogowanego użytkownika, posortowane alfabetycznie.
 * RLS gwarantuje izolację per user_id.
 */
export async function getFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('name', { ascending: true });

  throwIfError(error);
  return data ?? [];
}

/**
 * Tworzy nowy folder dla zalogowanego użytkownika.
 * Rzuca Error z kodem `23505` jeśli folder o tej nazwie (case-insensitive) już istnieje.
 * user_id pochodzi z getSession() (cache-first, bez network call) — kolumna NOT NULL
 * wymaga jawnego user_id przy INSERT; RLS and check zusätzlich egzekwuje ownership.
 */
export async function createFolder(name: string): Promise<Folder> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('folders')
    .insert({ name, user_id: session.user.id })
    .select()
    .single();

  throwIfError(error);

  if (!data) {
    throw new Error('Nie udało się utworzyć folderu.');
  }

  return data;
}

/**
 * Aktualizuje nazwę folderu.
 * RLS gwarantuje że tylko właściciel może edytować.
 * Rzuca Error z kodem `23505` przy duplikacie nazwy.
 */
export async function updateFolder(id: string, name: string): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);

  if (!data) {
    throw new Error('Nie udało się zaktualizować folderu.');
  }

  return data;
}

/**
 * Usuwa folder.
 * CASCADE w schemacie usuwa powiązane wiersze z `video_folders`,
 * ale NIE usuwa filmów z tabeli `videos`.
 * RLS gwarantuje że tylko właściciel może usuwać.
 */
export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  throwIfError(error);
}

/**
 * Zwraca aktualne przypisania folder_id dla danego video.
 */
export async function getVideoFolderIds(videoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('video_folders')
    .select('folder_id')
    .eq('video_id', videoId);

  throwIfError(error);

  return ((data as Pick<VideoFolder, 'folder_id'>[]) ?? []).map(
    (row) => row.folder_id,
  );
}

/**
 * Przypisuje film do listy folderów (diff and apply).
 * - Oblicza diff między aktualnymi a docelowymi folderIds
 * - INSERT brakujące, DELETE nadmiarowe
 * - Idempotentne — re-assignment do tego samego folderu = no-op
 */
export async function assignVideoToFolders(
  videoId: string,
  targetFolderIds: string[],
): Promise<void> {
  const currentIds = await getVideoFolderIds(videoId);

  const toAdd = targetFolderIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !targetFolderIds.includes(id));

  if (toAdd.length > 0) {
    const inserts = toAdd.map((folderId) => ({
      video_id: videoId,
      folder_id: folderId,
    }));
    const { error } = await supabase.from('video_folders').insert(inserts);
    throwIfError(error);
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('video_folders')
      .delete()
      .eq('video_id', videoId)
      .in('folder_id', toRemove);
    throwIfError(error);
  }
}

/**
 * Usuwa przypisanie konkretnego filmu z konkretnego folderu.
 */
export async function removeVideoFromFolder(
  videoId: string,
  folderId: string,
): Promise<void> {
  const { error } = await supabase
    .from('video_folders')
    .delete()
    .eq('video_id', videoId)
    .eq('folder_id', folderId);

  throwIfError(error);
}
