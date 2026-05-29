import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VideoGrid } from './VideoGrid';
import type { Video } from '../types';

/**
 * VideoGrid tests — EmptyLibrary gdy brak filmów, karty gdy są dane.
 *
 * IU-7: VideoCard teraz używa useFolders (wymaga AuthProvider + QueryClient).
 * Mockujemy useAuth i useFolders żeby wyizolować VideoGrid z VideoCard.
 */

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: { status: 'authenticated', user: { id: 'user-1' }, session: null },
    loading: false,
    user: { id: 'user-1' },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/features/library/hooks/useFolders', () => ({
  useFolders: vi
    .fn()
    .mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
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

function makeVideo(id: string): Video {
  return {
    id,
    user_id: 'user-1',
    source: 'youtube_link',
    source_url: `https://youtu.be/${id}`,
    source_id: id,
    title: `Film ${id}`,
    notes: null,
    thumbnail_url: null,
    embed_html: null,
    duration_seconds: null,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  };
}

describe('VideoGrid', () => {
  it('renderuje EmptyLibrary gdy videos.length === 0', () => {
    render(<VideoGrid videos={[]} />, { wrapper: makeWrapper() });
    expect(screen.getByTestId('empty-library')).toBeInTheDocument();
  });

  it('nie renderuje EmptyLibrary gdy są filmy', () => {
    render(<VideoGrid videos={[makeVideo('v-1')]} />, {
      wrapper: makeWrapper(),
    });
    expect(screen.queryByTestId('empty-library')).not.toBeInTheDocument();
  });

  it('renderuje VideoCard dla każdego filmu', () => {
    render(
      <VideoGrid
        videos={[makeVideo('v-1'), makeVideo('v-2'), makeVideo('v-3')]}
      />,
      { wrapper: makeWrapper() },
    );
    expect(screen.getAllByTestId('video-card')).toHaveLength(3);
  });

  it('renderuje tytuły filmów', () => {
    render(<VideoGrid videos={[makeVideo('abc'), makeVideo('xyz')]} />, {
      wrapper: makeWrapper(),
    });
    expect(screen.getByText('Film abc')).toBeInTheDocument();
    expect(screen.getByText('Film xyz')).toBeInTheDocument();
  });
});
