# Review Fazy 4 — Video sources

**Data:** 2026-05-29
**Faza:** 4 (IU-8: YouTube link + Meta embed; IU-9: YouTube upload resumable)
**Reviewerzy:** 1× test-coverage agent (pełny) + security/performance/architecture inline (4 agenty hit session limit)
**Commit:** `22e3922`
**Testy przed review:** 276/276 PASS

---

## Severity gate

⛔ **WYMAGA POPRAWEK** — 1× P1 (brak testów security-critical sanitizera), 6× P2

- 🔴 [P1-blocking]: 1
- 🟠 [P2-important]: 6
- 🟡 [P3-nit]: 10
- 🔵 [suggestion]: 0
- 🌐 [E2E]: 0 passed / 0 failed / 2 skipped (Agent 5 hit session limit)

---

## Odchylenia od planu technicznego

- **IU-8:** Meta Edge Function używa `graph.facebook.com/v18.0` (Plan A potwierdzony przez operatora 2026-05-29). Fallback `oembed_unavailable` + `manual_entry` zaimplementowany gracefully. Zgodne z planem.
- **IU-9:** `UploadQueueWidget` jest komponentem prezentacyjnym — background upload wymaga podniesienia `useResumableUpload` do `UploadProvider` context (aktualnie działa tylko wewnątrz dialogu). Zalogowane w kontekście. Nie blokuje core flow.
- **IU-9:** `hasYoutubeUploadScope()` wymaga Supabase webhook/trigger ustawiającego `user_metadata.youtube_upload_granted`. Bez tego prompt zawsze widoczny. Acceptable dla MVP.

---

## [P1-blocking]

### P1-1: `src/lib/dompurify-wrapper.ts` — brak testów security-critical sanitizera

`sanitizeEmbedHtml` jest jedyną warstwą ochrony przed XSS przed `dangerouslySetInnerHTML` w `VideoPlayer.tsx:99`. Funkcja używa customowej konfiguracji DOMPurify z listą dozwolonych tagów i atrybutów. Brak testów oznacza że:
- Refaktor `PURIFY_CONFIG` może nieświadomie osłabić ochronę
- Nie ma weryfikacji że `<script>` jest blokowany przez tę konkretną konfigurację
- Nie wiadomo czy `onerror` / `javascript:` są blokowane

**Wymagane testy:**
- valid oEmbed HTML `<blockquote>...<iframe src="..."></iframe></blockquote>` → output zawiera `<iframe>` (zachowuje embed)
- `<script>alert(1)</script>` → output nie zawiera `<script>`
- `<img onerror="alert(1)" src="x">` → output nie zawiera `onerror` attr
- `<a href="javascript:alert(1)">klik</a>` → output nie zawiera `javascript:` href
- `''` (pusty string) → zwraca `''`

---

## [P2-important]

### P2-1: `src/features/library/components/VideoPlayer.tsx` — brak testów renderowania per source type

Komponent zawiera logikę warunkową dla 3 source types i 2 fallback stanów. Brak testów — żaden refaktor nie jest potwierdzony przez test suite.

**Brakujące testy:**
- `source='youtube_link'` + `sourceId='dQw4w9WgXcQ'` → renderuje `<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?...">` 
- `source='youtube_upload'` + `sourceId` → renderuje ten sam iframe pattern
- `source='youtube_link'` bez `sourceId` → renderuje "Brak ID wideo"
- `source='meta_embed'` + `embedHtml='<blockquote...'` → renderuje `dangerouslySetInnerHTML`
- `source='meta_embed'` bez `embedHtml` → renderuje "Podgląd niedostępny"

### P2-2: `src/features/library/components/VideoDetailDialog.tsx` — brak testów edit + delete flow

Komponent zarządza inline-edit tytułu + notatek (save on blur) i delete z AlertDialog. Logika biznesowa bez pokrycia.

**Brakujące testy:**
- zmiana tytułu + blur → `updateVideo` wywołane z nową wartością; toast "Zapisano"
- kliknięcie "Usuń" → AlertDialog; "Usuń" → `deleteVideo` + `onClose`
- kliknięcie "Anuluj" w AlertDialog → dialog zamknięty, `deleteVideo` nie wywołane

