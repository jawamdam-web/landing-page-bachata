import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import { Reveal } from './Reveal';

/**
 * FinalCTA — domykający blok wezwania do akcji.
 *
 * Jedyny blok z solid accent (terracotta) na stronie — świadomie, jako akcent
 * domykający (DESIGN.md sekcja 3: accent oszczędnie, ~10% powierzchni). CTA
 * "Załóż konto" → /signup. Przycisk na accent bg używa secondary variant
 * (jasne tło) dla kontrastu z terracotta.
 */

export function FinalCTA() {
  return (
    <section className="bg-bg py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8 xl:px-10">
        <Reveal className="rounded-xl bg-accent px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-2xl font-semibold tracking-[-0.015em] text-accent-foreground text-balance md:text-3xl">
            Zacznij porządkować swoje filmy z zajęć.
          </h2>
          <p className="mx-auto mt-4 max-w-prose text-lg text-accent-foreground/85 text-pretty">
            Załóż darmowe konto i miej swoją bibliotekę tańca zawsze pod ręką.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/signup"
              className={buttonVariants({ variant: 'secondary', size: 'lg' })}
            >
              Załóż konto
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
