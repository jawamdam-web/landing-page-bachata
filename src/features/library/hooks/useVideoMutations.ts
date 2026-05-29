/**
 * useVideoMutations — React Query mutations dla operacji na filmach (IU-8).
 *
 * Eksporty:
 * - useCreateVideoFromYoutubeLink
 * - useCreateVideoFromMetaLink
 * - useUpdateVideo
 * - useDeleteVideo
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  createVideoFromMetaLink,
  createVideoFromYoutubeLink,
  deleteVideo,
  isDuplicateVideoError,
  updateVideo,
} from '../api/videos';

/** Mutation: dodaje film z linku YouTube. */
export function useCreateVideoFromYoutubeLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (url: string) => createVideoFromYoutubeLink(url),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['videos', userId] });
      toast.success('Film dodany do biblioteki.');
    },

    onError: (error: unknown) => {
      if (isDuplicateVideoError(error)) {
        toast.error('Ten film już jest w Twojej bibliotece.');
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Nie udało się dodać filmu.';
      toast.error(message);
    },
  });
}

/** Mutation: dodaje film z linku Facebook/Instagram. */
export function useCreateVideoFromMetaLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (url: string) => createVideoFromMetaLink(url),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['videos', userId] });
      toast.success('Film dodany do biblioteki.');
    },

    onError: (error: unknown) => {
      if (isDuplicateVideoError(error)) {
        toast.error('Ten film już jest w Twojej bibliotece.');
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Nie udało się dodać filmu.';
      toast.error(message);
    },
  });
}

/** Mutation: aktualizuje tytuł i/lub notatki filmu. */
export function useUpdateVideo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (params: Parameters<typeof updateVideo>[0]) =>
      updateVideo(params),

    onSuccess: (updatedVideo) => {
      // Optimistic-style: zaktualizuj film w cache bez full refetch
      queryClient.setQueryData<unknown[]>(['videos', userId], (prev) =>
        Array.isArray(prev)
          ? prev.map((v) =>
              (v as { id: string }).id === updatedVideo.id ? updatedVideo : v,
            )
          : prev,
      );
      toast.success('Zapisano.');
    },

    onError: () => {
      toast.error('Nie udało się zapisać zmian.');
    },
  });
}

/** Mutation: usuwa film z biblioteki. */
export function useDeleteVideo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (id: string) => deleteVideo(id),

    onSuccess: (_, id) => {
      // Usuń film z cache (optimistic remove)
      queryClient.setQueryData<unknown[]>(['videos', userId], (prev) =>
        Array.isArray(prev)
          ? prev.filter((v) => (v as { id: string }).id !== id)
          : prev,
      );
      void queryClient.invalidateQueries({ queryKey: ['videos', userId] });
      toast.success('Film usunięty z biblioteki.');
    },

    onError: () => {
      toast.error('Nie udało się usunąć filmu.');
    },
  });
}
