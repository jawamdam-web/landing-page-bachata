import { type ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * AuthLayout — split layout dla stron auth (login/signup/forgot/reset).
 *
 * Mobile-first: pojedyncza kolumna z formularzem wyśrodkowanym (DESIGN.md
 * forms = max-w-narrow 32rem). Od lg pojawia się lewy panel editorial
 * (inverse bg, brand + tagline) — warm-neutral, bez solid terracotta
 * (DESIGN.md sekcja 3: akcent oszczędnie).
 *
 * Tokeny: bg.DEFAULT (cream), bg.inverse (ciemny panel), accent jako subtelny
 * underline pod brandem. min-h-dvh (dynamic viewport, mobile chrome).
 */

interface AuthLayoutProps {
  /** Nagłówek strony (h1), np. "Zaloguj się". */
  title: string;
  /** Podtytuł pod nagłówkiem (opcjonalny). */
  subtitle?: ReactNode;
  /** Formularz / treść. */
  children: ReactNode;
  /** Stopka pod formularzem (np. link "Nie masz konta?"). */
  footer?: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-bg lg:grid-cols-2">
      {/* Panel brandu — tylko desktop (lg+) */}
      <aside className="hidden flex-col justify-between bg-bg-inverse p-10 text-fg-inverse lg:flex">
        <Link
          to="/"
          className="text-meta font-medium uppercase tracking-[0.02em] text-fg-inverse/70 transition-colors hover:text-fg-inverse"
        >
          Bachata Napoli
        </Link>
        <div className="max-w-prose">
          <p className="text-2xl font-semibold tracking-[-0.02em] text-balance">
            Twoje filmy z zajęć — uporządkowane.
          </p>
          <p className="mt-3 text-base text-fg-inverse/70 text-pretty">
            Bez gubienia w rolce telefonu. Załóż konto i miej swoją bibliotekę
            tańca zawsze pod ręką.
          </p>
        </div>
        <span className="text-small text-fg-inverse/50">
          Lubin · spotkania i biblioteka tańca
        </span>
      </aside>

      {/* Kolumna z formularzem */}
      <main className="flex flex-col items-center justify-center px-5 py-12 md:px-8">
        <div className="w-full max-w-narrow">
          <Link
            to="/"
            className="mb-8 inline-block text-meta font-medium uppercase tracking-[0.02em] text-fg-muted transition-colors hover:text-fg lg:hidden"
          >
            Bachata Napoli
          </Link>
          <h1 className="text-2xl font-semibold tracking-[-0.015em] text-fg text-balance">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-base text-fg-muted text-pretty">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-8">{children}</div>
          {footer ? (
            <div className="mt-8 text-center text-small text-fg-muted">
              {footer}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
