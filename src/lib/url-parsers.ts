/**
 * URL parsers dla źródeł wideo.
 *
 * Eksporty:
 * - parseYoutubeUrl(url) → { videoId } | null
 * - parseMetaUrl(url) → { platform: 'fb' | 'ig', postId } | null
 *
 * Wszystkie funkcje przyjmują nieprzetworzony string od użytkownika.
 * Zwracają null gdy URL nie jest rozpoznanym wzorcem — nie rzucają.
 */

export interface YoutubeParseResult {
  videoId: string;
}

export interface MetaParseResult {
  platform: 'fb' | 'ig';
  postId: string;
}

/**
 * Rozpoznane domeny YouTube (wszystkie traktowane jak youtube.com).
 */
const YT_DOMAINS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
]);

/**
 * Wyodrębnia videoId z URL YouTube.
 *
 * Obsługiwane warianty:
 * - youtube.com/watch?v=<id> (oraz m.youtube.com)
 * - youtu.be/<id>
 * - youtube.com/shorts/<id>
 * - youtube.com/embed/<id>
 *
 * @returns { videoId } lub null gdy URL nie pasuje do żadnego wzorca.
 */
export function parseYoutubeUrl(url: string): YoutubeParseResult | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname;
  if (!YT_DOMAINS.has(host)) return null;

  // youtu.be/<id>
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0] ?? '';
    if (!id) return null;
    return { videoId: id };
  }

  // youtube.com/watch?v=<id>
  const vParam = parsed.searchParams.get('v');
  if (vParam) return { videoId: vParam };

  // youtube.com/shorts/<id>  lub  youtube.com/embed/<id>
  const pathMatch = parsed.pathname.match(/^\/(shorts|embed)\/([^/?#]+)/);
  if (pathMatch) {
    const id = pathMatch[2];
    if (id) return { videoId: id };
  }

  return null;
}

/**
 * Wyodrębnia platform + postId z URL Facebooka lub Instagrama.
 *
 * Obsługiwane warianty FB:
 * - facebook.com/share/v/<id>
 * - facebook.com/<page>/videos/<id>
 * - facebook.com/reel/<id>
 * - fb.watch/<id>
 *
 * Obsługiwane warianty IG:
 * - instagram.com/p/<code>
 * - instagram.com/reel/<code>
 * - instagram.com/tv/<code>
 *
 * @returns { platform, postId } lub null gdy URL nie pasuje do żadnego wzorca.
 */
export function parseMetaUrl(url: string): MetaParseResult | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname;
  const pathname = parsed.pathname.replace(/\/$/, ''); // strip trailing slash

  // Instagram
  if (host === 'instagram.com' || host === 'www.instagram.com') {
    const igMatch = pathname.match(/^\/(p|reel|tv)\/([^/?#]+)/);
    if (igMatch) {
      const postId = igMatch[2];
      if (postId) return { platform: 'ig', postId };
    }
    return null;
  }

  // fb.watch/<id>
  if (host === 'fb.watch') {
    const id = pathname.slice(1).split('/')[0] ?? '';
    if (id) return { platform: 'fb', postId: id };
    return null;
  }

  // facebook.com variants
  if (host === 'facebook.com' || host === 'www.facebook.com') {
    // facebook.com/share/v/<id>
    const shareMatch = pathname.match(/^\/share\/v\/([^/?#]+)/);
    if (shareMatch) {
      const id = shareMatch[1];
      if (id) return { platform: 'fb', postId: id };
    }

    // facebook.com/reel/<id>
    const reelMatch = pathname.match(/^\/reel\/([^/?#]+)/);
    if (reelMatch) {
      const id = reelMatch[1];
      if (id) return { platform: 'fb', postId: id };
    }

    // facebook.com/<page>/videos/<id>
    const videosMatch = pathname.match(/^\/[^/?#]+\/videos\/([^/?#]+)/);
    if (videosMatch) {
      const id = videosMatch[1];
      if (id) return { platform: 'fb', postId: id };
    }

    return null;
  }

  return null;
}
