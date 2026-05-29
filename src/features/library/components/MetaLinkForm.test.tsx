/**
 * MetaLinkForm tests — formularz dodawania linku Facebook/Instagram.
 *
 * Testujemy: render inputu + buttona, walidację Zod (invalid URL), submit z valid IG URL,
 * disabled button podczas pending.
 *
 * Mockujemy useCreateVideoFromMetaLink.
 */

import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetaLinkForm } from './MetaLinkForm';

const { mockMutateAsync, mockIsPending } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
  mockIsPending: { value: false },
}));

vi.mock('../hooks/useVideoMutations', () => ({
  useCreateVideoFromMetaLink: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending.value,
  })),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: { status: 'authenticated', user: { id: 'user-1' }, session: null },
    loading: false,
    user: { id: 'user-1' },
    signOut: vi.fn(),
  }),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

describe('MetaLinkForm', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockIsPending.value = false;
  });

  it('renderuje input URL i button "Dodaj film"', () => {
    render(<MetaLinkForm onSuccess={vi.fn()} />, { wrapper: makeWrapper() });

    expect(
      screen.getByLabelText('Link z Facebooka lub Instagrama'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Dodaj film/i }),
    ).toBeInTheDocument();
  });

  it('invalid URL "https://example.com" → po submit → inline error message', async () => {
    render(<MetaLinkForm onSuccess={vi.fn()} />, { wrapper: makeWrapper() });

    const input = screen.getByLabelText('Link z Facebooka lub Instagrama');
    await userEvent.type(input, 'https://example.com');
    fireEvent.click(screen.getByRole('button', { name: /Dodaj film/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Nie rozpoznaję linku',
      );
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('pusty URL → po submit → inline error "Wklej link"', async () => {
    render(<MetaLinkForm onSuccess={vi.fn()} />, { wrapper: makeWrapper() });

    fireEvent.click(screen.getByRole('button', { name: /Dodaj film/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('valid IG URL "https://instagram.com/reel/Cabc123/" → submit → mutation wywołana', async () => {
    mockMutateAsync.mockResolvedValue({});
    const onSuccess = vi.fn();

    render(<MetaLinkForm onSuccess={onSuccess} />, { wrapper: makeWrapper() });

    const input = screen.getByLabelText('Link z Facebooka lub Instagrama');
    await userEvent.type(input, 'https://instagram.com/reel/Cabc123/');
    fireEvent.click(screen.getByRole('button', { name: /Dodaj film/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        'https://instagram.com/reel/Cabc123/',
      );
    });
  });

  it('button disabled gdy isPending=true', () => {
    mockIsPending.value = true;

    render(<MetaLinkForm onSuccess={vi.fn()} />, { wrapper: makeWrapper() });

    // Gdy isPending=true, tekst zmienia się na "Dodaję..."
    const button = screen.getByRole('button', { name: /Dodaję/i });
    expect(button).toBeDisabled();
  });
});
