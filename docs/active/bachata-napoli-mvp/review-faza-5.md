# Code Review — Faza 5 (IU-10 + IU-11 + IU-12)

**Data:** 2026-05-30
**Branch:** `feature/bachata-napoli-mvp`
**Commits:** f2b1005, cd267d6, e5390fd
**Agenty:** Security · Performance · Architecture+TS · TestCoverage · E2E Browser

---

## Severity Gate

⚠️ **KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× P1 (blocking), 11× P2 (important), 14× P3 (nit/optional).
Pełne wyniki poniżej. Faza 5 gotowa do kontynuacji po naprawie P2.

---

## P1 — Blocking

**Brak.**

---

## P2 — Important

### Security

**P2-1** 🟠 `supabase/migrations/0005_share_tokens.sql:59–72` — `row_to_json(v)` i `row_to_json(f)` leakują `user_id` właściciela w publicznej odpowiedzi anon
`get_shared_content` zwraca pełny wiersz `videos` i `folders` łącznie z `user_id` UUID. Każdy user z linkiem otrzymuje UUID konta właściciela. Narusza minimum privilege i prywatność (enumeration).
Rekomendacja: zamień `row_to_json(v)` na `jsonb_build_object('id', v.id, 'title', v.title, 'source', v.source, 'source_id', v.source_id, 'notes', v.notes, 'thumbnail_url', v.thumbnail_url, 'embed_html', v.embed_html, 'duration_seconds', v.duration_seconds, 'created_at', v.created_at)` — analogicznie dla folderu.

**P2-2** 🟠 `supabase/functions/validate-meta-embed/index.ts:106–118` — brak walidacji domeny `mediaUrl` przed przekazaniem do Meta API
Dowolny string jako `url` param do `graph.facebook.com/oembed?url=<mediaUrl>`. Rekomendacja: waliduj że `mediaUrl` startsWith `https://www.facebook.com/` lub `https://www.instagram.com/` przed wywołaniem Meta API. Jeden blok `if` + `jsonError(400)`.

**P2-3** 🟠 `supabase/functions/validate-meta-embed/index.ts:148–155` — HTTP status Meta API wycieka do klienta
`message: \`Meta oEmbed returned ${metaResponse.status}\`` — ujawnia konfigurację integracji (401/403 = zły klucz/wygasły). Rekomendacja: zamień na stały string `'Meta oEmbed API unavailable'`.

### Architecture / Type Safety

**P2-4** 🟠 `src/pages/s/[token].tsx:45–54` — martwy kod `abortRef` — `controller.signal` nigdy nieprzekazany do `fetchSharedContent`
`AbortController` tworzony i przypisywany do `abortRef`, ale `.signal` nie jest przekazywany do RPC. `cancelled` flag skutecznie chroni `setState` — `abortRef` to dead code. Rekomendacja: usuń `abortRef`, `useRef` import (jeśli nieużywany), i samo `abortRef.current = controller`. Zostaw `cancelled` flag jako jedyną ochronę.

**P2-5** 🟠 `src/features/sharing/components/ShareDialog.tsx:47–61` — `useIsMobile` zduplikowany po raz trzeci (AddVideoDialog + VideoDetailDialog + ShareDialog)
Były P3 po Fazie 4, ale Faza 5 dodała trzecią kopię. 3 identyczne definicje (21 linii każda) = 63 linie duplikacji + 3 osobne MediaQueryList listenery. Rekomendacja: wyciągnij do `src/hooks/useIsMobile.ts`.

