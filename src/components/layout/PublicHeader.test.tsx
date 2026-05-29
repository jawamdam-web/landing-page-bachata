import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { AuthContextValue } from '@/features/auth/hooks/auth-context';
import { PublicHeader } from './PublicHeader';

/**
 * PublicHeader tests. Mockujemy useAuth (hook stanu — dozwolone, NIE testowany
 * kod) by sterować stanem auth. Testujemy zachowanie nawigacji guest vs authed.
 */

const mockUseAuth = vi.fn<() => AuthContextValue>();

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function guestState(): AuthContextValue {
  return {
    state: { status: 'unauthenticated', user: null, session: null },
    loading: false,
    user: null,
    signOut: vi.fn(),
  };
}

function authedState(): AuthContextValue {
  const user = { id: 'u1' } as AuthContextValue['user'];
  return {
    state: {
      status: 'authenticated',
      user: user as NonNullable<AuthContextValue['user']>,
      session: {} as never,
    },
    loading: false,
    user,
    signOut: vi.fn(),
  };
}

function renderHeader() {
  return render(
    <MemoryRouter>
      <PublicHeader />
    </MemoryRouter>,
  );
}

describe('PublicHeader', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('w stanie guest renderuje CTA "Zaloguj się" i "Załóż konto"', () => {
    mockUseAuth.mockReturnValue(guestState());
    renderHeader();

    expect(
      screen.getAllByRole('link', { name: 'Zaloguj się' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'Załóż konto' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('link', { name: 'Moja biblioteka' }),
    ).not.toBeInTheDocument();
  });

  it('w stanie authed renderuje link "Moja biblioteka" zamiast CTA auth', () => {
    mockUseAuth.mockReturnValue(authedState());
    renderHeader();

    const libraryLinks = screen.getAllByRole('link', {
      name: 'Moja biblioteka',
    });
    expect(libraryLinks.length).toBeGreaterThan(0);
    expect(libraryLinks[0]).toHaveAttribute('href', '/library');
    expect(
      screen.queryByRole('link', { name: 'Zaloguj się' }),
    ).not.toBeInTheDocument();
  });
});
