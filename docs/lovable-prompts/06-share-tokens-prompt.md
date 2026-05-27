# 06 — Share tokens (publiczne linki z revoke + SECURITY DEFINER RLS)

**Z planu:** IU-10
**Wymaga:** `04-video-sources-yt-link` (VideoPlayer) + `03-library` (foldery)
**Output:** Share tokens table + `get_shared_content()` SECURITY DEFINER function + ShareDialog + public `/s/<token>` route + revoke flow

---

## ⚠️ KRYTYCZNE — security-critical

To jest najbardziej wrażliwy IU planu. Halucynacja w RLS lub function = **realny risk wycieku prywatnych filmów obcych userów**. Po implementacji:

1. **Manualnie zweryfikuj** RLS policies + function body w Supabase Studio (NIE polegaj na Lovable że to dobrze zrobił)
2. **Testuj cross-user**: zaloguj się jako user A → utwórz share token → wyloguj się → otwórz `/s/<token>` w incognito → renderuje OK; potem revoke → renderuje "wyłączony"
3. **Testuj direct DB access**: w SQL Editor jako anon: `SELECT * FROM share_tokens` → MUSI zwrócić 0 rows (anon nie ma access do tabeli)
4. **Testuj fake token**: `/s/fakeXYZ` → renderuje RevokedTokenView (nie crash, nie 500)

Jeśli Lovable nie umie wygenerować poprawnego SECURITY DEFINER — **nie wklejaj uproszczonego workaround'a**. Lepiej tę funkcjonalność zrobić ręcznie w eksportowanym repo.

---

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Implementuję share tokens: user generuje publiczny link tokenowy do filmu lub folderu; każdy z linkiem widzi read-only; user może revoke; brak feed / follow / public profiles.

### Supabase migracja `0004_share_tokens.sql`

```sql
-- 0004_share_tokens.sql

create table public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  target_type text not null check (target_type in ('video', 'folder')),
  target_id uuid not null,   -- weak reference (no FK) — sprawdzane w funkcji
  revoked_at timestamptz,
  created_at timestamptz default now() not null,
  last_accessed_at timestamptz
);

create index share_tokens_user_target on public.share_tokens (user_id, target_id);
create index share_tokens_active on public.share_tokens (token) where revoked_at is null;

alter table public.share_tokens enable row level security;

-- Owner full access — SELECT/INSERT/UPDATE
create policy "share_tokens_owner_select" on public.share_tokens
  for select using (user_id = auth.uid());
create policy "share_tokens_owner_insert" on public.share_tokens
  for insert with check (user_id = auth.uid());
create policy "share_tokens_owner_update" on public.share_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ANON NIE MA polityki SELECT — wymusza go przez SECURITY DEFINER function

-- get_shared_content(token text) — jedyna ścieżka anonimowego dostępu
create or replace function public.get_shared_content(p_token text)
returns jsonb
language plpgsql
security definer    -- bypassuje RLS dla owner queries wewnątrz funkcji
set search_path = public
as $$
declare
  v_token_row public.share_tokens%rowtype;
  v_result jsonb;
begin
  -- Find active token
  select * into v_token_row
  from public.share_tokens
  where token = p_token and revoked_at is null;

  if not found then
    raise exception 'token_invalid_or_revoked' using errcode = 'P0001';
  end if;

  -- Update last_accessed
  update public.share_tokens
  set last_accessed_at = now()
  where id = v_token_row.id;

  -- Build response based on target_type
  if v_token_row.target_type = 'video' then
    select jsonb_build_object(
      'type', 'video',
      'video', to_jsonb(v.*)
    ) into v_result
    from public.videos v
    where v.id = v_token_row.target_id;

    if v_result is null then
      raise exception 'target_not_found' using errcode = 'P0002';
    end if;

  elsif v_token_row.target_type = 'folder' then
    select jsonb_build_object(
      'type', 'folder',
      'folder', to_jsonb(f.*),
      'videos', coalesce(
        (select jsonb_agg(to_jsonb(v.*) order by vf.added_at desc)
         from public.video_folders vf
         join public.videos v on v.id = vf.video_id
         where vf.folder_id = f.id),
        '[]'::jsonb
      )
    ) into v_result
    from public.folders f
    where f.id = v_token_row.target_id;

    if v_result is null then
      raise exception 'target_not_found' using errcode = 'P0002';
    end if;
  end if;

  return v_result;
end;
$$;

-- Anon role MOŻE wywołać funkcję (function-level grant)
grant execute on function public.get_shared_content(text) to anon, authenticated;
```

### `src/features/sharing/api/shareTokens.ts`

