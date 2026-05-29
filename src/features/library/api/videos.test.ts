import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Videos API tests. Mockujemy wyłącznie zewnętrzną granicę — singleton
 * `@/lib/supabase`. Testujemy zachowanie: wywołanie query, kształt zwrotki,
 * propagacja błędów (throw), RLS isolation (mock zwraca 0 rows dla cudzych danych).
 *
 * IU-8: dodane testy dla createVideoFromYoutubeLink, createVideoFromMetaLink,
 * updateVideo, deleteVideo, isDuplicateVideoError.
 */

type MockSelectBuilder = {
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const { mockFrom, mockGetSession, mockFetch } = vi.hoisted(() => {
  const builder: MockSelectBuilder = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  // Chain: każda metoda zwraca builder
  builder.select.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.single.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);

  const mockGetSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: 'fake-token', user: { id: 'user-a' } } },
  });

  const mockFetch = vi.fn();

  return {
    mockFrom: vi.fn().mockReturnValue(builder),
    mockGetSession,
    mockFetch,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
}));

// Mock global fetch dla Edge Function calls
vi.stubGlobal('fetch', mockFetch);

import {
  createVideoFromMetaLink,
  createVideoFromUpload,
  createVideoFromYoutubeLink,
  deleteVideo,
  getVideoById,
  getVideos,
  isDuplicateVideoError,
  updateVideo,
} from './videos';

const FAKE_VIDEO_A = {
  id: 'v-1',
  user_id: 'user-a',
  source: 'youtube_link' as const,
  source_url: 'https://youtu.be/abc',
  source_id: 'abc',
  title: 'Figury podstawowe',
  notes: null,
  thumbnail_url: null,
  embed_html: null,
  duration_seconds: 120,
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
};

const FAKE_VIDEO_B = {
  id: 'v-2',
  user_id: 'user-a',
  source: 'meta_embed' as const,
  source_url: 'https://fb.com/video/123',
  source_id: '123',
  title: 'Bachata Social',
  notes: 'notatka',
  thumbnail_url: null,
  embed_html: '<blockquote>...</blockquote>',
  duration_seconds: null,
  created_at: '2026-05-02T10:00:00Z',
  updated_at: '2026-05-02T10:00:00Z',
};

describe('getVideos (bez folderId)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('zwraca wszystkie filmy usera, sortowane created_at DESC (domyślnie)', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.order.mockResolvedValue({
      data: [FAKE_VIDEO_B, FAKE_VIDEO_A],
      error: null,
    });

    const result = await getVideos();

    expect(mockFrom).toHaveBeenCalledWith('videos');
    expect(result).toHaveLength(2);
    // Sortowanie created_at DESC: B (2 maja) przed A (1 maja)
    const first = result[0];
    const second = result[1];
    expect(first?.id).toBe('v-2');
    expect(second?.id).toBe('v-1');
  });

  it('zwraca pustą tablicę gdy brak filmów (fresh user)', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.order.mockResolvedValue({ data: [], error: null });

    const result = await getVideos();
    expect(result).toEqual([]);
  });

  it('rzuca Error gdy Supabase zwróci błąd', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.order.mockResolvedValue({
      data: null,
      error: { message: 'connection refused' },
    });

    await expect(getVideos()).rejects.toThrow('connection refused');
  });

  it('RLS: zwraca 0 rows gdy user_id nie pasuje (mock izolacji)', async () => {
    // RLS w Supabase zwraca pustą tablicę (nie błąd) gdy user_id nie pasuje
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.order.mockResolvedValue({ data: [], error: null });

    const result = await getVideos();
    expect(result).toHaveLength(0);
  });
});

describe('getVideos (z folderId)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('używa SELECT z inner join video_folders i filtruje po folder_id', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.order.mockResolvedValue({ data: [FAKE_VIDEO_A], error: null });

    const result = await getVideos({ folderId: 'folder-1' });

    expect(mockFrom).toHaveBeenCalledWith('videos');
    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining('video_folders'),
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('v-1');
  });

  it('zwraca pustą tablicę gdy folder nie zawiera filmów', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.order.mockResolvedValue({ data: [], error: null });

    const result = await getVideos({ folderId: 'pusty-folder' });
    expect(result).toEqual([]);
  });
});

