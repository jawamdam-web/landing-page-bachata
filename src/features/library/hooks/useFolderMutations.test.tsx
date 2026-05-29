import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * useFolderMutations tests.
 *
 * Mockujemy:
 * - Funkcje API z `../api/folders` — zewnętrzna granica danych
 * - `@/features/auth/hooks/useAuth` — dostarcza user.id do query keys
 * - `sonner` — testujemy że toast jest wywołany
 */

const {
  mockCreateFolder,
  mockUpdateFolder,
  mockDeleteFolder,
  mockAssignVideoToFolders,
} = vi.hoisted(() => ({
  mockCreateFolder: vi.fn(),
  mockUpdateFolder: vi.fn(),
  mockDeleteFolder: vi.fn(),
  mockAssignVideoToFolders: vi.fn(),
}));

vi.mock('../api/folders', () => ({
  createFolder: mockCreateFolder,
  updateFolder: mockUpdateFolder,
  deleteFolder: mockDeleteFolder,
  assignVideoToFolders: mockAssignVideoToFolders,
  getVideoFolderIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  useCreateFolder,
  useDeleteFolder,
  useUpdateFolder,
  useAssignVideoToFolders,
} from './useFolderMutations';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

const FAKE_USER = { id: 'user-1', email: 'ty@przyklad.pl' };

const FAKE_FOLDER = {
  id: 'f-1',
  user_id: 'user-1',
  name: 'Zajęcia',
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('useCreateFolder', () => {
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

  it('wywołuje createFolder z nazwą i pokazuje toast success', async () => {
    mockCreateFolder.mockResolvedValue(FAKE_FOLDER);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateFolder(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync('Zajęcia');
    });

    expect(mockCreateFolder).toHaveBeenCalledWith('Zajęcia');
    expect(toast.success).toHaveBeenCalledWith('Folder utworzony.');
  });

  it('przy błędzie 23505 pokazuje toast z komunikatem o duplikacie', async () => {
    mockCreateFolder.mockRejectedValue(
      new Error('duplicate key value violates unique constraint (23505)'),
    );

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateFolder(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('Zajęcia');
      } catch {
        // mutation error swallowed — testujemy toast
      }
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Folder o tej nazwie już istnieje.',
      );
    });
  });
});

describe('useUpdateFolder', () => {
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

  it('wywołuje updateFolder i pokazuje toast success', async () => {
    const updated = { ...FAKE_FOLDER, name: 'Nowa nazwa' };
    mockUpdateFolder.mockResolvedValue(updated);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateFolder(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'f-1', name: 'Nowa nazwa' });
    });

    expect(mockUpdateFolder).toHaveBeenCalledWith('f-1', 'Nowa nazwa');
    expect(toast.success).toHaveBeenCalledWith('Nazwa zmieniona.');
  });

  it('przy błędzie rollbackuje cache i pokazuje toast error', async () => {
    mockUpdateFolder.mockRejectedValue(new Error('network error'));

    const { Wrapper, queryClient } = makeWrapper();

    // Ustaw dane w cache przed mutacją
    queryClient.setQueryData(['folders', 'user-1'], [FAKE_FOLDER]);

    const { result } = renderHook(() => useUpdateFolder(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 'f-1', name: 'Nowa nazwa' });
      } catch {
        // swallow
      }
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // Cache powinien być przywrócony do snapshot
    const cacheAfter = queryClient.getQueryData<(typeof FAKE_FOLDER)[]>([
      'folders',
      'user-1',
    ]);
    expect(cacheAfter?.[0]?.name).toBe('Zajęcia');
  });
});

describe('useDeleteFolder', () => {
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

  it('wywołuje deleteFolder i pokazuje toast success', async () => {
    mockDeleteFolder.mockResolvedValue(undefined);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteFolder(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync('f-1');
    });

    expect(mockDeleteFolder).toHaveBeenCalledWith('f-1');
    expect(toast.success).toHaveBeenCalledWith(
      'Folder usunięty. Filmy zostają w bibliotece.',
    );
  });

  it('optimistic update: usuwa folder z cache zanim sieć odpowie', async () => {
    // deleteFolder nigdy nie resolve → stan w trakcie
    mockDeleteFolder.mockReturnValue(new Promise(() => {}));

    const { Wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['folders', 'user-1'], [FAKE_FOLDER]);

    const { result } = renderHook(() => useDeleteFolder(), {
      wrapper: Wrapper,
    });

    act(() => {
      void result.current.mutate('f-1');
    });

    await waitFor(() => {
      const cache = queryClient.getQueryData<(typeof FAKE_FOLDER)[]>([
        'folders',
        'user-1',
      ]);
      expect(cache).toHaveLength(0);
    });
  });

  it('rollback optimistic update przy błędzie sieciowym', async () => {
    mockDeleteFolder.mockRejectedValue(new Error('network error'));

    const { Wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['folders', 'user-1'], [FAKE_FOLDER]);

    const { result } = renderHook(() => useDeleteFolder(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync('f-1');
      } catch {
        // swallow
      }
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // Snapshot przywrócony
    const cacheAfter = queryClient.getQueryData<(typeof FAKE_FOLDER)[]>([
      'folders',
      'user-1',
    ]);
    expect(cacheAfter).toHaveLength(1);
  });
});

describe('useAssignVideoToFolders', () => {
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

  it('wywołuje assignVideoToFolders z videoId i folderIds', async () => {
    mockAssignVideoToFolders.mockResolvedValue(undefined);

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAssignVideoToFolders(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        videoId: 'v-1',
        folderIds: ['f-1', 'f-2'],
      });
    });

    expect(mockAssignVideoToFolders).toHaveBeenCalledWith('v-1', [
      'f-1',
      'f-2',
    ]);
    expect(toast.success).toHaveBeenCalledWith('Foldery zaktualizowane.');
  });

  it('przy błędzie pokazuje toast error', async () => {
    mockAssignVideoToFolders.mockRejectedValue(new Error('assignment failed'));

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useAssignVideoToFolders(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          videoId: 'v-1',
          folderIds: ['f-1'],
        });
      } catch {
        // swallow
      }
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('assignment failed');
    });
  });
});
