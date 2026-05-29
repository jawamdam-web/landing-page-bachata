/**
 * google-identity.test.ts
 *
 * Scenariusze obowiązkowe z planu IU-9:
 *  [1] hasYoutubeUploadScope() zwraca true gdy session ma youtube.upload scope (metadata)
 *  [2] hasYoutubeUploadScope() zwraca false gdy brak scope
 *  [3] getGoogleAccessToken() zwraca token z aktywnej session
 *  [4] getGoogleAccessToken() gdy expired → wywołuje refreshGoogleAccessToken
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasYoutubeUploadScope,
  getGoogleAccessToken,
  refreshGoogleAccessToken,
  GoogleAuthError,
} from './google-identity';

// ─── Mock Supabase ─────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      linkIdentity: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as unknown as {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    refreshSession: ReturnType<typeof vi.fn>;
    linkIdentity: ReturnType<typeof vi.fn>;
  };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(overrides: {
  provider_token?: string | null;
  expires_at?: number;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    provider_token: overrides.provider_token ?? 'google-access-token',
    provider_refresh_token: 'refresh-token',
    expires_at: overrides.expires_at ?? nowSeconds + 3600,
    access_token: 'supabase-jwt',
    refresh_token: 'supabase-refresh',
    token_type: 'bearer',
    user: {
      id: 'user-123',
      user_metadata: overrides.user_metadata ?? {},
      app_metadata: overrides.app_metadata ?? {},
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── hasYoutubeUploadScope ─────────────────────────────────────────────────────

describe('hasYoutubeUploadScope', () => {
  /**
   * [1] Zwraca true gdy user_metadata.youtube_upload_granted = true
   */
  it('returns true when user_metadata has youtube_upload_granted', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: makeSession({
          user_metadata: { youtube_upload_granted: true },
        }),
      },
      error: null,
    });

    const result = await hasYoutubeUploadScope();
    expect(result).toBe(true);
  });

  /**
   * [1b] Zwraca true gdy app_metadata.youtube_upload_granted = true
   */
  it('returns true when app_metadata has youtube_upload_granted', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: makeSession({
          app_metadata: { youtube_upload_granted: true },
        }),
      },
      error: null,
    });

    const result = await hasYoutubeUploadScope();
    expect(result).toBe(true);
  });

  /**
   * [2] Zwraca false gdy brak scope — metadata nie ma flagi
   */
  it('returns false when user has provider_token but no scope metadata', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: makeSession({
          user_metadata: {},
        }),
      },
      error: null,
    });

    const result = await hasYoutubeUploadScope();
    expect(result).toBe(false);
  });

  /**
   * [2b] Zwraca false gdy brak provider_token (user nie zalogowany przez Google)
   */
  it('returns false when session has no provider_token', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: makeSession({ provider_token: null }),
      },
      error: null,
    });

    const result = await hasYoutubeUploadScope();
    expect(result).toBe(false);
  });

  /**
   * [2c] Zwraca false gdy brak sesji
   */
  it('returns false when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await hasYoutubeUploadScope();
    expect(result).toBe(false);
  });
});

// ─── getGoogleAccessToken ─────────────────────────────────────────────────────

describe('getGoogleAccessToken', () => {
  /**
   * [3] Zwraca provider_token z aktywnej (nie wygasłej) sesji
   */
  it('returns provider_token from active session', async () => {
    const session = makeSession({ provider_token: 'fresh-google-token' });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });

    const token = await getGoogleAccessToken();
    expect(token).toBe('fresh-google-token');
    expect(mockSupabase.auth.refreshSession).not.toHaveBeenCalled();
  });

  /**
   * [4] Gdy token wygasł (expires_at przeszły) → wywołuje refreshGoogleAccessToken
   */
  it('calls refreshGoogleAccessToken when session is expired', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiredSession = makeSession({
      provider_token: 'old-token',
      expires_at: nowSeconds - 100, // przeszłość
    });

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: expiredSession },
      error: null,
    });

    const newSession = makeSession({ provider_token: 'refreshed-token' });
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: newSession },
      error: null,
    });

    const token = await getGoogleAccessToken();
    expect(token).toBe('refreshed-token');
    expect(mockSupabase.auth.refreshSession).toHaveBeenCalledOnce();
  });

  /**
   * [4b] Gdy token wygasa za mniej niż 60s → wywołuje refresh (bufor bezpieczeństwa)
   */
  it('refreshes token when expiring within 60s buffer', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const soonExpiredSession = makeSession({
      provider_token: 'almost-expired-token',
      expires_at: nowSeconds + 30, // za 30s — poniżej buforu 60s
    });

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: soonExpiredSession },
      error: null,
    });

    const newSession = makeSession({ provider_token: 'new-token' });
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: newSession },
      error: null,
    });

    const token = await getGoogleAccessToken();
    expect(token).toBe('new-token');
  });

  it('throws GoogleAuthError when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(getGoogleAccessToken()).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });

  it('throws GoogleAuthError when no provider_token', async () => {
    // provider_token: null + token nie jest bliski wygaśnięcia → rzuca bez refresh
    const nowSeconds = Math.floor(Date.now() / 1000);
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          ...makeSession({ provider_token: 'will-be-overridden' }),
          provider_token: null,
          expires_at: nowSeconds + 3600,
        },
      },
      error: null,
    });

    await expect(getGoogleAccessToken()).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });
});

// ─── refreshGoogleAccessToken ──────────────────────────────────────────────────

describe('refreshGoogleAccessToken', () => {
  it('returns new provider_token after successful refresh', async () => {
    const newSession = makeSession({ provider_token: 'brand-new-token' });
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: newSession },
      error: null,
    });

    const token = await refreshGoogleAccessToken();
    expect(token).toBe('brand-new-token');
  });

  it('throws GoogleAuthError when refresh fails', async () => {
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Token expired' },
    });

    await expect(refreshGoogleAccessToken()).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });

  it('throws GoogleAuthError when new session has no provider_token', async () => {
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: {
        session: {
          ...makeSession({}),
          provider_token: null,
        },
      },
      error: null,
    });

    await expect(refreshGoogleAccessToken()).rejects.toBeInstanceOf(
      GoogleAuthError,
    );
  });
});