**P2-6** 🟠 `src/features/sharing/api/shareTokens.ts:173` — `as SharedContent` cast bez runtime type guard na granicy systemu
Supabase RPC zwraca `Json` (rekursiwynych union). Cast `data as SharedContent` pomija weryfikację runtime — regresja w strukturze JSON z migracji byłaby niewidoczna dla TypeScripta. Rekomendacja: dodaj minimalny type guard:
```typescript
function isSharedContent(v: unknown): v is SharedContent {
  if (typeof v !== 'object' || v === null) return false;
  const t = (v as Record<string, unknown>).type;
  return t === 'video' || t === 'folder';
}
```
Zamień `return data as SharedContent` na `if (!isSharedContent(data)) throw new Error('token_invalid_or_revoked'); return data;`.

**P2-7** 🟠 `src/vite-env.d.ts` — `VITE_SENTRY_DSN` i `VITE_PLAUSIBLE_DOMAIN` niezadeklarowane w `ImportMetaEnv`
Używane w `sentry.ts:19` i `analytics.ts:38` przez ręczne casy `as string | undefined`. Rekomendacja: dodaj do `ImportMetaEnv`:
```typescript
readonly VITE_SENTRY_DSN?: string;
readonly VITE_PLAUSIBLE_DOMAIN?: string;
```

**P2-8** 🟠 `src/lib/analytics.ts` — `initAnalytics()` eksportowana ale **nigdy nie wywoływana** — Plausible nie działa
`useCookieConsent.acceptAll()` nie wywołuje `initAnalytics()`. Skrypt Plausible nigdy nie jest wstrzykiwany do DOM po udzieleniu zgody. Analytics jest broken w obecnym stanie. Rekomendacja: w `CookieConsentBanner` po wywołaniu `acceptAll()` dodaj `initAnalytics()`. Lub — prościej — sprawdź consent w `useEffect` `CookieConsentBanner` i wywołaj `initAnalytics()` gdy `analytics === true`.

**P2-9** 🟠 `src/features/sharing/components/ShareLinkRow.tsx:44` — `setTimeout` bez cleanup (§13 violation)
`setTimeout(() => setCopied(false), 2000)` bez `clearTimeout` w cleanup. Po odmontowaniu komponentu przed upływem 2s timer wykona setState. Rekomendacja: użyj `useRef<ReturnType<typeof setTimeout>>` + `useEffect` z cleanup.

### Performance

**P2-10** 🟠 `index.html:16` — błędny `o0.ingest.sentry.io` w preconnect — placeholder, nie prawdziwa domena
`<link rel="preconnect" href="https://o0.ingest.sentry.io">` — `o0` to placeholder. Preconnect do nieistniejącego hosta marnuje RTT. Rekomendacja: usuń lub zaktualizuj po skonfigurowaniu prawdziwego DSN.

### Test Coverage

**P2-11** 🟠 `src/features/sharing/api/shareTokens.test.ts` — brak testu `fetchSharedContent(tokenZdeletedVideo) → throws 'target_not_found'`
Plan IU-10 explicite wymagał tego scenariusza (tabela zadań linia ~505). Ścieżka jest produkcyjnie osiągalna: token aktywny (`revoked_at IS NULL`) + video usunięte = `target_not_found` z PostgreSQL. Brakujący test:
```typescript
it('rzuca target_not_found gdy token aktywny ale video usunięte', async () => {
  mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'target_not_found', code: 'P0001' } });
  await expect(fetchSharedContent('token-deleted-video')).rejects.toThrow('target_not_found');
});
```

**P2-12** 🟠 `supabase/functions/_shared/sentry.ts` — brak jakichkolwiek testów `withSentry` wrappera
Każda Edge Function produkcyjna jest opakowana tym wrapperem. Plan zaznaczył test jako `[x] PASS`, ale plik testowy nie istnieje. Wymagane scenariusze: (1) brak `SENTRY_DSN` → handler wywołany normalnie, (2) handler rzuca → error re-throwowany + console.error.

---

## P3 — Nit (opcjonalne)

🟡 **P3-1** `supabase/migrations/0005_share_tokens.sql:8` — brak `CHECK (char_length(token) = 32)` na kolumnie `token`. Dodaj constraint.

