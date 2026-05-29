import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Hero } from './Hero';

/**
 * Hero tests. Routing przez MemoryRouter (CTA to <Link>). Sprawdzamy główne
 * CTA oraz graceful fallback gdy obraz się nie ładuje (onError) — brak
 * zepsutej ikonki, sekcja nadal renderuje treść.
 */

function renderHero() {
  return render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  );
}

describe('Hero', () => {
  it('renderuje główne CTA "Załóż konto" prowadzące do /signup', () => {
    renderHero();

    const cta = screen.getByRole('link', { name: 'Załóż konto' });
    expect(cta).toHaveAttribute('href', '/signup');
  });

  it('renderuje obraz hero z tekstem alternatywnym', () => {
    renderHero();

    expect(
      screen.getByRole('img', { name: 'Para tańcząca bachatę' }),
    ).toBeInTheDocument();
  });

  it('przy błędzie ładowania obrazu usuwa <img> (brak broken-image icon)', () => {
    renderHero();

    const image = screen.getByRole('img', { name: 'Para tańcząca bachatę' });
    fireEvent.error(image);

    expect(
      screen.queryByRole('img', { name: 'Para tańcząca bachatę' }),
    ).not.toBeInTheDocument();
    // Heading nadal obecny — sekcja nie jest zepsuta.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
