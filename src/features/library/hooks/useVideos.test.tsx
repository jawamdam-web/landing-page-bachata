import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * useVideos hook tests.
 *
 * Mockujemy:
 * - `../api/videos` (getVideos) — zewnętrzna granica danych
 * - `@/features/auth/hooks/useAuth` — dostarcza user.id do query key + enabled
 *
 * Testujemy: stan loading, resolved data, error state.
 *
 * vi.hoisted: factory vi.mock jest hoistowana ponad importy — mock musi powstać
 * w hoistowanym bloku, inaczej "Cannot access before initialization".
 */

const { mockGetVideos } = vi.hoisted(() => ({
  mockGetVideos: vi.fn(),
}));

vi.mock('../api/videos', () => ({
  getVideos: mockGetVideos,
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useVideos } from './useVideos';
import { useAuth } from '@/features/auth/hooks/useAuth';

const FAKE_USER = { id: 'user-1', email: 'ty@przyklad.pl' };

const FAKE_VIDEO = {
  id: 'v-1',
  user_id: 'user-1',
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

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('useVideos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      state: {
        status: 'authenticated',
        user: FAKE_USER as never,
        session: null as never,
      },
      loading: false,
      user: FAKE_USER as never,
      signOut: vi.fn(),
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('w stanie loading zwraca { data: undefined, isLoading: true }', () => {
    // getVideos nigdy nie resolves → hook zostaje w loading
    mockGetVideos.mockReturnValue(new Promise(() => {}));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVideos(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('po resolved query zwraca filmy w data, isLoading: false', async () => {
    mockGetVideos.mockResolvedValue([FAKE_VIDEO]);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVideos(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe('v-1');
    expect(result.current.isError).toBe(false);
  });

  it('przy błędzie API zwraca isError: true, error z wiadomością', async () => {
    mockGetVideos.mockRejectedValue(new Error('network error'));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVideos(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('network error');
    expect(result.current.data).toBeUndefined();
  });

  it('query jest disabled gdy user jest null (nieautoryzowany)', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: { status: 'unauthenticated', user: null, session: null },
      loading: false,
      user: null,
      signOut: vi.fn(),
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useVideos(), { wrapper: Wrapper });

    // enabled: false → hook nie odpala getVideos, zostaje w initial state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGetVideos).not.toHaveBeenCalled();
  });

  it('z folderId przekazuje go do getVideos (query key zawiera folderId)', async () => {
    mockGetVideos.mockResolvedValue([FAKE_VIDEO]);

    const { Wrapper } = makeWrapper();
    renderHook(() => useVideos({ folderId: 'folder-1' }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockGetVideos).toHaveBeenCalledWith({ folderId: 'folder-1' });
    });
  });
});
