/**
 * URL parsers tests — charakteryzacja edge cases (failing-first).
 * Uruchom PRZED implementacją by zobaczyć czerwone testy.
 */

import { describe, expect, it } from 'vitest';
import { parseYoutubeUrl, parseMetaUrl } from './url-parsers';

// ─── parseYoutubeUrl ────────────────────────────────────────────────────────

describe('parseYoutubeUrl', () => {
  it('youtube.com/watch?v=<id>', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('youtu.be/<id>', () => {
    expect(parseYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('youtube.com/shorts/<id>', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
    ).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('youtube.com/embed/<id>', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'),
    ).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('m.youtube.com/watch?v=<id>', () => {
    expect(
      parseYoutubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('watch?v= z dodatkowymi query params przed v', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/watch?t=30s&v=dQw4w9WgXcQ'),
    ).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('watch?v= z dodatkowymi query params po v', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s'),
    ).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('youtu.be/<id> z query params', () => {
    expect(parseYoutubeUrl('https://youtu.be/dQw4w9WgXcQ?si=XYZ&t=5')).toEqual({
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('zwraca null dla google.com', () => {
    expect(parseYoutubeUrl('https://google.com')).toBeNull();
  });

  it('zwraca null dla pustego stringa', () => {
    expect(parseYoutubeUrl('')).toBeNull();
  });

  it('zwraca null dla losowego tekstu', () => {
    expect(parseYoutubeUrl('to nie jest link')).toBeNull();
  });

  it('zwraca null dla youtube.com bez video ID', () => {
    expect(parseYoutubeUrl('https://www.youtube.com')).toBeNull();
  });

  it('zwraca null dla youtube.com/channel/...', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/channel/UCxxxxxxx'),
    ).toBeNull();
  });
});

// ─── parseMetaUrl ──────────────────────────────────────────────────────────

describe('parseMetaUrl', () => {
  it('instagram.com/reel/<code>/', () => {
    expect(parseMetaUrl('https://www.instagram.com/reel/Cabc123/')).toEqual({
      platform: 'ig',
      postId: 'Cabc123',
    });
  });

  it('instagram.com/p/<code>/', () => {
    expect(parseMetaUrl('https://www.instagram.com/p/CXyz789/')).toEqual({
      platform: 'ig',
      postId: 'CXyz789',
    });
  });

  it('instagram.com/tv/<code>/', () => {
    expect(parseMetaUrl('https://www.instagram.com/tv/CAbc456/')).toEqual({
      platform: 'ig',
      postId: 'CAbc456',
    });
  });

  it('facebook.com/share/v/<id>/', () => {
    expect(parseMetaUrl('https://www.facebook.com/share/v/xyz123/')).toEqual({
      platform: 'fb',
      postId: 'xyz123',
    });
  });

  it('facebook.com/<page>/videos/<id>/', () => {
    expect(
      parseMetaUrl('https://www.facebook.com/bachatanapoli/videos/123456789/'),
    ).toEqual({
      platform: 'fb',
      postId: '123456789',
    });
  });

  it('fb.watch/<id>/', () => {
    expect(parseMetaUrl('https://fb.watch/abc123xyz/')).toEqual({
      platform: 'fb',
      postId: 'abc123xyz',
    });
  });

  it('facebook.com/reel/<id>/', () => {
    expect(parseMetaUrl('https://www.facebook.com/reel/987654321/')).toEqual({
      platform: 'fb',
      postId: '987654321',
    });
  });

  it('instagram.com/reel bez trailing slash', () => {
    expect(parseMetaUrl('https://www.instagram.com/reel/Cabc123')).toEqual({
      platform: 'ig',
      postId: 'Cabc123',
    });
  });

  it('zwraca null dla google.com', () => {
    expect(parseMetaUrl('https://google.com')).toBeNull();
  });

  it('zwraca null dla pustego stringa', () => {
    expect(parseMetaUrl('')).toBeNull();
  });

  it('zwraca null dla youtube.com', () => {
    expect(parseMetaUrl('https://youtube.com/watch?v=abc')).toBeNull();
  });

  it('zwraca null dla instagram.com bez ścieżki video', () => {
    expect(parseMetaUrl('https://www.instagram.com/bachatanapoli/')).toBeNull();
  });
});
