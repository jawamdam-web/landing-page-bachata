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

  it('renderuje przycisk "Dodaj film" w stanie disabled', () => {
    render(<EmptyLibrary />);
    const button = screen.getByRole('button', { name: /Dodaj film/i });
    expect(button).toBeDisabled();
  });

  it('renderuje data-testid="empty-library"', () => {
    render(<EmptyLibrary />);
    expect(screen.getByTestId('empty-library')).toBeInTheDocument();
  });
});
