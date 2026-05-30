import { Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CONTACT_EMAIL = 'kontakt@bachatanapoli.pl';
const CONTACT_PHONE = '+48 [numer — do uzupełnienia przez operatora]';
const CONTACT_ADDRESS = 'Pizzeria Napoli, Lubin [adres — do uzupełnienia]';

/**
 * ContactForm — formularz kontaktowy MVP.
 *
 * Submit otwiera mailto: z prefilled content (bez infrastruktury edge function).
 * Dane kontaktowe: email, telefon (placeholder), adres (placeholder).
 */

function buildMailtoUrl(name: string, email: string, message: string): string {
  const subject = encodeURIComponent(
    `Wiadomość od ${name || 'gościa'} — Bachata Napoli`,
  );
  const body = encodeURIComponent(
    `Imię: ${name}\nE-mail: ${email}\n\nWiadomość:\n${message}`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get('name') as string | null) ?? '';
    const email = (data.get('email') as string | null) ?? '';
    const message = (data.get('message') as string | null) ?? '';
    window.location.href = buildMailtoUrl(name, email, message);
  };

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
      <section
        aria-label="Dane kontaktowe"
        className="flex flex-col gap-6 lg:w-72 lg:shrink-0"
      >
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-fg">
          Napisz do nas
        </h2>

        <ul className="flex flex-col gap-4" role="list">
          <li className="flex items-start gap-3">
            <Mail
              className="mt-0.5 size-5 shrink-0 text-accent"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-fg">E-mail</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-accent-soft-foreground underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <Phone
              className="mt-0.5 size-5 shrink-0 text-fg-subtle"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-fg">Telefon</p>
              <p className="text-sm text-fg-muted">{CONTACT_PHONE}</p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <MapPin
              className="mt-0.5 size-5 shrink-0 text-fg-subtle"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-fg">Adres</p>
              <p className="text-sm text-fg-muted">{CONTACT_ADDRESS}</p>
            </div>
          </li>
        </ul>
      </section>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-5"
        aria-label="Formularz kontaktowy"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-name">Imię</Label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            placeholder="Twoje imię"
            autoComplete="given-name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-email">
            E-mail <span className="text-fg-muted text-xs">(wymagane)</span>
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            placeholder="twoj@email.pl"
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-message">
            Wiadomość <span className="text-fg-muted text-xs">(wymagane)</span>
          </Label>
          <Textarea
            id="contact-message"
            name="message"
            placeholder="W czym możemy pomóc?"
            rows={5}
            required
            className="resize-y"
          />
        </div>

        <Button type="submit" size="lg" className="self-start">
          Wyślij wiadomość
        </Button>

        <p className="text-xs text-fg-subtle">
          Kliknięcie "Wyślij wiadomość" otworzy Twój program pocztowy z
          przygotowaną wiadomością.
        </p>
      </form>
    </div>
  );
}
