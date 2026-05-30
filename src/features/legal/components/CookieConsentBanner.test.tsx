import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type {
  ConsentState,
  UseCookieConsentReturn,
} from '../hooks/useCookieConsent';
import { CookieConsentBanner } from './CookieConsentBanner';

/**
 * CookieConsentBanner tests.
 *
 * Mockujemy useCookieConsent — testujemy zachowanie bannera w zależności od stanu.
 */

const mockUseCookieConsent = vi.fn<() => UseCookieConsentReturn>();

vi.mock('../hooks/useCookieConsent', () => ({
  useCookieConsent: () => mockUseCookieConsent(),
}));

function makeConsentReturn(analytics: boolean | null) {
  const consent: ConsentState = {
    analytics,
    timestamp: analytics !== null ? 123 : null,
  };
  return {
    consent,
    acceptAll: vi.fn(),
    acceptEssentialOnly: vi.fn(),
  };
}

function renderBanner() {
  return render(<CookieConsentBanner />);
}

describe('CookieConsentBanner', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('renderuje się gdy analytics === null (brak decyzji)', () => {
    mockUseCookieConsent.mockReturnValue(makeConsentReturn(null));
    renderBanner();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Używamy cookies/)).toBeInTheDocument();
  });

  it('nie renderuje się gdy analytics === true', () => {
    mockUseCookieConsent.mockReturnValue(makeConsentReturn(true));
    renderBanner();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('nie renderuje się gdy analytics === false', () => {
    mockUseCookieConsent.mockReturnValue(makeConsentReturn(false));
    renderBanner();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('klik "Akceptuj wszystkie" wywołuje acceptAll()', () => {
    const handlers = makeConsentReturn(null);
    mockUseCookieConsent.mockReturnValue(handlers);
    renderBanner();

    fireEvent.click(
      screen.getByRole('button', { name: /Zaakceptuj wszystkie/i }),
    );

    expect(handlers.acceptAll).toHaveBeenCalledTimes(1);
    expect(handlers.acceptEssentialOnly).not.toHaveBeenCalled();
  });

  it('klik "Tylko niezbędne" wywołuje acceptEssentialOnly()', () => {
    const handlers = makeConsentReturn(null);
    mockUseCookieConsent.mockReturnValue(handlers);
    renderBanner();

    fireEvent.click(
      screen.getByRole('button', { name: /Zaakceptuj tylko niezbędne/i }),
    );

    expect(handlers.acceptEssentialOnly).toHaveBeenCalledTimes(1);
    expect(handlers.acceptAll).not.toHaveBeenCalled();
  });

  it('zawiera link "Dowiedz się więcej" prowadzący do /privacy#cookies', () => {
    mockUseCookieConsent.mockReturnValue(makeConsentReturn(null));
    renderBanner();

    const link = screen.getByRole('link', { name: 'Dowiedz się więcej' });
    expect(link).toHaveAttribute('href', '/privacy#cookies');
  });
});