describe('getVideoById', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('zwraca film po ID', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: FAKE_VIDEO_A, error: null });

    const result = await getVideoById('v-1');
    expect(result).toEqual(FAKE_VIDEO_A);
  });

  it('rzuca gdy film nie istnieje (data: null, brak błędu Supabase)', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: null, error: null });

    await expect(getVideoById('nieistniejace-id')).rejects.toThrow(
      'nie został znaleziony',
    );
  });

  it('rzuca przy błędzie Supabase (np. invalid UUID format)', async () => {
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.single.mockResolvedValue({
      data: null,
      error: { message: 'invalid input syntax for type uuid' },
    });

    await expect(getVideoById('nie-uuid')).rejects.toThrow(
      'invalid input syntax for type uuid',
    );
  });

  it('RLS: rzuca gdy user_id nie pasuje (mock 0 rows)', async () => {
    // Supabase .single() z RLS zwróci error "PGRST116" (0 rows) gdy brak dostępu
    const builder = mockFrom();
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.single.mockResolvedValue({
      data: null,
      error: {
        message: 'JSON object requested, multiple (or no) rows returned',
      },
    });

    await expect(getVideoById('v-inny-user')).rejects.toThrow();
  });
});

// ─── IU-8: createVideoFromYoutubeLink ────────────────────────────────────────

describe('createVideoFromYoutubeLink', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rzuca invalid_youtube_url dla nieprawidłowego URL', async () => {
    await expect(
      createVideoFromYoutubeLink('https://example.com'),
    ).rejects.toMatchObject({
      code: 'invalid_youtube_url',
    });
  });

  it('rzuca invalid_youtube_url dla pustego stringa', async () => {
    await expect(createVideoFromYoutubeLink('')).rejects.toMatchObject({
      code: 'invalid_youtube_url',
    });
  });

  it('calls Edge Function i insertuje film z metadata YT', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          title: 'Bachata Sensual',
          description: '',
          thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
          duration: 'PT4M30S',
          channelTitle: 'TestChannel',
        },
      }),
    });

    const builder = mockFrom();
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: FAKE_VIDEO_A, error: null });

    const result = await createVideoFromYoutubeLink('https://youtu.be/abc123');
    expect(result).toEqual(FAKE_VIDEO_A);
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'youtube_link',
        source_id: 'abc123',
        title: 'Bachata Sensual',
        duration_seconds: 270,
      }),
    );
  });

  it('rzuca błąd z kodem 23505 gdy film już istnieje dla tego usera', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          title: 'Test',
          description: '',
          thumbnailUrl: '',
          duration: 'PT1M',
          channelTitle: '',
        },
      }),
    });

    const builder = mockFrom();
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({
      data: null,
      error: { message: 'duplicate key', code: '23505' },
    });

    await expect(
      createVideoFromYoutubeLink('https://youtu.be/abc123'),
    ).rejects.toMatchObject({
      code: '23505',
    });
  });

  it('film już dodany przez innego usera → success (per-user unique constraint)', async () => {
    // RLS izoluje per user — inny user to inne wiersze, INSERT przejdzie
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          title: 'Shared Video',
          description: '',
          thumbnailUrl: '',
          duration: 'PT2M',
          channelTitle: '',
        },
      }),
    });

    const builder = mockFrom();
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    // Symulujemy sukces — inny user nie powoduje konfliktu unique
    builder.single.mockResolvedValue({ data: FAKE_VIDEO_A, error: null });

    const result = await createVideoFromYoutubeLink('https://youtu.be/abc123');
    expect(result).toBeDefined();
  });
});

// ─── IU-8: createVideoFromMetaLink ────────────────────────────────────────────

describe('createVideoFromMetaLink', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rzuca invalid_meta_url dla nieprawidłowego URL', async () => {
    await expect(
      createVideoFromMetaLink('https://example.com'),
    ).rejects.toMatchObject({
      code: 'invalid_meta_url',
    });
  });

  it('calls Edge Function i insertuje film z oEmbed HTML', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          embedHtml: '<blockquote class="instagram-media">...</blockquote>',
          thumbnailUrl: '',
          title: 'Bachata Reel',
          authorName: 'bachatanapoli',
        },
      }),
    });

    const builder = mockFrom();
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: FAKE_VIDEO_B, error: null });

    const result = await createVideoFromMetaLink(
      'https://www.instagram.com/reel/Cabc123/',
    );
    expect(result).toEqual(FAKE_VIDEO_B);
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'meta_embed',
        source_id: 'Cabc123',
        embed_html: '<blockquote class="instagram-media">...</blockquote>',
      }),
    );
  });

  it('gdy oEmbed unavailable → nadal insertuje z fallback (manual entry)', async () => {
    // oEmbed endpoint zwraca błąd
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        error: {
          code: 'oembed_unavailable',
          message: 'Unavailable',
          fallback: 'manual_entry',
        },
      }),
    });

    const builder = mockFrom();
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: FAKE_VIDEO_B, error: null });

    // Powinno się udać mimo błędu oEmbed — fallback to manual title
    const result = await createVideoFromMetaLink(
      'https://www.instagram.com/reel/Cabc123/',
    );
    expect(result).toBeDefined();
    // title powinien być fallbackiem (postId jako title)
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'meta_embed',
        embed_html: null,
      }),
    );
  });
});

