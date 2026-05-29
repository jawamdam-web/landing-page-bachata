import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * useFolders hook tests.
 *
 * Mockujemy:
 * - `../api/folders` (getFolders) — zewnętrzna granica danych
 * - `@/features/auth/hooks/useAuth` — dostarcza user.id do query key + enabled
 *
 * Testujemy: stan loading, resolved data, error state, disabled gdy brak userId.
 */

const { mockGetFolders } = vi.hoisted(() => ({
  mockGetFolders: vi.fn(),
}));

vi.mock('../api/folders', () => ({
  getFolders: mockGetFolders,
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useFolders } from './useFolders';
import { useAuth } from '@/features/auth/hooks/useAuth';

const FAKE_USER = { id: 'user-1', email: 'ty@przyklad.pl' };

const FAKE_FOLDER = {
  id: 'f-1',
  user_id: 'user-1',
  name: 'Bachata sensual',
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

describe('useFolders', () => {
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
    // getFolders nigdy nie resolves → hook zostaje w loading
    mockGetFolders.mockReturnValue(new Promise(() => {}));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFolders(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('po resolved query zwraca foldery w data, isLoading: false', async () => {
    mockGetFolders.mockResolvedValue([FAKE_FOLDER]);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFolders(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe('f-1');
    expect(result.current.data?.[0]?.name).toBe('Bachata sensual');
    expect(result.current.isError).toBe(false);
  });

  it('query jest disabled gdy userId jest null (nieautoryzowany)', () => {
    vi.mocked(useAuth).mockReturnValue({
      state: { status: 'unauthenticated', user: null, session: null },
      loading: false,
      user: null,
      signOut: vi.fn(),
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFolders(), { wrapper: Wrapper });

    // enabled: false → hook nie odpala getFolders, zostaje w initial state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGetFolders).not.toHaveBeenCalled();
  });

  it('przy błędzie API zwraca isError: true, error z wiadomością', async () => {
    mockGetFolders.mockRejectedValue(new Error('permission denied'));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useFolders(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('permission denied');
    expect(result.current.data).toBeUndefined();
  });
});
