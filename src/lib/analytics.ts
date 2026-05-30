/**
 * Plausible analytics wrapper — privacy-friendly, consent-gated.
 *
 * Zasady:
 * - initAnalytics() wstrzykuje skrypt Plausible tylko gdy consent = true.
 * - trackEvent() jest no-op gdy brak zgody lub gdy window undefined (SSR).
 * - isAnalyticsEnabled() czyta localStorage bezpośrednio — moduł (nie hook).
 * - Klucz consent: 'bachatanapoli.cookie-consent' (zgodny z useCookieConsent).
 */

const CONSENT_STORAGE_KEY = 'bachatanapoli.cookie-consent';
const PLAUSIBLE_SCRIPT_ID = 'plausible-analytics';

interface ConsentData {
  analytics?: boolean;
  [key: string]: unknown;
}

export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as ConsentData;
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (!isAnalyticsEnabled()) return;
  if (document.getElementById(PLAUSIBLE_SCRIPT_ID)) return;

  const domain =
    (import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined) ??
    'bachatanapoli.pl';

  const script = document.createElement('script');
  script.id = PLAUSIBLE_SCRIPT_ID;
  script.defer = true;
  script.setAttribute('data-domain', domain);
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number>,
): void {
  if (typeof window === 'undefined') return;
  if (!isAnalyticsEnabled()) return;

  type PlausibleFn = (
    event: string,
    options?: { props?: Record<string, string | number> },
  ) => void;

  const plausible = (window as { plausible?: PlausibleFn }).plausible;
  if (typeof plausible !== 'function') return;

  plausible(name, props ? { props } : undefined);
}
