import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Videos API tests. Mockujemy wyłącznie zewnętrzną granicę — singleton
 * `@/lib/supabase`. Testujemy zachowanie: wywołanie query, kształt zwrotki,
 * propagacja błędów (throw), RLS isolation (mock zwraca 0 rows dla cudzych danych).
 */

type MockSelectBuilder = {
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const { mockFrom } = vi.hoisted(() => {
  const builder: MockSelectBuilder = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  // Chain: każda metoda zwraca builder
  builder.select.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.single.mockReturnValue(builder);

  return { mockFrom: vi.fn().mockReturnValue(builder) };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { getVideoById, getVideos } from './videos';

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