🟡 **P3-2** `public/robots.txt:3–4` — `Disallow: /library` bez trailing slash (niejasne dla starszych crawlerów). Zmień na `Disallow: /library/` i `Disallow: /settings/`.

🟡 **P3-3** `src/lib/sentry.ts:22` — `console.warn` w produkcyjnym kodzie (narusza coding-rules §6). Ogranicz do `if (import.meta.env.DEV)`.

🟡 **P3-4** `src/features/sharing/hooks/useShareTokens.ts:*` + `src/features/sharing/components/ShareDialog.tsx:*` + `src/features/sharing/components/ShareLinkRow.tsx:*` — relative imports (`../api/shareTokens`, `../hooks/useShareTokens`) zamiast `@/features/sharing/...` aliasów. Spójność z resztą projektu.

🟡 **P3-5** `src/features/sharing/components/SharedFolderView.tsx:24–31` — lokalny interface `SharedFolder` duplikuje `SharedFolderContent['folder']` z `shareTokens.ts`. Zamień na `type SharedFolder = SharedFolderContent['folder']`.

🟡 **P3-6** `src/features/sharing/components/ShareDialog.tsx:72,109` — `isRevoking` z jednej mutacji blokuje przyciski "Cofnij" we wszystkich wierszach jednocześnie. W MVP akceptowalne, ale zaskakujące UX. Dodaj komentarz lub napraw przez `revokingId` state.

🟡 **P3-7** `src/features/sharing/api/shareTokens.ts:138` — `listShareTokens` zwraca `select('*')` (8 kolumn), `ShareLinkRow` używa tylko `id` i `token`. Ogranicz do `select('id, token, created_at')`.

🟡 **P3-8** `src/lib/analytics.ts:19–29` — `isAnalyticsEnabled()` wywołuje `localStorage.getItem` + `JSON.parse` przy każdym `trackEvent`. Rozważ module-level cache lub sprawdź `window.plausible` jako short-circuit (już obecne, wystarczające).

🟡 **P3-9** `src/lib/sentry.ts:19` — brak sanity check formatu DSN przed `Sentry.init()` (pusty string lub literalny `"undefined"` string). Dodaj `if (!dsn || !dsn.startsWith('https://'))` guard.

🟡 **P3-10** `supabase/functions/validate-meta-embed/index.ts` — brak ograniczenia długości `mediaUrl` (może być > 10KB). Dodaj `if (mediaUrl.length > 2048) return jsonError(...)`.

🟡 **P3-11** `supabase/functions/fetch-youtube-metadata/index.ts:136` — brak walidacji formatu `videoId` (powinien być `/^[A-Za-z0-9_-]{11}$/`). Nieprawidłowe ID marnują quota YT API.

🟡 **P3-12** `src/features/legal/components/CookieConsentBanner.tsx:20` — `role="dialog"` bez `aria-modal="true"` i `aria-describedby`. Drobne WCAG 2.1 ARIA issue.

🟡 **P3-13** `src/features/sharing/api/shareTokens.test.ts` — test entropii tokenów weryfikuje wyłącznie mocked zwrotkę, nie faktyczną `generateToken()`. Rozważ ekstrahowanie i testowanie `generateToken` jako isolated helper.

🟡 **P3-14** `src/lib/sentry.test.ts` — brak negatywnej asercji "Sentry.init NIE jest wywoływane gdy brak DSN". Obecny test sprawdza `console.warn` — to tylko połowa graceful skip.

---

## E2E Browser Verification

Dev server: `:5173` aktywny.

| Scenariusz | Wynik |
|---|---|
| Cookie consent banner widoczny przy pierwszej wizycie | ✅ passed |
| `/privacy` renderuje się z sekcjami H1+H2 | ✅ passed |
| `/regulamin` renderuje się | ✅ passed |
| `/contact` renderuje się z formularzem | ✅ passed |
| Footer linki do `/privacy`, `/regulamin`, `/contact` widoczne | ✅ passed |
| `/s/abc123testtoken` renderuje RevokedTokenView bez crash | ✅ passed |
| StructuredData JSON-LD w DOM na landing `/` | ✅ passed |

