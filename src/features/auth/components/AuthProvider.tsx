import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { type Session } from '@supabase/supabase-js';
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
} from '../hooks/auth-context';

/**
 * AuthProvider — trzyma stan sesji i subskrybuje zmiany auth.
 *
 * KLUCZOWE (ograniczenie środowiska #3): NIE importuje `@/lib/supabase` ani
 * `../api/auth` na top-level. Klient Supabase (fail-fast na brak env) jest
 * ładowany dynamicznie WEWNĄTRZ useEffect, więc renderowanie providera w root
 * (main.tsx) nie ściąga supabase do eager startup chain → `bun run dev`
 * bootuje bez `.env.local`. Subskrypcja onAuthStateChange odpala się dopiero
 * po zamontowaniu (client-side), gdzie env już są (lub provider gracefully
 * zostaje w stanie `unauthenticated` jeśli klient nie wstał).
 */

function deriveState(session: Session | null): AuthState {
  if (session) {
    return { status: 'authenticated', user: session.user, session };
  }
  return { status: 'unauthenticated', user: null, session: null };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    session: null,
  });

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function bootstrap(): Promise<void> {
      const { supabase } = await import('@/lib/supabase');

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      setState(deriveState(session));

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setState(deriveState(nextSession));
      });
      unsubscribe = () => subscription.unsubscribe();
    }

    void bootstrap();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    async function handleSignOut(): Promise<void> {
      const { signOut } = await import('../api/auth');
      await signOut();
    }

    return {
      state,
      loading: state.status === 'loading',
      user: state.user,
      signOut: handleSignOut,
    };
  }, [state]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
