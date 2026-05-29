# Review Fazy 3 — Library core (IU-6 + IU-7)

**Data:** 2026-05-29
**Agenci:** security-sentinel, performance-oracle, architecture-strategist, test-coverage, feature-tester-e2e
**Pliki przejrzane:** 38 (commit `adc3443`)
**Testy:** 142/142 PASS przed review

---

## Severity gate

**⛔ WYMAGA POPRAWEK — 1× P1, 16× P2, 6× P3**

Jeden krytyczny bug renderowania (double LibrarySidebar) + szereg ważnych problemów bezpieczeństwa, type safety i testów.

---

## P1 — Blocking (1)

### 🔴 [P1-blocking] `src/pages/library/index.tsx:93,105` — LibrarySidebar podwójnie instancjonowany

`LibrarySidebar` jest renderowany dwukrotnie w `LibraryContent`. Każda instancja zawiera wewnętrznie zarówno `DesktopSidebar` jak i `MobileFolderSheet`. Skutek:
- **4 elementy w DOM**: 2× `DesktopSidebar` (oba z `lg:block` → oba widoczne na >=lg) + 2× `MobileFolderSheet`
- **Split-brain state**: dwa niezależne `createOpen` state dla `CreateFolderDialog` — klik "+ Nowy folder" na jednym nie otwiera drugiego
- **Duplikacja subscriptions**: `useFolders()`, `useCreateFolder` itp. mount'owane dwukrotnie

Naprawa: usuń pierwszą instancję `<LibrarySidebar>` z wiersza ~93 (header row). `LibrarySidebar` już zawiera oba warianty wewnętrznie — powinien być renderowany dokładnie raz w bloku flex.

---

## P2 — Important (16)

### Security (4)

🟠 [P2-security] **`supabase/migrations/0003_videos_folders.sql:154-158`** — video_folders INSERT/DELETE policy nie weryfikuje `folder_id` ownership

Policy sprawdza wyłącznie `video_id IN (SELECT ... WHERE user_id = auth.uid())`, ale nie weryfikuje czy `folder_id` należy do tego samego usera. User A może INSERT do `video_folders` z własnym `video_id` i cudzym `folder_id`. Naprawa: dodaj `AND folder_id IN (SELECT id FROM public.folders WHERE user_id = (SELECT auth.uid()))` do WITH CHECK obu policies (INSERT + DELETE).

🟠 [P2-security] **`src/pages/library/index.tsx:54`** — `?folder=` param bez walidacji UUID formatu

