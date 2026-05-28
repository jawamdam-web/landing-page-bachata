import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Auth API tests. Mockujemy WYŁĄCZNIE zewnętrzną granicę — singleton
 * `@/lib/supabase` (klient Supabase). Testujemy zachowanie warstwy auth.ts:
 * przekazywanie argumentów, kształt zwrotki, propagacja błędów (throw).
 *
 * window.location.origin pochodzi z jsdom (http://localhost) — używane do
 * budowy redirectTo/emailRedirectTo.
 */

// vi.hoisted: factory vi.mock jest hoistowana ponad importy, więc mockAuth
// musi powstać w hoistowanym bloku, inaczej "Cannot access before initialization".
const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    linkIdentity: vi.fn(),
    getSession: vi.fn(),
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: mockAuth },
}));

import {
  getCurrentSession,
  linkGoogleIdentity,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  updatePassword,
} from './auth';

const FAKE_USER = { id: 'user-1', email: 'ty@przyklad.pl' };
const FAKE_SESSION = { access_token: 'token', user: FAKE_USER };

describe('signUpWithEmail', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('resolves z { user, session } przy poprawnej rejestracji', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: FAKE_USER, session: FAKE_SESSION },
      error: null,
    });

    const result = await signUpWithEmail('ty@przyklad.pl', 'Pass1234');

    expect(result.user).toEqual(FAKE_USER);
    expect(result.session).toEqual(FAKE_SESSION);
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'ty@przyklad.pl',
      password: 'Pass1234',
      options: { emailRedirectTo: 'http://localhost:3000/auth-callback' },
    });
  });

  it('rejects z błędem (np. duplicate email, status 422)', async () => {
    const duplicateError = Object.assign(new Error('User already registered'), {
      status: 422,
    });
    mockAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: duplicateError,
    });

    await expect(
      signUpWithEmail('zajety@przyklad.pl', 'Pass1234'),
    ).rejects.toBe(duplicateError);
  });
});

describe('signInWithEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves z aktywną sesją przy poprawnych danych', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: FAKE_USER, session: FAKE_SESSION },
      error: null,
    });

    const result = await signInWithEmail('ty@przyklad.pl', 'Pass1234');

    expect(result.session).toEqual(FAKE_SESSION);
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ty@przyklad.pl',
      password: 'Pass1234',
    });
  });

  it('rejects przy błędnych danych logowania', async () => {
    const authError = new Error('Invalid login credentials');
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: authError,
    });

    await expect(signInWithEmail('ty@przyklad.pl', 'zle')).rejects.toBe(
      authError,
    );
  });
});

describe('signInWithGoogle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('wywołuje signInWithOAuth z provider google + redirectTo', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2' },
      error: null,
    });

    const data = await signInWithGoogle();

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/auth-callback' },
    });
    expect(data.url).toContain('accounts.google.com');
  });

  it('rejects gdy OAuth init zwróci błąd', async () => {
    const oauthError = new Error('provider disabled');
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: null, url: null },
      error: oauthError,
    });

    await expect(signInWithGoogle()).rejects.toBe(oauthError);
  });
});

describe('signOut', () => {
  beforeEach(() => vi.clearAllMocks());

  it('wywołuje supabase.auth.signOut', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalledOnce();
  });

  it('rejects gdy signOut zwróci błąd', async () => {
    const err = new Error('network');
    mockAuth.signOut.mockResolvedValue({ error: err });
    await expect(signOut()).rejects.toBe(err);
  });
});

describe('resetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('woła resetPasswordForEmail z redirectTo na /reset-password', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    await resetPassword('ty@przyklad.pl');

    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      'ty@przyklad.pl',
      { redirectTo: 'http://localhost:3000/reset-password' },
    );
  });

  it('rejects przy realnym błędzie (np. rate limit)', async () => {
    const err = new Error('rate limit');
    mockAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: err });
    await expect(resetPassword('ty@przyklad.pl')).rejects.toBe(err);
  });
});

describe('updatePassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('woła updateUser z nowym hasłem', async () => {
    mockAuth.updateUser.mockResolvedValue({
      data: { user: FAKE_USER },
      error: null,
    });

    const result = await updatePassword('NoweHaslo1');

    expect(mockAuth.updateUser).toHaveBeenCalledWith({
      password: 'NoweHaslo1',
    });
    expect(result.user).toEqual(FAKE_USER);
  });

  it('rejects gdy link wygasł (błąd updateUser)', async () => {
    const err = new Error('session expired');
    mockAuth.updateUser.mockResolvedValue({ data: { user: null }, error: err });
    await expect(updatePassword('NoweHaslo1')).rejects.toBe(err);
  });
});

describe('linkGoogleIdentity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('woła linkIdentity z provider google + scope youtube.upload', async () => {
    mockAuth.linkIdentity.mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com' },
      error: null,
    });

    await linkGoogleIdentity();

    expect(mockAuth.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth-callback',
        scopes: 'https://www.googleapis.com/auth/youtube.upload',
      },
    });
  });
});

describe('getCurrentSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('zwraca sesję z getSession', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: FAKE_SESSION },
      error: null,
    });

    const session = await getCurrentSession();
    expect(session).toEqual(FAKE_SESSION);
  });

  it('zwraca null gdy brak sesji', async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const session = await getCurrentSession();
    expect(session).toBeNull();
  });
});
