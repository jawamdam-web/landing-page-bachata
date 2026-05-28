import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LoginForm } from './LoginForm';

/**
 * LoginForm UI tests. Mockujemy auth API + sonner + GoogleSignInButton.
 * Routing przez MemoryRouter — testujemy redirect po sukcesie (do ?next lub
 * /library) oraz ochronę przed open-redirect.
 */

const mockSignIn = vi.fn();
const mockToastError = vi.fn();

vi.mock('../api/auth', () => ({
  signInWithEmail: (email: string, password: string) =>
    mockSignIn(email, password),
}));

vi.mock('sonner', () => ({
  toast: { error: (msg: string) => mockToastError(msg), success: vi.fn() },
}));

vi.mock('./GoogleSignInButton', () => ({
  GoogleSignInButton: () => <button type="button">Google stub</button>,
}));

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/library" element={<p>Strona biblioteki</p>} />
        <Route path="/folders" element={<p>Strona folderów</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('po sukcesie bez ?next przekierowuje do /library', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ user: { id: 'u1' }, session: {} });
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'ty@przyklad.pl');
    await user.type(screen.getByLabelText('Hasło'), 'Pass1234');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByText('Strona biblioteki')).toBeInTheDocument();
  });

  it('po sukcesie z ?next=/folders przekierowuje do /folders', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ user: { id: 'u1' }, session: {} });
    renderAt('/login?next=%2Ffolders');

    await user.type(screen.getByLabelText('Email'), 'ty@przyklad.pl');
    await user.type(screen.getByLabelText('Hasło'), 'Pass1234');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByText('Strona folderów')).toBeInTheDocument();
  });

  it('ignoruje open-redirect (?next=//evil.com) i idzie do /library', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ user: { id: 'u1' }, session: {} });
    renderAt('/login?next=%2F%2Fevil.com');

    await user.type(screen.getByLabelText('Email'), 'ty@przyklad.pl');
    await user.type(screen.getByLabelText('Hasło'), 'Pass1234');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByText('Strona biblioteki')).toBeInTheDocument();
  });

  it('error path: zły login → toast błędu, brak redirectu', async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'ty@przyklad.pl');
    await user.type(screen.getByLabelText('Hasło'), 'zlehaslo');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Nie udało się zalogować. Sprawdź email i hasło.',
      );
    });
    expect(screen.queryByText('Strona biblioteki')).not.toBeInTheDocument();
  });
});
