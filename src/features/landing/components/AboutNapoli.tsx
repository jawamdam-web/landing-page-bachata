import { Reveal } from './Reveal';

/**
 * AboutNapoli (R4) — sekcja "Dlaczego Napoli?". Prose, max-w-prose.
 *
 * Copy to PLACEHOLDER do dopracowania przez biznes (partner / pizzeria Napoli).
 * Editorial: eyebrow (meta) + h2 + dwa akapity body_lg/body. Bez foto —
 * oddychający, tekstowy oddech między hero a HowItWorks.
 */

export function AboutNapoli() {
  return (
    <section
      aria-labelledby="o-napoli-heading"
      className="bg-bg py-12 md:py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8 xl:px-10">
        <Reveal className="max-w-prose">
          <p className="text-meta font-medium uppercase tracking-[0.02em] text-accent-soft-foreground">
            Dlaczego Napoli?
          </p>
          <h2
            id="o-napoli-heading"
            className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-fg text-balance md:text-3xl"
          >
            Zaczęło się od pizzy i bachaty w jednym lokalu.
          </h2>
          <div className="mt-6 space-y-4 text-lg text-fg-muted text-pretty">
            <p>
              Bachata Napoli wzięła nazwę od miejsca, w którym wszystko się
              zaczęło — lubińskiej pizzerii Napoli. Ciepło włoskiej kuchni i
              rytm bachaty okazały się zaskakująco dobrym połączeniem.
            </p>
            <p>
              Dziś to lokalna społeczność dancerów, którzy spotykają się, by
              tańczyć, uczyć się i dzielić nagraniami z zajęć. Bez wielkich słów
              — po prostu taniec, ludzie i dobra energia. (Tę historię
              dopracujemy razem z partnerem.)
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