**7/7 scenariuszy PASS.**

---

## Odchylenia od planu

| IU | Odchylenie | Wpływ |
|---|---|---|
| IU-10 | Migracja `0005` zamiast `0004` (0004 zajęty przez Fazę 3 patch) | Brak — kolejność zachowana |
| IU-11 | Treść prawna jako statyczny JSX (brak react-markdown) | Brak — lżejsze rozwiązanie |
| IU-11 | CookieConsentBanner w `main.tsx` (poza RouterProvider) | Brak — wymagane architektonicznie |
| IU-12 | Prerender skipped — brak stabilnego pluginu dla React 19 + RR7 + Vite 6 | Strukturowane dane client-side; SEO ograniczone dla SPA |
| IU-12 | Sentry Deno = stub (Deno 1.45.x nie wspiera npm:@sentry/deno) | Edge errors nie trafiają do Sentry dashboard |

---

## Bookkeeping checkboxów Weryfikacja:

- Odznaczone automatycznie (CLI): 6
- Odznaczone na podstawie Agent 5 E2E: 5
- Pozostawione dla operatora (Manual/Docker): 4
- Failujące: 0

### Szczegóły
- [x] CLI: `bun run typecheck` + `bun run test` (IU-10, IU-11, IU-12) → PASS
- [x] CLI: `bun run build` → PASS (wszystkie 3 IU)
- [x] CLI: `bun run scripts/generate-sitemap.ts` → PASS (`dist/sitemap.xml` zawiera 6 routes)
- [x] CLI: `public/robots.txt` istnieje → PASS
- [x] E2E: `/privacy` renderuje → PASS (Agent 5)
- [x] E2E: `/regulamin` renderuje → PASS (Agent 5)
- [x] E2E: `/contact` renderuje → PASS (Agent 5)
- [x] E2E: Footer linki widoczne → PASS (Agent 5)
- [x] E2E: Cookie consent banner na `/` → PASS (Agent 5)
- [ ] Manual: `supabase db reset` migracja `0005` (wymaga Docker)
- [ ] Manual: E2E pełny flow create → share → revoke (wymaga żywej DB)
- [ ] Manual: Cookie consent toggle klik + reload (wymaga ręcznego testu przeglądarki)
- [ ] Manual: Lighthouse SEO ≥ 95 (odłożone — staging deploy)

---

## Pozytywne obserwacje

**Architektura sharing (IU-10):** wzorcowy podział warstw — `shareTokens.ts` → `useShareTokens.ts` → komponenty. Żaden komponent nie dotyka Supabase bezpośrednio. `FetchState` discriminated union zamiast boolean flags. RLS policy "owner_all" poprawna, `SET search_path = ''` w SECURITY DEFINER zachowane, `RAISE EXCEPTION` nie ujawnia różnicy między "nieznany" a "revoked".

**GDPR (IU-11):** `useCookieConsent` z try-catch na `JSON.parse` localStorage, pełna typizacja, lazy initialization — wzorcowo. `CookieConsentBanner` jest low-cost (zwraca `null` gdy consent ustawiony, brak wpływu na nawigację).

**Launch readiness (IU-12):** Plausible zamiast GA — lepszy wybór privacy + ~1KB; `beforeSend` maskuje email w Sentry; `maskAllText: true` w Replay. `StructuredData` statyczny JSON — zero runtime I/O. `generate-sitemap.ts` wyłącznie hardcoded routes — bezpieczne.

**Tokeny:** `crypto.getRandomValues(24 bytes) → base64url` = 192 bitów entropii (powyżej OWASP 128-bit minimum). Web Crypto API — kryptograficznie bezpieczne.
