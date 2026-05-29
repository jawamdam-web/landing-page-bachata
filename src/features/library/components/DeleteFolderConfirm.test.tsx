import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeleteFolderConfirm } from './DeleteFolderConfirm';
import type { Folder } from '../types';

/**
 * DeleteFolderConfirm tests.
 *
 * Testujemy: renderowanie nazwy folderu, klik "Usuń folder" → mutation,
 * klik "Anuluj" → brak mutation, loading state.
 */

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock('../hooks/useFolderMutations', () => ({
  useDeleteFolder: vi.fn().mockReturnValue({
    mutateAsync: mockMutateAsync,
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

const FAKE_FOLDER: Folder = {
  id: 'f-1',
  user_id: 'user-1',
  name: 'Zajęcia sensual',
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
};

describe('DeleteFolderConfirm', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
  });

  it('renderuje nazwę folderu w pytaniu potwierdzającym', () => {
    render(
      <DeleteFolderConfirm
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.getByText(/Usunąć folder/i)).toBeInTheDocument();
    expect(screen.getByText(/Zajęcia sensual/i)).toBeInTheDocument();
  });

  it('nie renderuje się gdy open={false}', () => {
    render(
      <DeleteFolderConfirm
        folder={FAKE_FOLDER}
        open={false}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.queryByText(/Usunąć folder/i)).not.toBeInTheDocument();
  });

  it('klik "Usuń folder" wywołuje mutation z id folderu', async () => {
    mockMutateAsync.mockResolvedValue(undefined);

    render(
      <DeleteFolderConfirm
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: /Usuń folder/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('f-1');
    });
  });

  it('klik "Anuluj" nie wywołuje mutation', () => {
    render(
      <DeleteFolderConfirm
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: /Anuluj/i }));

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('wyświetla opis informujący że filmy zostają w bibliotece', () => {
    render(
      <DeleteFolderConfirm
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    expect(
      screen.getByText(/Filmy w środku zostają w bibliotece/i),
    ).toBeInTheDocument();
  });
});
