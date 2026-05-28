import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { SignupForm } from './SignupForm';

/**
 * SignupForm UI tests. Mockujemy granice: auth API (signUpWithEmail) + sonner
 * (toast) + GoogleSignInButton (osobno testowany — tu zastąpiony stubem, bo
 * importuje auth API). Testujemy zachowanie: render, walidacja inline (błąd),
 * happy path (success panel + toast).
 */

const mockSignUp = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('../api/auth', () => ({
  signUpWithEmail: (email: string, password: string) =>
    mockSignUp(email, password),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

vi.mock('./GoogleSignInButton', () => ({
  GoogleSignInButton: () => <button type="button">Google stub</button>,
}));

function renderForm() {
  return render(
    <MemoryRouter>
      <SignupForm />
    </MemoryRouter>,
  );
}

describe('SignupForm', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('renderuje pola email, hasło i przycisk "Załóż konto"', () => {
    renderForm();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Załóż konto' }),
    ).toBeInTheDocument();
  });

  it('pokazuje błąd walidacji dla słabego hasła i nie woła API', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'ty@przyklad.pl');
    await user.type(screen.getByLabelText('Hasło'), 'slabe');
    await user.click(screen.getByRole('button', { name: 'Załóż konto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /cyfrę|8 znaków/,
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('happy path: woła API, pokazuje toast i panel "Sprawdź swój email"', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ user: { id: 'u1' }, session: null });
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'ty@przyklad.pl');
    await user.type(screen.getByLabelText('Hasło'), 'Pass1234');
    await user.click(screen.getByRole('button', { name: 'Załóż konto' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('ty@przyklad.pl', 'Pass1234');
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Wysłaliśmy link aktywacyjny na Twój email.',
    );
    expect(await screen.findByText('Sprawdź swój email')).toBeInTheDocument();
  });

  it('error path: pokazuje toast błędu gdy API rejectuje', async () => {
    const user = userEvent.setup();
    mockSignUp.mockRejectedValue(new Error('duplicate'));
    renderForm();

    await user.type(screen.getByLabelText('Email'), 'zajety@przyklad.pl');
    await user.type(screen.getByLabelText('Hasło'), 'Pass1234');
    await user.click(screen.getByRole('button', { name: 'Załóż konto' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Nie udało się założyć konta. Spróbuj jeszcze raz.',
      );
    });
  });
});
