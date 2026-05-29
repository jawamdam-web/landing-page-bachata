import { useEffect } from 'react';

/**
 * MetaTags — lekki SEO/social-meta dla MVP (BEZ react-helmet-async).
 *
 * Ustawia `document.title` + meta tagi (description, Open Graph, Twitter Card)
 * w useEffect i PRZYWRACA poprzednie wartości w cleanup. Dzięki temu zmiana
 * trasy nie zostawia "wyciekniętych" meta tagów landingu na innych stronach.
 *
 * `<html lang="pl">` jest już w index.html (IU-1) — tu nie ruszamy.
 */

interface MetaTagsProps {
  title: string;
  description: string;
  /** Ścieżka do obrazka social (og:image / twitter:image). */
  imageUrl: string;
  /** og:type — domyślnie "website". */
  ogType?: string;
}

type MetaSelector =
  | { attr: 'name'; key: string }
  | { attr: 'property'; key: string };

const META_TAGS: readonly {
  selector: MetaSelector;
  field: keyof MetaContent;
}[] = [
  { selector: { attr: 'name', key: 'description' }, field: 'description' },
  { selector: { attr: 'property', key: 'og:title' }, field: 'title' },
  {
    selector: { attr: 'property', key: 'og:description' },
    field: 'description',
  },
  { selector: { attr: 'property', key: 'og:image' }, field: 'image' },
  { selector: { attr: 'property', key: 'og:type' }, field: 'ogType' },
  {
    selector: { attr: 'name', key: 'twitter:card' },
    field: 'twitterCard',
  },
  { selector: { attr: 'name', key: 'twitter:title' }, field: 'title' },
  {
    selector: { attr: 'name', key: 'twitter:description' },
    field: 'description',
  },
  { selector: { attr: 'name', key: 'twitter:image' }, field: 'image' },
];

interface MetaContent {
  title: string;
  description: string;
  image: string;
  ogType: string;
  twitterCard: string;
}

function ensureMetaElement(selector: MetaSelector): HTMLMetaElement {
  const query = `meta[${selector.attr}="${selector.key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(query);
  if (existing) {
    return existing;
  }
  const created = document.createElement('meta');
  created.setAttribute(selector.attr, selector.key);
  document.head.appendChild(created);
  return created;
}

export function MetaTags({
  title,
  description,
  imageUrl,
  ogType = 'website',
}: MetaTagsProps): null {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const content: MetaContent = {
      title,
      description,
      image: imageUrl,
      ogType,
      twitterCard: 'summary_large_image',
    };

    const restorers = META_TAGS.map(({ selector, field }) => {
      const element = ensureMetaElement(selector);
      const previousContent = element.getAttribute('content');
      element.setAttribute('content', content[field]);
      return () => {
        if (previousContent === null) {
          element.remove();
          return;
        }
        element.setAttribute('content', previousContent);
      };
    });

    return () => {
      document.title = previousTitle;
      restorers.forEach((restore) => restore());
    };
  }, [title, description, imageUrl, ogType]);

  return null;
}
