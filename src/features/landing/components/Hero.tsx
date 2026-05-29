import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Hero — pierwsze wrażenie landingu (R2/R3). Mobile-first.
 *
 * Mobile: foto portrait (4:5) jako tło z gradient overlay → display heading +
 * tagline + 2 CTA w pionie. Desktop (>=md): foto landscape (16:9) w prawej
 * kolumnie, heading + CTA w lewej.
 *
 * Foto przez <picture> (mobile/desktop źródła) + loading="eager" +
 * fetchPriority="high" (LCP critical, DESIGN.md media.hero). Graceful
 * fallback: tokenowe tło accent.soft jest ZAWSZE pod obrazem, więc gdy obraz
 * się nie załaduje (onError → ukrycie <img>) — brak broken-image icon, alt
 * niesie kontekst. CTA: primary "Załóż konto" → /signup; secondary
 * "Dowiedz się więcej" (ghost) → smooth scroll do #jak-to-dziala.
 */

interface HeroProps {
  /** Źródło desktop (16:9). Domyślnie placeholder. */
  desktopSrc?: string;
  /** Źródło mobile (4:5). Domyślnie placeholder. */
  mobileSrc?: string;
}

const HEADING = 'Twoje filmy z zajęć — uporządkowane.';
const TAGLINE =
  'Zapisuj bachatę z YouTube, Facebooka i własnego telefonu w jednym miejscu. ' +
  'I tańcz lokalnie — w Lubinie.';
const HERO_ALT = 'Para tańcząca bachatę';

export function Hero({
  desktopSrc = '/hero-placeholder-desktop.svg',
  mobileSrc = '/hero-placeholder-mobile.svg',
}: HeroProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    setHasImageError(true);
    // Ukryj zepsuty obraz — tokenowe tło pozostaje (brak broken-image icon).
    event.currentTarget.style.display = 'none';
  };

  return (
    <section className="bg-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-20 md:grid-cols-2 md:gap-12 md:px-8 md:py-28 xl:px-10 xl:py-32">
        <div className="order-2 md:order-1">
          <p className="text-meta font-medium uppercase tracking-[0.02em] text-accent-soft-foreground">
            Bachata Napoli · Lubin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.02em] text-fg text-balance md:text-5xl">
            {HEADING}
          </h1>
          <p className="mt-4 max-w-prose text-lg text-fg-muted text-pretty">
            {TAGLINE}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className={buttonVariants({ size: 'lg' })}>
              Załóż konto
            </Link>
            <a
              href="#jak-to-dziala"
              className={buttonVariants({ variant: 'ghost', size: 'lg' })}
            >
              Dowiedz się więcej
            </a>
          </div>
        </div>

        <div
          className={cn(
            'order-1 overflow-hidden rounded-xl bg-accent-soft md:order-2',
            'aspect-[4/5] md:aspect-video',
            'shadow-hairline',
          )}
        >
          {hasImageError ? null : (
            <picture>
              <source
                media="(min-width: 48rem)"
                srcSet={desktopSrc}
                width={1600}
                height={900}
              />
              <img
                src={mobileSrc}
                alt={HERO_ALT}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={800}
                height={1000}
                onError={handleImageError}
                className="size-full object-cover"
              />
            </picture>
          )}
        </div>
      </div>
    </section>
  );
}
