import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '../hooks/useRequireAuth';

/**
 * RequireAuth — guard dla protected routes. Renderuje children TYLKO gdy user
 * jest zalogowany. Podczas bootstrapu sesji pokazuje loader (nie miga
 * contentem). Brak sesji → useRequireAuth przekierowuje na /login?next=...
 *
 * Użycie: <RequireAuth><LibraryPage /></RequireAuth>
 */

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const state = useRequireAuth();

  if (state.status === 'authenticated') {
    return <>{children}</>;
  }

  // loading (bootstrap) lub unauthenticated (redirect w toku) → loader
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5">
      <Loader2
        className="size-6 animate-spin text-fg-muted"
        aria-label="Ładowanie"
      />
    </main>
  );
}
