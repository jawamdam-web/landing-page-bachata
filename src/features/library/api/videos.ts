/**
 * Videos API — cienka typowana warstwa nad Supabase.
 *
 * Konwencje (spójne z auth.ts):
 * - Każda funkcja rzuca przy błędzie Supabase (nie zwraca `{ error }`).
 * - Parametr `folderId` zmienia kształt query (JOIN przez video_folders).
 * - Wyniki sortowane created_at DESC dla spójnego UX.
 *
 * IU-8 additions:
 * - createVideoFromYoutubeLink(url) — fetch metadata przez Edge Function + INSERT
 * - createVideoFromMetaLink(url) — fetch oEmbed przez Edge Function + INSERT
 * - updateVideo({ id, title, notes }) — edycja tytułu / notatek
 * - deleteVideo(id) — usuwa film z biblioteki
 */

import { supabase } from '@/lib/supabase';
import { parseIso8601Duration } from '@/lib/duration';
import { parseYoutubeUrl, parseMetaUrl } from '@/lib/url-parsers';
import type { GetVideosParams, Video } from '../types';

/** Rzuca przy błędzie Supabase z zachowaniem kodu (np. 23505). */
function throwIfError(error: { message: string; code?: string } | null): void {
  if (error) {
    const err = new Error(error.message) as Error & { code?: string };
    err.code = error.code;
    throw err;
  }
}

/**
 * Zwraca true jeśli błąd to unique_violation PostgreSQL (kod 23505).
 * Używamy do detekcji duplikatów per user (source + source_id).
 */
export function isDuplicateVideoError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === '23505'
  );
}

/**
 * Pobiera Supabase session JWT — potrzebny do autoryzacji Edge Functions.
 * Używa getSession() (cache-first) wystarczający do przekazania tokenu.
 */
async function getSessionToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.access_token;
}

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

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
      .select(
        'id, user_id, source, source_url, source_id, title, notes, thumbnail_url, embed_html, duration_seconds, created_at, updated_at, video_folders!inner(folder_id)',
      )
      .eq('video_folders.folder_id', folderId)
      .order('created_at', { ascending: false });

    throwIfError(error);
    // Mapowanie usuwa artefakt `video_folders` z JOIN — nie jest częścią typu Video
    return (data ?? []).map(
      ({ video_folders: _vf, ...video }) => video as Video,
    );
  }

  const { data, error } = await supabase
    .from('videos')
    .select(
      'id, user_id, source, source_url, source_id, title, notes, thumbnail_url, embed_html, duration_seconds, created_at, updated_at',
    )
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data ?? [];
}

// ─── IU-8 additions ──────────────────────────────────────────────────────────

interface YouTubeMetadataResponse {
  data: {
    title: string;
    description: string;
    thumbnailUrl: string;
    duration: string;
    channelTitle: string;
  };
}

interface MetaEmbedResponse {
  data: {
    embedHtml: string;
    thumbnailUrl: string;
    title: string;
    authorName: string;
  };
  error?: {
    code: string;
    message: string;
    fallback?: string;
  };
}

/**
 * Tworzy film z linku YouTube.
 * 1. Waliduje URL → wyciąga videoId
 * 2. Fetchuje metadata przez Edge Function (ukrywa API key)
 * 3. Insertuje do tabeli videos
 *
 * Rzuca:
 * - 'invalid_youtube_url' gdy URL nieprawidłowy
 * - Error z code '23505' gdy film już istnieje dla tego usera
 */
export async function createVideoFromYoutubeLink(url: string): Promise<Video> {
  const parsed = parseYoutubeUrl(url);
  if (!parsed) {
    const err = new Error(
      'Nie rozpoznaję linku. Wklej URL z YouTube.',
    ) as Error & {
      code: string;
    };
    err.code = 'invalid_youtube_url';
    throw err;
  }

  const { videoId } = parsed;
  const token = await getSessionToken();

  const response = await fetch(
    `${SUPABASE_FUNCTIONS_URL}/fetch-youtube-metadata`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ videoId }),
    },
  );

  if (!response.ok) {
    const errBody = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    const code = errBody?.error?.code ?? 'fetch_failed';
    const message =
      errBody?.error?.message ?? 'Nie udało się pobrać danych z YouTube.';
    const err = new Error(message) as Error & { code: string };
    err.code = code;
    throw err;
  }

  const { data: metadata } = (await response.json()) as YouTubeMetadataResponse;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const durationSeconds = parseIso8601Duration(metadata.duration);

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: session.user.id,
      source: 'youtube_link',
      source_url: url,
      source_id: videoId,
      title: metadata.title,
      thumbnail_url: metadata.thumbnailUrl || null,
      duration_seconds: durationSeconds > 0 ? durationSeconds : null,
      embed_html: null,
      notes: null,
    })
    .select()
    .single();

  throwIfError(error);
  if (!data) throw new Error('Nie udało się dodać filmu.');
  return data;
}

