/**
 * fetch-youtube-metadata — Edge Function (Deno).
 *
 * Proxy do YouTube Data API v3 — ukrywa API key po stronie serwera.
 *
 * Input (POST JSON):
 *   { videoId: string }
 *
 * Output (JSON):
 *   { data: { title, description, thumbnailUrl, duration, channelTitle } }
 *   { error: { code: 'not_found' | 'private' | 'rate_limited' | 'invalid_input', message } }
 *
 * Auth: wymaga Supabase JWT (Authorization: Bearer <token>).
 * Cache: Cache API, TTL 1h per videoId.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsPreflightResponse } from '../_shared/cors.ts';
import { jsonError, jsonSuccess } from '../_shared/response.ts';

const CACHE_TTL_SECONDS = 3600; // 1h

interface YoutubeVideoMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  channelTitle: string;
}

interface YouTubeApiResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      thumbnails?: {
        maxres?: { url?: string };
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
    contentDetails?: {
      duration?: string;
    };
  }>;
}

function getBestThumbnail(
  thumbnails: YouTubeApiResponse['items'][0]['snippet']['thumbnails'],
): string {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ''
  );
}

async function fetchFromCache(cacheKey: string): Promise<Response | undefined> {
  try {
    const cache = await caches.open('yt-metadata');
    return await cache.match(cacheKey);
  } catch {
    return undefined;
  }
}

async function saveToCache(
  cacheKey: string,
  data: YoutubeVideoMetadata,
): Promise<void> {
  try {
    const cache = await caches.open('yt-metadata');
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${CACHE_TTL_SECONDS}`,
      },
    });
    await cache.put(cacheKey, response);
  } catch {
    // cache miss w edge to nie błąd — logujemy cicho
    console.warn('[fetch-youtube-metadata] Cache write failed');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (req.method !== 'POST')
    return jsonError('method_not_allowed', 'Use POST', 405);

  // Auth JWT verification
  const authHeader = req.headers.get('Authorization');
  if (!authHeader)
    return jsonError('unauthorized', 'Missing Authorization header', 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError('server_error', 'Missing Supabase configuration', 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return jsonError('unauthorized', 'Invalid or expired token', 401);

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_input', 'Invalid JSON body', 400);
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('videoId' in body) ||
    typeof (body as Record<string, unknown>).videoId !== 'string'
  ) {
    return jsonError('invalid_input', 'Missing videoId string in body', 400);
  }

  const videoId = (body as { videoId: string }).videoId.trim();
  if (!videoId)
    return jsonError('invalid_input', 'videoId cannot be empty', 400);

  // Cache check
  const cacheKey = `https://yt-cache/${videoId}`;
  const cached = await fetchFromCache(cacheKey);
  if (cached) {
    const data = (await cached.json()) as YoutubeVideoMetadata;
    return jsonSuccess(data);
  }

  // Fetch from YouTube Data API v3
  const apiKey = Deno.env.get('YOUTUBE_API_KEY');
  if (!apiKey) return jsonError('server_error', 'Missing YouTube API key', 500);

  const ytUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  ytUrl.searchParams.set('id', videoId);
  ytUrl.searchParams.set('part', 'snippet,contentDetails');
  ytUrl.searchParams.set('key', apiKey);

  let ytResponse: Response;
  try {
    ytResponse = await fetch(ytUrl.toString());
  } catch {
    return jsonError('network_error', 'Failed to reach YouTube API', 502);
  }

  if (ytResponse.status === 403)
    return jsonError('rate_limited', 'YouTube API quota exceeded', 429);
  if (!ytResponse.ok)
    return jsonError(
      'server_error',
      `YouTube API error: ${ytResponse.status}`,
      502,
    );

  const ytData = (await ytResponse.json()) as YouTubeApiResponse;

  if (!ytData.items || ytData.items.length === 0) {
    return jsonError('not_found', 'Video not found or is private', 404);
  }

  const item = ytData.items[0];
  if (!item) return jsonError('not_found', 'Video not found', 404);

  const snippet = item.snippet ?? {};
  const contentDetails = item.contentDetails ?? {};

  // Check for private/deleted via empty snippet title
  if (!snippet.title) {
    return jsonError('private', 'Video is private or unavailable', 404);
  }

  const metadata: YoutubeVideoMetadata = {
    title: snippet.title,
    description: snippet.description ?? '',
    thumbnailUrl: getBestThumbnail(snippet.thumbnails ?? {}),
    duration: contentDetails.duration ?? '',
    channelTitle: snippet.channelTitle ?? '',
  };

  await saveToCache(cacheKey, metadata);

  return jsonSuccess(metadata);
});