`searchParams.get('folder')` przekazywane bezpośrednio do query bez walidacji. Dodaj UUID regex check przed użyciem: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`. Niepoprawna wartość → traktuj jak `undefined` (brak folderu).

🟠 [P2-security] **`src/pages/library/index.tsx:125`** — raw `error.message` z PostgREST wyświetlany w UI

`{error.message}` renderowany bezpośrednio w `<p>`. Wiadomości PostgREST mogą zawierać nazwy tabel/kolumn/constraintów — information disclosure. Zastąp generycznym komunikatem (np. "Błąd ładowania").

🟠 [P2-security] **`src/features/library/api/folders.ts:43`** — zbędny `getUser()` + jawny `user_id` w INSERT zamiast RLS

`createFolder` wywołuje `supabase.auth.getUser()` i ręcznie przekazuje `user_id` do INSERT. `updateFolder`/`deleteFolder` słusznie polegają wyłącznie na RLS. Niespójny wzorzec + dodatkowy network round-trip do Auth serwera. Usuń `getUser()`, pozwól RLS (`with check`) egzekwować `user_id = auth.uid()`.

---

### Architecture & Type Safety (6)

🟠 [P2-arch] **`src/components/layout/DashboardLayout.tsx:18`** — `QueryClient` tworzony na poziomie modułu (module-scope singleton)

`const queryClient = new QueryClient(...)` poza komponentem → ten sam instance przy HMR, test leakage między testami, anti-pattern dla SSR. Poprawny wzorzec: `const [queryClient] = useState(() => new QueryClient(...))` wewnątrz ciała komponentu.

🟠 [P2-arch] **`src/features/library/api/videos.ts:41`** — `as Video[]` cast na JOIN query ukrywa embedded `video_folders` property

Zapytanie z `!inner` JOIN zwraca `Video & { video_folders: { folder_id: string }[] }[]`, nie `Video[]`. Cast `as Video[]` ukrywa embedded property — obiekty mają ją w runtime. Naprawa: `.map(({ video_folders: _vf, ...video }) => video)` lub `select(...)` bez JOIN artefaktu.

🟠 [P2-arch] **`src/components/layout/DashboardHeader.tsx:43-44`** — unsafe `as string | undefined` na `user_metadata`

`user?.user_metadata?.full_name as string | undefined` — `user_metadata` to `Record<string, unknown>`. Cast pomija nullability. Naprawa: `typeof val === 'string' ? val : undefined`.

🟠 [P2-arch] **`src/features/library/api/folders.ts:17` + `useFolderMutations.ts:29`** — 23505 wykrywane przez `error.message.includes('23505')` zamiast `.code`

`PostgrestError` ma dedykowane pole `.code` ze stable PG error code `'23505'`. String-match na `message` to niestabilny undocumented internal detail. Naprawa: `error.code === '23505'` (dostępne w `PostgrestError` z `@supabase/postgrest-js`).

🟠 [P2-arch] **`FolderPickerSheet.tsx:43` + `FolderPickerPopover.tsx:47`** — stale `useState(currentFolderIds)` bez sync przy ponownym otwarciu

`useState<string[]>(currentFolderIds)` inicjalizuje tylko przy pierwszym mount. Jeśli `currentFolderIds` zmieni się zewnętrznie (inwalidacja cache) między dwoma otwarciami pickera — wyświetla stary stan. Naprawa: `useEffect(() => { if (open) setSelected(currentFolderIds); }, [open, currentFolderIds])`.

🟠 [P2-arch] **`DeleteFolderConfirm.tsx:34` + `FolderPickerSheet.tsx:63` + `FolderPickerPopover.tsx:67`** — unguarded `mutateAsync` bez try/catch

Async handlery (`handleDelete`, `handleSave`) bez try/catch. Odrzucony `mutateAsync` → `onOpenChange(false)` nie wywoła się, dialog/sheet zostaje otwarty w stanie disabled. `onError` w hooku wyświetla toast, ale komponent nie zamyka się. Naprawa: try/catch z finally dla `onOpenChange(false)`.

---

### Performance (4)

🟠 [P2-perf] **`src/features/library/components/VideoCard.tsx:115`** — `useFolders()` wewnątrz każdego VideoCard = N subscriptions

Przy gridzie 30 filmów: 30 wywołań `useFolders()` = 30 oddzielnych subscriptions do cache `['folders', userId]`. Każda inwalidacja (create/update/delete folder) triggeruje re-render wszystkich 30 kart. `folders` powinny być fetchowane raz na poziomie `VideoGrid` i przekazywane jako prop.

🟠 [P2-perf] **`src/features/library/api/folders.ts:125`** — zbędny `getVideoFolderIds` round-trip wewnątrz `assignVideoToFolders`

Mutacja zawsze fetuje aktualne powiązania z bazy, mimo że caller (FolderPickerSheet/Popover) zna `currentFolderIds` ze stanu lokalnego. Naprawa: `assignVideoToFolders(videoId, targetFolderIds, currentFolderIds?)` — pomiń fetch jeśli `currentFolderIds` podane.

🟠 [P2-perf] **`src/features/library/hooks/useFolderMutations.ts:156`** — `useAssignVideoToFolders` nie invaliduje folderów usuniętych z przypisania

`onSuccess` invaliduje cache dla `targetFolderIds`, ale pominięte foldery (usunięte z przypisania) nie są invalidowane. Film widoczny w folderze przez `staleTime: 60s` po jego usunięciu. Naprawa: invaliduj unię `targetFolderIds ∪ previousFolderIds`, lub `invalidateQueries(['videos', userId])` z `exact: false`.

🟠 [P2-perf] **`src/features/library/api/videos.ts:46`** — `select('*')` pobiera `embed_html` + `notes` niepotrzebnie dla list view

`embed_html` (surowy HTML embeda) + `notes` (tekst usera) pobierane dla każdego video w gridzie, choć potrzebne dopiero w detail dialog (IU-8). Naprawa: `.select('id, user_id, source, source_url, source_id, title, thumbnail_url, duration_seconds, created_at, updated_at')`.

---

### Testy (2)

🟠 [P2-tests] **Brak test files dla 6 komponentów IU-7 + hooka useFolders**

Komponenty bez żadnych testów: `FolderList`, `CreateFolderDialog`, `EditFolderDialog`, `DeleteFolderConfirm`, `FolderPickerSheet`, `FolderPickerPopover`. Hook `useFolders` bez testu (analogiczny do `useVideos.test.tsx`). Każdy z tych komponentów zawiera niebanalną logikę (walidacja, inline errors, uncommitted state, reset). §2 coding-rules: każda nowa funkcja publiczna = min. 1 happy path + 1 error case.

🟠 [P2-tests] **`src/features/library/api/folders.test.ts`** — brak testów dla `removeVideoFromFolder` + `useAssignVideoToFolders folderIds: []`

`removeVideoFromFolder` (eksportowana z folders.ts) nie ma żadnego testu. `useAssignVideoToFolders` z `folderIds: []` (usuń ze wszystkich folderów) jest krytycznym use case niepokrytym testami.

---

## P3 — Nit (6)

🟡 [P3-nit] **`src/features/library/api/videos.ts` + `folders.ts`** — `throwIfError` zduplikowany w obu plikach. Wyciągnij do `src/features/library/api/utils.ts` (§3 coding-rules: shared logic → dedykowany moduł).

🟡 [P3-nit] **`src/features/library/components/VideoCard.tsx:98`** — `new Intl.DateTimeFormat('pl-PL', ...)` tworzony przy każdym wywołaniu `relativeDate()`. Wynieś na poziom modułu jako const (jeden expensive constructor na load, nie N przy gridzie).

🟡 [P3-nit] **`src/features/library/hooks/useFolderMutations.ts:82,120`** — hardcoded `['folders', userId]` literal w `setQueryData` rollback zamiast `queryKey` z closure `onMutate`. Jeśli kształt klucza zmieni się, rollback będzie pisał do złego klucza.

🟡 [P3-nit] **`src/features/library/components/VideoCard.tsx`** — `currentFolderIds` zawsze `[]` domyślnie (VideoGrid nie przekazuje). Picker otwiera się z zawsze pustymi checkboxami nawet gdy film jest w folderach. Powiązane z P2-perf (lift useFolders do VideoGrid).

🟡 [P3-nit] **`src/features/library/hooks/useFolderMutations.ts`** — `useUpdateFolder` i `useDeleteFolder` bez `onSettled: () => invalidateQueries(...)`. Po sukcesie `onSuccess` invaliduje, ale jeśli serwer zwróci inne dane niż optimistic update → cache niespójny do następnego staleTime. Dodaj `onSettled`.

🟡 [P3-nit] **`src/features/library/components/VideoCard.tsx:157-158`** — `<div>` z `onClick`/`onKeyDown` stopPropagation bez `role` attribute. Screen readery nie traktują `<div>` jako interaktywny element.

---

## Odchylenia od planu

Żadne zmiany nie wykraczają poza zadeklarowany scope IU-6/IU-7. Wykryte problemy to implementacyjne błędy i braki w nowo dodanym kodzie.

---

## E2E Verification (Agent 5)

| Scenariusz | Wynik |
|---|---|
| `/library` bez sesji → redirect `/login?next=%2Flibrary` | ✅ PASS |
| Mobile (<lg): sidebar ukryty, folder trigger widoczny | ✅ PASS (code inspection + 375px viewport) |
| Desktop: sidebar 240px lewa kolumna | ✅ PASS (code inspection `w-60 lg:block`) |
| `supabase db reset` migracja `0003` | ⏭️ SKIP — Docker niedostępny |
| E2E — CRUD folderów + assignment + filter | ⏭️ SKIP — wymaga aktywnej sesji DB |

Screenshoty: `/tmp/bachata-e2e-faza3/`

---

## Bookkeeping checkboxów Weryfikacja:

- Odznaczone automatycznie (CLI/grep): 0 (wszystkie CLI były już `[x]` po execute)
- Odznaczone na podstawie Agent 5 E2E: 1 (`/library` DashboardLayout + auth guard)
- Pozostawione dla operatora (Manual/Docker): 2
- Niejasne (P3): 0
- Failujące (P2): 0

### Szczegóły
- [x] E2E: `/library` renderuje DashboardLayout + auth guard działa → PASS (Agent 5)
- [ ] Manual: `supabase db reset` aplikuje migrację `0003` → wymaga operatora (Docker)
- [ ] Manual: E2E CRUD folderów + assignment + filter → wymaga operatora (aktywna sesja DB)

---

## Podsumowanie

**Krytyczne (P1):** Jeden realny bug renderowania — `LibrarySidebar` renderowany dwukrotnie w page layout, co powoduje duplikację UI i split-brain state dialogów. Wymaga naprawy przed kontynuacją.

**Ważne (P2):** Security: brakująca weryfikacja `folder_id` w RLS video_folders + information disclosure przez raw error.message. Type safety: trzy unsafe casts + fragile 23505 detection. Performance: useFolders w każdej karcie (N subscriptions). Testy: 6 komponentów + 1 hook bez pokrycia.

**Pozytywne:** Architektura warstwowa czysta (Page→Hook→API→Supabase), zero `any` w całym kodzie, optymistyczne updates z rollback poprawnie zaimplementowane, RLS na wszystkich tabelach, Zod validation na formularzach.
