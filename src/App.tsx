import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';

/**
 * App — smoke page IU-1 (CTA podpięte do auth w IU-4).
 *
 * Cel: baseline render verification. Demonstruje że:
 * - Tailwind v4 czyta @theme tokens (bg-bg, text-fg, color-accent)
 * - Geist Variable jest załadowany (font-sans)
 * - Button primary używa accent terracotta (oklch(0.62 0.13 38))
 * - Spacing/typography skala z DESIGN.md działa
 *
 * To NIE jest landing — landing buduje IU-5. To pure smoke page dla scaffoldu.
 * IU-4 podpiął CTA "Załóż konto" → /signup (Link + buttonVariants) bez
 * ściągania supabase do eager chain (Link to czysta nawigacja klienta).
 */
function App() {
  return (
    <main className="min-h-dvh bg-bg flex items-center justify-center px-5 py-12">
      <div className="max-w-narrow w-full text-center">
        <p className="text-meta uppercase tracking-[0.02em] text-fg-muted mb-3 text-[0.8125rem] font-medium">
          MVP — Foundation
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-fg text-balance mb-4">
          Bachata Napoli
        </h1>
        <p className="text-lg text-fg-muted text-pretty mb-8">
          Twoja biblioteka tańca + spotkania w Lubinie.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link to="/signup" className={buttonVariants({ size: 'lg' })}>
            Załóż konto
          </Link>
          <Link
            to="/login"
            className={buttonVariants({ variant: 'ghost', size: 'lg' })}
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    </main>
  );
}

export default App;
