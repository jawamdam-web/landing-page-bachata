# 03 — Library (schema + dashboard + foldery CRUD + m:n)

**Z planu:** IU-6 + IU-7
**Wymaga:** `01-auth` (protected route)
**Output:** Schema videos/folders/m:n + dashboard z empty state + folder CRUD + filter

---

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Implementuję bibliotekę filmów: schema DB + dashboard `/library` + foldery CRUD + przypisywanie filmów do wielu folderów (m:n) + filtrowanie po folderze. **Bez sources jeszcze** — to dostarczy prompt 04+. W tym prompt: empty state + skeleton + management.

### Supabase migracja `0003_videos_folders.sql`

```sql
-- 0003_videos_folders.sql

-- VIDEOS
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('youtube_link', 'youtube_upload', 'meta_embed')),
  source_url text not null,
  source_id text not null,
  title text not null,
  notes text,
  thumbnail_url text,
  embed_html text,
  duration_seconds integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index videos_unique_per_user on public.videos (user_id, source, source_id);
create index videos_user_created on public.videos (user_id, created_at desc);

alter table public.videos enable row level security;

create policy "videos_select_own" on public.videos
  for select using (user_id = auth.uid());
create policy "videos_insert_own" on public.videos
  for insert with check (user_id = auth.uid());
create policy "videos_update_own" on public.videos
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "videos_delete_own" on public.videos
  for delete using (user_id = auth.uid());

create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- FOLDERS
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index folders_unique_name_per_user on public.folders (user_id, lower(name));

alter table public.folders enable row level security;

create policy "folders_select_own" on public.folders
  for select using (user_id = auth.uid());
create policy "folders_insert_own" on public.folders
  for insert with check (user_id = auth.uid());
create policy "folders_update_own" on public.folders
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "folders_delete_own" on public.folders
  for delete using (user_id = auth.uid());

create trigger folders_set_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

-- M:N — video_folders
create table public.video_folders (
  video_id uuid not null references public.videos(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  added_at timestamptz default now() not null,
  primary key (video_id, folder_id)
);

create index video_folders_by_folder on public.video_folders (folder_id, video_id);

alter table public.video_folders enable row level security;

create policy "video_folders_select_own" on public.video_folders
  for select using (
    video_id in (select id from public.videos where user_id = auth.uid())
  );
create policy "video_folders_insert_own" on public.video_folders
  for insert with check (
    video_id in (select id from public.videos where user_id = auth.uid())
    and folder_id in (select id from public.folders where user_id = auth.uid())
  );
create policy "video_folders_delete_own" on public.video_folders
  for delete using (
    video_id in (select id from public.videos where user_id = auth.uid())
  );
```

Po wykonaniu migracji: regen types przez Supabase integration (lub `npx supabase gen types`).

### Pliki — struktura

**`src/features/library/types.ts`** — re-export DB types z aliasami:
```ts
import type { Database } from "@/lib/database.types";

export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];
export type Folder = Database["public"]["Tables"]["folders"]["Row"];
export type FolderInsert = Database["public"]["Tables"]["folders"]["Insert"];
export type VideoSource = Video["source"]; // 'youtube_link' | 'youtube_upload' | 'meta_embed'
```

**`src/features/library/api/videos.ts`**:
```ts
import { supabase } from "@/lib/supabase";
import type { Video } from "../types";

export async function getVideos(folderId?: string): Promise<Video[]> {
  if (folderId) {
    const { data, error } = await supabase
      .from("video_folders")
      .select("video:videos(*)")
      .eq("folder_id", folderId)
      .order("added_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => r.video).filter(Boolean) as Video[];
  }
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getVideoById(id: string): Promise<Video | null> {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
}

export async function updateVideoMeta(id: string, patch: { title?: string; notes?: string | null }): Promise<void> {
  const { error } = await supabase.from("videos").update(patch).eq("id", id);
  if (error) throw error;
}
```

