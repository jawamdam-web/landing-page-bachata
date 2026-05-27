# 04 — Video sources: YouTube link paste + AddVideoDialog + VideoPlayer

**Z planu:** IU-8 (część YouTube)
**Wymaga:** `03-library` (schema gotowy, AddVideoDialog placeholder)
**Output:** Dodawanie filmów przez paste YouTube link + VideoPlayer renderer dla YT + VideoDetailDialog

---

## Pre-flight

- [ ] `YOUTUBE_API_KEY` w Supabase Edge Function env (Supabase Dashboard → Edge Functions → Secrets): `supabase secrets set YOUTUBE_API_KEY=<key>`
- [ ] GCP project ma YouTube Data API v3 enabled (z IU-3 operator)

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Implementuję pierwszy z 3 źródeł filmów: **paste YouTube URL** → metadata fetch przez Edge Function (ukrywa API key) → film w bibliotece + VideoPlayer renderujący YT embed. Plus root komponenty: AddVideoDialog z 3 tabami (YT / Meta / Upload) — tab Meta i Upload pozostają placeholderami do prompt 05/manual.

### URL parser — `src/lib/url-parsers.ts`

```ts
export interface YoutubeUrlMatch {
  videoId: string;
}

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"];

export function parseYoutubeUrl(input: string): YoutubeUrlMatch | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.includes(url.hostname)) return null;

  // youtu.be/<id>
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { videoId: id } : null;
  }

  // youtube.com/watch?v=<id>
  const vParam = url.searchParams.get("v");
  if (vParam) return { videoId: vParam };

  // youtube.com/shorts/<id>, /embed/<id>, /v/<id>, /live/<id>
  const pathMatch = url.pathname.match(/^\/(?:shorts|embed|v|live)\/([^/?]+)/);
  if (pathMatch) return { videoId: pathMatch[1] };

  return null;
}
```

### ISO 8601 duration parser — `src/lib/duration.ts`

```ts
export function parseIso8601Duration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h ?? 0) * 3600) + (Number(m ?? 0) * 60) + Number(s ?? 0);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
```

### Edge Function — `supabase/functions/fetch-youtube-metadata/index.ts`

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody { videoId: string }

interface YouTubeApiItem {
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; high?: { url: string } };
  };
  contentDetails: { duration: string };
  status: { privacyStatus: "public" | "unlisted" | "private" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: { code: "method_not_allowed", message: "Use POST" } }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: { code: "unauthorized", message: "Missing auth" } }, 401);

  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return json({ error: { code: "missing_api_key", message: "YOUTUBE_API_KEY not configured" } }, 500);

  let body: RequestBody;
  try { body = await req.json(); } catch { return json({ error: { code: "invalid_json", message: "Invalid JSON body" } }, 400); }
  if (!body.videoId || typeof body.videoId !== "string") {
    return json({ error: { code: "invalid_video_id", message: "videoId required" } }, 400);
  }

  const ytUrl = `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(body.videoId)}&part=snippet,contentDetails,status&key=${apiKey}`;
  const ytRes = await fetch(ytUrl);
  if (!ytRes.ok) {
    if (ytRes.status === 403) return json({ error: { code: "quota_exceeded", message: "YouTube API quota exceeded" } }, 503);
    return json({ error: { code: "yt_api_error", message: `YT API responded ${ytRes.status}` } }, 502);
  }

  const ytData: { items: YouTubeApiItem[] } = await ytRes.json();
  if (!ytData.items || ytData.items.length === 0) {
    return json({ error: { code: "not_found", message: "Film nie istnieje lub jest prywatny" } }, 404);
  }

  const item = ytData.items[0];
  if (item.status.privacyStatus === "private") {
    return json({ error: { code: "private", message: "Film jest prywatny" } }, 403);
  }

  return json({
    data: {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? null,
      duration: item.contentDetails.duration,
      channelTitle: item.snippet.channelTitle,
    },
  }, 200, { "Cache-Control": "public, max-age=3600" });
});

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders, ...extraHeaders },
  });
}
```

Deploy: `supabase functions deploy fetch-youtube-metadata`

### API layer — extend `src/features/library/api/videos.ts`

```ts
import { parseIso8601Duration } from "@/lib/duration";