### P2-3: `src/features/library/components/YoutubeLinkForm.tsx` + `MetaLinkForm.tsx` — brak testów formularzy

Oba formularze mają walidację Zod i integrację z hookami mutacji. Logika submit bez pokrycia.

**Brakujące testy:**
- YoutubeLinkForm: submit nieprawidłowego URL → inline error "Nie rozpoznaję linku..."
- YoutubeLinkForm: submit poprawnego URL → `mutateAsync` wywołane; button `disabled` podczas pending
- MetaLinkForm: analogicznie

### P2-4: `src/features/library/api/videos.test.ts` — brak bezpośrednich testów `createVideoFromUpload`

Funkcja istnieje w `videos.ts:294`, jest mockowana w `useResumableUpload.test.tsx`, ale jej własna logika nie jest weryfikowana:
- INSERT z `source: 'youtube_upload'`
- budowanie `source_url` i `thumbnail_url` z `youtubeVideoId`
- brak session → rzuca `Error('Not authenticated')`
- Supabase error → rzuca

### P2-5: `supabase/functions/fetch-youtube-metadata/index.test.ts` — cache hit scenariusz z planu nie jest przetestowany

Plan IU-8 wymaga: "drugi call w 1h → cached, zero call do YT API". Cache API (`caches.open()`) nie jest dostępna w Vitest/jsdom — ale `fetchFromCache` i `saveToCache` mogłyby być testowane przez mock `caches` lub przynajmniej characterization test sprawdzający wywołanie `caches.open('yt-metadata')`.

Alternatywnie — potwierdź to ograniczenie w komentarzu w pliku testowym i dodaj wpis TODO dla testu w środowisku Deno.

### P2-6: `supabase/functions/fetch-youtube-metadata/index.test.ts` — "fake ID → 404" scenariusz pokryty tylko pośrednio

Plan wymaga weryfikacji że Edge Function zwraca HTTP 404 z `code: 'not_found'` dla pustego `items`. Test weryfikuje `isNotFound` flag na poziomie helper logiki, ale nie weryfikuje finalne mapowanie do `jsonError('not_found', ..., 404)`.

---

## [P3-nit]

### P3-1: `src/lib/dompurify-wrapper.ts:33` — `style` attr w allowliście DOMPurify

Atrybut `style` na liście `ALLOWED_ATTR` umożliwia CSS-based data exfiltration (`background-image: url(...)`) i ewentualne ataki przez przyszłe CSS features. oEmbed HTML od FB/IG typowo nie wymaga inline styles — używa klas. Rozważ usunięcie `'style'` z `ALLOWED_ATTR`.

### P3-2: `VideoPlayer.tsx:78-86` — brak `sandbox` na YT iframe

Defence-in-depth: YouTube iframe nie ma atrybutu `sandbox`. Dodanie `sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups"` ograniczyłoby możliwości embeda nawet dla zaufanego YouTube. Aktualnie dopuszczalny trade-off, ale warto rozważyć przed launchem.

### P3-3: `src/lib/youtube-resumable-upload.ts` — 307 linii (limit: 300)

Funkcja `readBlobAsArrayBuffer` (linie 190-206) mogłaby być wyekstrahowana do `src/lib/blob-utils.ts`, co zmniejszy plik do ~293 linii.

### P3-4: `youtube-resumable-upload.ts:161-165` — `as UploadFailedError & { status: number }` pattern

```ts
const err = new UploadFailedError(`Server error ${response.status}`) as UploadFailedError & { status: number };
err.status = response.status;
```

Lepiej: `class UploadServerError extends UploadFailedError { constructor(public readonly status: number) { super(...) } }`. Eliminuje `as` assertion.

### P3-5: `validate-meta-embed/index.ts:122-159` — 3× identyczny error response inline

Trzy bloki `return new Response(JSON.stringify({ error: { code: 'oembed_unavailable', ... } }), { status: 503, ... })`. Wyciągnij do `oembedUnavailableResponse(reason: string): Response` helper (analogicznie do `jsonError` z `_shared/response.ts`).

### P3-6: `useResumableUpload.ts:21` — relative import zamiast alias

```ts
import { getGoogleAccessToken, refreshGoogleAccessToken } from '../../../features/auth/api/google-identity';
```
Powinno być `@/features/auth/api/google-identity`.

