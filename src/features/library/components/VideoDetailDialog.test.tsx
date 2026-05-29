/**
 * VideoDetailDialog tests — modal z detalami wideo.
 *
 * Testujemy: render dialogu, edycja tytułu (inline blur), delete flow,
 * cancel delete.
 *
 * Mockujemy useUpdateVideo + useDeleteVideo przez vi.mock('../hooks/useVideoMutations').
 * Mockujemy VideoPlayer żeby uniknąć DOMPurify/iframe problemów w testach dialogu.
 */

import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VideoDetailDialog } from './VideoDetailDialog';
import type { Video } from '../types';

vi.mock('./VideoPlayer', () => ({
  VideoPlayer: () => <div data-testid="video-player" />,
}));

const { mockUpdateMutate, mockDeleteMutate } = vi.hoisted(() => ({
  mockUpdateMutate: vi.fn(),
  mockDeleteMutate: vi.fn(),
}));

vi.mock('../hooks/useVideoMutations', () => ({
  useUpdateVideo: vi.fn().mockReturnValue({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
  useDeleteVideo: vi.fn().mockReturnValue({
    mutate: mockDeleteMutate,
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

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: 'v-1',
    user_id: 'user-1',
    source: 'youtube_link',
    source_url: 'https://youtu.be/abc',
    source_id: 'abc',
    title: 'Figury podstawowe',
    notes: null,
    thumbnail_url: null,
    embed_html: null,
    duration_seconds: null,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

describe('VideoDetailDialog', () => {
  beforeEach(() => {
    mockUpdateMutate.mockReset();
    mockDeleteMutate.mockReset();
  });

  it('renderuje VideoPlayer i tytuł w input gdy open=true', () => {
    render(
      <VideoDetailDialog
        video={makeVideo({ title: 'Figury podstawowe' })}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    const titleInput = screen.getByRole('textbox', {
      name: /Tytuł filmu/i,
    });
    expect(titleInput).toHaveValue('Figury podstawowe');
  });

  it('renderuje textarea notatek', () => {
    render(
      <VideoDetailDialog
        video={makeVideo({ notes: 'Moje notatki' })}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    const textarea = screen.getByLabelText('Notatki');
    expect(textarea).toHaveValue('Moje notatki');
  });

  it('edycja tytułu + blur → useUpdateVideo mutate wywołane z nowym tytułem', async () => {
    render(
      <VideoDetailDialog
        video={makeVideo({ title: 'Stary tytuł' })}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    const titleInput = screen.getByRole('textbox', { name: /Tytuł filmu/i });

    // Wyczyść i wpisz nowy tytuł
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Nowy tytuł');
    fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'v-1', title: 'Nowy tytuł' }),
      );
    });
  });

  it('klik "Usuń" → AlertDialog z potwierdzeniem pojawia się', async () => {
    render(
      <VideoDetailDialog
        video={makeVideo()}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    fireEvent.click(screen.getByRole('button', { name: /Usuń/i }));

    await waitFor(() => {
      expect(screen.getByText('Usunąć ten film?')).toBeInTheDocument();
    });
  });

  it('klik "Usuń" w AlertDialog → useDeleteVideo wywołane + onClose', async () => {
    const onOpenChange = vi.fn();

    render(
      <VideoDetailDialog
        video={makeVideo()}
        open={true}
        onOpenChange={onOpenChange}
      />,
      { wrapper: makeWrapper() },
    );

    // Otwórz AlertDialog
    fireEvent.click(screen.getByRole('button', { name: /Usuń/i }));

    await waitFor(() => {
      expect(screen.getByText('Usunąć ten film?')).toBeInTheDocument();
    });

    // Potwierdź usunięcie — AlertDialog ma dwa "Usuń": trigger i action
    // Klikamy przycisk "Usuń" w footerze AlertDialoga (role=button, destructive)
    const confirmButtons = screen.getAllByRole('button', { name: /Usuń/i });
    // Ostatni button to AlertDialogAction
    const confirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmBtn!);

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith('v-1');
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('klik "Anuluj" w AlertDialog → AlertDialog znika bez wywołania useDeleteVideo', async () => {
    render(
      <VideoDetailDialog
        video={makeVideo()}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: makeWrapper() },
    );

    // Otwórz AlertDialog
    fireEvent.click(screen.getByRole('button', { name: /Usuń/i }));

    await waitFor(() => {
      expect(screen.getByText('Usunąć ten film?')).toBeInTheDocument();
    });

    // Kliknij Anuluj
    fireEvent.click(screen.getByRole('button', { name: /Anuluj/i }));

    await waitFor(() => {
      expect(screen.queryByText('Usunąć ten film?')).not.toBeInTheDocument();
    });

    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });
});
