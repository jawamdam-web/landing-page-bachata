import { Reveal } from './Reveal';

/**
 * Instructors (R6) — sekcja instruktorów. 2-kolumnowy grid (1 kol. mobile).
 *
 * Foto (placeholder SVG) + bio Małgosi i Szymona + link do Bachata Rebel.
 * Bio i href to PLACEHOLDERY do potwierdzenia przez biznes. id="instruktorzy".
 * Obraz dostaje shadow-hairline (DESIGN.md sekcja 7: image outline).
 */

interface Instructor {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
}

const REBEL_HREF = 'https://bachatarebel.pl';

const INSTRUCTORS: readonly Instructor[] = [
  {
    name: 'Małgosia',
    role: 'Instruktorka',
    bio: 'Prowadzi zajęcia bachaty z naciskiem na muzykalność i czystą technikę. Tańczy i uczy z pasją, którą zaraża całą grupę.',
    imageSrc: '/instruktorzy-placeholder.svg',
  },
  {
    name: 'Szymon',
    role: 'Instruktor',
    bio: 'Skupia się na prowadzeniu i swobodzie ruchu. Sprawia, że nawet pierwsze kroki na parkiecie są naturalne i pełne luzu.',
    imageSrc: '/instruktorzy-placeholder.svg',
  },
];

export function Instructors() {
  return (
    <section
      id="instruktorzy"
      aria-labelledby="instruktorzy-heading"
      className="scroll-mt-20 bg-bg-subtle py-12 md:py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8 xl:px-10">
        <Reveal className="max-w-prose">
          <p className="text-meta font-medium uppercase tracking-[0.02em] text-accent-soft-foreground">
            Instruktorzy
          </p>
          <h2
            id="instruktorzy-heading"
            className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-fg text-balance md:text-3xl"
          >
            Prowadzą Małgosia i Szymon.
          </h2>
          <p className="mt-4 text-lg text-fg-muted text-pretty">
            Z ekipą{' '}
            <a
              href={REBEL_HREF}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent-soft-foreground underline-offset-4 hover:underline"
            >
              Bachata Rebel
            </a>
            .
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {INSTRUCTORS.map((instructor, index) => (
            <Reveal key={instructor.name} delayMs={index * 30}>
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-accent-soft shadow-hairline">
                <img
                  src={instructor.imageSrc}
                  alt={`${instructor.name} — instruktor bachaty`}
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={900}
                  className="size-full object-cover"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-fg">
                {instructor.name}
              </h3>
              <p className="text-meta font-medium uppercase tracking-[0.02em] text-fg-muted">
                {instructor.role}
              </p>
              <p className="mt-2 text-base text-fg-muted text-pretty">
                {instructor.bio}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
