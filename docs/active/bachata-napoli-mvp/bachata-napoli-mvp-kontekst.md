# Bachata Napoli MVP — kontekst wykonawczy

**Branch:** `feature/bachata-napoli-mvp`
**Ostatnia aktualizacja:** 2026-05-29
**Status:** active — Faza 1 (Foundation) ✅ + Faza 2 (Auth + landing) ✅ ukończone; następna: Faza 3 (Library core)

## Powiązane pliki

### Repo (foundation już istnieje na main)

- `docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md` — dokument źródłowy produktowy (R1–R18 + non-goals + success metrics)
- `docs/DESIGN.md` — design system projektu (tokeny OKLCH terracotta przygaszony + warm-neutral, Geist sans-only, voice "ty/ciepło", concentric radius, motion respecting reduced-motion)
- `docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md` — pełny plan techniczny z 12 Implementation Unitami
- `.claude/rules/coding-rules.md` — standardy kodowania (zero `any`, plik <300 linii, funkcja <50 linii, RLS na każdym endpoint, Zod na granicach systemu)

### Repo (do stworzenia w trakcie wykonania, kluczowe paths)

**Faza 1:**
- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/global.css` (z `@theme {}`)
- `components.json` (shadcn/ui), `src/lib/utils.ts`
- `supabase/config.toml`, `supabase/migrations/0001_init_baseline.sql`, `src/lib/supabase.ts`, `src/lib/database.types.ts`
- `docs/operations/{gcp-setup,youtube-scope-verification-checklist,meta-developer-setup}.md`

**Faza 2:**
- `supabase/migrations/0002_profiles_and_trigger.sql`
- `src/features/auth/{api,components,hooks,schemas}.ts/.tsx` + `src/pages/{login,signup,forgot-password,reset-password,auth-callback}.tsx`
- `src/features/landing/components/{Hero,AboutNapoli,HowItWorks,BachataSocial,Instructors,FinalCTA}.tsx`
- `src/components/layout/{PublicHeader,PublicFooter}.tsx` + `src/components/seo/MetaTags.tsx`
- `public/{hero-placeholder.jpg,og-image.jpg,instruktorzy-placeholder.jpg}`

**Faza 3:**
- `supabase/migrations/0003_videos_folders.sql`
- `src/features/library/{api,components,hooks,types}.ts/.tsx` (VideoGrid, VideoCard, EmptyLibrary, LibrarySidebar, FolderList, CreateFolderDialog, FolderPickerSheet/Popover)
- `src/components/layout/{DashboardLayout,DashboardHeader}.tsx`
- `src/pages/library/index.tsx`

**Faza 4:**
- `supabase/functions/{fetch-youtube-metadata,validate-meta-embed}/index.ts` + `supabase/functions/_shared/{cors,response}.ts`
- `src/features/library/components/{AddVideoDialog,YoutubeLinkForm,MetaLinkForm,VideoPlayer,VideoDetailDialog,VideoUploadForm,UploadProgress,UploadQueueWidget}.tsx`
- `src/lib/{url-parsers,duration,youtube-resumable-upload,dompurify-wrapper}.ts`
- `src/features/auth/{api/google-identity,components/GoogleScopeUpgradePrompt}.ts/.tsx`
- `src/features/library/hooks/useResumableUpload.ts`

**Faza 5:**
- `supabase/migrations/0004_share_tokens.sql`
- `src/features/sharing/{api,components,hooks}.ts/.tsx` + `src/pages/s/[token].tsx`
- `src/features/legal/{components,content,hooks}.ts/.tsx` + `src/pages/{privacy,regulamin,contact}.tsx`
- `docs/legal/{privacy-policy,regulamin}-draft.md`
- `src/lib/{sentry,analytics}.ts` + `src/components/seo/StructuredData.tsx`
- `supabase/functions/_shared/sentry.ts`
- `public/{robots.txt,sitemap.xml}` + `scripts/generate-sitemap.ts`
- Modify `vite.config.ts` (prerender plugin)

## Decyzje techniczne (rozstrzygnięte w `/dev-plan`)

| Decyzja | Wybór | Powód |
|---|---|---|
| Stack | Vite SPA + React 19 + TS + Tailwind v4 + shadcn/ui + Supabase | Zgodne z konfiguracją projektu (skille + agenci). Vite + prerender daje wystarczający SEO |
| Wideo storage | YouTube (zero własnego hostingu) | Brainstorm decyzja — oszczędność infra + copyright responsibility |
| YT upload | Direct browser → YT (resumable upload protocol) | Niższe koszty + szybciej dla usera |
| OAuth scope | Incremental (basic na sign-in, `youtube.upload` na pierwszy upload) | Lepsza conversion + Google best practice |
| Share tokens | 192-bit random + `SECURITY DEFINER` function dla anon | Jedyny bezpieczny pattern pod Supabase RLS |
| Identity model | Google OAuth + email/hasło + `linkIdentity` | Brainstorm — email user może dolinkować Google later |
| SEO | Prerender (`vite-ssg` lub `vite-plugin-prerender`) dla landing/legal | Vite SPA bez SSR, prerender wystarcza dla static routes |
| Router | TanStack Router lub React Router 7 | Decyzja w IU-1 (oba spełniają wymagania) |
| Forms | React Hook Form + Zod + shadcn/ui Form | Stack standard |
| State | React Query (server) + Zustand (UI, minimal) | Brak Redux/MobX — overkill |
| Email transactional | Supabase default SMTP w MVP | Resend = upgrade w v1.1 jeśli volume rośnie |
| Hosting | Vercel / Cloudflare Pages / Netlify | Operator decyzja w IU-12 |
| DB region | Supabase EU (Frankfurt) | GDPR |
| Storage Supabase | NIE używamy w MVP | YT jest storage; hero photo + avatars to placeholder JPEGi w `public/` |
| File cap YT upload | 2 GB | Realistic max z telefonu + safe upper bound |
| Brand color | Terracotta przygaszony `oklch(0.62 0.13 38)` | Editorial Apple/Notion-style + ciepły akcent włoski |

## Zależności

### Wewnętrzne (sequencing)

- IU-1 → IU-2 → IU-3 (Faza 1 sequential)
- IU-4 wymaga IU-1, IU-2, IU-3 (Google OAuth client gotowy)
- IU-5 wymaga IU-1, IU-4 (CTA "Załóż konto" → `/signup`)
- IU-6 wymaga IU-4 (auth required)
- IU-7 wymaga IU-6
- IU-8 wymaga IU-6, IU-3 (API keys)
- IU-9 wymaga IU-4, IU-6, IU-8 (AddVideoDialog skeleton)
- IU-10 wymaga IU-6, IU-7, IU-8 (VideoPlayer)
- IU-11 wymaga IU-5 (footer linki)
- IU-12 wymaga IU-5, IU-11

### Zewnętrzne (operator/business)

- **Domena `bachatanapoli.pl`** zarejestrowana i kontrolowana
- **GCP project + OAuth client + YT Data API enabled** — operator w IU-3
- **YT OAuth sensitive scope verification APPROVED** — operator w IU-3, **krytyczna ścieżka ~2-6 tyg.**
- **YT quota extension request APPROVED** (target 100k+ jednostek/dzień) — operator w IU-3
- **Meta App + oEmbed Read product** (jeśli Plan A) — operator w IU-3, status do weryfikacji w 2026
- **Supabase Cloud projects** (staging + prod, EU region) — operator w IU-2
- **Sentry projects** (frontend + edge) — operator w IU-12
- **Plausible site** lub Umami instance — operator w IU-12
- **Hosting account** (Vercel/CFP/Netlify) — operator w IU-12
- **SSL cert** (auto via hosting)
- **Google Search Console** verification + sitemap submission — operator w IU-12
- **Partnership Bachata Rebel** (Małgosia + Szymon) — gotowe
- **Hero photoshoot** — produkcyjne, placeholder OK w MVP
- **Final copy do landing sekcji** — biznes/copywriter
- **Prawnik** do review privacy + regulamin — operator w IU-11
- **DPA podpisane** z processors (Supabase, Google, Meta jeśli używany, Sentry, Plausible)

## Designerski kontekst

- **DESIGN.md (projekt-wide):** `./docs/DESIGN.md`
- **SPEC.md (per-feature, pomiary z Figmy):** `null`
- **Screeny referencyjne:** brak — projektujemy w oparciu o DESIGN.md tokeny

> Te pliki są MANDATORY context dla subagentów buildujących UI. `dev-docs-execute` wstrzykuje je do promptu Agent tool. Brak Figmy oznacza że buildery UI (feature-builder-ui, feature-builder-fullstack) bazują wyłącznie na `docs/DESIGN.md` + ux-ui-guidelines + opisach komponentów z planu technicznego. Skill figma:figma-* w mirrorze ich frontmatera pozostaje, ale jest neutralizowany przez brak `figma_spec`/`figma_screens` w tym planie.

## Krytyczne ostrzeżenia (do przekazania subagentom)

1. **TEST-FIRST mandatory dla IU-8/IU-9/IU-10** — URL parsers (edge cases), resumable upload protocol (chunking/resume/retry/refresh), RLS SECURITY DEFINER function (security-critical). Notatki wykonawcze w planie technicznym.
2. **Meta oEmbed status w 2026 VERIFY before code** w IU-8 — fallback Plan B (manual entry bez embed) lub C (usuń R11) gotowe.
3. **YT scope verification BLOCKING dla IU-9 public launch** — submit w IU-3 ASAP, monitor status, rozważ invite-only launch jeśli verification w toku.
4. **RLS test coverage** — każda business table musi mieć RLS-on + minimum 1 policy. Test cross-user access (user A nie widzi B). Brak tego = security review fail.
5. **Mobile-first UX** — testuj wszystko na 375px (iPhone SE) viewport. Tap targets ≥ 44px. Input font-size ≥ 16px (iOS Safari zoom). Bottom sheet > modal dla mobile actions.

## Log wykonawczy

### Faza 1 — Foundation (2026-05-28) ✅

**IU-1 (feature-builder-fullstack) — completed.** Vite 6 + React 19 + TS 5.7 strict scaffolding. Quality gates: typecheck/lint/test (6/6)/build PASS. Bundle JS gzip ~99 KB (limit 200). Decyzje:
- **Router: React Router 7** (`createBrowserRouter` data router) zamiast TanStack — prostszy onboarding, brak wymogu type-safe search params w MVP, dominujący w ekosystemie shadcn/ui. TanStack byłby +20KB bez wartości teraz.
- **ESLint 9 flat config** (`eslint.config.js`) z override dla `src/components/ui/**` (shadcn CVA pattern, wyłączony `react-refresh/only-export-components`).
- **Vitest 3** (nie 2) — uplift wymuszony konfliktem typów `PluginOption` z Vite 6.

**IU-2 (feature-builder-data) — completed.** Supabase baseline. Quality gates PASS (11/11 testów). Decyzje:
- **Bez `@supabase/ssr`** — czysty Vite SPA, klient-only.
- **`private` schema + `is_owner(uuid)` helper** (SECURITY INVOKER, `search_path=''`) jako reusable RLS predicate. `revoke usage from public` = defense in depth (PostgREST nie wywoła).
- **`main.tsx` NIE ruszany** — lazy import strategy: nic w łańcuchu entry→router→App nie importuje `@/lib/supabase`, więc dev startuje bez `.env.local`. Fail-fast throw odpala się dopiero przy pierwszym konsumencie (IU-4+).
- **`database.types.ts` = stub** — Docker Desktop niedostępny lokalnie, więc `supabase start/db reset/gen types` nie uruchomione. Migracja `0001` zwalidowana tylko statycznie.

**IU-3 (feature-builder-data) — completed.** 3 operator runbooki + `.env.example`. Brak kodu, brak odchyleń. Quality gates PASS.

### Faza 2 — Auth + landing (2026-05-29) ✅

**IU-4 (feature-builder-fullstack) — completed.** Supabase Auth: Google OAuth + email/hasło + protected routes. Migracja 0002 (profiles + `handle_new_user` trigger SECURITY DEFINER). Quality gates: typecheck/lint/test (66/66) PASS. E2E (agent-browser): render wszystkich stron auth + guard `/library`→`/login?next` ✓. Decyzje:
- **RHF + Zod + sonner + React Query** dodane (pinowane wersje §8). `Input` dostał `ref` prop (React 19, bez forwardRef) dla `register()`.
- **`database.types.ts` ręcznie rozszerzony** o `profiles` (Docker niedostępny — do regen `bun gen-db-types` w sesji z Dockerem).
- **Email rate limit (`429 over_email_send_rate_limit`)** na żywym backendzie Cloud podczas testów signup — to NIE bug, dowód że backend live i wysyła maile. Happy-path E2E `/login`→`/library` + toast forgot-password odłożone (wymagają potwierdzonego konta / resetu limitu).
- **Odłożone:** `supabase db reset` migracji 0002 (Docker).

**IU-5 (feature-builder-ui) — completed.** Publiczny landing (`/`): Hero + AboutNapoli + HowItWorks + BachataSocial + Instructors + FinalCTA + PublicHeader (sticky, mobile Sheet) + PublicFooter + MetaTags. Quality gates: typecheck/lint/test (74/74)/build PASS. E2E (agent-browser): desktop 2-col + mobile single-col, zero horizontal scroll, CTA→/signup, smooth scroll, sticky header, meta tagi, smoke a11y ✓. Decyzje:
- **Route `/`: `App.tsx` smoke page → `pages/index.tsx` (LandingPage, eager).** App.tsx usunięty (martwy kod). Constraint #3 (dev bez `.env.local`) utrzymany — łańcuch landingu nie importuje supabase (`useAuth` czyta tylko kontekst); supabase = osobny lazy chunk (210KB) w buildzie.
- **`Reveal.tsx`** (poza listą plików planu) — wspólny scroll-reveal IntersectionObserver, respektuje `prefers-reduced-motion`, cleanup §13.
- **`radix-ui@1.4.3`** (umbrella) przez `shadcn add sheet` — kanoniczne dla nowego registry, funkcjonalnie = react-dialog. `sheet.tsx` przepisany na tokeny DESIGN.md (`bg-bg`/`text-fg-muted`/`z-overlay`).
- **Odłożone do IU-12:** Lighthouse audit + prerender. **Operator:** prawdziwe foto (hero/instruktorzy) + brandowy `og-image.jpg` (SVG placeholdery — sharp/ImageMagick niedostępne).

### Odchylenia od planu (zalogowane)

0. **(Faza 2) Placeholdery `.svg` zamiast `.jpg`** (IU-5) — brak sharp/ImageMagick. Gradient brand-palette, lekkie. Operator dostarczy JPEG przed publikacją. **`Reveal.tsx`** dodany poza listą plików (shared observer, §3). **`radix-ui` umbrella** zamiast `@radix-ui/react-dialog` (shadcn registry default). Żadne nie zmienia scope.
1. **`bun.lockb` → `bun.lock`** (IU-1) — Bun 1.3+ używa text lockfile. Funkcjonalnie identyczne, commitowalne.
2. **Geist via `@fontsource-variable/geist`** (IU-1) zamiast hard-coded `<link rel="preload">` — Vite kontroluje hashed URLs + auto-preload, lepsza cache invalidation. `font-display: swap` wbudowane.
3. **`tsconfig.app.json` dodany** (IU-1) — separacja typów node (vite.config) od browser (src). Standard Vite scaffold.
4. **`.eslintrc.json` → `eslint.config.js`** (IU-1) — flat config preferred dla ESLint 9.
5. **`src/vite-env.d.ts` rozszerzony zamiast `main.tsx`** (IU-2) — `ImportMetaEnv` dla Supabase vars. Zmiana minimalna, w duchu planu.
6. **IU-2 E2E `window.supabase`** świadomie pominięty — nie eksponujemy klienta w `window` (security). Weryfikacja sesji przejdzie w IU-4 auth flow.

Żadne odchylenie nie zmienia scope ani nie wymaga decyzji usera — wszystkie to merytorycznie uzasadnione wybory implementacyjne w granicach IU.

### Review Fazy 1 (2026-05-28)

`/dev-docs-review` — 4 agenci (security, performance, TS+architecture, test-coverage) + manualny E2E. **Severity gate: ⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× P1, 3× P2, 11× P3. Raport: `review-faza-1.md`.

- **CLI na żywo:** typecheck/lint/test (11/11)/build PASS. JS bundle **99.36 KB gzip** (limit 200). `supabase-js` poprawnie tree-shaken.
- **P2-1 kod RESOLVED:** usunięto nieużywany import `geist-mono` z `global.css:5` (6 woff2 → 0, CSS −1.8 KB). Quality gate zielone po fixie.
- **P2-2 smoke page RESOLVED:** zainstalowano `agent-browser` (via `bun add -g` — npm `-g` failuje na EACCES `/usr/local`) + live verify na `:5174`: H1+Geist+terracotta `oklch(0.62 0.13 38)` ✓, zero console errors/warnings ✓, `prefers-reduced-motion` 0.12s→1e-05s ✓.
- **P2-3 Supabase OTWARTE:** stack nie zweryfikowany (Docker niedostępny). Migracja `0001` poprawna statycznie (potwierdzone: `is_owner` SECURITY INVOKER + `search_path=''`, `private` poza PostgREST). Czeka na sesję z Dockerem.
- **Kluczowy wniosek:** foundation jest czysty i security-conscious — zero `any`, zero sekretów, tsconfig przewyższa plan, testy testują behavior. Wzorzec do utrzymania w IU-4+.

### Review Fazy 2 (2026-05-29)

`/dev-docs-review` — 5 agentów (security, performance, architecture+TS, test-coverage, E2E browser axe-core) + konsolidacja. **Severity gate: ⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI** — 0× P1, 5× P2, 11× P3. Raport: `review-faza-2.md`. Checkboxy w `*-zadania.md` → "Do poprawy po review fazy 2".

- **CLI na żywo:** typecheck/lint/test (74/74)/build PASS. Eager JS **135.21 KB gzip** (limit 200). Constraint #3 zweryfikowany — supabase osobny lazy chunk 210 KB, zero w eager landing.
- **P2-5 (najważniejszy) — kontrast WCAG AA:** axe-core wykrył biały tekst na accent terracotta = 3.74:1 (wymóg 4.5:1) na primary CTA + subtekst FinalCTA 3.13:1. Wcześniejszy "smoke a11y PASS" odłożył pełny axe — scan ujawnił naruszenie. Fix dotyka `global.css`/`DESIGN.md` (decyzja brandowa: przyciemnić accent).
- **P2 perf:** react-query w eager mimo użycia dopiero od IU-6 → naprawić przy starcie IU-6.
- **P2 arch+test (AuthProvider hotspot):** omija granicę auth.ts + cleanup/unsubscribe nieasertowany + brak testu guard `useRequireAuth`/`RequireAuth` (core security R8).
- **Kluczowy wniosek:** security/architektura/type-safety wzorcowe (RLS poprawne, zero any/as/!, cleanupy §13, zero anty-patternów testowych). Główne długi: 1 realny a11y (kontrast) + testy guard/cleanup + perf eager. Wszystko nie-blokujące.

### Blokery / TODO przeniesione dalej

- **Docker Desktop** wymagany do walidacji Supabase stack na żywo. Następna sesja na maszynie z Dockerem: `bunx supabase start && bunx supabase db reset && bun gen-db-types` → zastąpić stub `database.types.ts` + commit diff.
- **Krytyczna ścieżka YT scope verification (~2-6 tyg.)** — operator musi rozpocząć Fazę B z `youtube-scope-verification-checklist.md` ASAP (biegnie równolegle z developmentem IU-4..IU-12).
- **Meta Plan A/B/C** — operator wykonuje pre-flight check (Sekcja 0 `meta-developer-setup.md`) PRZED zleceniem IU-8.
- **Pre-commit hook fix** — `.husky/pre-commit` dostał `export PATH="$HOME/.bun/bin:$PATH"` (git hook env nie miał `bunx` w PATH).

## Źródła

- **Requirements doc:** `docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md`
- **Plan techniczny:** `docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md`
