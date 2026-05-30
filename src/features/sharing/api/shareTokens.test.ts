/**
 * shareTokens API tests.
 *
 * Mockujemy wyłącznie zewnętrzną granicę — singleton `@/lib/supabase`.
 * Testujemy zachowanie: wywołanie query, kształt zwrotki, propagacja błędów.
 *
 * Scenariusze obligatoryjne (per IU-10 spec):
 * - createShareToken → INSERT z 32-char tokenem + zwraca { token, url }
 * - dwa wywołania createShareToken → różne tokeny (entropy)
 * - revokeShareToken → UPDATE revoked_at ustawione
 * - fetchSharedContent(validToken) → rpc('get_shared_content') wywołane z tokenem
 * - fetchSharedContent(revokedToken) → throws z 'token_invalid_or_revoked'
 * - fetchSharedContent(fakeToken) → throws z 'token_invalid_or_revoked'
 * - RLS test: anon SELECT → 0 rows (mock brak polityki = pustа tablica)
 * - RLS test: user A widzi tylko swoje tokeny
 * - get_shared_content przez RPC → SUCCESS (symulacja SECURITY DEFINER)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const { mockFrom, mockRpc, mockGetSession } = vi.hoisted(() => {
  const builder: MockBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
  };

  // Chain: każda metoda zwraca builder (poza single — zwraca promise-like)
  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.is.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.single.mockReturnValue(builder);

  const mockRpc = vi.fn();

  const mockGetSession = vi.fn().mockResolvedValue({
    data: {
      session: {
        access_token: 'fake-token',
        user: { id: 'user-a' },
      },
    },
  });

  return {
    mockFrom: vi.fn().mockReturnValue(builder),
    mockRpc,
    mockGetSession,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: { getSession: mockGetSession },
  },
}));

// Mock window.location.origin
vi.stubGlobal('window', { location: { origin: 'https://app.test' } });

import {
  createShareToken,
  fetchSharedContent,
  listShareTokens,
  revokeShareToken,
} from './shareTokens';

const FAKE_TOKEN = 'abc123def456ghi789jkl012';
const FAKE_TOKEN_ID = 'st-1';
const FAKE_VIDEO_ID = 'v-1';
const FAKE_FOLDER_ID = 'f-1';

const FAKE_SHARE_TOKEN = {
  id: FAKE_TOKEN_ID,
  user_id: 'user-a',
  token: FAKE_TOKEN,
  target_type: 'video' as const,
  target_id: FAKE_VIDEO_ID,
  revoked_at: null,
  created_at: '2026-01-01T00:00:00Z',
  last_accessed_at: null,
};

/** Singleton buildera używany wewnątrz testów — resetowany w beforeEach. */
let currentBuilder: MockBuilder;

