import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateFolderDialog } from './CreateFolderDialog';

/**
 * CreateFolderDialog tests.
 *
 * Mockujemy useCreateFolder — testujemy zachowanie formularza i walidację.
 * Nie testujemy internals hooka — wystarczy że mutation jest wywołana z poprawnym arg.
 */

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock('../hooks/useFolderMutations', () => ({
  useCreateFolder: vi.fn().mockReturnValue({
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

describe('CreateFolderDialog', () => {
  it('nie renderuje się gdy open={false}', () => {
    render(<CreateFolderDialog open={false} onOpenChange={vi.fn()} />, {
      wrapper: makeWrapper(),
    });

    expect(screen.queryByText('Nowy folder')).not.toBeInTheDocument();
  });

  it('renderuje input i button "Utwórz" gdy open={true}', () => {
    render(<CreateFolderDialog open={true} onOpenChange={vi.fn()} />, {
      wrapper: makeWrapper(),
    });

    expect(screen.getByLabelText('Nazwa folderu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Utwórz/i })).toBeInTheDocument();
  });

  it('submit z pustą nazwą pokazuje inline error walidacji', async () => {
    render(<CreateFolderDialog open={true} onOpenChange={vi.fn()} />, {
      wrapper: makeWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: /Utwórz/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Podaj nazwę folderu.',
      );
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('submit z nazwą > 100 znaków pokazuje inline error walidacji', async () => {
    const longName = 'a'.repeat(101);

    render(<CreateFolderDialog open={true} onOpenChange={vi.fn()} />, {
      wrapper: makeWrapper(),
    });

    const input = screen.getByLabelText('Nazwa folderu');
    await userEvent.type(input, longName);
    fireEvent.click(screen.getByRole('button', { name: /Utwórz/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Nazwa może mieć maksymalnie 100 znaków.',
      );
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('submit z poprawną nazwą wywołuje mutation z tą nazwą', async () => {
    mockMutateAsync.mockResolvedValue({
      id: 'f-new',
      name: 'Zajęcia',
      user_id: 'user-1',
    });
    const onOpenChange = vi.fn();

    render(<CreateFolderDialog open={true} onOpenChange={onOpenChange} />, {
      wrapper: makeWrapper(),
    });

    const input = screen.getByLabelText('Nazwa folderu');
    await userEvent.type(input, 'Zajęcia');
    fireEvent.click(screen.getByRole('button', { name: /Utwórz/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('Zajęcia');
    });
  });

  it('błąd 23505 pokazuje inline error "Folder o tej nazwie już istnieje."', async () => {
    const duplicateErr = Object.assign(new Error('duplicate key'), {
      code: '23505',
    });
    mockMutateAsync.mockRejectedValue(duplicateErr);

    render(<CreateFolderDialog open={true} onOpenChange={vi.fn()} />, {
      wrapper: makeWrapper(),
    });

    const input = screen.getByLabelText('Nazwa folderu');
    await userEvent.type(input, 'Zajęcia');
    fireEvent.click(screen.getByRole('button', { name: /Utwórz/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Folder o tej nazwie już istnieje.',
      );
    });
  });

  it('button "Anuluj" wywołuje onOpenChange(false)', () => {
    const onOpenChange = vi.fn();

    render(<CreateFolderDialog open={true} onOpenChange={onOpenChange} />, {
      wrapper: makeWrapper(),
    });

    fireEvent.click(screen.getByRole('button', { name: /Anuluj/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
