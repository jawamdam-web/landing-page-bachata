/**
 * Videos API — cienka typowana warstwa nad Supabase.
 *
 * Konwencje (spójne z auth.ts):
 * - Każda funkcja rzuca przy błędzie Supabase (nie zwraca `{ error }`).
 * - Parametr `folderId` zmienia kształt query (JOIN przez video_folders).
 * - Wyniki sortowane created_at DESC dla spójnego UX.
 */

import { supabase } from '@/lib/supabase';
import type { GetVideosParams, Video } from '../types';

/** Rzuca przy błędzie Supabase. */
function throwIfError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Zwraca filmy zalogowanego użytkownika.
 *
 * - Bez `folderId` → wszystkie filmy, sortowane created_at DESC.
 * - Z `folderId` → tylko filmy przypisane do tego folderu (JOIN video_folders).
 *
 * RLS gwarantuje izolację per user_id — wołający nie musi przekazywać userId.
 */
export async function getVideos(
  params: GetVideosParams = {},
): Promise<Video[]> {
  const { folderId } = params;

  if (folderId) {
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_folders!inner(folder_id)')
      .eq('video_folders.folder_id', folderId)
      .order('created_at', { ascending: false });

    throwIfError(error);
    return (data ?? []) as Video[];
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data ?? [];
}

/**
 * Zwraca pojedynczy film po ID.
 * Rzuca jeśli film nie istnieje lub nie należy do zalogowanego usera (RLS → 0 rows).
 */
export async function getVideoById(id: string): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  throwIfError(error);

  if (!data) {
    throw new Error(`Film o id "${id}" nie został znaleziony.`);
  }

  return data;
}