### P3-7: `useIsMobile` zdefiniowany w 2 miejscach

`AddVideoDialog.tsx:84-98` i `VideoDetailDialog.tsx:54-67` definiują identyczny hook. Wyciągnij do `src/hooks/useIsMobile.ts`. Przy zamontowaniu obu komponentów jednocześnie → 2× MediaQueryList listener na ten sam media query.

### P3-8: `url-parsers.test.ts` — brak testu `parseMetaUrl` dla private FB post → null

`https://www.facebook.com/permalink.php?story_fbid=...` to popularny format linka do prywatnego posta FB. Parser powinien zwrócić `null` dla nierozpoznanych formatów — test potwierdziłby to zachowanie.

### P3-9: `youtube-resumable-upload.test.ts` — brak testu `file.size === 0`

Plik 0-bajtowy może powodować `Content-Range: bytes 0--1/0` (dzielenie przez 0 w obliczeniach). Test: `new File([], 'empty.mp4')` → rzuca `UploadFailedError` z opisowym komunikatem.

### P3-10: `videos.ts:163-174` + `youtube-resumable-upload.ts:123` — JSON cast bez Zod

`(await response.json()) as YouTubeMetadataResponse` i `(await response.json()) as { id?: string }` — jeśli API zmieni kształt odpowiedzi, silent runtime breakage. Rozważ Zod schemas dla API boundaries jako follow-up.

---

## Pozytywne obserwacje

- **Security:** `sanitizeEmbedHtml` JEST wywoływane przed każdym `dangerouslySetInnerHTML`. Nie ma przypadku gdzie embed HTML idzie bezpośrednio do DOM.
- **Security:** Oba Edge Functions (`fetch-youtube-metadata`, `validate-meta-embed`) weryfikują JWT przez `supabase.auth.getUser()`. API keys nie wyciekają do frontendu.
- **Security:** `user_id` w INSERT jest zawsze brany z `session.user.id` (nie z inputu użytkownika). RLS podwójnie egzekwuje.
- **Security:** `parseYoutubeUrl` i `parseMetaUrl` zwracają tylko zwalidowane ID — nie ma raw URL injection.
- **Architecture:** `useResumableUpload` używa poprawnie discriminated union dla stanu upload.
- **Architecture:** URL parsery skompilowane bez regex per-call — `new URL()` i `Set` na module level.
- **Performance:** DOMPurify jest w lazy library chunk (`index-D_zsWq8o.js`), NIE w eager bundle (`index-Cm8KkmxN.js`). Eager bundle: 127.67 KB gzip — bez zmian od Fazy 2.
- **Performance:** FB SDK loader jest genuinely lazy (tylko gdy `meta_embed` source).
- **Test coverage:** Wszystkie 10 scenariuszy protokołu resumable upload (308, 5xx, 401, abort) są pokryte.
- **Test coverage:** URL parsery pokryte 25 testami z wariantami edge-case.

---

## Bookkeeping checkboxów Weryfikacja:

- Odznaczone automatycznie (CLI): 4 (typecheck, lint, test, youtube-resumable-upload test, useResumableUpload test)
- Odznaczone na podstawie Agent 5 E2E: 0 (agent hit session limit)
- Pozostawione dla operatora (Docker/Manual): 4
- Niejasne (P3): 0
- Failujące (P2): 0

### Szczegóły

**IU-8:**
- [x] CLI: `bun run typecheck + bun run lint + bun run test` → PASS (276/276 2026-05-29)
- [ ] Docker: `supabase functions serve fetch-youtube-metadata` — SKIP (Docker niedostępny)
- [ ] Docker: `supabase functions serve validate-meta-embed` — SKIP (Docker niedostępny)
- [ ] E2E: add YT link + Meta link + detail dialog + delete — SKIP (Agent 5 session limit; odłożone do sesji z żywą DB)

**IU-9:**
- [x] CLI: `bun run typecheck` → PASS
- [x] CLI: `bun run test src/lib/youtube-resumable-upload` → PASS (9/9)
- [x] CLI: `bun run test src/features/library/hooks/useResumableUpload` → PASS (6/6)
- [ ] E2E: scope upgrade prompt dla usera bez scope — SKIP (Agent 5 session limit; odłożone do sesji z aktywną DB)
