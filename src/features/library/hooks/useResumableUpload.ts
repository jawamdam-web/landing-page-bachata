/**
 * useResumableUpload — React hook opakowujący YouTube Resumable Upload.
 *
 * State machine (discriminated union):
 *   idle → uploading → success | error
 *   uploading → cancelled (przez abort)
 *
 * Persystencja sessionStorage: zapisuje { resumableUrl, uploadedBytes, fileSize, title }
 * by umożliwić "Wznów upload?" po F5 (plik trzeba re-wybrać przez user).
 *
 * Po sukcesie: createVideoFromUpload → React Query invalidation.
 */

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getGoogleAccessToken,
  refreshGoogleAccessToken,
} from '../../../features/auth/api/google-identity';
import {
  uploadToYoutube,
  QuotaExceededError,
  UploadAbortedError,
} from '@/lib/youtube-resumable-upload';
import { createVideoFromUpload } from '../api/videos';

// ─── Typy ─────────────────────────────────────────────────────────────────────

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'success'
  | 'error'
  | 'cancelled';

export type UploadState =
  | { status: 'idle' }
  | {
      status: 'uploading';
      progress: number;
      uploadedBytes: number;
      totalBytes: number;
    }
  | { status: 'success'; youtubeVideoId: string }
  | { status: 'error'; error: Error }
  | { status: 'cancelled' };

// ─── SessionStorage key ────────────────────────────────────────────────────────

const SESSION_KEY = 'yt_resumable_upload_state';

export interface PersistedUploadState {
  title: string;
  fileSize: number;
  uploadedBytes: number;
}

function readPersistedState(): PersistedUploadState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedUploadState;
  } catch {
    return null;
  }
}

function writePersistedState(state: PersistedUploadState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage może być niedostępny (private mode) — ignorujemy
  }
}

function clearPersistedState(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignorujemy
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseResumableUploadReturn {
  uploadState: UploadState;
  startUpload: (file: File, title: string) => void;
  cancelUpload: () => void;
  resetUpload: () => void;
  persistedState: PersistedUploadState | null;
}

export function useResumableUpload(): UseResumableUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  function cancelUpload(): void {
    abortControllerRef.current?.abort();
  }

  function resetUpload(): void {
    abortControllerRef.current?.abort();
    setUploadState({ status: 'idle' });
    clearPersistedState();
  }

  function startUpload(file: File, title: string): void {
    if (uploadState.status === 'uploading') return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setUploadState({
      status: 'uploading',
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
    });

    void runUpload(file, title, controller.signal);
  }

  async function runUpload(
    file: File,
    title: string,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      const accessToken = await getGoogleAccessToken();

      const result = await uploadToYoutube({
        file,
        title,
        accessToken,
        signal,
        onProgress: (uploadedBytes, totalBytes) => {
          const progress = totalBytes > 0 ? uploadedBytes / totalBytes : 0;
          setUploadState({
            status: 'uploading',
            progress,
            uploadedBytes,
            totalBytes,
          });
          writePersistedState({ title, fileSize: totalBytes, uploadedBytes });
        },
        refreshToken: () => refreshGoogleAccessToken(),
      });

      // Upload zakończony sukcesem — zapisz do biblioteki
      await createVideoFromUpload({
        youtubeVideoId: result.youtubeVideoId,
        title,
      });

      clearPersistedState();
      void queryClient.invalidateQueries({ queryKey: ['videos', userId] });
      setUploadState({
        status: 'success',
        youtubeVideoId: result.youtubeVideoId,
      });
      toast.success('Film zapisany w bibliotece.');
    } catch (err) {
      clearPersistedState();

      if (err instanceof UploadAbortedError || signal.aborted) {
        setUploadState({ status: 'cancelled' });
        return;
      }

      if (err instanceof QuotaExceededError) {
        toast.error('Dziś osiągnęliśmy limit YT API. Spróbuj jutro.');
        setUploadState({
          status: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
        });
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(error.message || 'Nie udało się przesłać filmu.');
      setUploadState({ status: 'error', error });
    }
  }

  return {
    uploadState,
    startUpload,
    cancelUpload,
    resetUpload,
    persistedState: readPersistedState(),
  };
}
