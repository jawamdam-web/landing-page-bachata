import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FolderList } from './FolderList';
import type { Folder } from '../types';

/**
 * FolderList tests — testujemy zachowanie (behavior), nie implementację.
 *
 * FolderList zawiera EditFolderDialog i DeleteFolderConfirm (wewnętrzne dialogi),
 * które używają useUpdateFolder/useDeleteFolder → wymagają QueryClientProvider
 * i mockowania useAuth + mutations.
 */

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: { status: 'authenticated', user: { id: 'user-1' }, session: null },
    loading: false,
    user: { id: 'user-1' },
    signOut: vi.fn(),
  }),
}));

vi.mock('../hooks/useFolderMutations', () => ({
  useUpdateFolder: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteFolder: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateFolder: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useAssignVideoToFolders: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
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

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'f-1',
    user_id: 'user-1',
    name: 'Bachata sensual',
    created_at: '2026-05-01T10:00:00Z',
    updated_at: '2026-05-01T10:00:00Z',
    ...overrides,
  };
}

describe('FolderList', () => {
  it('zwraca null gdy lista folderów jest pusta', () => {
    const { container } = render(
      <FolderList
        folders={[]}
        activeFolderId={null}
        onFolderSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderuje nazwy folderów', () => {
    const folders = [
      makeFolder({ id: 'f-1', name: 'Bachata sensual' }),
      makeFolder({ id: 'f-2', name: 'Footwork' }),
    ];

    render(
      <FolderList
        folders={folders}
        activeFolderId={null}
        onFolderSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.getByText('Bachata sensual')).toBeInTheDocument();
    expect(screen.getByText('Footwork')).toBeInTheDocument();
  });

  it('aktywny folder ma aria-current="page"', () => {
    const folders = [
      makeFolder({ id: 'f-1', name: 'Bachata sensual' }),
      makeFolder({ id: 'f-2', name: 'Footwork' }),
    ];

    const { container } = render(
      <FolderList
        folders={folders}
        activeFolderId="f-1"
        onFolderSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    // Folder name button (nie dropdown trigger) ma aria-current="page" dla aktywnego
    const activeButton = container.querySelector('button[aria-current="page"]');
    expect(activeButton).toBeInTheDocument();
    expect(activeButton).toHaveTextContent('Bachata sensual');

    // Nieaktywny folder — brak aria-current
    expect(
      container.querySelector('button[aria-current="false"]'),
    ).not.toBeInTheDocument();
  });

  it('klik na folder wywołuje onFolderSelect z jego id', () => {
    const onFolderSelect = vi.fn();
    const folders = [makeFolder({ id: 'f-1', name: 'Zajęcia' })];

    const { container } = render(
      <FolderList
        folders={folders}
        activeFolderId={null}
        onFolderSelect={onFolderSelect}
      />,
      { wrapper: makeWrapper() },
    );

    // Folder name button nie ma aria-label — szukamy button bez aria-label z tekstem "Zajęcia"
    const folderButtons = container.querySelectorAll(
      'button:not([aria-label])',
    );
    const folderNameButton = Array.from(folderButtons).find((btn) =>
      btn.textContent?.includes('Zajęcia'),
    );
    expect(folderNameButton).toBeInTheDocument();
    fireEvent.click(folderNameButton!);

    expect(onFolderSelect).toHaveBeenCalledWith('f-1');
  });

  it('każdy folder ma button menu z aria-label "Opcje folderu [nazwa]"', () => {
    const folders = [makeFolder({ id: 'f-1', name: 'Bachata sensual' })];

    render(
      <FolderList
        folders={folders}
        activeFolderId={null}
        onFolderSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    expect(
      screen.getByRole('button', { name: /Opcje folderu Bachata sensual/i }),
    ).toBeInTheDocument();
  });

  it('klik na menu otwiera dropdown z opcjami "Zmień nazwę" i "Usuń folder"', async () => {
    const folders = [makeFolder({ id: 'f-1', name: 'Zajęcia' })];

    render(
      <FolderList
        folders={folders}
        activeFolderId={null}
        onFolderSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Opcje folderu Zajęcia/i }),
    );

    expect(await screen.findByText('Zmień nazwę')).toBeInTheDocument();
    expect(await screen.findByText('Usuń folder')).toBeInTheDocument();
  });

  it('klik "Zmień nazwę" otwiera EditFolderDialog (renderuje tytuł dialogu)', async () => {
    const folders = [makeFolder({ id: 'f-1', name: 'Zajęcia' })];

    render(
      <FolderList
        folders={folders}
        activeFolderId={null}
        onFolderSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Opcje folderu Zajęcia/i }),
    );

    const renameItem = await screen.findByText('Zmień nazwę');
    await userEvent.click(renameItem);

    expect(await screen.findByText('Zmień nazwę folderu')).toBeInTheDocument();
  });

  it('klik "Usuń folder" otwiera DeleteFolderConfirm (renderuje pytanie z nazwą)', async () => {
    const folders = [makeFolder({ id: 'f-1', name: 'Zajęcia' })];

    render(
      <FolderList
        folders={folders}
        activeFolderId={null}
        onFolderSelect={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Opcje folderu Zajęcia/i }),
    );

    const deleteItem = await screen.findByText('Usuń folder');
    await userEvent.click(deleteItem);

    expect(await screen.findByText(/Usunąć folder/i)).toBeInTheDocument();
  });
});
