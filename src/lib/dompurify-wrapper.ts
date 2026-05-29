/**
 * DOMPurify wrapper — sanitizacja HTML embeda Meta (FB/IG).
 *
 * Dozwolone tagi: tylko te używane przez oficjalne widgety FB/IG oEmbed.
 * Blokuje: <script>, event handlers (onerror, onclick, etc.), javascript: href.
 *
 * Używaj WYŁĄCZNIE do sanitizacji embed_html przed dangerouslySetInnerHTML.
 */

import DOMPurify, { type Config } from 'dompurify';

/**
 * Konfiguracja — whitelist tagów i atrybutów typowych dla FB/IG embeds.
 * blockquote + iframe to główne elementy w oEmbed output.
 */
const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: ['blockquote', 'iframe', 'div', 'a', 'p', 'br', 'span', 'cite'],
  ALLOWED_ATTR: [
    'class',
    'id',
    'data-href',
    'data-width',
    'data-show-text',
    'data-show-captions',
    'data-layout',
    'frameborder',
    'allowfullscreen',
    'width',
    'height',
    'src',
    'scrolling',
    'style',
    'allow',
    'referrerpolicy',
    'loading',
    'title',
  ],
  // Force https for src/href
  FORCE_BODY: true,
};

/**
 * Sanitizuje HTML embeda Meta — usuwa skrypty i złośliwe atrybuty.
 *
 * @param html - surowy HTML z oEmbed API
 * @returns bezpieczny HTML gotowy do dangerouslySetInnerHTML
 */
export function sanitizeEmbedHtml(html: string): string {
  if (!html) return '';
  const result = DOMPurify.sanitize(html, {
    ...PURIFY_CONFIG,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
  return typeof result === 'string' ? result : String(result);
}
