import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditFolderDialog } from './EditFolderDialog';
import type { Folder } from '../types';

/**
 * EditFolderDialog tests.
 *
 * Testujemy: prefilled input, walidację, błąd 23505, Anuluj bez mutation.
 */

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock('../hooks/useFolderMutations', () => ({
  useUpdateFolder: vi.fn().mockReturnValue({
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
  name: 'Bachata sensual',
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
};

describe('EditFolderDialog', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
  });

  it('renderuje input z prefilled nazwą folderu', () => {
    render(
      <EditFolderDialog
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    const input = screen.getByLabelText('Nazwa folderu');
    expect(input).toHaveValue('Bachata sensual');
  });

  it('nie renderuje się gdy open={false}', () => {
    render(
      <EditFolderDialog
        folder={FAKE_FOLDER}
        open={false}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.queryByText('Zmień nazwę folderu')).not.toBeInTheDocument();
  });

  it('submit z poprawną nową nazwą wywołuje mutation z id i nową nazwą', async () => {
    mockMutateAsync.mockResolvedValue({ ...FAKE_FOLDER, name: 'Nowa nazwa' });

    render(
      <EditFolderDialog
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    const input = screen.getByLabelText('Nazwa folderu');
    await userEvent.clear(input);
    await userEvent.type(input, 'Nowa nazwa');
    fireEvent.click(screen.getByRole('button', { name: /Zapisz/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'f-1',
        name: 'Nowa nazwa',
      });
    });
  });

  it('submit z pustą nazwą pokazuje inline error walidacji', async () => {
    render(
      <EditFolderDialog
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    const input = screen.getByLabelText('Nazwa folderu');
    await userEvent.clear(input);
    fireEvent.click(screen.getByRole('button', { name: /Zapisz/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Podaj nazwę folderu.',
      );
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('błąd 23505 pokazuje inline error "Folder o tej nazwie już istnieje."', async () => {
    const duplicateErr = Object.assign(new Error('duplicate key'), {
      code: '23505',
    });
    mockMutateAsync.mockRejectedValue(duplicateErr);

    render(
      <EditFolderDialog
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    const input = screen.getByLabelText('Nazwa folderu');
    await userEvent.clear(input);
    await userEvent.type(input, 'Footwork');
    fireEvent.click(screen.getByRole('button', { name: /Zapisz/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Folder o tej nazwie już istnieje.',
      );
    });
  });

  it('klik "Anuluj" wywołuje onOpenChange(false) bez wywołania mutation', () => {
    const onOpenChange = vi.fn();

    render(
      <EditFolderDialog
        folder={FAKE_FOLDER}
        open={true}
        onOpenChange={onOpenChange}
      />,
      { wrapper: makeWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: /Anuluj/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