// ─── IU-8: updateVideo ───────────────────────────────────────────────────────

describe('updateVideo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('aktualizuje tytuł i zwraca zaktualizowany film', async () => {
    const updated = { ...FAKE_VIDEO_A, title: 'Nowy tytuł' };
    const builder = mockFrom();
    builder.update.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: updated, error: null });

    const result = await updateVideo({ id: 'v-1', title: 'Nowy tytuł' });
    expect(result.title).toBe('Nowy tytuł');
  });

  it('rzuca przy błędzie Supabase', async () => {
    const builder = mockFrom();
    builder.update.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({
      data: null,
      error: { message: 'row not found' },
    });

    await expect(updateVideo({ id: 'v-1', title: 'X' })).rejects.toThrow(
      'row not found',
    );
  });
});

// ─── IU-8: deleteVideo ───────────────────────────────────────────────────────

describe('deleteVideo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('wywołuje DELETE z poprawnym id', async () => {
    const builder = mockFrom();
    builder.delete.mockReturnValue(builder);
    builder.eq.mockResolvedValue({ error: null });

    await deleteVideo('v-1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'v-1');
  });

  it('rzuca przy błędzie Supabase', async () => {
    const builder = mockFrom();
    builder.delete.mockReturnValue(builder);
    builder.eq.mockResolvedValue({ error: { message: 'forbidden' } });

    await expect(deleteVideo('v-1')).rejects.toThrow('forbidden');
  });
});

// ─── IU-8: isDuplicateVideoError ─────────────────────────────────────────────

describe('isDuplicateVideoError', () => {
  it('zwraca true dla błędu z code 23505', () => {
    const err = Object.assign(new Error('duplicate key'), { code: '23505' });
    expect(isDuplicateVideoError(err)).toBe(true);
  });

  it('zwraca false dla błędu z innym kodem', () => {
    const err = Object.assign(new Error('other'), { code: '42P01' });
    expect(isDuplicateVideoError(err)).toBe(false);
  });

  it('zwraca false dla null', () => {
    expect(isDuplicateVideoError(null)).toBe(false);
  });

  it('zwraca false dla zwykłego Error bez code', () => {
    expect(isDuplicateVideoError(new Error('fail'))).toBe(false);
  });
});

// ─── IU-9: createVideoFromUpload ─────────────────────────────────────────────

describe('createVideoFromUpload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: wywołuje Supabase insert z poprawnymi polami youtube_upload', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { access_token: 'tok', user: { id: 'user-a' } } },
    });

    const insertedVideo = {
      ...FAKE_VIDEO_A,
      source: 'youtube_upload' as const,
      source_id: 'abc123',
      source_url: 'https://www.youtube.com/watch?v=abc123',
      thumbnail_url: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg',
      title: 'Test',
    };

    const builder = mockFrom();
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({ data: insertedVideo, error: null });

    const result = await createVideoFromUpload({
      youtubeVideoId: 'abc123',
      title: 'Test',
    });

    expect(result).toEqual(insertedVideo);
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'youtube_upload',
        source_id: 'abc123',
        source_url: 'https://www.youtube.com/watch?v=abc123',
        thumbnail_url: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg',
      }),
    );
  });

  it('brak sesji (mock getSession zwraca null) → rzuca Error("Not authenticated")', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    await expect(
      createVideoFromUpload({ youtubeVideoId: 'abc123', title: 'Test' }),
    ).rejects.toThrow('Not authenticated');
  });

  it('Supabase error → throwIfError rzuca', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { access_token: 'tok', user: { id: 'user-a' } } },
    });

    const builder = mockFrom();
    builder.insert.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    builder.single.mockResolvedValue({
      data: null,
      error: { message: 'db error' },
    });

    await expect(
      createVideoFromUpload({ youtubeVideoId: 'abc123', title: 'Test' }),
    ).rejects.toThrow('db error');
  });
});
