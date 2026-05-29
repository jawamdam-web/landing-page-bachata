import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../components/AuthProvider';
import { useAuth } from './useAuth';

/**
 * useAuth + AuthProvider tests. Mockujemy zewnętrzną granicę `@/lib/supabase`.
 * AuthProvider ładuje klienta dynamicznie w useEffect — mock musi dostarczyć
 * getSession + onAuthStateChange.
 *
 * Testujemy zachowanie: initial state loading → po getSession ustalony stan
 * (authenticated/unauthenticated); useAuth poza providerem rzuca.
 */

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

const FAKE_USER = { id: 'user-1', email: 'ty@przyklad.pl' };
const FAKE_SESSION = { access_token: 'token', user: FAKE_USER };

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth (poza providerem)', () => {
  it('rzuca błąd gdy użyty bez <AuthProvider>', () => {
    expect(() => renderHook(() => useAuth())).toThrowError(
      /wewnątrz <AuthProvider>/,
    );
  });
});

describe('AuthProvider + useAuth (bootstrap)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('startuje w stanie loading (user: null) zanim getSession się rozwiąże', () => {
    // getSession nigdy nie resolves w tym teście → stan zostaje loading
    mockGetSession.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.state.status).toBe('loading');
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('po getSession z sesją przechodzi w authenticated z userem', async () => {
    mockGetSession.mockResolvedValue({ data: { session: FAKE_SESSION } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.status).toBe('authenticated');
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(FAKE_USER);
  });

  it('po getSession bez sesji przechodzi w unauthenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.state.status).toBe('unauthenticated');
    });
    expect(result.current.user).toBeNull();
  });

  it('subskrybuje onAuthStateChange podczas bootstrapu', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <span>dziecko</span>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalledOnce();
    });
    expect(screen.getByText('dziecko')).toBeInTheDocument();
  });

  it('odsubskrybowuje onAuthStateChange przy unmount (cleanup §13)', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { unmount } = render(
      <AuthProvider>
        <span>dziecko</span>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalledOnce();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });
});
