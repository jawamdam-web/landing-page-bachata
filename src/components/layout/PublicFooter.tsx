import { Link } from 'react-router';

/**
 * PublicFooter — stopka stron publicznych.
 *
 * Linki do /privacy, /regulamin, /contact powstają w IU-11 — tu są tylko
 * odnośniki (route'y mogą jeszcze nie istnieć, to OK). Copyright z dynamicznym
 * rokiem. Inverse bg (DESIGN.md sekcja 1: ciemne sekcje = bg.inverse).
 */

const FOOTER_LINKS: readonly { to: string; label: string }[] = [
  { to: '/privacy', label: 'Prywatność' },
  { to: '/regulamin', label: 'Regulamin' },
  { to: '/contact', label: 'Kontakt' },
];

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-inverse text-fg-inverse">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8 md:py-16 xl:px-10">
        <div>
          <p className="text-base font-semibold tracking-[-0.01em]">
            Bachata Napoli
          </p>
          <p className="mt-1 text-small text-fg-inverse/60">
            Lubin · biblioteka tańca i spotkania
          </p>
        </div>

        <nav
          aria-label="Stopka"
          className="flex flex-wrap items-center gap-x-6 gap-y-2"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-small text-fg-inverse/70 underline-offset-4 transition-colors hover:text-fg-inverse hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border-inverse">
        <div className="mx-auto max-w-6xl px-5 py-4 md:px-8 xl:px-10">
          <p className="text-small text-fg-inverse/50 tabular-nums">
            © {currentYear} Bachata Napoli. Wszystkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  );
}
