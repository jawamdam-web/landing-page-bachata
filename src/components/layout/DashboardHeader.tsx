/**
 * DashboardHeader — sticky header dla tras zalogowanych.
 *
 * Logo (link do /) + user menu (DropdownMenu z shadcn).
 * User menu: Avatar z inicjałami/zdjęciem + "Moja biblioteka" link + separator + "Wyloguj".
 *
 * DESIGN.md sekcja 10 (Navigation): sticky z-sticky, backdrop-blur.
 * Konsekwentny styl z PublicHeader (h-16, max-w-6xl, px-5 md:px-8 xl:px-10).
 */

import { Link } from 'react-router';
import { LogOut, Library } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

/** Zwraca 1-2 inicjały z display_name lub email. */
function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0];
      const second = parts[1];
      if (first && second && first.length > 0 && second.length > 0) {
        return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase();
      }
    }
    const first = parts[0];
    if (first) {
      return first.slice(0, 2).toUpperCase();
    }
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export function DashboardHeader() {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name as string | undefined;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = getInitials(displayName, user?.email);

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8 xl:px-10">
        {/* Logo */}
        <Link
          to="/"
          className="text-base font-semibold tracking-[-0.01em] text-fg transition-colors hover:text-accent"
        >
          Bachata Napoli
        </Link>

        {/* User menu */}
        <div className="relative">
          <details className="group">
            <summary
              className="flex cursor-pointer list-none items-center gap-2 rounded-md p-1 transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label={`Menu użytkownika${user?.email ? `: ${user.email}` : ''}`}
            >
              {/* Avatar */}
              <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-sm font-medium text-accent-soft-foreground">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{
                      boxShadow: 'inset 0 0 0 1px oklch(0.90 0.008 70)',
                    }}
                  />
                ) : (
                  <span aria-hidden="true">{initials}</span>
                )}
              </div>
            </summary>

            {/* Dropdown */}
            <div className="absolute right-0 top-full z-dropdown mt-1 w-52 rounded-lg border border-border bg-bg shadow-md">
              {/* User info */}
              {user?.email && (
                <div className="border-b border-border px-3 py-2">
                  <p className="text-xs text-fg-muted truncate">{user.email}</p>
                </div>
              )}

              <nav className="py-1" aria-label="Menu konta">
                <Link
                  to="/library"
                  className="flex min-h-10 items-center gap-2 px-3 py-2 text-sm text-fg transition-colors hover:bg-bg-muted"
                >
                  <Library
                    className="size-4 text-fg-muted"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  Moja biblioteka
                </Link>
              </nav>

              <div className="border-t border-border py-1">
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex min-h-10 w-full items-center gap-2 px-3 py-2 text-sm text-fg transition-colors hover:bg-bg-muted"
                >
                  <LogOut
                    className="size-4 text-fg-muted"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  Wyloguj się
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
