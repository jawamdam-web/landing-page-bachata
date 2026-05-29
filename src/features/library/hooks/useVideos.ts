/**
 * useVideos — React Query wrapper dla getVideos().
 *
 * Query keys:
 *   ['videos', userId]              → wszystkie filmy usera
 *   ['videos', userId, { folderId }] → filmy w konkretnym folderze
 *
 * staleTime: 60_000 (1 min) — biblioteka rzadko się zmienia w tle.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getVideos } from '../api/videos';
import type { GetVideosParams, Video } from '../types';

export interface UseVideosResult {
  data: Video[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useVideos(params: GetVideosParams = {}): UseVideosResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const queryKey = params.folderId
    ? (['videos', userId, { folderId: params.folderId }] as const)
    : (['videos', userId] as const);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getVideos(params),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
  };
}