**`src/features/library/api/folders.ts`**:
```ts
import { supabase } from "@/lib/supabase";
import type { Folder } from "../types";

export async function getFolders(): Promise<Folder[]> {
  const { data, error } = await supabase.from("folders").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createFolder(name: string): Promise<Folder> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("folders")
    .insert({ name: name.trim(), user_id: user.user.id })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Folder o tej nazwie już istnieje");
    throw error;
  }
  return data;
}

export async function updateFolder(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("folders").update({ name: name.trim() }).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("Folder o tej nazwie już istnieje");
    throw error;
  }
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function getFolderIdsForVideo(videoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("video_folders")
    .select("folder_id")
    .eq("video_id", videoId);
  if (error) throw error;
  return (data ?? []).map((r) => r.folder_id);
}

export async function assignVideoToFolders(videoId: string, folderIds: string[]): Promise<void> {
  const current = await getFolderIdsForVideo(videoId);
  const toAdd = folderIds.filter((id) => !current.includes(id));
  const toRemove = current.filter((id) => !folderIds.includes(id));

  if (toAdd.length) {
    const { error } = await supabase
      .from("video_folders")
      .insert(toAdd.map((folder_id) => ({ video_id: videoId, folder_id })));
    if (error) throw error;
  }
  if (toRemove.length) {
    const { error } = await supabase
      .from("video_folders")
      .delete()
      .eq("video_id", videoId)
      .in("folder_id", toRemove);
    if (error) throw error;
  }
}
```

**`src/features/library/hooks/useVideos.ts`** — React Query:
```ts
import { useQuery } from "@tanstack/react-query";
import { getVideos } from "../api/videos";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useVideos(folderId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["videos", user?.id, { folderId: folderId ?? null }],
    queryFn: () => getVideos(folderId),
    enabled: !!user,
    staleTime: 60_000,
  });
}
```

**`src/features/library/hooks/useFolders.ts`**:
```ts
import { useQuery } from "@tanstack/react-query";
import { getFolders } from "../api/folders";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useFolders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["folders", user?.id],
    queryFn: getFolders,
    enabled: !!user,
    staleTime: 60_000,
  });
}
```

**`src/features/library/hooks/useFolderMutations.ts`** — z optimistic updates dla assignment:
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as folders from "../api/folders";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function useCreateFolder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: folders.createFolder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders", user?.id] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: folders.deleteFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders", user?.id] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useAssignVideoToFolders() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ videoId, folderIds }: { videoId: string; folderIds: string[] }) =>
      folders.assignVideoToFolders(videoId, folderIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos", user?.id] });
    },
  });
}
```

### `src/components/layout/DashboardLayout.tsx`

```
[DashboardHeader sticky top]
[Grid >=lg: sidebar 240px + main; <lg: main only]
  [LibrarySidebar — desktop only]
  [main]
    {children}
