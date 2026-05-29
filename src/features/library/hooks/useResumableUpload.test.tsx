/**
 * useResumableUpload.test.tsx
 *
 * Scenariusze obowiązkowe z planu IU-9:
 *  [1] initial state: { status: 'idle' }
 *  [2] during upload: { status: 'uploading', progress: 0.5 } po 50%
 *  [3] success → createVideoFromUpload wywołane + { status: 'success' }
 *  [4] error → { status: 'error', error }
 *  [5] sessionStorage persistuje i odczytuje stan
 */

import { type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResumableUpload } from './useResumableUpload';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    loading: false,
    state: { status: 'authenticated', user: { id: 'user-123' }, session: {} },
    signOut: vi.fn(),
  }),
}));

vi.mock('../../../features/auth/api/google-identity', () => ({
  getGoogleAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
  refreshGoogleAccessToken: vi.fn().mockResolvedValue('refreshed-token'),
}));

vi.mock('@/lib/youtube-resumable-upload', () => ({
  uploadToYoutube: vi.fn(),
  QuotaExceededError: class QuotaExceededError extends Error {
    constructor() {
      super('quota');
      this.name = 'QuotaExceededError';
    }
  },
  UploadAbortedError: class UploadAbortedError extends Error {
    constructor() {
      super('aborted');
      this.name = 'UploadAbortedError';
    }
  },
  UploadFailedError: class UploadFailedError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'UploadFailedError';
    }
  },
}));

vi.mock('../api/videos', () => ({
  createVideoFromUpload: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { uploadToYoutube } from '@/lib/youtube-resumable-upload';
import { createVideoFromUpload } from '../api/videos';
const mockUpload = uploadToYoutube as ReturnType<typeof vi.fn>;
const mockCreate = createVideoFromUpload as ReturnType<typeof vi.fn>;

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function makeFile(sizeBytes = 1024, name = 'test.mp4'): File {
  return new File([new ArrayBuffer(sizeBytes)], name, { type: 'video/mp4' });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useResumableUpload', () => {
  /**
   * [1] initial state: { status: 'idle' }
   */
  it('starts in idle state', () => {
    const { result } = renderHook(() => useResumableUpload(), {
      wrapper: makeWrapper(),
    });

    expect(result.current.uploadState).toEqual({ status: 'idle' });
  });

  /**
   * [2] podczas uploadu: { status: 'uploading', progress: ~0.5 } po 50% chunks
   */
  it('transitions to uploading state with progress during upload', async () => {
    let capturedOnProgress:
      | ((uploaded: number, total: number) => void)
      | undefined;

    mockUpload.mockImplementation(
      (opts: { onProgress: (u: number, t: number) => void }) => {
        capturedOnProgress = opts.onProgress;
        return new Promise(() => {}); // never resolves
      },
    );

    const { result } = renderHook(() => useResumableUpload(), {
      wrapper: makeWrapper(),
    });

    const file = makeFile(1000);
    act(() => {
      result.current.startUpload(file, 'Test video');
    });

    // Stan powinien być uploading
    await waitFor(() => {
      expect(result.current.uploadState.status).toBe('uploading');
    });

    // Symuluj 50% postęp
    act(() => {
      capturedOnProgress?.(500, 1000);
    });

    expect(result.current.uploadState).toMatchObject({
      status: 'uploading',
      progress: 0.5,
      uploadedBytes: 500,
      totalBytes: 1000,
    });
  });

  /**
   * [3] success → createVideoFromUpload wywołane + { status: 'success' }
   */
  it('calls createVideoFromUpload and transitions to success on upload complete', async () => {
    const youtubeVideoId = 'yt-vid-456';
    mockUpload.mockResolvedValue({ youtubeVideoId });
    mockCreate.mockResolvedValue({ id: 'video-db-id' });

    const { result } = renderHook(() => useResumableUpload(), {
      wrapper: makeWrapper(),
    });

    const file = makeFile(1024);
    act(() => {
      result.current.startUpload(file, 'Success video');
    });

    await waitFor(() => {
      expect(result.current.uploadState.status).toBe('success');
    });

    expect(result.current.uploadState).toEqual({
      status: 'success',
      youtubeVideoId,
    });
    expect(mockCreate).toHaveBeenCalledWith({
      youtubeVideoId,
      title: 'Success video',
    });
  });

  /**
   * [4] error → { status: 'error', error }
   */
  it('transitions to error state when upload throws', async () => {
    const uploadError = new Error('Sieć niedostępna');
    mockUpload.mockRejectedValue(uploadError);

    const { result } = renderHook(() => useResumableUpload(), {
      wrapper: makeWrapper(),
    });

    const file = makeFile(1024);
    act(() => {
      result.current.startUpload(file, 'Error video');
    });

    await waitFor(() => {
      expect(result.current.uploadState.status).toBe('error');
    });

    expect(result.current.uploadState).toMatchObject({
      status: 'error',
      error: uploadError,
    });
  });

  /**
   * [5] sessionStorage persistuje stan podczas uploadu i odczytuje po reload
   */
  it('persists upload state to sessionStorage and reads it back', async () => {
    let capturedOnProgress:
      | ((uploaded: number, total: number) => void)
      | undefined;

    mockUpload.mockImplementation(
      (opts: { onProgress: (u: number, t: number) => void }) => {
        capturedOnProgress = opts.onProgress;
        return new Promise(() => {}); // never resolves
      },
    );

    const { result } = renderHook(() => useResumableUpload(), {
      wrapper: makeWrapper(),
    });

    const file = makeFile(2000);
    act(() => {
      result.current.startUpload(file, 'Persistent video');
    });

    await waitFor(() => {
      expect(result.current.uploadState.status).toBe('uploading');
    });

    // Zapisuje stan przez onProgress
    act(() => {
      capturedOnProgress?.(1000, 2000);
    });

    // SessionStorage powinien mieć stan
    const stored = sessionStorage.getItem('yt_resumable_upload_state');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as {
      title: string;
      uploadedBytes: number;
      fileSize: number;
    };
    expect(parsed.title).toBe('Persistent video');
    expect(parsed.uploadedBytes).toBe(1000);
    expect(parsed.fileSize).toBe(2000);

    // Nowy renderHook (symuluje reload) odczytuje persistedState
    const { result: result2 } = renderHook(() => useResumableUpload(), {
      wrapper: makeWrapper(),
    });

    expect(result2.current.persistedState).toMatchObject({
      title: 'Persistent video',
      uploadedBytes: 1000,
      fileSize: 2000,
    });
  });

  /**
   * [6] cancelUpload → status 'cancelled', sessionStorage wyczyszczony
   */
  it('transitions to cancelled state after cancelUpload', async () => {
    const { UploadAbortedError } =
      await import('@/lib/youtube-resumable-upload');
    mockUpload.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new UploadAbortedError()), 0);
      });
    });

    const { result } = renderHook(() => useResumableUpload(), {
      wrapper: makeWrapper(),
    });

    act(() => {
      result.current.startUpload(makeFile(1024), 'Cancel test');
    });

    act(() => {
      result.current.cancelUpload();
    });

    await waitFor(() => {
      expect(result.current.uploadState.status).toBe('cancelled');
    });
  });
});
