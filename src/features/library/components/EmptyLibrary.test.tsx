import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyLibrary } from './EmptyLibrary';

/**
 * EmptyLibrary tests — renderowanie empty state z voice copy z DESIGN.md sekcja 2.
 */

describe('EmptyLibrary', () => {
  it('renderuje heading "Twoja biblioteka czeka na pierwszy film"', () => {
    render(<EmptyLibrary />);
    expect(
      screen.getByRole('heading', {
        name: /Twoja biblioteka czeka na pierwszy film/i,
      }),
    ).toBeInTheDocument();
  });

  it('renderuje copy o wklejaniu linku', () => {
    render(<EmptyLibrary />);
    expect(screen.getByText(/Wklej link/i)).toBeInTheDocument();
  });

  it('renderuje aktywny przycisk "Dodaj film" (IU-8 — nie placeholder)', () => {
    render(<EmptyLibrary />);
    const button = screen.getByRole('button', { name: /Dodaj film/i });
    // IU-8 implementuje AddVideoDialog — button jest teraz aktywny (nie disabled)
    expect(button).not.toBeDisabled();
  });

  it('renderuje data-testid="empty-library"', () => {
    render(<EmptyLibrary />);
    expect(screen.getByTestId('empty-library')).toBeInTheDocument();
  });
});