[Mobile FAB: "Dodaj film" → AddVideoDialog (z prompt 04)]
```

### `src/pages/library/index.tsx`

```tsx
export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get("folder") ?? undefined;
  const { data: videos, isLoading } = useVideos(folderId);
  const { data: folders } = useFolders();
  const currentFolder = folders?.find((f) => f.id === folderId);

  return (
    <DashboardLayout>
      <MetaTags title="Moja biblioteka — Bachata Napoli" description="Twoje filmy z zajęć bachaty" />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">{currentFolder?.name ?? "Wszystkie filmy"}</h1>
        {currentFolder && (
          <p className="text-fg-muted mt-1">{videos?.length ?? 0} filmów w folderze</p>
        )}
      </header>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      ) : videos && videos.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <VideoGrid videos={videos ?? []} />
      )}
    </DashboardLayout>
  );
}
```

### `src/features/library/components/`

**`VideoGrid.tsx`** — 1/2/3 cols responsive grid, mapped to `VideoCard`.

**`VideoCard.tsx`** (skeleton — pełna impl w prompt 04):
- `border border-border bg-bg-subtle rounded-lg overflow-hidden`
- Thumbnail 16:9 (placeholder gradient cream-terracotta dopóki source nie zwróci)
- Padding: title (line-clamp-2), meta row (source icon + duration tabular + date "2 dni temu")
- Hover: `border-border-strong translate-y-[-2px]`
- Click → otwiera VideoDetailDialog (z prompt 04)
- "⋯" menu trigger w prawym górnym rogu thumbnail → DropdownMenu: "Zarządzaj folderami", "Udostępnij" (prompt 06), "Usuń"

**`VideoCardSkeleton.tsx`** — animate-pulse placeholder.

**`EmptyLibrary.tsx`**:
```
[Lucide VideoOff icon xl muted, centered]
<h2 centered> Twoja biblioteka czeka na pierwszy film </h2>
<p centered muted> Wklej link, dodaj embed lub wgraj plik z telefonu — wszystko trafi tu, uporządkowane. </p>
[Button primary "Dodaj film"] → otwiera AddVideoDialog (z prompt 04; w tym IU = placeholder z toast "Funkcjonalność wkrótce")
```

**`LibrarySidebar.tsx`** (desktop >=lg):
```
<aside className="w-60 border-r border-border p-4 sticky top-[<header height>]">
  [Button "Wszystkie filmy"] (active jeśli brak ?folder param) → Link to /library
  [Divider]
  [Heading meta] FOLDERY [+ button przy nazwie] → CreateFolderDialog trigger
  [FolderList — lista folderów z aktywnym indicator]
