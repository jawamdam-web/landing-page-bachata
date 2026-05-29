/**
 * Library feature types — aliasy aplikacyjne dla wierszy z bazy danych.
 *
 * Re-eksportujemy z `@/lib/database.types` (stub ręczny, do regeneracji po
 * uruchomieniu `bun gen-db-types`). Warstwa UI konsumuje Video/Folder/VideoFolder
 * z tego pliku — nigdy bezpośrednio z `Database['public']['Tables']`.
 *
 * Schemat Zod jest źródłem prawdy dla walidacji na granicy API (IU-8).
 * Tu definiujemy tylko aliasy typów z Row.
 */

import type { Tables } from '@/lib/database.types';
import type { VideoSource } from '@/lib/database.types';

/** Wiersz tabeli `public.videos`. */
export type Video = Tables<'videos'>;

/** Wiersz tabeli `public.folders`. */
export type Folder = Tables<'folders'>;

/** Wiersz tabeli `public.video_folders` (junction). */
export type VideoFolder = Tables<'video_folders'>;

/** Dozwolone wartości kolumny `videos.source`. */
export type { VideoSource };

/** Parametry zapytania dla listy filmów. */
export interface GetVideosParams {
  folderId?: string;
}
