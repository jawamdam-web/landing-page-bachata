import { Youtube, Share2, Smartphone, type LucideIcon } from 'lucide-react';
import { Reveal } from './Reveal';

/**
 * HowItWorks — explainer "Jak to działa". 3 źródła zapisu filmów.
 *
 * Sekcja MUSI mieć id="jak-to-dziala" — target smooth-scroll z Hero ("Dowiedz
 * się więcej") i z nawigacji. 3-kolumnowy grid (desktop) / stack (mobile).
 * Każda kolumna: ikona Lucide + heading + 1 zdanie. Stagger reveal (30ms/idx).
 */

interface Source {
  icon: LucideIcon;
  title: string;
  description: string;
}

const SOURCES: readonly Source[] = [
  {
    icon: Youtube,
    title: 'Wklej link z YouTube',
    description:
      'Skopiuj adres filmu z zajęć i wklej — zapiszemy go w Twojej bibliotece.',
  },
  {
    icon: Share2,
    title: 'Wklej post z Facebooka lub Instagrama',
    description:
      'Nagranie z grupowego posta? Wklej link, a my zajmiemy się resztą.',
  },
  {
    icon: Smartphone,
    title: 'Wgraj plik z telefonu',
    description:
      'Nakręciłeś własne wideo po zajęciach? Wgraj je prosto z telefonu.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="jak-to-dziala"
      aria-labelledby="jak-to-dziala-heading"
      className="scroll-mt-20 bg-bg-subtle py-12 md:py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8 xl:px-10">
        <Reveal className="max-w-prose">
          <p className="text-meta font-medium uppercase tracking-[0.02em] text-accent-soft-foreground">
            Jak to działa
          </p>
          <h2
            id="jak-to-dziala-heading"
            className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-fg text-balance md:text-3xl"
          >
            Trzy sposoby, żeby zapisać film z zajęć.
          </h2>
        </Reveal>

        <ul className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
          {SOURCES.map((source, index) => {
            const Icon = source.icon;
            return (
              <Reveal
                as="li"
                key={source.title}
                delayMs={index * 30}
                className="rounded-lg border border-border bg-bg p-6"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-md bg-accent-soft text-accent-soft-foreground">
                  <Icon
                    className="size-6"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-fg">
                  {source.title}
                </h3>
                <p className="mt-2 text-base text-fg-muted text-pretty">
                  {source.description}
                </p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