</aside>
```

**`FolderList.tsx`** — każdy item:
- Link do `/library?folder=<id>` z `name` + count badge
- Active state (gdy URL match): `bg-bg-muted text-accent-soft-foreground border-l-2 border-accent`
- Hover: `bg-bg-subtle`
- "⋯" dropdown: "Zmień nazwę" (EditFolderDialog), "Usuń" (DeleteFolderConfirm)

**`CreateFolderDialog.tsx`** — Dialog (desktop) / Sheet (mobile bottom):
- RHF + Zod schema: `z.object({ name: z.string().min(1, "Podaj nazwę").max(100, "Max 100 znaków") })`
- Input "Nazwa folderu" + button "Utwórz" + button "Anuluj"
- onSubmit: `useCreateFolder.mutateAsync(name)` → toast "Folder utworzony" / error toast z message z thrown Error

**`EditFolderDialog.tsx`** — analogicznie, prefilled name.

**`DeleteFolderConfirm.tsx`** — AlertDialog:
- Title: "Usunąć folder?"
- Description: "Filmy w środku zostają w bibliotece, tylko folder zniknie."
- "Usuń" (destructive variant) + "Anuluj"
- onConfirm: `useDeleteFolder.mutateAsync(id)` → toast "Folder usunięty"

**`FolderPickerPopover.tsx`** (desktop) / **`FolderPickerSheet.tsx`** (mobile):
- Triggered z VideoCard "⋯" → "Zarządzaj folderami"
- Wnętrze:
  - shadcn `<Command>` z search input
  - Lista folderów z checkboxami (controlled state)
  - "+ Nowy folder" inline action → CreateFolderDialog
  - "Zapisz" → `useAssignVideoToFolders.mutateAsync({ videoId, folderIds: selected })` → toast "Zapisano"
  - "Anuluj"

### Mobile folder navigation (LibrarySidebar nie pokazywane <lg)

- Sticky pill chips bar pod headerem (horizontal scroll): "Wszystkie", [folder names...], "+ Nowy"
- Active chip: terracotta border
- Klik chip → router push z `?folder=<id>`

### Wizualne refs do DESIGN.md

- Card: hairline border, **bez shadow** (flat editorial — DESIGN.md sekcja 7)
- Folder active indicator: 2px left border accent (DESIGN.md sekcja 10 navigation)
- Tap targets mobile ≥ 44px (folder rows mobile = h-12)
- Tabular nums w meta row (`font-variant-numeric: tabular-nums` lub `font-feature-settings: 'tnum'`)
- Relative date PL: "przed chwilą", "5 min temu", "wczoraj", "2 dni temu", potem pełna data — użyj `date-fns` z `pl` locale lub własny helper

## Constraints (DON'T)

- ❌ NIE pozwól na video INSERT bez `user_id = auth.uid()` — RLS to wyłapie, ale weryfikuj że Supabase Studio test (impersonate user A → INSERT z `user_id = userB.id` → reject)
- ❌ NIE używaj `select('*')` bez potrzeby na hot paths — explicit columns dla performance
- ❌ NIE renderuj listy folderów jako `<div>` mapy — używaj semantic `<nav>` + `<ul>` + `<li>`
- ❌ NIE pomijaj `aria-label` na "⋯" icon buttons — WCAG
- ❌ NIE używaj `confirm()` dla destructive — AlertDialog shadcn
- ❌ NIE optymistycznie usuwaj folder PRZED confirm dialog — opt-update po confirm
- ❌ NIE rób folder picker jako select dropdown — multi-select potrzebuje checkbox list (lub MultiCombobox)
- ❌ NIE dodawaj predefiniowanych tagów ("początkujący", "śednio-zaawansowany") — brainstorm explicite mówi że tylko własne foldery usera w MVP

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 04

- [ ] Fresh user (post-signup, no data) → `/library` → renderuje DashboardHeader + EmptyLibrary z CTA "Dodaj film"
- [ ] Mobile (<lg): brak sidebar, jest FAB + folder chips bar
- [ ] Desktop: LibrarySidebar widoczna lewa kolumna
- [ ] Klik "+ Nowy folder" → dialog → wpisz "Andrzejewscy zajęcia" → submit → folder w sidebar + toast success
- [ ] Próba duplikatu nazwy → form error inline (nie crash): "Folder o tej nazwie już istnieje"
- [ ] Klik folder w sidebar → URL `?folder=<uuid>` → header pokazuje folder name + count, grid pokazuje tylko z folderu
- [ ] Klik "Wszystkie filmy" → URL bez `?folder`
- [ ] "⋯" na folderze → "Zmień nazwę" → EditDialog → save → toast
- [ ] "⋯" na folderze → "Usuń folder" → AlertDialog → confirm → folder znika
- [ ] (po dodaniu 1 wideo manualnie via Supabase Studio) Klik VideoCard "⋯" → "Zarządzaj folderami" → checkbox 2 foldery → Zapisz → film w obu folderach po filtrowaniu
- [ ] **RLS test:** Supabase Studio impersonate user A → SELECT videos → 0 rows; INSERT z `user_id = userB.id` → reject
- [ ] axe scan na `/library` → 0 violations
- [ ] DevTools console: zero warnings/errors

## Common gotchas

- **`23505` Postgres error code dla unique constraint violations** — używaj tego do mapowania na user-friendly message
- **Supabase RLS przepuszcza INSERT mimo policy** — sprawdź czy `WITH CHECK` clause jest w INSERT policy (nie tylko `USING`)
- **Optimistic update flickerze** — `onMutate` snapshot + `onError` rollback + `onSettled` invalidate (standard React Query pattern)
- **Lovable proponuje tagging system zamiast folderów** — odmów, R12/R13 mówi folders z m:n, nie tags
- **Lovable proponuje shadcn Combobox dla folder picker** — Combobox = single-select. Potrzebujemy multi-select (checkbox list). Użyj shadcn `Command` z checkboxami w items.
- **Mobile sticky chips bar zasłania content** — dodaj `pt-[chip-bar-height]` do main lub użyj `IntersectionObserver` żeby fade out chips na scroll down