export async function createVideoFromYoutubeLink(url: string): Promise<Video> {
  const parsed = parseYoutubeUrl(url);
  if (!parsed) throw new Error("Nie rozpoznaję linku. Wklej URL z YouTube.");

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Nie jesteś zalogowany");

  const { data: metaRes, error: metaError } = await supabase.functions.invoke<{
    data?: { title: string; thumbnailUrl: string | null; duration: string };
    error?: { code: string; message: string };
  }>("fetch-youtube-metadata", { body: { videoId: parsed.videoId } });

  if (metaError) throw new Error(metaError.message);
  if (metaRes?.error) throw new Error(metaRes.error.message);
  if (!metaRes?.data) throw new Error("Brak metadanych z YouTube");

  const meta = metaRes.data;

  const { data, error } = await supabase
    .from("videos")
    .insert({
      user_id: user.user.id,
      source: "youtube_link",
      source_url: url,
      source_id: parsed.videoId,
      title: meta.title,
      thumbnail_url: meta.thumbnailUrl,
      duration_seconds: parseIso8601Duration(meta.duration),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ten film już jest w Twojej bibliotece");
    throw error;
  }
  return data;
}
```

### `src/features/library/components/AddVideoDialog.tsx`

Root entry — Dialog (desktop) / Sheet (mobile bottom):
- 3 taby shadcn `<Tabs>`: "YouTube link" / "Facebook / Instagram" / "Wgraj plik"
- W tym IU implementowany tab YouTube; pozostałe 2 = placeholder z disabled state + tooltip "Wkrótce dostępne"
- Trigger: button "Dodaj film" w EmptyLibrary + FAB mobile + future "+ Dodaj film" w sidebar

```tsx
export function AddVideoDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // useMediaQuery hook lub Tailwind responsive utility
  const isMobile = useMediaQuery("(max-width: 47.99rem)");

  const content = (
    <Tabs defaultValue="youtube" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="youtube">YouTube</TabsTrigger>
        <TabsTrigger value="meta">FB / IG</TabsTrigger>
        <TabsTrigger value="upload">Wgraj plik</TabsTrigger>
      </TabsList>
      <TabsContent value="youtube"><YoutubeLinkForm onSuccess={() => setOpen(false)} /></TabsContent>
      <TabsContent value="meta"><PlaceholderTab text="Wsparcie dla Facebook / Instagram wkrótce." /></TabsContent>
      <TabsContent value="upload"><PlaceholderTab text="Upload pliku wkrótce." /></TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="max-h-[90vh]">
          <SheetHeader><SheetTitle>Dodaj film</SheetTitle></SheetHeader>
          <div className="pt-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Dodaj film</DialogTitle></DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
```

### `src/features/library/components/YoutubeLinkForm.tsx`

- RHF + Zod schema: `z.object({ url: z.string().url("Nieprawidłowy URL") })`
- Pole "URL filmu z YouTube" + hint "np. https://youtube.com/watch?v=..."
- Submit button "Dodaj film" — loading state z Lucide `Loader2` spin
- Error inline + toast
- onSuccess: invalidate `["videos"]` query, toast "Dodano film", close dialog

### `src/features/library/components/VideoPlayer.tsx`

```tsx
interface VideoPlayerProps { video: Video }

export function VideoPlayer({ video }: VideoPlayerProps) {
  if (video.source === "youtube_link" || video.source === "youtube_upload") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-bg-inverse">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.source_id}?rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }
  if (video.source === "meta_embed" && video.embed_html) {
    return <MetaEmbedRenderer html={video.embed_html} />; // implementacja w prompt 05
  }
  return <div className="aspect-video w-full rounded-lg bg-bg-muted flex items-center justify-center text-fg-muted">Brak odtwarzacza</div>;
}
```

### `src/features/library/components/VideoDetailDialog.tsx`

Dialog (desktop) / full-screen Sheet (mobile) z:
- VideoPlayer (full width responsive)
- Tytuł — inline edit (click → input → save on blur via `updateVideoMeta`)
- Notes textarea — auto-save on blur, max 2000 chars (Zod validation)
- Meta: source icon, duration (tabular), data dodania
- Action buttons: "Udostępnij" (prompt 06), "Zarządzaj folderami" (FolderPicker z prompt 03), "Usuń" (AlertDialog confirm)
- Close: ESC + X button

Z VideoCard click handler:
```tsx
<button onClick={() => setSelectedVideo(video)}>...</button>
{selectedVideo && <VideoDetailDialog video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
```

### VideoCard — full implementation

```tsx
import { Youtube, Facebook, UploadCloud, MoreHorizontal } from "lucide-react";
import { formatDuration } from "@/lib/duration";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

const SOURCE_ICONS = {
  youtube_link: Youtube,
  youtube_upload: UploadCloud,
  meta_embed: Facebook,
};

export function VideoCard({ video, onClick, onMenuClick }) {
  const SourceIcon = SOURCE_ICONS[video.source];
  return (
    <article className="group relative border border-border bg-bg-subtle rounded-lg overflow-hidden hover:border-border-strong hover:-translate-y-0.5 transition-all duration-150">
      <button onClick={onClick} className="block w-full text-left">
        <div className="aspect-video bg-bg-muted relative">
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent-soft to-bg-muted" />
          )}
          {video.duration_seconds && (
            <span className="absolute bottom-2 right-2 bg-bg-inverse/90 text-fg-inverse text-xs px-1.5 py-0.5 rounded font-mono tabular-nums">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium line-clamp-2 mb-2">{video.title}</h3>
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <SourceIcon className="w-4 h-4" aria-hidden />
            <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: pl })}</span>
          </div>
        </div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Akcje filmu" className="absolute top-2 right-2 p-1.5 rounded-md bg-bg/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-bg transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onMenuClick("folders")}>Zarządzaj folderami</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMenuClick("share")}>Udostępnij</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onMenuClick("delete")} className="text-error">Usuń</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
