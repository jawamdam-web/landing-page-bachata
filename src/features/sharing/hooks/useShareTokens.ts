/**
 * useShareTokens — React Query hooks dla tokenów udostępniania.
 *
 * Eksporty:
 * - useShareTokens(targetType, targetId) — lista aktywnych tokenów
 * - useCreateShareToken() — mutation: generuje nowy token
 * - useRevokeShareToken() — mutation: odwołuje token
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  createShareToken,
  listShareTokens,
  revokeShareToken,
} from '@/features/sharing/api/shareTokens';
import type {
  CreateShareTokenParams,
  ShareTargetType,
} from '@/features/sharing/api/shareTokens';

/** Query key factory dla tokenów udostępniania. */
export const shareTokensKeys = {
  list: (
    userId: string | null,
    targetType: ShareTargetType,
    targetId: string,
  ) => ['share_tokens', userId, targetType, targetId] as const,
};

/**
 * Zwraca aktywne tokeny dla danego video lub folderu.
 * Odświeżanie co 60s (linki rzadko się zmieniają).
 */
export function useShareTokens(targetType: ShareTargetType, targetId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: shareTokensKeys.list(userId, targetType, targetId),
    queryFn: () => listShareTokens(targetType, targetId),
    enabled: !!userId && !!targetId,
    staleTime: 60_000,
  });
}

/** Mutation: tworzy nowy publiczny token. */
export function useCreateShareToken() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: (params: CreateShareTokenParams) => createShareToken(params),

    onSuccess: (_, params) => {
      void queryClient.invalidateQueries({
        queryKey: shareTokensKeys.list(
          userId,
          params.targetType,
          params.targetId,
        ),
      });
    },

    onError: () => {
      toast.error('Nie udało się utworzyć linku. Spróbuj jeszcze raz.');
    },
  });
}

/** Mutation: odwołuje token (revoke). */
export function useRevokeShareToken() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string;
      targetType: ShareTargetType;
      targetId: string;
    }) => revokeShareToken(id),

    onSuccess: (_, { targetType, targetId }) => {
      void queryClient.invalidateQueries({
        queryKey: shareTokensKeys.list(userId, targetType, targetId),
      });
      toast.success('Dostęp cofnięty.');
    },

    onError: () => {
      toast.error('Nie udało się cofnąć dostępu.');
    },
  });
}
