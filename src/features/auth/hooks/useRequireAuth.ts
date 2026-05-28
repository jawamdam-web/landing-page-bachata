import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from './useAuth';
import { type AuthState } from './auth-context';

/**
 * useRequireAuth — przekierowuje na `/login?next=<current>` gdy brak sesji.
 *
 * Zwraca aktualny `AuthState`, żeby komponent guard mógł renderować loader
 * podczas bootstrapu (`status === 'loading'`) zamiast migać contentem.
 * Redirect odpala się TYLKO po zakończeniu bootstrapu (status ustalony jako
 * `unauthenticated`) — nie podczas `loading` (uniknięcie fałszywego redirectu).
 */
export function useRequireAuth(): AuthState {
  const { state } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (state.status !== 'unauthenticated') return;

    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    void navigate(`/login?next=${next}`, { replace: true });
  }, [state.status, location.pathname, location.search, navigate]);

  return state;
}