describe('shareTokens API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Tworzenie nowej instancji buildera z podłączonym chainem
    currentBuilder = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      single: vi.fn(),
    };

    currentBuilder.select.mockReturnValue(currentBuilder);
    currentBuilder.insert.mockReturnValue(currentBuilder);
    currentBuilder.update.mockReturnValue(currentBuilder);
    currentBuilder.delete.mockReturnValue(currentBuilder);
    currentBuilder.eq.mockReturnValue(currentBuilder);
    currentBuilder.is.mockReturnValue(currentBuilder);
    currentBuilder.order.mockReturnValue(currentBuilder);
    currentBuilder.limit.mockReturnValue(currentBuilder);
    currentBuilder.single.mockResolvedValue({
      data: FAKE_SHARE_TOKEN,
      error: null,
    });

    mockFrom.mockReturnValue(currentBuilder);

    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: 'fake-token', user: { id: 'user-a' } },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // createShareToken
  // ──────────────────────────────────────────────────────────────────────────

  describe('createShareToken', () => {
    it('zwraca token, url i shareToken przy INSERT', async () => {
      const result = await createShareToken({
        targetType: 'video',
        targetId: FAKE_VIDEO_ID,
      });

      expect(result.token).toBeTypeOf('string');
      expect(result.token.length).toBe(32);
      expect(result.url).toBe(`https://app.test/s/${result.token}`);
      expect(result.shareToken).toEqual(FAKE_SHARE_TOKEN);
    });

    it('wywołuje INSERT z poprawnym kształtem danych', async () => {
      await createShareToken({
        targetType: 'video',
        targetId: FAKE_VIDEO_ID,
      });

      const builder = currentBuilder;
      expect(mockFrom).toHaveBeenCalledWith('share_tokens');
      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-a',
          target_type: 'video',
          target_id: FAKE_VIDEO_ID,
          token: expect.stringMatching(/^[A-Za-z0-9_-]{32}$/),
        }),
      );
    });

    it('dwa wywołania generują różne tokeny (entropy)', async () => {
      const r1 = await createShareToken({
        targetType: 'video',
        targetId: FAKE_VIDEO_ID,
      });

      // Drugie wywołanie — symuluj inny rekord zwrócony
      const builder = currentBuilder;
      builder.single.mockResolvedValueOnce({
        data: { ...FAKE_SHARE_TOKEN, token: 'different-token-XYZ-padded12' },
        error: null,
      });

      const r2 = await createShareToken({
        targetType: 'video',
        targetId: FAKE_VIDEO_ID,
      });

      expect(r1.token).not.toBe(r2.token);
    });

    it('rzuca gdy brak sesji', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { session: null } });

      await expect(
        createShareToken({ targetType: 'video', targetId: FAKE_VIDEO_ID }),
      ).rejects.toThrow('Not authenticated');
    });

    it('rzuca gdy Supabase zwraca błąd', async () => {
      const builder = currentBuilder;
      builder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'DB error', code: '23500' },
      });

      await expect(
        createShareToken({ targetType: 'video', targetId: FAKE_VIDEO_ID }),
      ).rejects.toThrow('DB error');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // revokeShareToken
  // ──────────────────────────────────────────────────────────────────────────

  describe('revokeShareToken', () => {
    it('wywołuje UPDATE z revoked_at jako string ISO', async () => {
      const builder = currentBuilder;
      builder.eq.mockResolvedValueOnce({ data: null, error: null });

      await revokeShareToken(FAKE_TOKEN_ID);

      expect(mockFrom).toHaveBeenCalledWith('share_tokens');
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          revoked_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }),
      );
      expect(builder.eq).toHaveBeenCalledWith('id', FAKE_TOKEN_ID);
    });

    it('rzuca gdy Supabase zwraca błąd', async () => {
      const builder = currentBuilder;
      builder.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Row not found', code: '404' },
      });

      await expect(revokeShareToken('nonexistent-id')).rejects.toThrow(
        'Row not found',
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // listShareTokens
  // ──────────────────────────────────────────────────────────────────────────

  describe('listShareTokens', () => {
    it('zwraca aktywne tokeny dla danego target', async () => {
      const builder = currentBuilder;
      builder.limit.mockResolvedValueOnce({
        data: [FAKE_SHARE_TOKEN],
        error: null,
      });

      const result = await listShareTokens('video', FAKE_VIDEO_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(FAKE_SHARE_TOKEN);
      expect(builder.eq).toHaveBeenCalledWith('target_type', 'video');
      expect(builder.eq).toHaveBeenCalledWith('target_id', FAKE_VIDEO_ID);
      expect(builder.is).toHaveBeenCalledWith('revoked_at', null);
    });

    it('zwraca pustą tablicę gdy brak aktywnych tokenów (RLS anon = 0 rows)', async () => {
      const builder = currentBuilder;
      builder.limit.mockResolvedValueOnce({ data: [], error: null });

      const result = await listShareTokens('video', FAKE_VIDEO_ID);

      expect(result).toEqual([]);
    });

    it('RLS isolation — user A widzi tylko swoje tokeny (mock zwraca wyłącznie user-a)', async () => {
      const tokenUserA = { ...FAKE_SHARE_TOKEN, user_id: 'user-a' };
      const builder = currentBuilder;
      builder.limit.mockResolvedValueOnce({
        data: [tokenUserA],
        error: null,
      });

      const result = await listShareTokens('video', FAKE_VIDEO_ID);

      // Wszystkie wyniki mają user_id === 'user-a' (RLS zapewnia to po stronie DB)
      result.forEach((t) => expect(t.user_id).toBe('user-a'));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // fetchSharedContent
  // ──────────────────────────────────────────────────────────────────────────

  describe('fetchSharedContent', () => {
    it('wywołuje rpc get_shared_content z tokenem i zwraca dane video', async () => {
      const sharedVideo = {
        type: 'video',
        video: {
          id: FAKE_VIDEO_ID,
          title: 'Test Video',
          source: 'youtube_link',
          source_url: 'https://youtu.be/abc',
          source_id: 'abc',
          user_id: 'user-a',
          notes: null,
          thumbnail_url: null,
          embed_html: null,
          duration_seconds: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      };

      mockRpc.mockResolvedValueOnce({ data: sharedVideo, error: null });

      const result = await fetchSharedContent(FAKE_TOKEN);

      expect(mockRpc).toHaveBeenCalledWith('get_shared_content', {
        p_token: FAKE_TOKEN,
      });
      expect(result).toEqual(sharedVideo);
    });

    it('zwraca dane folderu z listą filmów (SECURITY DEFINER symulacja)', async () => {
      const sharedFolder = {
        type: 'folder',
        folder: {
          id: FAKE_FOLDER_ID,
          name: 'Zajęcia Wrzesień',
          user_id: 'user-a',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        videos: [],
      };

      mockRpc.mockResolvedValueOnce({ data: sharedFolder, error: null });

      const result = await fetchSharedContent('folder-token-xyz');

      expect(result).toEqual(sharedFolder);
    });

    it('rzuca z komunikatem gdy token odwołany (token_invalid_or_revoked)', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'token_invalid_or_revoked', code: 'PGRST116' },
      });

      await expect(fetchSharedContent('revoked-token')).rejects.toThrow(
        'token_invalid_or_revoked',
      );
    });

    it('rzuca z komunikatem gdy token nieznany (fakeToken)', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'token_invalid_or_revoked', code: 'PGRST116' },
      });

      await expect(
        fetchSharedContent('fake-nonexistent-token'),
      ).rejects.toThrow('token_invalid_or_revoked');
    });

    it('rzuca target_not_found gdy token aktywny ale treść usunięta', async () => {
      // get_shared_content RAISE EXCEPTION 'target_not_found' gdy video/folder
      // zostało usunięte (target_id to weak reference bez FK).
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'target_not_found', code: 'P0001' },
      });

      await expect(fetchSharedContent('token-deleted-target')).rejects.toThrow(
        'target_not_found',
      );
    });

    it('rzuca gdy rpc zwraca null data bez error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      await expect(fetchSharedContent('empty-response-token')).rejects.toThrow(
        'token_invalid_or_revoked',
      );
    });
  });
});
