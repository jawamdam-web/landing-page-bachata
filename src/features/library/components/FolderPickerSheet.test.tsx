import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FolderPickerSheet } from './FolderPickerSheet';
import type { Folder } from '../types';

/**
 * FolderPickerSheet tests.
 *
 * Testujemy: lista folderów z checkboxami, toggle stanu lokalnego,
 * "Zapisz" → mutation, "Anuluj" → brak mutation, currentFolderIds inicjalizuje
 * checked state.
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

describe('FolderPickerSheet', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
  });

  it('renderuje listę folderów jako checkboxy', () => {
    render(
      <FolderPickerSheet
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        videoTitle="Figury podstawowe"
        folders={[FOLDER_A, FOLDER_B]}
        currentFolderIds={[]}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.getByText('Bachata sensual')).toBeInTheDocument();
    expect(screen.getByText('Footwork')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('currentFolderIds inicjalizuje stan checked — zaznaczony folder ma aria-checked="true"', () => {
    render(
      <FolderPickerSheet
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        videoTitle="Figury podstawowe"
        folders={[FOLDER_A, FOLDER_B]}
        currentFolderIds={['f-1']}
      />,
      { wrapper: makeWrapper() },
    );

    const checkboxA = screen.getByRole('checkbox', {
      name: /Bachata sensual/i,
    });
    expect(checkboxA).toHaveAttribute('aria-checked', 'true');

    const checkboxB = screen.getByRole('checkbox', { name: /Footwork/i });
    expect(checkboxB).toHaveAttribute('aria-checked', 'false');
  });

  it('klik na folder toggleuje lokalny stan (uncommitted)', () => {
    render(
      <FolderPickerSheet
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        videoTitle="Figury podstawowe"
        folders={[FOLDER_A]}
        currentFolderIds={[]}
      />,
      { wrapper: makeWrapper() },
    );

    const checkbox = screen.getByRole('checkbox', { name: /Bachata sensual/i });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('"Zapisz" wywołuje mutation z videoId i zaznaczonymi folderIds', async () => {
    mockMutateAsync.mockResolvedValue(undefined);

    render(
      <FolderPickerSheet
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        videoTitle="Figury podstawowe"
        folders={[FOLDER_A, FOLDER_B]}
        currentFolderIds={['f-1']}
      />,
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
      <FolderPickerSheet
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        videoTitle="Figury podstawowe"
        folders={[FOLDER_A]}
        currentFolderIds={[]}
      />,
      { wrapper: makeWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: /Anuluj/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('renderuje tytuł video w nagłówku sheetu', () => {
    render(
      <FolderPickerSheet
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        videoTitle="Figury podstawowe bachata"
        folders={[]}
        currentFolderIds={[]}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.getByText('Figury podstawowe bachata')).toBeInTheDocument();
  });

  it('wyświetla komunikat gdy brak folderów', () => {
    render(
      <FolderPickerSheet
        open={true}
        onOpenChange={vi.fn()}
        videoId="v-1"
        videoTitle="Figury podstawowe"
        folders={[]}
        currentFolderIds={[]}
      />,
      { wrapper: makeWrapper() },
    );

    expect(
      screen.getByText(/Nie masz jeszcze żadnych folderów/i),
    ).toBeInTheDocument();
  });
});
