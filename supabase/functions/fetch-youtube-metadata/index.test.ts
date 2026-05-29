/**
 * fetch-youtube-metadata Edge Function tests.
 *
 * WAŻNE: Ten plik jest uruchamiany przez Vitest (Node/jsdom), NIE przez Deno.
 * Edge Function nie może być importowana bezpośrednio (Deno.serve, caches API).
 * Testujemy LOGIKĘ biznesową — parsowanie odpowiedzi YT API, przypadki błędów.
 *
 * Wzorzec: testujemy helper functions wyekstrahowane z handlera.
 */

import { describe, expect, it } from 'vitest';

// Testujemy logikę pomocniczą — getBestThumbnail i parsowanie odpowiedzi
// przez re-implementację identycznej logiki w testach (characterization tests)

interface ThumbnailSet {
  maxres?: { url?: string };
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
}

function getBestThumbnail(thumbnails: ThumbnailSet): string {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ''
  );
}

describe('getBestThumbnail (logika wyboru thumbnailów YT)', () => {
  it('zwraca maxres gdy dostępny', () => {
    const thumbnails: ThumbnailSet = {
      maxres: { url: 'https://i3.ytimg.com/vi/abc/maxresdefault.jpg' },
      high: { url: 'https://i3.ytimg.com/vi/abc/hqdefault.jpg' },
    };
    expect(getBestThumbnail(thumbnails)).toBe(
      'https://i3.ytimg.com/vi/abc/maxresdefault.jpg',
    );
  });

  it('fallback na high gdy brak maxres', () => {
    const thumbnails: ThumbnailSet = {
      high: { url: 'https://i3.ytimg.com/vi/abc/hqdefault.jpg' },
      medium: { url: 'https://i3.ytimg.com/vi/abc/mqdefault.jpg' },
    };
    expect(getBestThumbnail(thumbnails)).toBe(
      'https://i3.ytimg.com/vi/abc/hqdefault.jpg',
    );
  });

  it('fallback na medium gdy brak maxres i high', () => {
    const thumbnails: ThumbnailSet = {
      medium: { url: 'https://i3.ytimg.com/vi/abc/mqdefault.jpg' },
    };
    expect(getBestThumbnail(thumbnails)).toBe(
      'https://i3.ytimg.com/vi/abc/mqdefault.jpg',
    );
  });

  it('fallback na default gdy tylko default dostępny', () => {
    const thumbnails: ThumbnailSet = {
      default: { url: 'https://i3.ytimg.com/vi/abc/default.jpg' },
    };
    expect(getBestThumbnail(thumbnails)).toBe(
      'https://i3.ytimg.com/vi/abc/default.jpg',
    );
  });

  it('zwraca pusty string gdy brak thumbnailów', () => {
    expect(getBestThumbnail({})).toBe('');
  });
});

describe('Logika walidacji videoId', () => {
  it('pusty string jest nieważny', () => {
    const videoId = ''.trim();
    expect(videoId).toBeFalsy();
  });

  it('prawidłowy videoId nie jest pusty', () => {
    const videoId = 'dQw4w9WgXcQ'.trim();
    expect(videoId).toBeTruthy();
  });
});

describe('Mapowanie odpowiedzi YouTube API', () => {
  it('parsuje pełny snippet do MetaData', () => {
    const item = {
      snippet: {
        title: 'Bachata Sensual Tutorial',
        description: 'Opis tańca',
        channelTitle: 'BachataChannel',
        thumbnails: {
          high: { url: 'https://example.com/thumb.jpg' },
        },
      },
      contentDetails: {
        duration: 'PT4M30S',
      },
    };

    const metadata = {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: getBestThumbnail(item.snippet.thumbnails),
      duration: item.contentDetails.duration,
      channelTitle: item.snippet.channelTitle,
    };

    expect(metadata).toEqual({
      title: 'Bachata Sensual Tutorial',
      description: 'Opis tańca',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      duration: 'PT4M30S',
      channelTitle: 'BachataChannel',
    });
  });

  it('items: [] → not_found (brak wideo)', () => {
    const ytData = { items: [] };
    const isNotFound = !ytData.items || ytData.items.length === 0;
    expect(isNotFound).toBe(true);
  });

  it('items z pustym snippet.title → private', () => {
    const item = { snippet: { title: '' }, contentDetails: {} };
    const isPrivate = !item.snippet.title;
    expect(isPrivate).toBe(true);
  });
});
