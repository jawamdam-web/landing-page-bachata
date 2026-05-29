/**
 * dompurify-wrapper tests — sanitizeEmbedHtml.
 *
 * Środowisko: jsdom (domyślne w projekcie) — DOMPurify wymaga DOM API.
 * Testujemy zachowanie sanitizacji: co przechodzi, co jest usuwane.
 */

import { describe, expect, it } from 'vitest';
import { sanitizeEmbedHtml } from './dompurify-wrapper';

describe('sanitizeEmbedHtml', () => {
  it('zwraca pusty string dla pustego stringa', () => {
    expect(sanitizeEmbedHtml('')).toBe('');
  });

  it('valid oEmbed HTML z <blockquote> + <iframe src="https://..."> → output zachowuje <iframe>', () => {
    const html =
      '<blockquote class="instagram-media"><p>Test</p></blockquote>' +
      '<iframe src="https://www.instagram.com/embed/abc123" frameborder="0"></iframe>';

    const result = sanitizeEmbedHtml(html);

    expect(result).toContain('<iframe');
    expect(result).toContain('src="https://www.instagram.com/embed/abc123"');
  });

  it('<script>alert(1)</script> → output nie zawiera <script>', () => {
    const html = '<script>alert(1)</script>';

    const result = sanitizeEmbedHtml(html);

    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
  });

  it('<img onerror="alert(1)" src="x"> → output nie zawiera atrybutu onerror', () => {
    const html = '<img onerror="alert(1)" src="x">';

    const result = sanitizeEmbedHtml(html);

    expect(result).not.toContain('onerror');
  });

  it('<a href="javascript:alert(1)">klik</a> → output nie zawiera "javascript:" w href', () => {
    const html = '<a href="javascript:alert(1)">klik</a>';

    const result = sanitizeEmbedHtml(html);

    expect(result).not.toContain('javascript:');
  });

  it('dozwolone tagi (blockquote, div, p, span) są zachowywane', () => {
    const html =
      '<div class="fb-video"><blockquote><p>Opis</p><span>autor</span></blockquote></div>';

    const result = sanitizeEmbedHtml(html);

    expect(result).toContain('<div');
    expect(result).toContain('<blockquote');
    expect(result).toContain('<p>');
    expect(result).toContain('<span>');
  });
});
