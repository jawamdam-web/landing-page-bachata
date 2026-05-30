import { useCallback, useState } from 'react';

const STORAGE_KEY = 'bachatanapoli.cookie-consent';

export type ConsentState = {
  analytics: boolean | null;
  timestamp: number | null;
};

export type UseCookieConsentReturn = {
  consent: ConsentState;
  acceptAll: () => void;
  acceptEssentialOnly: () => void;
};

function readFromStorage(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { analytics: null, timestamp: null };
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'analytics' in parsed &&
      'timestamp' in parsed
    ) {
      const p = parsed as Record<string, unknown>;
      const analytics =
        p.analytics === true || p.analytics === false ? p.analytics : null;
      const timestamp = typeof p.timestamp === 'number' ? p.timestamp : null;
      return { analytics, timestamp };
    }
  } catch {
    // corrupted storage — treat as no decision
  }
  return { analytics: null, timestamp: null };
}

function writeToStorage(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota) — silently ignore
  }
}

export function useCookieConsent(): UseCookieConsentReturn {
  const [consent, setConsent] = useState<ConsentState>(readFromStorage);

  const acceptAll = useCallback(() => {
    const next: ConsentState = { analytics: true, timestamp: Date.now() };
    writeToStorage(next);
    setConsent(next);
  }, []);

  const acceptEssentialOnly = useCallback(() => {
    const next: ConsentState = { analytics: false, timestamp: Date.now() };
    writeToStorage(next);
    setConsent(next);
  }, []);

  return { consent, acceptAll, acceptEssentialOnly };
}
