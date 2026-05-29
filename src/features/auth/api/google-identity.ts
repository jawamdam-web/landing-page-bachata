/**
 * google-identity.ts — Google identity / OAuth scope management.
 *
 * Odpowiada za:
 * - Sprawdzanie czy user ma scope `youtube.upload`
 * - Żądanie incremental OAuth scope upgrade
 * - Pobieranie aktualnego Google access tokenu
 * - Odświeżanie Google access tokenu
 *
 * Scope detection: sprawdzamy `session.provider_token` obecność.
 * Supabase zapisuje go w sesji gdy Google zwróci token — brak go oznacza
 * albo że user nie jest zalogowany przez Google, albo scope nie był przyznany.
 *
 * Dla dokładnej weryfikacji scope — sprawdzamy endpoint Google tokeninfo
 * lub próbujemy wywołanie YouTube API. Tutaj używamy podejścia pragmatycznego:
 * sprawdzamy obecność provider_token + user_metadata.
 */

import { supabase } from '@/lib/supabase';

// ─── Typy ─────────────────────────────────────────────────────────────────────

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthError';
  }
}

// ─── Zakres youtube.upload ─────────────────────────────────────────────────────

const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';

/**
 * Sprawdza czy aktualny user ma przyznany scope youtube.upload.
 *
 * Podejście: jeśli Supabase ma provider_token (Google OAuth), sprawdzamy
 * app_metadata lub user_metadata dla listy grantowanych scope'ów.
 * Supabase nie persystuje scopes explicite — używamy obecności provider_token
 * jako wskaźnika że Google OAuth był użyty. Dla dokładnego sprawdzenia scope
 * można wywołać tokeninfo endpoint (poza scope tego IU).
 *
 * Praktyczne podejście: próbujemy uzyskać token — jeśli jest i YouTube scope
 * był kiedykolwiek zgranty (persystowany w metadanych), zwracamy true.
 */
export async function hasYoutubeUploadScope(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) return false;

  // Sprawdź user_metadata.youtube_upload_granted (ustawiamy po pierwszym grancie)
  // lub app_metadata (server-side). Fallback: zakładamy że skoro user ma
  // provider_token, mógł lub nie mógł mieć scope — wymagamy re-check.
  const user = session.user;
  const hasGrant =
    user.user_metadata?.['youtube_upload_granted'] === true ||
    user.app_metadata?.['youtube_upload_granted'] === true;

  return hasGrant;
}

/**
 * Żąda przyznania scope youtube.upload przez incremental OAuth.
 * Przekierowuje user do Google consent screen.
 *
 * Po powrocie Supabase odświeża sesję z nowym tokenem — komponent nasłuchuje
 * onAuthStateChange i aktualizuje stan po redirect.
 */
export async function requestYoutubeUploadScope(): Promise<void> {
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth-callback`,
      scopes: YOUTUBE_UPLOAD_SCOPE,
    },
  });

  if (error) {
    throw new GoogleAuthError(
      `Nie udało się uzyskać zgody na upload. ${error.message}`,
    );
  }
}

/**
 * Zwraca aktualny Google access token z sesji Supabase.
 * Jeśli token wygasł (sprawdzamy expires_at) — próbuje odświeżyć.
 *
 * Rzuca GoogleAuthError jeśli:
 * - Brak aktywnej sesji
 * - Brak provider_token (user nie zalogował się przez Google)
 * - Odświeżenie nie powiodło się
 */
export async function getGoogleAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new GoogleAuthError('Brak aktywnej sesji. Zaloguj się ponownie.');
  }

  if (!session.provider_token) {
    throw new GoogleAuthError(
      'Brak tokenu Google. Zaloguj się przez Google, aby uploadować filmy.',
    );
  }

  // Sprawdź czy token jest bliski wygaśnięcia (lub wygasł)
  // Supabase przechowuje expires_at w sesji (Unix timestamp w sekundach)
  const expiresAt = session.expires_at ?? 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isExpiredOrClose = nowSeconds >= expiresAt - 60; // 60s bufor

  if (isExpiredOrClose) {
    return refreshGoogleAccessToken();
  }

  return session.provider_token;
}

/**
 * Odświeża Google access token przez Supabase Auth refresh.
 *
 * Rzuca GoogleAuthError jeśli odświeżenie się nie powiodło
 * (np. user cofnął scope, token nieprawidłowy).
 */
export async function refreshGoogleAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw new GoogleAuthError(
      'Sesja Google wygasła. Zaloguj się ponownie przez Google.',
    );
  }

  const newToken = data.session?.provider_token;
  if (!newToken) {
    throw new GoogleAuthError(
      'Nie udało się odświeżyć tokenu Google. Zaloguj się ponownie.',
    );
  }

  return newToken;
}
