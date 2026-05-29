/**
 * VideoPlayer tests — renderowanie wideo zgodnie z source type.
 *
 * Testujemy: YT iframe URL, fallback "Brak ID wideo", meta_embed HTML, fallback "Podgląd niedostępny".
 * sanitizeEmbedHtml jest realnie wywołany — jsdom dostarcza DOM dla DOMPurify.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  it('source="youtube_link" + sourceId → renderuje <iframe> z youtube-nocookie.com/embed/{id}', () => {
    const { container } = render(
      <VideoPlayer
        source="youtube_link"
        sourceId="dQw4w9WgXcQ"
        title="Never Gonna Give You Up"
      />,
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('youtube-nocookie.com/embed/dQw4w9WgXcQ'),
    );
  });

  it('source="youtube_upload" + sourceId → renderuje <iframe> z tym samym wzorcem YT nocookie', () => {
    const { container } = render(
      <VideoPlayer
        source="youtube_upload"
        sourceId="dQw4w9WgXcQ"
        title="Upload video"
      />,
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('youtube-nocookie.com/embed/dQw4w9WgXcQ'),
    );
  });

  it('source="youtube_link" bez sourceId → renderuje tekst "Brak ID wideo"', () => {
    render(<VideoPlayer source="youtube_link" title="Film bez ID" />);

    expect(screen.getByText('Brak ID wideo')).toBeInTheDocument();
  });

  it('source="meta_embed" + embedHtml → renderuje div z zawartością embeda', () => {
    const embedHtml =
      '<blockquote class="instagram-media"><p>Bachata post</p></blockquote>';

    const { container } = render(
      <VideoPlayer source="meta_embed" embedHtml={embedHtml} title="IG Post" />,
    );

    // Div z aria-label zawierającym tytuł
    const embedDiv = container.querySelector('[aria-label="Embed: IG Post"]');
    expect(embedDiv).toBeInTheDocument();
    // Zawartość HTML jest wyrenderowana — blockquote powinien być w DOM
    expect(container.innerHTML).toContain('instagram-media');
  });

  it('source="meta_embed" bez embedHtml → renderuje tekst "Podgląd niedostępny"', () => {
    render(<VideoPlayer source="meta_embed" title="Bez embeda" />);

    expect(screen.getByText('Podgląd niedostępny')).toBeInTheDocument();
  });
});
