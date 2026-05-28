import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * /auth-callback — strona docelowa OAuth redirect + email confirm.
 *
 * Klient Supabase (detectSessionInUrl: true) ekstrahuje sesję z hash/query
 * asynchronicznie i emituje onAuthStateChange → AuthProvider aktualizuje stan.
 * Tu czekamy aż status się ustali i przekierowujemy:
 *   - authenticated   → ?next lub /library
 *   - unauthenticated → /login (link wygasł / błąd)
 *
 * Lazy-loaded w router.tsx.
 */

function resolveNextPath(raw: string | null): string {
  if (!raw) return '/library';
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith('/') && !decoded.startsWith('//')) {
    return decoded;
  }
  return '/library';
}

export function AuthCallbackPage() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (state.status === 'authenticated') {
      const next = resolveNextPath(searchParams.get('next'));
      void navigate(next, { replace: true });
    } else if (state.status === 'unauthenticated') {
      void navigate('/login', { replace: true });
    }
  }, [state.status, searchParams, navigate]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5">
      <div
        role="status"
        className="flex flex-col items-center gap-3 text-fg-muted"
      >
        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
        <p className="text-base">Logujemy Cię…</p>
      </div>
    </main>
  );
}

export default AuthCallbackPage;
