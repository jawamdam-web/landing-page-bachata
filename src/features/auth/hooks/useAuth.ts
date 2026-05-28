import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context';

/**
 * useAuth — dostęp do stanu sesji + akcji (signOut).
 *
 * Initial state (przed bootstrapem): `{ status: 'loading', user: null }`.
 * Po getSession: `authenticated` (z user/session) lub `unauthenticated`.
 *
 * Rzuca jeśli użyty poza <AuthProvider> — fail-fast, łapie błędne drzewo.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musi być użyty wewnątrz <AuthProvider>.');
  }
  return context;
}