```ts
import { supabase } from "@/lib/supabase";

export type SharedContent =
  | { type: "video"; video: Video }
  | { type: "folder"; folder: Folder; videos: Video[] };

function generateToken(): string {
  // 24 bytes = 192 bits entropy → 32-char URL-safe base64
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function createShareToken({
  targetType,
  targetId,
}: { targetType: "video" | "folder"; targetId: string }) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Nie jesteś zalogowany");

  const token = generateToken();
  const { data, error } = await supabase
    .from("share_tokens")
    .insert({ user_id: user.user.id, token, target_type: targetType, target_id: targetId })
    .select()
    .single();
  if (error) throw error;
  return { token: data.token, url: `${window.location.origin}/s/${data.token}`, id: data.id };
}

export async function revokeShareToken(id: string): Promise<void> {
  const { error } = await supabase
    .from("share_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function listActiveShareTokens(targetType: "video" | "folder", targetId: string) {
  const { data, error } = await supabase
    .from("share_tokens")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSharedContent(token: string): Promise<SharedContent> {
  const { data, error } = await supabase.rpc("get_shared_content", { p_token: token });
  if (error) {
    if (error.message?.includes("token_invalid_or_revoked")) {
      throw new Error("token_invalid_or_revoked");
    }
    if (error.message?.includes("target_not_found")) {
      throw new Error("target_not_found");
    }
    throw error;
  }
  return data as SharedContent;
}
```

### `src/features/sharing/hooks/useShareTokens.ts`

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/shareTokens";

export function useShareTokens(targetType: "video" | "folder", targetId: string) {
  return useQuery({
    queryKey: ["share_tokens", targetType, targetId],
    queryFn: () => api.listActiveShareTokens(targetType, targetId),
  });
}

export function useCreateShareToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createShareToken,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["share_tokens", vars.targetType, vars.targetId] }),
  });
}

export function useRevokeShareToken(targetType: "video" | "folder", targetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.revokeShareToken,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["share_tokens", targetType, targetId] }),
  });
}
```

### `src/features/sharing/components/ShareDialog.tsx`

Triggered z VideoDetailDialog "Udostępnij" lub LibrarySidebar folder context menu.

Zawartość:
```
[Header] Udostępnij {video|folder} "{nazwa}"

[Sekcja 1: Generuj link]
Każdy z linkiem zobaczy {ten film | filmy z tego folderu} bez konta.
[Button "Utwórz nowy link"] → useCreateShareToken.mutate

[Sekcja 2: Aktywne linki] (lista z useShareTokens)
Per token:
  [Input read-only z URL] [Copy button] [Revoke button → confirm]
  Meta: "Utworzony 2 dni temu, ostatnio otwierany 5 min temu"

[Pusty stan] "Brak aktywnych linków" gdy lista pusta
```

Copy button:
```tsx
async function copy(url: string) {
  await navigator.clipboard.writeText(url);
  toast.success("Skopiowano");
}
```

Revoke z AlertDialog confirm:
```
Cofnąć link?
Osoby, którym go wysłałeś, stracą dostęp.
[Cofnij link] [Anuluj]
```

### Public route `src/pages/s/[token].tsx` (lub `/s/:token`)

```tsx
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSharedContent } from "@/features/sharing/api/shareTokens";
import { SharedVideoView } from "@/features/sharing/components/SharedVideoView";
import { SharedFolderView } from "@/features/sharing/components/SharedFolderView";
import { RevokedTokenView } from "@/features/sharing/components/RevokedTokenView";

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared_content", token],
    queryFn: () => fetchSharedContent(token!),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Ładowanie...</p></div>;
  if (error) return <RevokedTokenView />;
  if (!data) return <RevokedTokenView />;

  if (data.type === "video") return <SharedVideoView video={data.video} />;
  return <SharedFolderView folder={data.folder} videos={data.videos} />;
}
```

### `src/features/sharing/components/SharedVideoView.tsx`

```tsx
import { VideoPlayer } from "@/features/library/components/VideoPlayer";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function SharedVideoView({ video }: { video: Video }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 container mx-auto px-5 md:px-8 py-8 max-w-4xl">
        <article>
          <VideoPlayer video={video} />
          <h1 className="text-2xl font-semibold mt-6">{video.title}</h1>
          {video.notes && <p className="text-fg-muted mt-4 whitespace-pre-wrap">{video.notes}</p>}
        </article>
        <aside className="mt-12 p-6 bg-accent-soft rounded-xl text-center">
          <h2 className="text-xl font-semibold">Lubisz tańczyć bachatę?</h2>
          <p className="text-fg-muted mt-2 max-w-md mx-auto">Załóż konto i organizuj własne filmy z zajęć — bez gubienia w rolce telefonu.</p>
          <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent-hover">
            <Link to="/signup">Załóż konto</Link>
          </Button>
        </aside>
      </main>
    </div>
  );
}
```

### `src/features/sharing/components/SharedFolderView.tsx`

Analogicznie:
- Header: folder name + count "X filmów"
- Grid VideoCard (read-only — bez "⋯" menu)
- Klik VideoCard → otwiera inline `<VideoPlayer />` w modal (Dialog desktop / Sheet mobile)
- Footer CTA jak w SharedVideoView

### `src/features/sharing/components/RevokedTokenView.tsx`

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { LinkIcon } from "lucide-react";

export function RevokedTokenView() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <LinkIcon className="w-12 h-12 mx-auto text-fg-subtle mb-4" />
          <h1 className="text-2xl font-semibold">Ten link został wyłączony</h1>
          <p className="text-fg-muted mt-2">Osoba, która Ci go wysłała, cofnęła dostęp lub film został usunięty.</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/">Wróć do strony głównej</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
```