/**
 * Tworzy film z linku Facebook/Instagram.
 * 1. Waliduje URL → wyciąga platform + postId
 * 2. Fetchuje oEmbed przez Edge Function
 * 3. Insertuje do tabeli videos z embed_html
 *
 * Rzuca:
 * - 'invalid_meta_url' gdy URL nieprawidłowy
 * - Error z code '23505' gdy film już istnieje dla tego usera
 */
export async function createVideoFromMetaLink(url: string): Promise<Video> {
  const parsed = parseMetaUrl(url);
  if (!parsed) {
    const err = new Error(
      'Nie rozpoznaję linku. Wklej URL z Facebooka lub Instagrama.',
    ) as Error & { code: string };
    err.code = 'invalid_meta_url';
    throw err;
  }

  const { platform, postId } = parsed;
  const token = await getSessionToken();

  const response = await fetch(
    `${SUPABASE_FUNCTIONS_URL}/validate-meta-embed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ platform, url }),
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  let embedHtml: string | null = null;
  let thumbnailUrl: string | null = null;
  let title = postId; // fallback: postId jako title

  if (response.ok) {
    const body = (await response.json()) as MetaEmbedResponse;
    if (body.data) {
      embedHtml = body.data.embedHtml || null;
      thumbnailUrl = body.data.thumbnailUrl || null;
      title = body.data.title || body.data.authorName || postId;
    }
  }
  // jeśli oEmbed unavailable — kontynuujemy z fallback danymi (manual entry)

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: session.user.id,
      source: 'meta_embed',
      source_url: url,
      source_id: postId,
      title,
      thumbnail_url: thumbnailUrl,
      duration_seconds: null,
      embed_html: embedHtml,
      notes: null,
    })
    .select()
    .single();

  throwIfError(error);
  if (!data) throw new Error('Nie udało się dodać filmu.');
  return data;
}

// ─── IU-9: createVideoFromUpload ─────────────────────────────────────────────

export interface CreateVideoFromUploadParams {
  /** YouTube Video ID zwrócone przez Resumable Upload API. */
  youtubeVideoId: string;
  title: string;
}

/**
 * Tworzy rekord w tabeli videos po udanym YouTube upload.
 * Source = 'youtube_upload', source_url = standardowy link do YT.
 * Thumbnail = mqdefault (auto-generowany przez YT po upload).
 *
 * Rzuca przy błędzie Supabase.
 */
export async function createVideoFromUpload(
  params: CreateVideoFromUploadParams,
): Promise<Video> {
  const { youtubeVideoId, title } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: session.user.id,
      source: 'youtube_upload',
      source_url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      source_id: youtubeVideoId,
      title,
      thumbnail_url: `https://i.ytimg.com/vi/${youtubeVideoId}/mqdefault.jpg`,
      embed_html: null,
      notes: null,
      duration_seconds: null,
    })
    .select()
    .single();

  throwIfError(error);
  if (!data) throw new Error('Nie udało się zapisać filmu w bibliotece.');
  return data;
}

export interface UpdateVideoParams {
  id: string;
  title?: string;
  notes?: string | null;
}

/**
 * Aktualizuje tytuł i/lub notatki filmu.
 * RLS gwarantuje że tylko właściciel może edytować.
 */
export async function updateVideo(params: UpdateVideoParams): Promise<Video> {
  const { id, ...updates } = params;

  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  if (!data) throw new Error('Nie udało się zaktualizować filmu.');
  return data;
}

/**
 * Usuwa film z biblioteki.
 * CASCADE w schemacie usuwa powiązane wiersze z video_folders.
 * RLS gwarantuje że tylko właściciel może usuwać.
 */
export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase.from('videos').delete().eq('id', id);
  throwIfError(error);
}

// ─── existing functions below ────────────────────────────────────────────────

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
