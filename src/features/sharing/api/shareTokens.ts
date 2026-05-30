/**
 * shareTokens API — CRUD dla tokenów udostępniania.
 *
 * Konwencje spójne z videos.ts i folders.ts:
 * - Każda funkcja rzuca przy błędzie Supabase.
 * - createShareToken → INSERT z losowym 32-char URL-safe tokenem.
 * - revokeShareToken → UPDATE revoked_at = now().
 * - listShareTokens → SELECT aktywnych tokenów dla danego target.
 * - fetchSharedContent → RPC get_shared_content (anon-safe, SECURITY DEFINER).
 *
 * BEZPIECZEŃSTWO:
 * - Token = 24 losowe bajty → base64url → 32 znaki URL-safe.
 * - fetchSharedContent używa anon key (bez auth) — SECURITY DEFINER function po stronie DB.
 * - Pozostałe funkcje wymagają zalogowanego usera — RLS izoluje per user_id.
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';
import type { Video } from '@/features/library/types';

export type ShareToken = Tables<'share_tokens'>;

export type ShareTargetType = 'video' | 'folder';

export interface CreateShareTokenParams {
  targetType: ShareTargetType;
  targetId: string;
}

export interface CreateShareTokenResult {
  token: string;
  url: string;
  shareToken: ShareToken;
}

/**
 * Pola video bezpieczne do publicznej ekspozycji.
 * Bez `user_id` — `get_shared_content` celowo go pomija (prywatność właściciela).
 */
export type SharedVideo = Omit<Video, 'user_id' | 'updated_at'>;

/** Metadane folderu w publicznym widoku — bez `user_id`. */
export type SharedFolderMeta = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

/** Typ danych zwróconych przez get_shared_content RPC. */
export type SharedVideoContent = {
  type: 'video';
  video: SharedVideo;
};

export type SharedFolderContent = {
  type: 'folder';
  folder: SharedFolderMeta;
  videos: SharedVideo[];
};

export type SharedContent = SharedVideoContent | SharedFolderContent;

/**
 * Type guard na granicy systemu — RPC zwraca `Json`, więc walidujemy
 * dyskryminator zanim zwrócimy typowany `SharedContent`.
 */
function isSharedContent(value: unknown): value is SharedContent {
  if (typeof value !== 'object' || value === null) return false;
  const type = (value as Record<string, unknown>).type;
  return type === 'video' || type === 'folder';
}

/** Rzuca przy błędzie Supabase z zachowaniem kodu. */
function throwIfError(error: { message: string; code?: string } | null): void {
  if (error) {
    const err = new Error(error.message) as Error & { code?: string };
    err.code = error.code;
    throw err;
  }
}

/**
 * Generuje 32-char URL-safe token z 24 losowych bajtów (base64url).
 * Używa Web Crypto API — dostępne w przeglądarce i w Bun/Node 15+.
 */
function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  // base64url: zamień + → -, / → _, usuń =
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Tworzy nowy publiczny token dla danego video lub folderu.
 * Zwraca token, pełny URL do udostępnienia i rekord z bazy.
 *
 * Rzuca przy błędzie Supabase lub braku sesji.
 */
export async function createShareToken(
  params: CreateShareTokenParams,
): Promise<CreateShareTokenResult> {
  const { targetType, targetId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const token = generateToken();

  const { data, error } = await supabase
    .from('share_tokens')
    .insert({
      user_id: session.user.id,
      token,
      target_type: targetType,
      target_id: targetId,
    })
    .select()
    .single();

  throwIfError(error);
  if (!data) throw new Error('Nie udało się utworzyć linku.');

  const url = `${window.location.origin}/s/${token}`;
  return { token, url, shareToken: data };
}

/**
 * Odwołuje token — ustawia revoked_at na bieżący czas.
 * RLS gwarantuje że tylko właściciel może odwołać.
 */
export async function revokeShareToken(id: string): Promise<void> {
  const { error } = await supabase
    .from('share_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);

  throwIfError(error);
}

/**
 * Zwraca aktywne tokeny dla danego target (max 5, sortowane newest first).
 * RLS gwarantuje że user widzi tylko swoje tokeny.
 */
export async function listShareTokens(
  targetType: ShareTargetType,
  targetId: string,
): Promise<ShareToken[]> {
  const { data, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  throwIfError(error);
  return data ?? [];
}

/**
 * Pobiera udostępnioną treść (video lub folder) przez token publiczny.
 * Wywołuje SECURITY DEFINER function — działa bez auth (anon key).
 *
 * Rzuca gdy:
 * - token nieznany lub odwołany → 'token_invalid_or_revoked'
 * - target nie istnieje → 'target_not_found'
 */
export async function fetchSharedContent(
  token: string,
): Promise<SharedContent> {
  const { data, error } = await supabase.rpc('get_shared_content', {
    p_token: token,
  });

  if (error) {
    // PostgreSQL RAISE EXCEPTION zwraca message w error.message
    throw new Error(error.message);
  }

  if (!isSharedContent(data)) {
    throw new Error('token_invalid_or_revoked');
  }

  return data;
}
