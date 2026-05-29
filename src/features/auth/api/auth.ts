import {
  type AuthError,
  type OAuthResponse,
  type Session,
  type User,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Auth API — cienka, typowana warstwa nad Supabase Auth. Granica danych:
 * komponenty/hooki UI wołają TE funkcje, nigdy `supabase.auth.*` bezpośrednio.
 *
 * Konwencje:
 * - Każda funkcja rzuca `AuthError` przy błędzie (nie zwraca `{ error }`) —
 *   wołający łapie w mutacji/handlerze i pokazuje toast. Fail-fast.
 * - Importuje singleton `@/lib/supabase` (pierwszy konsument w projekcie).
 *   Plik trafia do bundla TYLKO przez lazy route imports (patrz router.tsx),
 *   więc dev server bootuje bez `.env.local`.
 */

/** Pełny redirect URL do strony callback OAuth/email confirm. */
function authCallbackUrl(): string {
  return `${window.location.origin}/auth-callback`;
}

/** Pełny redirect URL do strony resetu hasła (recovery link). */
function resetPasswordUrl(): string {
  return `${window.location.origin}/reset-password`;
}

/** Rzuca jeśli Supabase zwrócił błąd; w przeciwnym razie no-op. */
function throwIfAuthError(error: AuthError | null): void {
  if (error) {
    throw error;
  }
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
}

/**
 * Rejestracja email/hasło. Z włączonym "Confirm email" Supabase zwraca
 * `session: null` (user musi kliknąć link aktywacyjny). Trigger handle_new_user
 * tworzy profil po stronie bazy.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: authCallbackUrl() },
  });
  throwIfAuthError(error);
  return { user: data.user, session: data.session };
}

/** Logowanie email/hasło. Zwraca aktywną sesję przy sukcesie. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  throwIfAuthError(error);
  return { user: data.user, session: data.session };
}

/**
 * Logowanie przez Google OAuth. Przekierowuje przeglądarkę do Google —
 * po powrocie ląduje na /auth-callback (detectSessionInUrl w kliencie).
 */
export async function signInWithGoogle(): Promise<OAuthResponse['data']> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authCallbackUrl() },
  });
  throwIfAuthError(error);
  return data;
}

/** Wylogowanie — czyści lokalną sesję. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  throwIfAuthError(error);
}

/**
 * Wysyła link do resetu hasła. Security best practice: nie ujawniamy czy email
 * istnieje — wołający pokazuje ten sam toast niezależnie od wyniku. Rzuca tylko
 * przy realnych błędach (np. rate limit), nie przy "nieznanym" emailu.
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetPasswordUrl(),
  });
  throwIfAuthError(error);
}

/** Ustawia nowe hasło dla zalogowanego usera (po wejściu z recovery linku). */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  throwIfAuthError(error);
  return { user: data.user, session: null };
}

/**
 * Linkowanie tożsamości Google do istniejącego konta (incremental OAuth).
 * Używane w IU-9 do uploadu YT (scope youtube.upload). Tu kod jest gotowy,
 * faktyczny flow odpalany później.
 */
export async function linkGoogleIdentity(): Promise<OAuthResponse['data']> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: authCallbackUrl(),
      scopes: 'https://www.googleapis.com/auth/youtube.upload',
    },
  });
  throwIfAuthError(error);
  return data;
}

/** Zwraca aktualną sesję (z localStorage/refresh). Dla bootstrapu UI. */
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  throwIfAuthError(error);
  return data.session;
}

/**
 * Subskrybuje zmiany stanu auth (login/logout/refresh). Zwraca funkcję
 * odsubskrybowującą. Trzyma `supabase.auth.*` w obrębie tej warstwy — wołający
 * (AuthProvider) nie sięga po klienta bezpośrednio.
 */
export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}
