/**
 * useFolders — React Query wrapper dla getFolders().
 *
 * Query key: ['folders', userId]
 * staleTime: 60_000 (1 min)
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getFolders } from '../api/folders';
import type { Folder } from '../types';

export interface UseFoldersResult {
  data: Folder[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useFolders(): UseFoldersResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['folders', userId] as const,
    queryFn: getFolders,
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
