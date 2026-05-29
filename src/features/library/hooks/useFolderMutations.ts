/**
 * useFolderMutations — React Query mutations dla CRUD folderów + assignment m:n.
 *
 * Wzorce:
 * - Optimistic updates: onMutate → snapshot cache → modify → onError rollback
 * - Sonner toasts: success/error feedback
 * - Query invalidation po mutations: ['folders', userId]
 *
 * Eksporty:
 * - useCreateFolder
 * - useUpdateFolder
 * - useDeleteFolder
 * - useAssignVideoToFolders
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  assignVideoToFolders,
  createFolder,
  deleteFolder,
  isDuplicateFolderError,
  updateFolder,
} from '../api/folders';
import type { Folder } from '../types';

/** Zwraca komunikat błędu dla duplicate constraint (23505). */
function resolveErrorMessage(error: unknown, fallback: string): string {
  if (isDuplicateFolderError(error)) {
    return 'Folder o tej nazwie już istnieje.';
  }
  return fallback;
}

/** Mutation: tworzy nowy folder. Invaliduje ['folders', userId]. */
export function useCreateFolder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (name: string) => createFolder(name),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders', userId] });
      toast.success('Folder utworzony.');
    },

    onError: (error: unknown) => {
      toast.error(
        resolveErrorMessage(error, 'Nie udało się utworzyć folderu.'),
      );
    },
  });
}

/** Mutation: zmienia nazwę folderu. Optimistic update + rollback przy błędzie. */
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateFolder(id, name),

    onMutate: async ({ id, name }) => {
      const queryKey = ['folders', userId] as const;
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<Folder[]>(queryKey);

      queryClient.setQueryData<Folder[]>(
        queryKey,
        (prev) => prev?.map((f) => (f.id === id ? { ...f, name } : f)) ?? [],
      );

      return { snapshot };
    },

    onError: (error: unknown, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(['folders', userId], context.snapshot);
      }
      toast.error(
        resolveErrorMessage(error, 'Nie udało się zmienić nazwy folderu.'),
      );
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders', userId] });
      toast.success('Nazwa zmieniona.');
    },
  });
}

/** Mutation: usuwa folder. Optimistic update (usuwa z cache) + rollback przy błędzie. */
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),

    onMutate: async (id) => {
      const queryKey = ['folders', userId] as const;
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<Folder[]>(queryKey);

      queryClient.setQueryData<Folder[]>(
        queryKey,
        (prev) => prev?.filter((f) => f.id !== id) ?? [],
      );

      return { snapshot };
    },

    onError: (error: unknown, _id, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(['folders', userId], context.snapshot);
      }
      toast.error(
        error instanceof Error
          ? error.message
          : 'Nie udało się usunąć folderu.',
      );
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['folders', userId] });
      void queryClient.invalidateQueries({ queryKey: ['videos', userId] });
      toast.success('Folder usunięty. Filmy zostają w bibliotece.');
    },
  });
}

/**
 * Mutation: przypisuje film do folderów (diff and apply).
 * Optimistic update na cache ['videos', userId, { folderId }] — niezbędny
 * dla natychmiastowego feedbacku przy filtrowaniu library.
 */
export function useAssignVideoToFolders() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: ({
      videoId,
      folderIds,
    }: {
      videoId: string;
      folderIds: string[];
    }) => assignVideoToFolders(videoId, folderIds),

    onSuccess: (_, { folderIds }) => {
      // Invalidate all folder-filtered video queries + base videos query
      void queryClient.invalidateQueries({ queryKey: ['videos', userId] });
      folderIds.forEach((folderId) => {
        void queryClient.invalidateQueries({
          queryKey: ['videos', userId, { folderId }],
        });
      });
      toast.success('Foldery zaktualizowane.');
    },

    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Nie udało się zaktualizować folderów.',
      );
    },
  });
}
