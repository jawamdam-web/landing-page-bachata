# Code Review — Faza 1 (Foundation)

**Data:** 2026-05-28
**Branch:** `feature/bachata-napoli-mvp`
**Zakres:** IU-1 (bootstrap Vite SPA), IU-2 (Supabase baseline), IU-3 (operator runbooki)
**Reviewerzy:** security-sentinel, performance-oracle, kieran-typescript-reviewer + architecture-strategist, test-coverage, E2E (manualny)

---

## Severity gate

⚠️ **KONTYNUUJ Z ZASTRZEŻENIAMI** — 0 problemów P1, 1 realny P2 (cleanup), 2 P2 środowiskowe (weryfikacja niemożliwa w tej sesji, znane blockery). Faza 1 jest gotowa do kontynuacji do Fazy 2.

## Statystyki

- Plików sprawdzonych: 39 (kod + config + 3 runbooki)
- 🔴 [blocking]: **0**
- 🟠 [important]: **3** (1 kod: geist-mono; 2 środowiskowe: browser E2E + Docker/Supabase)
- 🟡 [nit]: **11**
- 🌐 [E2E]: 0 passed / 0 failed / **1 skipped** (agent-browser niezainstalowany)
- ☑️ Weryfikacja: 8 auto (CLI/grep) / 0 E2E / 0 manual / 0 niejasne / 4 skipped (3× Docker, 1× browser)

## Wyniki CLI (uruchomione na żywo)

| Komenda | Wynik |
|---|---|
| `bun run typecheck` | ✅ exit 0 |
| `bun run lint` | ✅ exit 0 |
| `bun run test` | ✅ 11/11 PASS (utils 6, supabase 5) |
| `bun run build` | ✅ exit 0 — JS **99.36 KB gzip** / CSS 10.66 KB gzip (limit 200 KB) |

Potwierdzono: `supabase-js` jest poprawnie tree-shaken z produkcyjnego bundla (nic w łańcuchu entry → router → App nie importuje `src/lib/supabase.ts`), więc lazy-import strategy działa.

---

## 🔴 P1 — Blocking

Brak. Wszyscy reviewerzy potwierdzili zero problemów blokujących. Foundation jest czysty, bezpieczny dla swojego zakresu i zgodny z `coding-rules.md`.

---

## 🟠 P2 — Important

