import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VideoCard } from './VideoCard';
import type { Video } from '../types';

/**
 * VideoCard tests — testujemy zachowanie (behavior), nie implementację.
 * Sprawdzamy: renderowanie tytułu, poprawną ikonę źródła dla każdego source value.
 *
 * IU-7: VideoCard używa teraz useFolders (hook z useAuth + React Query),
 * dlatego testy wymagają mockowania useAuth i QueryClientProvider.
 */

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: { status: 'authenticated', user: { id: 'user-1' }, session: null },
    loading: false,
    user: { id: 'user-1' },
    signOut: vi.fn(),
  }),
}));

vi.mock('../hooks/useFolders', () => ({
  useFolders: vi.fn().mockReturnValue({
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

describe('VideoCard', () => {
  it('renderuje tytuł filmu', () => {
    render(
      <VideoCard
        folders={[]}
        video={makeVideo({ title: 'Bachata Social Lublin' })}
      />,
      {
        wrapper: makeWrapper(),
      },
    );
    expect(screen.getByText('Bachata Social Lublin')).toBeInTheDocument();
  });

  it('renderuje correct aria-label z tytułem', () => {
    render(
      <VideoCard folders={[]} video={makeVideo({ title: 'Sensual steps' })} />,
      {
        wrapper: makeWrapper(),
      },
    );
    const card = screen.getByRole('button', { name: /Sensual steps/i });
    expect(card).toBeInTheDocument();
  });

  it('wyświetla aria-label "Źródło: YouTube" dla source youtube_link', () => {
    render(
      <VideoCard folders={[]} video={makeVideo({ source: 'youtube_link' })} />,
      {
        wrapper: makeWrapper(),
      },
    );
    expect(screen.getByLabelText(/YouTube/i)).toBeInTheDocument();
  });

  it('wyświetla aria-label "Źródło: YouTube (upload)" dla source youtube_upload', () => {
    render(
      <VideoCard
        folders={[]}
        video={makeVideo({ source: 'youtube_upload' })}
      />,
      {
        wrapper: makeWrapper(),
      },
    );
    expect(screen.getByLabelText(/YouTube \(upload\)/i)).toBeInTheDocument();
  });

  it('wyświetla aria-label "Źródło: Facebook/Instagram" dla source meta_embed', () => {
    render(
      <VideoCard folders={[]} video={makeVideo({ source: 'meta_embed' })} />,
      {
        wrapper: makeWrapper(),
      },
    );
    expect(screen.getByLabelText(/Facebook\/Instagram/i)).toBeInTheDocument();
  });

  it('wyświetla duration w formacie mm:ss gdy duration_seconds podany', () => {
    render(
      <VideoCard folders={[]} video={makeVideo({ duration_seconds: 185 })} />,
      {
        wrapper: makeWrapper(),
      },
    );
    expect(screen.getByLabelText(/Czas trwania: 03:05/i)).toBeInTheDocument();
  });

  it('nie wyświetla duration gdy duration_seconds jest null', () => {
    render(
      <VideoCard folders={[]} video={makeVideo({ duration_seconds: null })} />,
      {
        wrapper: makeWrapper(),
      },
    );
    expect(screen.queryByLabelText(/Czas trwania/i)).not.toBeInTheDocument();
  });

  it('wyświetla thumbnail gdy thumbnail_url podany', () => {
    const { container } = render(
      <VideoCard
        folders={[]}
        video={makeVideo({
          thumbnail_url: 'https://img.youtube.com/vi/abc/mqdefault.jpg',
        })}
      />,
      { wrapper: makeWrapper() },
    );
    // img ma alt="" (dekoracyjny) → sprawdzamy obecność i src przez querySelector.
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      'src',
      'https://img.youtube.com/vi/abc/mqdefault.jpg',
    );
  });

  it('renderuje data-testid="video-card"', () => {
    render(<VideoCard folders={[]} video={makeVideo()} />, {
      wrapper: makeWrapper(),
    });
    expect(screen.getByTestId('video-card')).toBeInTheDocument();
  });
});
