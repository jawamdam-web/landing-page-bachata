import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FolderPickerPopover } from './FolderPickerPopover';
import type { Folder } from '../types';

/**
 * FolderPickerPopover tests.
 *
 * Analogicznie do Sheet, plus: Command search filtruje listę folderów.
 * Używamy CommandItem (role=option) — shadcn Command renderuje je z role="option".
 */

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock('../hooks/useFolderMutations', () => ({
  useAssignVideoToFolders: vi.fn().mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useCreateFolder: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: { status: 'authenticated', user: { id: 'user-1' }, session: null },
    loading: false,
    user: { id: 'user-1' },
    signOut: vi.fn(),
  }),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

const FOLDER_A: Folder = {
  id: 'f-1',
  user_id: 'user-1',
  name: 'Bachata sensual',
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
};

const FOLDER_B: Folder = {
  id: 'f-2',
  user_id: 'user-1',
  name: 'Footwork',
  created_at: '2026-05-02T10:00:00Z',
  updated_at: '2026-05-02T10:00:00Z',
};

describe('FolderPickerPopover', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
  });

  it('renderuje listę folderów gdy open={true}', () => {
    render(
      <FolderPickerPopover
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        folders={[FOLDER_A, FOLDER_B]}
        currentFolderIds={[]}
      >
        <button>Foldery</button>
      </FolderPickerPopover>,
      { wrapper: makeWrapper() },
    );

    expect(screen.getByText('Bachata sensual')).toBeInTheDocument();
    expect(screen.getByText('Footwork')).toBeInTheDocument();
  });

  it('currentFolderIds inicjalizuje zaznaczone foldery (CommandItem ma checkbox indicator)', () => {
    render(
      <FolderPickerPopover
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        folders={[FOLDER_A, FOLDER_B]}
        currentFolderIds={['f-1']}
      >
        <button>Foldery</button>
      </FolderPickerPopover>,
      { wrapper: makeWrapper() },
    );

    // FOLDER_A (f-1) powinien być zaznaczony — CommandItem ma aria-selected=true
    const itemA = screen.getByRole('option', { name: /Bachata sensual/i });
    expect(itemA).toHaveAttribute('aria-selected', 'true');

    const itemB = screen.getByRole('option', { name: /Footwork/i });
    expect(itemB).toHaveAttribute('aria-selected', 'false');
  });

  it('"Zapisz" wywołuje mutation z videoId i zaznaczonymi folderIds', async () => {
    mockMutateAsync.mockResolvedValue(undefined);

    render(
      <FolderPickerPopover
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        folders={[FOLDER_A, FOLDER_B]}
        currentFolderIds={['f-1']}
      >
        <button>Foldery</button>
      </FolderPickerPopover>,
      { wrapper: makeWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: /Zapisz/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        videoId: 'v-1',
        folderIds: ['f-1'],
      });
    });
  });

  it('"Anuluj" nie wywołuje mutation', () => {
    render(
      <FolderPickerPopover
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        folders={[FOLDER_A]}
        currentFolderIds={[]}
      >
        <button>Foldery</button>
      </FolderPickerPopover>,
      { wrapper: makeWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: /Anuluj/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('Command search input filtruje foldery po nazwie', async () => {
    render(
      <FolderPickerPopover
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        folders={[FOLDER_A, FOLDER_B]}
        currentFolderIds={[]}
      >
        <button>Foldery</button>
      </FolderPickerPopover>,
      { wrapper: makeWrapper() },
    );

    const searchInput = screen.getByPlaceholderText('Szukaj folderów...');
    await userEvent.type(searchInput, 'Bachata');

    expect(screen.getByText('Bachata sensual')).toBeInTheDocument();
    expect(screen.queryByText('Footwork')).not.toBeInTheDocument();
  });

  it('wyświetla "Brak folderów." gdy search nie pasuje do żadnego folderu', async () => {
    render(
      <FolderPickerPopover
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        folders={[FOLDER_A]}
        currentFolderIds={[]}
      >
        <button>Foldery</button>
      </FolderPickerPopover>,
      { wrapper: makeWrapper() },
    );

    const searchInput = screen.getByPlaceholderText('Szukaj folderów...');
    await userEvent.type(searchInput, 'zzz');

    expect(screen.getByText('Brak folderów.')).toBeInTheDocument();
  });
});
