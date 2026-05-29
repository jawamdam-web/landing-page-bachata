import { useState } from 'react';
import { Link } from 'react-router';
import { Menu } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * PublicHeader — sticky top header dla stron publicznych (landing).
 *
 * Stan auth przez useAuth() (czyta TYLKO kontekst — zero importu supabase,
 * więc bezpieczny w eager chain landingu, ograniczenie środowiska #3):
 *   - authenticated → link "Moja biblioteka" (→ /library)
 *   - guest/loading → "Zaloguj się" (ghost) + "Załóż konto" (primary)
 *
 * Mobile (<md): hamburger otwierający shadcn Sheet z tą samą nawigacją.
 * Desktop (>=md): inline nav. DESIGN.md sekcja 10 (Navigation), z-sticky.
 */

const NAV_LINKS: readonly { href: string; label: string }[] = [
  { href: '#jak-to-dziala', label: 'Jak to działa' },
  { href: '#spotkania', label: 'Spotkania' },
  { href: '#instruktorzy', label: 'Instruktorzy' },
];

export function PublicHeader() {
  const { state } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = state.status === 'authenticated';

  const handleMenuLinkClick = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8 xl:px-10">
        <Link
          to="/"
          className="text-base font-semibold tracking-[-0.01em] text-fg"
        >
          Bachata Napoli
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Główna nawigacja"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Link
              to="/library"
              className={buttonVariants({ variant: 'secondary' })}
            >
              Moja biblioteka
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={buttonVariants({ variant: 'ghost' })}
              >
                Zaloguj się
              </Link>
              <Link to="/signup" className={buttonVariants()}>
                Załóż konto
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger
            aria-label="Otwórz menu"
            className="inline-flex size-11 items-center justify-center rounded-sm text-fg transition-colors hover:bg-bg-subtle md:hidden"
          >
            <Menu className="size-6" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-3/4 max-w-xs">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Nawigacja mobilna" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.href}>
                  <a
                    href={link.href}
                    onClick={handleMenuLinkClick}
                    className="rounded-sm px-3 py-3 text-base text-fg transition-colors hover:bg-bg-subtle"
                  >
                    {link.label}
                  </a>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2">
              {isAuthenticated ? (
                <SheetClose asChild>
                  <Link
                    to="/library"
                    className={buttonVariants({
                      variant: 'secondary',
                      size: 'lg',
                    })}
                  >
                    Moja biblioteka
                  </Link>
                </SheetClose>
              ) : (
                <>
                  <SheetClose asChild>
                    <Link
                      to="/login"
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'lg',
                      })}
                    >
                      Zaloguj się
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/signup"
                      className={buttonVariants({ size: 'lg' })}
                    >
                      Załóż konto
                    </Link>
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
