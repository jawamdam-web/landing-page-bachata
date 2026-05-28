import { createContext } from 'react';
import { type Session, type User } from '@supabase/supabase-js';

/**
 * Auth state — dyskryminowana unia (coding-rules §13: stan zamiast wielu
 * booleanów). `status` jest jedynym źródłem prawdy o fazie.
 *
 * - loading      → bootstrap (getSession w toku), user/session nieznane
 * - authenticated→ aktywna sesja
 * - unauthenticated → brak sesji
 */
export type AuthState =
  | { status: 'loading'; user: null; session: null }
  | { status: 'authenticated'; user: User; session: Session }
  | { status: 'unauthenticated'; user: null; session: null };

export interface AuthContextValue {
  state: AuthState;
  /** true dopóki trwa bootstrap sesji (wygodny alias dla guards). */
  loading: boolean;
  /** Zalogowany user lub null (wygodny alias). */
  user: User | null;
  /** Wylogowanie — czyści sesję i stan. */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