### P2-1 (kod) — `src/global.css:5` — nieużywany import `@fontsource-variable/geist-mono`
Import `@fontsource-variable/geist-mono/index.css` wstrzykuje 6 bloków `@font-face` do shipowanego CSS i emituje 6 hashowanych assetów woff2 (~77 KB raw), których żaden kod Fazy 1 nie używa. Token `--font-mono` (`global.css:52`) jest zdefiniowany, ale `grep` potwierdza brak użycia utility `font-mono` w `src/`. Browser nie pobiera tych woff2 w runtime (unicode-range gating), więc to NIE jest regresja payloadu — to dead weight CSS + dead build artifacts, naruszające `coding-rules.md` §5 (anti-pattern #1 Over-specification, #10 Defensive over-engineering) i §3 ("abstrakcja dopiero gdy 2+ użycia").
**Fix:** usuń import (linia 5) teraz; dodaj ponownie w fazie wprowadzającej element monospace. Token `--font-mono` może zostać (ma system-fallback, zero kosztu bez `@font-face`).

### P2-2 (środowiskowe) — Smoke page nie zweryfikowany w przeglądarce na żywo
Checkbox `Weryfikacja: Dev server :5173 renderuje smoke page z brand terracotta accent` + 3 deferred testy E2E (`Test:` linie 31-33: H1 + Geist + Button accent / zero console errors / `prefers-reduced-motion`) nie zostały zweryfikowane wizualnie — **`agent-browser` nie jest zainstalowany** w tej sesji.
**Status weryfikacji-by-construction (silne, ale nie live):** dev server serwuje HTTP 200 z poprawnym `<html lang="pl">`, viewport `viewport-fit=cover`, `theme-color #fbf8f3` (zgodny z tokenem cream bg), pełny SEO title + description; `App.tsx` renderuje H1 "Bachata Napoli" + Button primary (`bg-accent` = terracotta `oklch(0.62 0.13 38)`); `global.css` zawiera media query `prefers-reduced-motion`. Build produkuje działający bundel.
**Fix:** `npm i -g agent-browser && agent-browser install`, potem live verify na `:5174` (terracotta, console, reduced-motion) — wymaga decyzji usera (ciężki install Chromium).

### P2-3 (środowiskowe) — Supabase local stack nie zweryfikowany (Docker niedostępny)
3 checkboxy `Weryfikacja:` IU-2 (`supabase start`, `supabase db reset` migracja 0001, `bun gen-db-types`) wymagają Dockera, który nie jest dostępny lokalnie. Migracja `0001_init_baseline.sql` zwalidowana **tylko statycznie** (reviewerzy potwierdzili poprawność: `is_owner` SECURITY INVOKER + `search_path=''` + schema-qualified `auth.uid()`; `private` schema poza `[api] schemas`; RLS-on-default convention). To już udokumentowany blocker w `kontekst.md`.
**Fix:** następna sesja na maszynie z Dockerem: `bunx supabase start && bunx supabase db reset && bun gen-db-types` → zastąp stub `database.types.ts` + commit. (Bez zmian w kodzie — to gap weryfikacji, nie defekt.)

---

## 🟡 P3 — Nits (opcjonalne)

### Config / TypeScript
- 🟡 **`tsconfig.node.json:21`** — phantom reference do `vitest.config.ts` (plik nie istnieje, test config jest inline w `vite.config.ts`). Usuń wpis → `"include": ["vite.config.ts"]`.
- 🟡 **`tsconfig.app.json:33`** — redundantne globy `include` (`src` już rekursywnie pokrywa `src/**/*.test.*`). Kosmetyka.
- 🟡 **`src/lib/database.types.ts:16`** — stub bez klucza `__InternalSupabase` (generator go teraz emituje). Bez akcji — `gen-db-types.sh` nadpisze całość; flaga tylko żeby pierwszy diff nie zaskoczył.
- 🟡 **`src/lib/supabase.ts:8-12`** — kontrakt lazy-import egzekwowany tylko komentarzem. Watch-item dla IU-2+: rozważ `eslint-plugin-import/no-restricted-paths` (zakaz importu `@/lib/supabase` z `main.tsx`/`router.tsx`/`App.tsx`) lub `getSupabaseClient()` factory, gdy pojawi się pierwszy konsument.

### Security (wszystkie future / watch-item, brak akcji w Fazie 1)
- 🟡 **`supabase/config.toml:61-65`** — `[db.seed] enabled = true` ale `supabase/seed.sql` nie istnieje → `supabase db reset` wyrzuci warning. Stwórz pusty `seed.sql` lub ustaw `enabled = false`.
- 🟡 **`supabase/config.toml:178`** — `minimum_password_length = 6` (default). Gdy IU-4 włączy email/hasło, rozważ `8` + complexity.
- 🟡 **`index.html` / hosting** — brak CSP / security headers (`frame-ancestors`, `Referrer-Policy`, HSTS). Zaprojektuj przy pierwszej realnej stronie (IU-5); Meta runbook już zakłada `frame-src` dla embedów.
- 🟡 **`config.toml:15`** — konwencja: każda przyszła funkcja `SECURITY DEFINER` MUSI mieć `search_path=''` + fully-qualified calls (jak `is_owner`). Dodaj do checklisty review Fazy 2: "potwierdź że `private` nigdy nie trafia do `[api] schemas`".

### Performance (future, poprawnie nieobecne teraz)
- 🟡 **`index.html`** — brak preload krytycznego sans woff2 (FOUT z `font-display: swap`). Przedwczesne dla smoke page — odłóż do IU-5 (real above-the-fold).
- 🟡 **`vite.config.ts`** — brak `manualChunks` / route-level `React.lazy()` — POPRAWNIE nieobecne dla single-route app. Wróć przy IU-4/IU-5.

### Test coverage (nice-to-have)
- 🟡 **`src/lib/supabase.test.ts:39`** — redundantny `toBeDefined()` (linie 40-41 niosą realną asercję behavior). Zostaw lub usuń linię 39.
- 🟡 **`src/lib/supabase.test.ts:44-58`** — fail-fast testy asertują tylko regex message; dodaj `await expect(import('./supabase')).rejects.toBeInstanceOf(Error)` (coding-rules §4 typed errors).
- 🟡 **`src/lib/supabase.ts:28`** — guard `if (!URL || !KEY)` przepuszcza whitespace-only env (`'   '`). Świadoma decyzja czy trim-validate.
- 🟡 **`src/lib/utils.test.ts`** — brak testu object-syntax `cn({ active: true })` (idiom shadcn CVA). Dodaj 1 test.
- 🔵 **Sugestia (S1):** dodaj `src/App.test.tsx` (RTL — już w deps) pokrywający DOM-checkowalną część deferred IU-1 E2E (H1 + przyciski CTA). Font/Lighthouse/reduced-motion zostają deferred do prawdziwego E2E.

---

## Odchylenia od planu

Brak nieuzasadnionych odchyleń. Wszystkie zalogowane w `kontekst.md` (bun.lock text lockfile, Geist via fontsource, tsconfig.app.json, eslint flat config, vite-env.d.ts zamiast main.tsx, świadomy skip IU-2 E2E window.supabase) to merytorycznie uzasadnione wybory implementacyjne w granicach IU.

**Pliki testowe zdefiniowane w planie — wszystkie istnieją:**
- IU-1: `src/lib/utils.test.ts` ✅ (6/6)
- IU-2: `src/lib/supabase.test.ts` ✅ (5/5)
- IU-3: brak (docs-only, tylko `[Manual]` operator testy) ✅

**Delegate to:** zgodność potwierdzona — IU-1 fullstack, IU-2/IU-3 data. Brak niezgodności kategorii plików.

---

## Co zrobiono notably dobrze (wzorzec dla IU-2+)

- **Type safety:** zero `any` w kodzie produkcyjnym, zero `!` non-null assertions, zero unsafe `as`. `main.tsx:7-10` narrows `getElementById` przez explicit throw zamiast `!`. tsconfig PRZEWYŻSZA obietnicę planu (dodaje `noUnusedLocals`, `noUncheckedSideEffectImports`).
- **Test quality (§2):** `supabase.test.ts` testuje behavior (singleton, fail-fast per env var, actionable message) przez dynamic-import + `vi.stubEnv`/`vi.resetModules` — poprawna technika dla module-eval side-effects. Mockowany TYLKO `import.meta.env` (właściwa granica).
- **Secret hygiene (§9):** zero realnych sekretów; `.env.local` gitignored + untracked; tylko `.env.example` z placeholderami. Runbooki IU-3 są security-positive (server-side-only keys, DOMPurify allowlist dla Plan B, CSP `frame-src`).
- **`database.types.ts` stub** jest type-safe (`Record<string, never>` vacuously assignable do `GenericSchema`) — klient jest realnie typowany, nie kolapsuje do `any`.

---

## Bookkeeping checkboxów Weryfikacja:

- Odznaczone automatycznie (CLI/grep): **8**
- Odznaczone na podstawie Agent 5 E2E: **0**
- Pozostawione dla operatora (Manual): **0** (Weryfikacja: — sekcje `Operator:` i `Test: [Manual]` są osobne i nietknięte)
- Niejasne (P3): **0**
- Skipped (środowiskowe, P2): **4** (3× Docker, 1× browser)

### Szczegóły
- [x] CLI: `bun run typecheck` → PASS
- [x] CLI: `bun run lint` → PASS
- [x] CLI: `bun run test` → PASS (11/11)
- [x] CLI: `bun run build` <200KB → PASS (99.36 KB gzip)
- [x] CLI: `bun run typecheck` z importem supabase → PASS (typecheck kompiluje `src/lib/supabase.ts`)
- [x] grep: `gcp-setup.md` istnieje z checkboxami → PASS (69 operator checkboxes)
- [x] grep: `youtube-scope-verification-checklist.md` tracking sekcje → PASS (Submitted/In review/Approved)
- [x] grep: `.env.example` Google/Meta vars → PASS (4/4)
- [x] E2E browser: `Dev server :5173 smoke page terracotta` → **PASS** (zweryfikowane po review, patrz Aktualizacja)
- [ ] CLI/Docker: `supabase start` → SKIP (Docker niedostępny) — P2-3
- [ ] CLI/Docker: `supabase db reset` migracja 0001 → SKIP (Docker niedostępny) — P2-3
- [ ] CLI/Docker: `bun gen-db-types` → SKIP (Docker niedostępny) — P2-3

---

## Aktualizacja — post-review fixes (2026-05-28, ta sama sesja)

User wybrał: napraw P2 kodu (geist-mono) + zainstaluj agent-browser dla live E2E.

### ✅ P2-1 RESOLVED — geist-mono usunięty
`src/global.css:5` import usunięty. Rebuild: **6 mono woff2 → 0**, CSS 60.08 → 58.28 KB raw (gzip 10.66 → 10.51). JS bez zmian (99.36 KB gzip). Quality gate po fixie: typecheck/lint/test (11/11) zielone. Token `--font-mono` zostawiony (zero kosztu); dependency w package.json zostawiona (nieimportowana = nie trafia do bundla).

### ✅ P2-2 RESOLVED — smoke page zweryfikowany live
`agent-browser@0.27.0` zainstalowany via `bun add -g` (npm `-g` failował na EACCES `/usr/local` — bun global dir jest user-owned) + Chrome 149 dla mac-arm64. Wyniki na `:5174`:

| Scenariusz (deferred IU-1 E2E) | Wynik |
|---|---|
| H1 "Bachata Napoli" lvl1 + Geist + Button primary accent | ✅ font-family "Geist Variable"; btn bg `oklch(0.62 0.13 38)` = terracotta token (exact); btn color `oklch(0.99 0 0)`; body bg cream `oklch(0.99 0.004 70)` |
| Zero console errors/warnings | ✅ tylko `[debug] [vite]` HMR + `[info]` React DevTools (dev-only); zero error/warn |
| `prefers-reduced-motion: reduce` → bez transition | ✅ transition-duration 0.12s → **1e-05s** (global.css `!important` rule działa) |
| Lighthouse Performance >90 (baseline) | ⚪ nie uruchomiony (brak narzędzia Lighthouse; baseline empty page) |

Screenshot wizualnie potwierdza editorial-warm mood (cream bg, Geist, terracotta accent oszczędnie).

### Pozostaje otwarte
- **P2-3 (Docker)** — Supabase live stack nadal czeka na sesję z Dockerem. Bez zmian.

### Zaktualizowany severity gate
✅ **GOTOWE DO KONTYNUACJI** — 0× P1, 1× P2 otwarte (środowiskowe, Docker), 11× P3 (opcjonalne). 2 z 3 P2 rozwiązane w tej sesji.
