import { type ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { type AuthState } from './auth-context';
import { useRequireAuth } from './useRequireAuth';
import { RequireAuth } from '../components/RequireAuth';

/**
 * useRequireAuth + RequireAuth — guard chronionych tras (R8, security-relevant).
 * Mockujemy `./useAuth` (źródło stanu) i `react-router` (navigate/location) —
 * to zewnętrzne granice, nie testowana logika. Testujemy zachowanie guarda:
 * redirect tylko po `unauthenticated`, brak redirectu w `loading`, render
 * loader/children w komponencie.
 */

const mockNavigate = vi.fn();
let mockLocation = { pathname: '/library', search: '' };

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

let mockState: AuthState;
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    state: mockState,
    loading: mockState.status === 'loading',
    user: mockState.user,
    signOut: vi.fn(),
  }),
}));

// Minimalne stuby typów zewnętrznych (Supabase User/Session mają wiele pól
// nieistotnych dla guarda — narrowing po `status` to wszystko czego potrzeba).
const FAKE_USER = { id: 'u1', email: 'ty@przyklad.pl' } as unknown as User;
const FAKE_SESSION = {
  access_token: 'token',
  user: FAKE_USER,
} as unknown as Session;

beforeEach(() => {
  vi.clearAllMocks();
  mockLocation = { pathname: '/library', search: '' };
});

describe('useRequireAuth', () => {
  it('przekierowuje na /login?next=<encoded> gdy unauthenticated', () => {
    mockState = { status: 'unauthenticated', user: null, session: null };

    renderHook(() => useRequireAuth());

    expect(mockNavigate).toHaveBeenCalledWith('/login?next=%2Flibrary', {
      replace: true,
    });
  });

  it('enkoduje pathname + search w parametrze next', () => {
    mockState = { status: 'unauthenticated', user: null, session: null };
    mockLocation = { pathname: '/library', search: '?folder=1' };

    renderHook(() => useRequireAuth());

    expect(mockNavigate).toHaveBeenCalledWith(
      '/login?next=%2Flibrary%3Ffolder%3D1',
      { replace: true },
    );
  });

  it('NIE przekierowuje podczas loading (uniknięcie fałszywego redirectu)', () => {
    mockState = { status: 'loading', user: null, session: null };

    renderHook(() => useRequireAuth());

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('NIE przekierowuje gdy authenticated i zwraca aktualny stan', () => {
    mockState = {
      status: 'authenticated',
      user: FAKE_USER,
      session: FAKE_SESSION,
    };

    const { result } = renderHook(() => useRequireAuth());

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.status).toBe('authenticated');
  });
});

describe('RequireAuth', () => {
  function Secret(): ReactNode {
    return <div>tajna zawartość</div>;
  }

  it('renderuje children gdy authenticated', () => {
    mockState = {
      status: 'authenticated',
      user: FAKE_USER,
      session: FAKE_SESSION,
    };

    render(
      <RequireAuth>
        <Secret />
      </RequireAuth>,
    );

    expect(screen.getByText('tajna zawartość')).toBeInTheDocument();
  });

  it('renderuje loader (nie children) podczas loading', () => {
    mockState = { status: 'loading', user: null, session: null };

    render(
      <RequireAuth>
        <Secret />
      </RequireAuth>,
    );

    expect(screen.queryByText('tajna zawartość')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Ładowanie')).toBeInTheDocument();
  });

  it('nie renderuje children gdy unauthenticated (redirect w toku)', () => {
    mockState = { status: 'unauthenticated', user: null, session: null };

    render(
      <RequireAuth>
        <Secret />
      </RequireAuth>,
    );

    expect(screen.queryByText('tajna zawartość')).not.toBeInTheDocument();
  });
});
