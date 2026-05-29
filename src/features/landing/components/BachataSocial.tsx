import { MapPin, CalendarClock, Users, type LucideIcon } from 'lucide-react';
import { Reveal } from './Reveal';

/**
 * BachataSocial (R5) — "Bachata Napoli Social". STATYCZNE info o spotkaniu.
 *
 * BRAK RSVP w MVP (świadomie poza scope). Card z trzema metadanymi: gdzie /
 * kiedy / co. Wartości "kiedy" i miejsce to PLACEHOLDERY do potwierdzenia
 * przez biznes. Flat card wg DESIGN.md sekcja 7 (border + bg-subtle, zero
 * shadow). id="spotkania" — target nawigacji.
 */

interface MeetingDetail {
  icon: LucideIcon;
  label: string;
  value: string;
}

const DETAILS: readonly MeetingDetail[] = [
  {
    icon: MapPin,
    label: 'Gdzie',
    value: 'Pizzeria Napoli, Lubin',
  },
  {
    icon: CalendarClock,
    label: 'Kiedy',
    value: 'Czwartki, 19:00',
  },
  {
    icon: Users,
    label: 'Co',
    value: 'Lekcja, practise i integracja',
  },
];

export function BachataSocial() {
  return (
    <section
      id="spotkania"
      aria-labelledby="spotkania-heading"
      className="scroll-mt-20 bg-bg py-12 md:py-16 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8 xl:px-10">
        <Reveal className="max-w-prose">
          <p className="text-meta font-medium uppercase tracking-[0.02em] text-accent-soft-foreground">
            Bachata Napoli Social
          </p>
          <h2
            id="spotkania-heading"
            className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-fg text-balance md:text-3xl"
          >
            Spotykamy się, żeby tańczyć.
          </h2>
          <p className="mt-4 text-lg text-fg-muted text-pretty">
            Cotygodniowe spotkanie społeczności — lekcja, wspólne practise i
            integracja. Wpadnij, potańcz, poznaj ludzi.
          </p>
        </Reveal>

        <Reveal
          delayMs={30}
          className="mt-8 rounded-lg border border-border bg-bg-subtle p-6 md:p-8"
        >
          <dl className="grid gap-6 sm:grid-cols-3">
            {DETAILS.map((detail) => {
              const Icon = detail.icon;
              return (
                <div key={detail.label}>
                  <dt className="flex items-center gap-2 text-meta font-medium uppercase tracking-[0.02em] text-fg-muted">
                    <Icon
                      className="size-4 text-accent-soft-foreground"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    {detail.label}
                  </dt>
                  <dd className="mt-2 text-lg font-medium text-fg">
                    {detail.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
