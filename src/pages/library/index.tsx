import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';

/**
 * /library — PLACEHOLDER (IU-4). Pełną bibliotekę (VideoGrid, sidebar, foldery)
 * buduje IU-6. Tu istnieje tylko po to, żeby protected route guard miał cel
 * redirectu i można było zweryfikować flow auth (login → /library, logout).
 *
 * IU-6 zastąpi ten plik docelowym dashboardem.
 */
export function LibraryPage() {
  const { user, signOut } = useAuth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-prose flex-col gap-4 px-5 py-12">
      <p className="text-meta font-medium uppercase tracking-[0.02em] text-fg-muted">
        Biblioteka
      </p>
      <h1 className="text-2xl font-semibold tracking-[-0.015em] text-fg">
        Cześć{user?.email ? `, ${user.email}` : ''}.
      </h1>
      <p className="text-base text-fg-muted text-pretty">
        Twoja biblioteka czeka na pierwszy film. (Ten widok to placeholder —
        pełny dashboard powstaje w kolejnym etapie.)
      </p>
      <div>
        <Button variant="outline" onClick={() => void signOut()}>
          Wyloguj się
        </Button>
      </div>
    </main>
  );
}

export default LibraryPage;
