/**
 * VideoPlayer — renderuje wideo zgodnie z source type.
 *
 * - youtube_link / youtube_upload: iframe youtube-nocookie.com (rel=0, modestbranding)
 * - meta_embed: dangerouslySetInnerHTML z DOMPurify sanitization
 *               + FB JS SDK XFBML.parse po mount
 *
 * DESIGN.md sekcja 12: video_embeds.aspect_ratio_wrapper = "aspect-video" (16/9).
 */

import { useEffect, useRef } from 'react';
import { sanitizeEmbedHtml } from '@/lib/dompurify-wrapper';
import type { VideoSource } from '../types';

// Rozszerza Window o opcjonalny FB SDK
declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement) => void;
      };
    };
  }
}

interface VideoPlayerProps {
  source: VideoSource;
  /** YT video ID dla youtube_link / youtube_upload, brak dla meta_embed */
  sourceId?: string;
  /** Surowy HTML embeda — tylko dla meta_embed */
  embedHtml?: string | null;
  title: string;
}

/** Lazy-load FB JS SDK gdy jeszcze nie załadowany. */
function loadFbSdk(): void {
  if (document.getElementById('facebook-jssdk')) return;

  const script = document.createElement('script');
  script.id = 'facebook-jssdk';
  script.src =
    'https://connect.facebook.net/pl_PL/sdk.js#xfbml=1&version=v18.0';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function VideoPlayer({
  source,
  sourceId,
  embedHtml,
  title,
}: VideoPlayerProps) {
  const metaRef = useRef<HTMLDivElement>(null);

  // FB XFBML parse po mount dla meta_embed
  useEffect(() => {
    if (source !== 'meta_embed') return;

    if (window.FB) {
      window.FB.XFBML.parse(metaRef.current ?? undefined);
    } else {
      loadFbSdk();
    }
  }, [source, embedHtml]);

  if (source === 'youtube_link' || source === 'youtube_upload') {
    if (!sourceId) {
      return (
        <div className="flex aspect-video w-full items-center justify-center bg-bg-muted">
          <p className="text-sm text-fg-muted">Brak ID wideo</p>
        </div>
      );
    }

    return (
      <div className="aspect-video w-full overflow-hidden rounded-md bg-bg-muted">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${sourceId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  // meta_embed
  if (!embedHtml) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-bg-muted">
        <p className="text-sm text-fg-muted">Podgląd niedostępny</p>
      </div>
    );
  }

  const safeHtml = sanitizeEmbedHtml(embedHtml);

  return (
    <div
      ref={metaRef}
      className="w-full overflow-hidden"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      aria-label={`Embed: ${title}`}
    />
  );
}
