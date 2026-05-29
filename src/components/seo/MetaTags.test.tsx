import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MetaTags } from './MetaTags';

/**
 * MetaTags tests. Sprawdzamy zachowanie efektu: ustawienie document.title +
 * meta tagów przy mount oraz przywrócenie poprzednich wartości przy unmount
 * (cleanup w useEffect return).
 */

function getMetaContent(query: string): string | null {
  return (
    document.head
      .querySelector<HTMLMetaElement>(query)
      ?.getAttribute('content') ?? null
  );
}

describe('MetaTags', () => {
  it('ustawia document.title oraz meta description/og:image przy mount', () => {
    render(
      <MetaTags
        title="Tytuł testowy"
        description="Opis testowy"
        imageUrl="/test-og.svg"
      />,
    );

    expect(document.title).toBe('Tytuł testowy');
    expect(getMetaContent('meta[name="description"]')).toBe('Opis testowy');
    expect(getMetaContent('meta[property="og:title"]')).toBe('Tytuł testowy');
    expect(getMetaContent('meta[property="og:image"]')).toBe('/test-og.svg');
    expect(getMetaContent('meta[name="twitter:card"]')).toBe(
      'summary_large_image',
    );
  });

  it('przywraca poprzedni document.title po unmount (cleanup)', () => {
    document.title = 'Poprzedni tytuł';

    const { unmount } = render(
      <MetaTags title="Tytuł landingu" description="Opis" imageUrl="/og.svg" />,
    );

    expect(document.title).toBe('Tytuł landingu');

    unmount();

    expect(document.title).toBe('Poprzedni tytuł');
  });

  it('usuwa stworzony meta tag po unmount gdy nie istniał wcześniej', () => {
    expect(getMetaContent('meta[property="og:type"]')).toBeNull();

    const { unmount } = render(
      <MetaTags title="T" description="D" imageUrl="/i.svg" />,
    );

    expect(getMetaContent('meta[property="og:type"]')).toBe('website');

    unmount();

    expect(getMetaContent('meta[property="og:type"]')).toBeNull();
  });
});
