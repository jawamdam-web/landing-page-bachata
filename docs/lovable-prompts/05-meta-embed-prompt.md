# 05 — Meta embed (Facebook + Instagram publicznych postów)

**Z planu:** IU-8 (część Meta)
**Wymaga:** `04-video-sources-yt-link` (AddVideoDialog + VideoPlayer skeleton)
**Output:** Tab "FB / IG" w AddVideoDialog + Edge Function validate-meta-embed + MetaEmbedRenderer z DOMPurify sanitization

---

## ⚠️ KRYTYCZNE OSTRZEŻENIE — przeczytaj PRZED implementacją

**Meta oEmbed API w 2026 — STATUS DO ZWERYFIKOWANIA.** Meta historycznie kilkukrotnie zmieniało politykę dla embed API:
- 2020: deprecation public oEmbed (wymagana App z access token)
- 2021: dodatkowe restrictions
- 2024: niektóre endpointy zamknięte całkowicie

**ZANIM zaimplementujesz cokolwiek z tego promptu:** sprawdź aktualną dokumentację Meta Developer (https://developers.facebook.com/docs/) dla:
- `oembed_video` endpoint (FB)
- `instagram_oembed` endpoint (IG)
- Wymagania App Review

**Decyzja po sprawdzeniu:**
- ✅ **Plan A (oEmbed dostępne)** → kontynuuj ten prompt
- ⚠️ **Plan B (oEmbed niedostępne / wymaga restrictive Review)** → pomiń ten prompt, dodaj "manual entry" form (user wkleja URL + title + thumbnail URL ręcznie, my zapisujemy jako external link bez embedu — klik = otwiera w nowej karcie)
- ❌ **Plan C (wszystko zablokowane)** → usuń R11 z MVP, decyzja z biznesem

**Lovable PRAWDOPODOBNIE nie wie o najnowszych zmianach Meta** — nie polegaj na jego sugestiach co do API. Zweryfikuj manualnie.

---

## Pre-flight (Plan A)

- [ ] Meta App utworzony w https://developers.facebook.com/apps
- [ ] Product "oEmbed Read" dodany do App (jeśli nadal istnieje)
- [ ] App Review przeszedł (jeśli wymagany dla `oembed` use case)
- [ ] `META_APP_ID` + `META_APP_SECRET` w Supabase Edge Function env: `supabase secrets set META_APP_ID=<id> META_APP_SECRET=<secret>`

## Build (Plan A)

<!-- ============================ PASTE TO LOVABLE ============================ -->

Dodaję wsparcie dla embedów publicznych postów Facebook + Instagram. URL parser → Edge Function fetch oEmbed → DB → MetaEmbedRenderer z DOMPurify sanitization + FB JS SDK init.

**WAŻNE security:** Meta oEmbed zwraca HTML z `<iframe>` — chociaż source jest trusted (Meta API), używamy DOMPurify jako defense-in-depth (założenie zero-trust). Bez sanitize = XSS attack surface.

### Extend `src/lib/url-parsers.ts`

```ts
export interface MetaUrlMatch {
  platform: "fb" | "ig";
  postId: string;
}

const FB_HOSTS = ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"];
const IG_HOSTS = ["instagram.com", "www.instagram.com"];

export function parseMetaUrl(input: string): MetaUrlMatch | null {
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }

  if (FB_HOSTS.includes(url.hostname)) {
    // fb.watch/<id>
    if (url.hostname === "fb.watch") {
      const id = url.pathname.slice(1).split("/")[0];
      return id ? { platform: "fb", postId: id } : null;
    }
    // facebook.com/share/v/<id>/
    const shareMatch = url.pathname.match(/^\/share\/v\/([^/]+)/);
    if (shareMatch) return { platform: "fb", postId: shareMatch[1] };
    // facebook.com/<page>/videos/<id>
    const videoMatch = url.pathname.match(/^\/[^/]+\/videos\/([^/]+)/);
    if (videoMatch) return { platform: "fb", postId: videoMatch[1] };
    // facebook.com/<page>/posts/<id>
    const postMatch = url.pathname.match(/^\/[^/]+\/posts\/([^/]+)/);
    if (postMatch) return { platform: "fb", postId: postMatch[1] };
    return null;
  }

  if (IG_HOSTS.includes(url.hostname)) {
    // instagram.com/(p|reel|tv)/<code>/
    const match = url.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
    if (match) return { platform: "ig", postId: match[2] };
    return null;
  }

  return null;
}
```

### Edge Function — `supabase/functions/validate-meta-embed/index.ts`

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  platform: "fb" | "ig";
  url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: { code: "method_not_allowed", message: "Use POST" } }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: { code: "unauthorized", message: "Missing auth" } }, 401);

  const appId = Deno.env.get("META_APP_ID");
  const appSecret = Deno.env.get("META_APP_SECRET");
  if (!appId || !appSecret) return json({ error: { code: "missing_app_credentials", message: "Meta App credentials not configured" } }, 500);

  let body: RequestBody;
  try { body = await req.json(); } catch { return json({ error: { code: "invalid_json", message: "Invalid JSON" } }, 400); }

  if (!body.url || !["fb", "ig"].includes(body.platform)) {
    return json({ error: { code: "invalid_input", message: "platform + url required" } }, 400);
  }

  const accessToken = `${appId}|${appSecret}`;
  const endpoint = body.platform === "fb"
    ? `https://graph.facebook.com/v18.0/oembed_video?url=${encodeURIComponent(body.url)}&access_token=${accessToken}&omitscript=true`
    : `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(body.url)}&access_token=${accessToken}&omitscript=true`;

  const metaRes = await fetch(endpoint);
  if (!metaRes.ok) {
    if (metaRes.status === 404) return json({ error: { code: "not_found", message: "Post nie istnieje lub jest prywatny" } }, 404);
    return json({ error: { code: "meta_api_error", message: `Meta API responded ${metaRes.status}` } }, 502);
  }

  const meta = await metaRes.json();
  return json({
    data: {
      html: meta.html,                         // <iframe ...>
      thumbnailUrl: meta.thumbnail_url ?? null,
      title: meta.title ?? meta.author_name ?? "Post z " + (body.platform === "fb" ? "Facebooka" : "Instagrama"),
      authorName: meta.author_name ?? null,
    },
  }, 200, { "Cache-Control": "public, max-age=3600" });
});

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders, ...extra } });
}
```

Deploy: `supabase functions deploy validate-meta-embed`

### `src/lib/dompurify-wrapper.ts`

```ts
import DOMPurify from "dompurify";

