import { Button } from '@/components/ui/button';
import { useCookieConsent } from '../hooks/useCookieConsent';

/**
 * CookieConsentBanner — renderuje się tylko gdy analytics === null (brak decyzji).
 *
 * Pozycja: fixed bottom-center (mobile) / bottom-right (desktop).
 * z-toast (70) — nad treścią, poniżej tooltipów.
 * WCAG: role="dialog", aria-live="polite", aria-label dla przycisków.
 */

export function CookieConsentBanner() {
  const { consent, acceptAll, acceptEssentialOnly } = useCookieConsent();

  if (consent.analytics !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Zgoda na pliki cookie"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-toast mx-auto max-w-sm border border-border bg-bg px-5 py-4 shadow-md sm:bottom-4 sm:left-auto sm:right-4 sm:rounded-lg"
    >
      <p className="text-sm text-fg">
        Używamy cookies do działania serwisu. Cookies analityczne (opcjonalne)
        pomagają nam ulepszyć platformę.{' '}
        <a
          href="/privacy#cookies"
          className="font-medium text-accent-soft-foreground underline-offset-4 hover:underline"
        >
          Dowiedz się więcej
        </a>
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={acceptEssentialOnly}
          aria-label="Zaakceptuj tylko niezbędne cookies"
        >
          Tylko niezbędne
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={acceptAll}
          aria-label="Zaakceptuj wszystkie cookies"
        >
          Akceptuj wszystkie
        </Button>
      </div>
    </div>
  );
}