```

### EmptyLibrary update — podłącz AddVideoDialog

W `EmptyLibrary.tsx` zmień placeholder na:
```tsx
<AddVideoDialog trigger={<Button className="bg-accent text-accent-foreground hover:bg-accent-hover">Dodaj film</Button>} />
```

## Constraints (DON'T)

- ❌ NIE używaj YouTube API key bezpośrednio w frontend kodzie — ZAWSZE przez Edge Function
- ❌ NIE używaj `youtube.com/embed/` (cookies) — używaj `youtube-nocookie.com/embed/` (privacy mode)
- ❌ NIE zapomnij `?rel=0&modestbranding=1` w iframe URL — ukrywa related videos + YT branding
- ❌ NIE skip cache w Edge Function — `Cache-Control: public, max-age=3600` oszczędza quotę
- ❌ NIE wrzucaj iframe bez `title` attribute — accessibility violation
- ❌ NIE pozwól na duplicate per user — unique constraint `(user_id, source, source_id)` + 23505 error handling
- ❌ NIE oczekuj sukcesu z Lovable dla zaawansowanych regex w `parseYoutubeUrl` — zweryfikuj na 6 wariantach URL manualnie
- ❌ NIE używaj `dangerouslySetInnerHTML` dla YT — iframe wystarcza. `dangerouslySetInnerHTML` tylko dla Meta embed (prompt 05) z DOMPurify

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 05

- [ ] EmptyLibrary CTA "Dodaj film" → otwiera AddVideoDialog (Dialog desktop / Sheet mobile)
- [ ] Tab "YouTube" — wklej `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → submit → toast "Dodano film" + VideoCard pojawia się w grid (Rick Astley jako test)
- [ ] Tab "YouTube" — wklej `https://youtu.be/dQw4w9WgXcQ` (skrócony URL) → success (parser obsługuje warianty)
- [ ] Tab "YouTube" — wklej `https://example.com` → form error "Nie rozpoznaję linku"
- [ ] Tab "YouTube" — wklej URL prywatnego filmu → error toast "Film jest prywatny"
- [ ] Wklej ten sam URL drugi raz → toast "Ten film już jest w Twojej bibliotece" (unique constraint)
- [ ] Klik VideoCard → VideoDetailDialog otwiera się → VideoPlayer renderuje YT iframe (Rick Astley odtwarza)
- [ ] VideoDetailDialog → edit tytuł inline (click + new value + blur) → toast "Zapisano" → grid pokazuje nowy tytuł po zamknięciu
- [ ] VideoDetailDialog → notes textarea → wpisz "Test note" → blur → save
- [ ] VideoDetailDialog → menu Usuń → AlertDialog confirm → film znika z grid + toast
- [ ] VideoCard "⋯" → "Zarządzaj folderami" → FolderPicker działa (z prompt 03)
- [ ] Mobile: AddVideoDialog otwiera się jako bottom sheet (nie centered modal)
- [ ] Edge Function logi w Supabase Dashboard: `fetch-youtube-metadata` requesty mają status 200
- [ ] Cache test: ten sam videoId fetched drugi raz w <1h → response z `cf-cache-status: HIT` lub szybszy timing

## Common gotchas

- **Edge Function `Authorization` header missing** — Supabase JS automatycznie wysyła JWT z `supabase.functions.invoke`; w cURL test pamiętaj `-H "Authorization: Bearer <anon-key>"`
- **YouTube API quota** — domyślny limit 10k/dzień; `videos.list` kosztuje 1 jednostkę → 10k requests/dzień. Spokojnie wystarczy do MVP. Quota extension dla `videos.insert` (upload) w IU-9.
- **iframe nie ładuje się — CSP error** — sprawdź `Content-Security-Policy`; YouTube nocookie wymaga `frame-src https://www.youtube-nocookie.com`. Lovable domyślnie nie ustawia CSP — OK; problem może wynikać z hosting provider.
- **`parseYoutubeUrl` zwraca null dla valid URL** — debugger: log `url.hostname` + `url.pathname` + `url.searchParams`. Najczęściej mobile share URLs mają inne hosty (`m.youtube.com`) — sprawdź czy są w `YOUTUBE_HOSTS`.
- **Lovable proponuje YT IFrame API zamiast embed iframe** — odmów, IFrame API to overkill (~20KB JS) dla MVP. Plain iframe wystarcza.
- **`date-fns` import duży** — używaj subpath imports: `import { formatDistanceToNow } from "date-fns/formatDistanceToNow"` + `import { pl } from "date-fns/locale/pl"`