// Allow iframes (z Meta) — domyślnie DOMPurify usuwa
const config: DOMPurify.Config = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "style", "loading"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

export function sanitizeMetaEmbed(html: string): string {
  return DOMPurify.sanitize(html, config);
}
```

Install: `npm install dompurify` + `npm install -D @types/dompurify`

### Extend `src/features/library/api/videos.ts`

```ts
export async function createVideoFromMetaLink(url: string): Promise<Video> {
  const parsed = parseMetaUrl(url);
  if (!parsed) throw new Error("Nie rozpoznaję linku. Wklej URL z Facebooka lub Instagrama.");

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Nie jesteś zalogowany");

  const { data: metaRes, error: metaError } = await supabase.functions.invoke<{
    data?: { html: string; thumbnailUrl: string | null; title: string };
    error?: { code: string; message: string };
  }>("validate-meta-embed", { body: { platform: parsed.platform, url } });

  if (metaError) throw new Error(metaError.message);
  if (metaRes?.error) throw new Error(metaRes.error.message);
  if (!metaRes?.data) throw new Error("Brak danych z Meta");

  const meta = metaRes.data;

  const { data, error } = await supabase
    .from("videos")
    .insert({
      user_id: user.user.id,
      source: "meta_embed",
      source_url: url,
      source_id: parsed.postId,
      title: meta.title,
      thumbnail_url: meta.thumbnailUrl,
      embed_html: meta.html,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ten post już jest w Twojej bibliotece");
    throw error;
  }
  return data;
}
```

### `src/features/library/components/MetaLinkForm.tsx`

Analogiczny do `YoutubeLinkForm`:
- Pole "URL posta z Facebooka lub Instagrama" + hint
- Submit → `createVideoFromMetaLink(url)`
- Loading + error toast + onSuccess invalidate + close

### `src/features/library/components/MetaEmbedRenderer.tsx`

```tsx
import { useEffect, useRef } from "react";
import { sanitizeMetaEmbed } from "@/lib/dompurify-wrapper";

interface Props { html: string }

export function MetaEmbedRenderer({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const sanitized = sanitizeMetaEmbed(html);

  useEffect(() => {
    // Lazy load FB SDK only when rendering Meta embed
    if (!document.getElementById("fb-sdk")) {
      const script = document.createElement("script");
      script.id = "fb-sdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
    // Re-parse XFBML when sanitized HTML changes
    const interval = setInterval(() => {
      if (window.FB?.XFBML && ref.current) {
        window.FB.XFBML.parse(ref.current);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [sanitized]);

  return <div ref={ref} className="aspect-video w-full" dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

declare global {
  interface Window {
    FB?: { XFBML: { parse: (el?: HTMLElement | null) => void } };
  }
}
```

### Aktywuj tab "FB / IG" w `AddVideoDialog`

Zastąp placeholder w `<TabsContent value="meta">`:
```tsx
<TabsContent value="meta"><MetaLinkForm onSuccess={() => setOpen(false)} /></TabsContent>
```

### Update `VideoPlayer` — wire MetaEmbedRenderer

Już jest skeleton w prompt 04 — `if (video.source === "meta_embed" && video.embed_html) return <MetaEmbedRenderer html={video.embed_html} />;` — upewnij się że import działa.

## Constraints (DON'T)

- ❌ **NIE rób `dangerouslySetInnerHTML` z `embed_html` BEZ DOMPurify sanitization** — zero-trust, defense in depth. Choć Meta = trusted, kompromitacja API lub MITM = XSS w naszej app.
- ❌ NIE używaj Meta App Secret w frontend kodzie — ZAWSZE przez Edge Function
- ❌ NIE używaj `omitscript=false` — nie chcemy żeby Meta embed dorzucał własne `<script>` tagi do naszego DOM. FB SDK loadujemy explicite z naszej kontroli.
- ❌ NIE cache'uj Meta embed HTML w localStorage — może zawierać access tokens lub session-bound URLs
- ❌ NIE pozwól userowi wkleić URL prywatnego posta — Meta API zwraca 404, my pokazujemy "Post nie istnieje lub jest prywatny" (nie ujawniaj różnicy bezpieczeństwowo)
- ❌ NIE renderuj Meta embed na public share view (prompt 06) bez double-check sanitization — public surface = większy attack surface

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 06

- [ ] Tab "FB / IG" w AddVideoDialog aktywny (nie disabled)
- [ ] Wklej IG reel URL (np. `https://www.instagram.com/reel/CAbc123/`) → submit → toast "Dodano film" → VideoCard pojawia się z thumbnail
- [ ] Wklej FB video URL → success
- [ ] Wklej invalid URL "https://example.com" → form error "Nie rozpoznaję linku. Wklej URL z Facebooka lub Instagrama."
- [ ] Wklej URL prywatnego posta → error toast "Post nie istnieje lub jest prywatny"
- [ ] VideoCard klik → VideoDetailDialog → VideoPlayer renderuje MetaEmbedRenderer → embed widoczny + interactive
- [ ] DevTools console: brak XSS warnings, brak unsafe-inline CSP errors
- [ ] DOMPurify sanitize test (manualne): w Supabase Studio podmień `embed_html` row na `<iframe>...</iframe><script>alert(1)</script>` → odśwież detail → `<script>` powinien być usunięty (sprawdź DevTools elements)
- [ ] Mobile: embed responsive, brak horizontal scroll
- [ ] Edge Function `validate-meta-embed` logi: requesty 200; auth header present

## Common gotchas

- **Meta oEmbed zwraca 400 "Object does not exist"** — najczęstszy: nie zalogowany Meta App ma access do post (App Review requirement). Sprawdź czy App ma "oEmbed Read" product enabled.
- **FB SDK nie ładuje się / `window.FB` undefined** — sprawdź CSP (`script-src 'self' connect.facebook.net`); Lovable domyślnie nie blokuje
- **IG embed wygląda jak gołe URL bez stylowania** — FB JS SDK musi sparsować XFBML. `useEffect` z `clearInterval` w `MetaEmbedRenderer` rozwiązuje race condition gdy SDK ładuje się po render
- **DOMPurify usuwa wszystko z `embed_html` (puste div)** — config musi zawierać `ADD_TAGS: ["iframe"]` + `ADD_ATTR: ["allow", "allowfullscreen", ...]`. Domyślny DOMPurify blokuje iframes.
- **Lovable proponuje `iframe.parentNode.innerHTML = embedHtml`** — nie używaj direct DOM manipulation, użyj `dangerouslySetInnerHTML` z sanitize — React-idiomatic
- **`omitscript=true` nie działa dla IG** — Meta API różnie traktuje per platform; weryfikuj manualnie zwracaną HTML strukturę
