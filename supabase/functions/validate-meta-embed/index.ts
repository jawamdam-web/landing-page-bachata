/**
 * validate-meta-embed — Edge Function (Deno).
 *
 * Proxy do Meta oEmbed API — ukrywa app credentials po stronie serwera.
 * Plan A: Meta oEmbed endpoints (graph.facebook.com).
 *
 * Input (POST JSON):
 *   { platform: 'fb' | 'ig', url: string }
 *
 * Output (JSON — success):
 *   { data: { embedHtml, thumbnailUrl, title, authorName } }
 *
 * Output (JSON — fallback gdy oEmbed niedostępny):
 *   { error: { code: 'oembed_unavailable', message, fallback: 'manual_entry' } }
 *
 * Auth: wymaga Supabase JWT.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsPreflightResponse } from '../_shared/cors.ts';
import { jsonError, jsonSuccess } from '../_shared/response.ts';
import { withSentry } from '../_shared/sentry.ts';

interface MetaEmbedResult {
  embedHtml: string;
  thumbnailUrl: string;
  title: string;
  authorName: string;
}

// Meta oEmbed API response shape
interface OEmbedResponse {
  html?: string;
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
}

// Whitelist dozwolonych prefiksów URL per platforma — broni przed przekazaniem
// dowolnego URLa do Meta API (SSRF defense-in-depth). Trailing slash w prefiksie
// blokuje obejście typu https://facebook.com.evil.com/ (review P2-2).
const ALLOWED_URL_PREFIXES: Record<'fb' | 'ig', readonly string[]> = {
  fb: [
    'https://www.facebook.com/',
    'https://facebook.com/',
    'https://m.facebook.com/',
    'https://fb.watch/',
  ],
  ig: ['https://www.instagram.com/', 'https://instagram.com/'],
};

const MAX_MEDIA_URL_LENGTH = 2048;

function isAllowedMediaUrl(platform: 'fb' | 'ig', mediaUrl: string): boolean {
  return ALLOWED_URL_PREFIXES[platform].some((prefix) =>
    mediaUrl.startsWith(prefix),
  );
}

function getOEmbedUrl(
  platform: 'fb' | 'ig',
  mediaUrl: string,
  accessToken: string,
): string {
  const base =
    platform === 'ig'
      ? 'https://graph.facebook.com/v18.0/instagram_oembed'
      : 'https://graph.facebook.com/v18.0/oembed_video';

  const url = new URL(base);
  url.searchParams.set('url', mediaUrl);
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('omitscript', 'true');
  return url.toString();
}

Deno.serve(
  withSentry(async (req: Request) => {
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
      !('platform' in body) ||
      !('url' in body)
    ) {
      return jsonError('invalid_input', 'Missing platform or url in body', 400);
    }

    const { platform, url: mediaUrl } = body as Record<string, unknown>;

    if (platform !== 'fb' && platform !== 'ig') {
      return jsonError('invalid_input', 'platform must be "fb" or "ig"', 400);
    }
    if (typeof mediaUrl !== 'string' || !mediaUrl) {
      return jsonError('invalid_input', 'url must be a non-empty string', 400);
    }
    if (mediaUrl.length > MAX_MEDIA_URL_LENGTH) {
      return jsonError('invalid_input', 'url is too long', 400);
    }
    if (!isAllowedMediaUrl(platform, mediaUrl)) {
      return jsonError(
        'invalid_input',
        'url must be a facebook.com or instagram.com link',
        400,
      );
    }

    // Get Meta credentials
    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    if (!metaAppId || !metaAppSecret) {
      return jsonError('server_error', 'Missing Meta API credentials', 500);
    }

    const accessToken = `${metaAppId}|${metaAppSecret}`;
    const oEmbedUrl = getOEmbedUrl(platform, mediaUrl, accessToken);

    let metaResponse: Response;
    try {
      metaResponse = await fetch(oEmbedUrl);
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'oembed_unavailable',
            message: 'Could not reach Meta oEmbed API',
            fallback: 'manual_entry',
          },
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    if (!metaResponse.ok) {
      console.warn(
        `[validate-meta-embed] oEmbed API returned ${metaResponse.status}`,
      );
      return new Response(
        JSON.stringify({
          error: {
            code: 'oembed_unavailable',
            // Status logowany server-side; nie ujawniamy go klientowi (review P2-3).
            message: 'Meta oEmbed API unavailable',
            fallback: 'manual_entry',
          },
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const oEmbedData = (await metaResponse.json()) as OEmbedResponse;

    if (!oEmbedData.html) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'oembed_unavailable',
            message: 'No embed HTML returned from Meta',
            fallback: 'manual_entry',
          },
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const result: MetaEmbedResult = {
      embedHtml: oEmbedData.html,
      thumbnailUrl: oEmbedData.thumbnail_url ?? '',
      title: oEmbedData.title ?? '',
      authorName: oEmbedData.author_name ?? '',
    };

    return jsonSuccess(result);
  }),
);