### Wire-up

- W `VideoDetailDialog` (z prompt 04): add button "Udostępnij" → otwiera `<ShareDialog targetType="video" targetId={video.id} targetName={video.title} />`
- W `LibrarySidebar` (z prompt 03): folder "⋯" menu → "Udostępnij folder" → `<ShareDialog targetType="folder" targetId={folder.id} targetName={folder.name} />`
- W `src/router.tsx`: dodaj `/s/:token` jako **public** route (no auth guard)

## Constraints (DON'T)

- ❌ NIE pozwól anon SELECT bezpośrednio z `share_tokens` table — JEDYNA ścieżka anon to `get_shared_content()` function. Brak SELECT policy dla anon.
- ❌ NIE używaj numerycznego ID lub UUID jako token — używaj 192-bit random base64 (32 chars). UUID = 122 bits + przewidywalna struktura.
- ❌ NIE używaj `Math.random()` do generowania tokenu — niesecurelnie predictable. Używaj `crypto.getRandomValues()`.
- ❌ NIE dodawaj revoke jako fizyczny DELETE — używaj soft delete (`revoked_at` timestamp). Audit + recovery.
- ❌ NIE pokazuj usera w shared view (ani name ani avatar) — zachowanie prywatności
- ❌ NIE pomijaj `SECURITY DEFINER` na `get_shared_content` — bez tego funkcja nie ma RLS-bypass, nie zwróci danych anon
- ❌ NIE używaj `SECURITY INVOKER` (default) dla funkcji — security risk: anon dostaje wszystko co properties pozwolą
- ❌ NIE używaj `set search_path = public` opcjonalnie — bez tego function jest podatna na search_path injection attack
- ❌ NIE pokazuj różnych error messages dla "revoked" vs "fake token" — uniform error → frontend pokazuje RevokedTokenView dla obu

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 07

- [ ] Migracja `0004_share_tokens.sql` aplikuje się bez błędów
- [ ] VideoDetailDialog → "Udostępnij" → ShareDialog otwiera się
- [ ] "Utwórz nowy link" → token pojawia się w liście aktywnych + URL kopiowalny + toast "Link utworzony"
- [ ] Skopiuj URL → otwórz w **incognito browser** (no auth) → SharedVideoView renderuje się z VideoPlayer + tytuł + footer CTA
- [ ] Revoke link → odśwież share view w incognito → RevokedTokenView "Ten link został wyłączony"
- [ ] Share folder → public view pokazuje grid wideos + folder name + brak edit buttons
- [ ] Otwórz `/s/fakeXYZ123` (random) → RevokedTokenView (no crash, no 500)
- [ ] **RLS test (KRYTYCZNY)** w Supabase SQL Editor jako anon role:
   - `SELECT * FROM share_tokens` → **MUSI** zwrócić "permission denied" lub 0 rows
   - `SELECT get_shared_content('<valid-token>')` → success
   - `SELECT get_shared_content('fake')` → exception `token_invalid_or_revoked`
- [ ] **Cross-user test** w Supabase Studio:
   - Impersonate user A → `SELECT * FROM share_tokens` → tylko swoje tokens
   - Impersonate user B → próbuj UPDATE z `id = <userA token id>` → reject (RLS)
- [ ] Token format check: w Supabase Studio sprawdź że tokens to 32-char ASCII (URL-safe base64), różne dla każdego call (entropy)
- [ ] DevTools: na `/s/<token>` brak XSS warnings, brak unsafe-inline errors

## Common gotchas

- **`security definer` function nie zwraca danych anon** — sprawdź `grant execute on function ... to anon` (function-level grant). Bez tego anon nie może wywołać RPC.
- **`set search_path = public` — co to robi i czemu** — bez tego attacker mógłby utworzyć obiekt `public.videos` w innym schema i podstawić; `set search_path` w function definition zamyka tę lukę
- **Lovable proponuje `select * from share_tokens where token = $1 and revoked_at is null` zamiast SECURITY DEFINER function** — odmów. Direct SELECT przez anon = wymaga RLS policy dla anon = potencjalny leak innych kolumn (user_id, target_id reveals identity).
- **Lovable proponuje JWT token zamiast random** — odmów. JWT = przewidywalna struktura, signature attacker może próbować. Random 192-bit = practically uncrackable.
- **`crypto.getRandomValues` undefined w Node (testach)** — w Node używaj `import { webcrypto } from 'crypto'; const crypto = webcrypto;`. W browser działa natywnie.
- **Token w URL widoczny w logach hostingu / proxy** — akceptowalne (krótki TTL przez revoke); ostrzegamy usera w copy "Każdy z linkiem ma dostęp"
- **Lovable proponuje analytics event na każdy share view** — OK ale ZA cookie consent (prompt 07); w MVP `last_accessed_at` w DB wystarczy
