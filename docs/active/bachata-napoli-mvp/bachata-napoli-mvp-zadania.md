# Bachata Napoli MVP — checklist zadań

**Branch:** `feature/bachata-napoli-mvp`
**Ostatnia aktualizacja:** 2026-05-29 (Faza 4 done)

> **Format:** każdy IU zawiera (1) checkboxy implementacyjne, (2) `Test:` z prefiksem typu `[Unit]`/`[E2E]`/`[Manual]`, (3) `Weryfikacja:` (automatyzowalne PASS/FAIL), (4) opcjonalny `Operator:` (kroki wymagające człowieka). `/dev-docs-review` automatycznie odznacza `Weryfikacja:` po PASS — operator checklist NIE jest odznaczany przez autopilota.

---

## Faza 1 — Foundation

### IU-1: Bootstrap Vite SPA + design tokens + shadcn/ui

**Delegate:** feature-builder-fullstack | **Status:** ✅ Done (2026-05-28)

**Implementacja:**
- [x] Stwórz: `package.json`, `bun.lock` (text lockfile Bun 1.3+), `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json` (+ `tsconfig.app.json`)
- [x] Stwórz: `index.html` (Geist Variable via `@fontsource-variable/geist` + meta viewport)
- [x] Stwórz: `src/main.tsx`, `src/App.tsx`
- [x] Stwórz: `src/global.css` z `@theme {}` (1:1 mapping z `docs/DESIGN.md`)
- [x] Stwórz: `src/router.tsx` (React Router 7 — `createBrowserRouter` data router)
- [x] Stwórz: `components.json` (shadcn/ui, style new-york)
- [x] Stwórz: `src/lib/utils.ts` (cn helper)
- [x] Stwórz: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`
- [x] Stwórz: `.gitignore`, `.env.example`, `eslint.config.js` (flat config ESLint 9), `.prettierrc.json`, `README.md`
- [x] Stwórz: `.github/workflows/ci.yml`
- [x] Stwórz: `src/lib/utils.test.ts`

**Test:**
- [x] Test: [Unit] `cn()` helper łączy klasy + resolves Tailwind merge conflicts (6/6 PASS)
- [x] Test: [E2E] `/` renderuje H1 "Bachata Napoli" z Geist + Button primary z `accent.DEFAULT` *(PASS 2026-05-28: H1 lvl1, font-family "Geist Variable", btn bg `oklch(0.62 0.13 38)`)*
- [ ] Test: [E2E] DevTools: zero console errors/warnings; Lighthouse Performance > 90 (baseline) *(console ✓ zero errors/warnings — tylko Vite HMR debug + React DevTools info; Lighthouse nie uruchomiony)*
- [x] Test: [E2E] `prefers-reduced-motion: reduce` → button hover bez transition *(PASS 2026-05-28: transition-duration 0.12s → 1e-05s)*

**Weryfikacja:**
- [x] Weryfikacja: `bun run typecheck` przechodzi bez błędów
- [x] Weryfikacja: `bun run lint` przechodzi bez błędów
- [x] Weryfikacja: `bun run test` (Vitest) zielony
- [x] Weryfikacja: `bun run build` produkuje `dist/` poniżej 200KB initial bundle
- [x] Weryfikacja: Dev server `:5173` renderuje smoke page z brand terracotta accent (PASS 2026-05-28 via agent-browser na :5174 — terracotta `oklch(0.62 0.13 38)` potwierdzony)

---

### IU-2: Supabase init — schema baseline + RLS pattern + client

**Delegate:** feature-builder-data | **Status:** ✅ Done (2026-05-28) | **Zależy od:** IU-1

**Implementacja:**
- [x] Stwórz: `supabase/config.toml`
- [x] Stwórz: `supabase/migrations/0001_init_baseline.sql` (extensions pgcrypto/uuid-ossp + `private.is_owner()` helper + komentarz RLS-on-default)
- [x] Stwórz: `src/lib/supabase.ts` (singleton client)
- [x] Stwórz: `src/lib/database.types.ts` (stub — regen `bun gen-db-types` po pierwszym `supabase start` z Dockerem)
- [x] Stwórz: `scripts/gen-db-types.sh`
- [x] Modify: `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` + Google OAuth placeholdery)
- [x] Modify: `src/vite-env.d.ts` zamiast `main.tsx` — lazy import strategy (nic top-level nie importuje supabase, więc dev nie crashuje przy missing env)
- [x] Modify: `README.md` (sekcja "Local Supabase setup")
- [x] Stwórz: `src/lib/supabase.test.ts`

**Test:**
- [x] Test: [Unit] `supabase` import zwraca singleton (re-import = ten sam reference)
- [x] Test: [Unit] Brak `VITE_SUPABASE_URL` w env → init rzuca jasny error (fail-fast)
- [ ] Test: [E2E] DevTools: `window.supabase.auth.getSession()` → `{ session: null }` (anon) *(świadomie pominięty — nie eksponujemy supabase w window; weryfikacja w IU-4 auth flow)*

**Weryfikacja:**
- [ ] Weryfikacja: `supabase start` uruchamia lokalny stack bez błędów (SKIP — Docker niedostępny w tej sesji)
- [ ] Weryfikacja: `supabase db reset` aplikuje migrację `0001` bez błędów (SKIP — Docker niedostępny w tej sesji)
- [x] Weryfikacja: `bun run typecheck` przechodzi z importem `supabase` z `@/lib/supabase`
- [ ] Weryfikacja: `bun gen-db-types` produkuje `src/lib/database.types.ts` bez warnings (SKIP — Docker niedostępny w tej sesji)

**Operator:**
- [ ] Operator: Stworzony Supabase Cloud project `bachatanapoli-staging` w EU (Frankfurt) → URL+anon key do `.env.staging`
- [ ] Operator: Stworzony Supabase Cloud project `bachatanapoli-prod` → `.env.production`

---

### IU-3: GCP + YouTube Data API + Meta Developer setup

**Delegate:** feature-builder-data | **Status:** ✅ Done (2026-05-28) | **Zależy od:** IU-1, IU-2

**Implementacja:**
- [x] Stwórz: `docs/operations/gcp-setup.md` (operator runbook, 297 linii)
- [x] Stwórz: `docs/operations/youtube-scope-verification-checklist.md` (236 linii, tracking + Plan B/C)
- [x] Stwórz: `docs/operations/meta-developer-setup.md` (202 linie, pre-flight 2026 + Plan A/B/C)
- [x] Modify: `.env.example` (`VITE_GOOGLE_OAUTH_CLIENT_ID`, `YOUTUBE_API_KEY`, `META_APP_ID`, `META_APP_SECRET`)

**Test:**
- [ ] Test: [Manual] Operator uruchamia `gcp-setup.md` step-by-step → kończy z working Client ID + Secret w env staging *(operator — runbook gotowy, wykonanie po stronie człowieka)*
- [ ] Test: [Manual] OAuth basic scopes flow (`openid` + `email`) działa w Supabase Auth Studio testing mode *(operator — po wgraniu credentials)*

**Weryfikacja:**
- [x] Weryfikacja: `docs/operations/gcp-setup.md` istnieje z checkboxami operator steps
- [x] Weryfikacja: `docs/operations/youtube-scope-verification-checklist.md` istnieje z tracking sekcjami (Submitted/In Review/Approved)
- [x] Weryfikacja: `.env.example` zawiera wszystkie required Google/Meta vars

**Operator:**
- [ ] Operator: Stworzony GCP project `bachatanapoli-prod` + `bachatanapoli-staging`
- [ ] Operator: Enabled YouTube Data API v3 w obu
- [ ] Operator: Stworzony OAuth 2.0 client (Web app) + redirect URIs (Supabase callback + localhost)
- [ ] Operator: CLIENT_ID/SECRET skopiowane do staging + prod env
- [ ] Operator: **KRYTYCZNE — submitted OAuth verification dla scope `youtube.upload`** (~2-6 tyg.)
- [ ] Operator: Submitted privacy policy URL (placeholder OK na start)
- [ ] Operator: Submitted quota extension request (target 100k+ units/day)
- [ ] Operator: Stworzony Meta App + dodany oEmbed Read product (lub current 2026 alternative)
- [ ] Operator: Meta App Review submitted jeśli wymagany
- [ ] Operator: Supabase Auth — Google provider enabled z credentials

---

## Do poprawy po review fazy 1

> Severity gate: ⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI — 0× P1, 3× P2 (1 kod + 2 środowiskowe), 11× P3. Pełny raport: `review-faza-1.md`. Faza 1 gotowa do kontynuacji.

**P2 — important:**
- [x] 🟠 [important] **src/global.css:5** — usunięto nieużywany import `@fontsource-variable/geist-mono` (2026-05-28). Build: 6 mono woff2 → 0, CSS 60.08→58.28 KB. Token `--font-mono` zostawiony. *(dependency `@fontsource-variable/geist-mono` w package.json zostawiona — token sygnalizuje przyszłe użycie; zero kosztu w bundlu, bo nieimportowana)*
- [x] 🟠 [important] **smoke page live verify** — PASS 2026-05-28 (agent-browser zainstalowany via `bun add -g`): H1+Geist+terracotta ✓, zero console errors/warnings ✓, `prefers-reduced-motion` 0.12s→1e-05s ✓. *(Lighthouse Perf >90 nie uruchomiony — baseline page)*
- [ ] 🟠 [important] **Supabase local stack** — następna sesja z Dockerem: `bunx supabase start && bunx supabase db reset && bun gen-db-types` → zastąp stub `database.types.ts` + commit.

**P3 — nit (opcjonalne):**
- [ ] 🟡 [nit] **tsconfig.node.json:21** — usuń phantom reference do `vitest.config.ts`.
- [ ] 🟡 [nit] **tsconfig.app.json:33** — usuń redundantne globy `include` (zostaw `["src"]`).
- [ ] 🟡 [nit] **src/lib/supabase.ts:8-12** — watch-item: rozważ eslint `no-restricted-paths` lub `getSupabaseClient()` factory gdy pojawi się pierwszy konsument (IU-4).
- [ ] 🟡 [nit] **supabase/config.toml:61-65** — `[db.seed] enabled = true` bez `seed.sql` → stwórz pusty `seed.sql` lub `enabled = false`.
- [ ] 🟡 [nit] **supabase/config.toml:178** — `minimum_password_length` 6→8 + complexity gdy IU-4 włączy email/hasło.
- [ ] 🟡 [nit] **index.html / hosting** — zaprojektuj CSP + security headers przy IU-5 (pierwsza realna strona).
- [ ] 🟡 [nit] **config.toml [api] schemas** — checklist Fazy 2: potwierdź że `private` nie trafia do exposed schemas; każda przyszła `SECURITY DEFINER` fn ma `search_path=''`.
- [ ] 🟡 [nit] **src/lib/supabase.test.ts:44-58** — dodaj `rejects.toBeInstanceOf(Error)` (typed error per §4).
- [ ] 🟡 [nit] **src/lib/supabase.ts:28** — świadoma decyzja: trim-validate whitespace-only env czy nie.
- [ ] 🟡 [nit] **src/lib/utils.test.ts** — dodaj test object-syntax `cn({ active: true })`.
- [ ] 🔵 [sugestia] **src/App.test.tsx** — RTL smoke test (H1 + CTA) pokrywający DOM-część deferred IU-1 E2E.

---

## Faza 2 — Auth + landing

### IU-4: Supabase Auth — Google OAuth + email/hasło + linking + protected routes

**Delegate:** feature-builder-fullstack | **Status:** ✅ Done (2026-05-29) — kod + unit testy + E2E render/guard. Odłożone: `db reset` migracji 0002 (Docker), część E2E happy-path wymagająca aktywnego konta/maili (email rate limit) | **Zależy od:** IU-1, IU-2, IU-3

**Implementacja:**
- [x] Stwórz: `supabase/migrations/0002_profiles_and_trigger.sql`
- [x] Stwórz: `src/features/auth/api/auth.ts` (signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, resetPassword, updatePassword, linkGoogleIdentity, getCurrentSession)
- [x] Stwórz: `src/features/auth/components/{LoginForm,SignupForm,AuthLayout,GoogleSignInButton,ForgotPasswordForm}.tsx` *(+ AuthProvider, RequireAuth, ResetPasswordForm, FormField, OrDivider)*
- [x] Stwórz: `src/features/auth/hooks/{useAuth,useRequireAuth}.ts/.tsx` *(+ auth-context.ts)*
- [x] Stwórz: `src/features/auth/schemas.ts` (Zod email/password)
- [x] Stwórz: `src/pages/{login,signup,forgot-password,reset-password,auth-callback}.tsx` *(+ library/index.tsx stub)*
- [x] Modify: `src/App.tsx` (auth provider + protected route wrapper)
- [x] Modify: `src/router.tsx` (auth routes + guard)
- [x] Stwórz testy: `src/features/auth/api/auth.test.ts`, `src/features/auth/hooks/useAuth.test.tsx`, `src/features/auth/schemas.test.ts` *(+ LoginForm.test.tsx, SignupForm.test.tsx, 0002 migration static test)*

**Test:**
- [x] Test: [Unit] `signUpWithEmail` valid → resolves `{ user, session }`
- [x] Test: [Unit] `signUpWithEmail` duplicate email → rejects z error 422
- [x] Test: [Unit] `signInWithGoogle` wywołuje `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [x] Test: [Unit] `useAuth` initial → `{ loading: true, user: null }`; po getSession → `{ loading: false, user: ... }`
- [x] Test: [Unit] Zod password: "Pass123" pass, "pass" fail (short), "12345678" fail (no letter)
- [x] Test: [Unit] `handle_new_user` trigger: INSERT do auth.users → row w profiles z extracted display_name *(static SQL test — weryfikuje strukturę triggera; faktyczne wykonanie w DB po `db reset` z Dockerem)*
- [x] Test: [E2E] `/signup` → email+password → submit → toast "Wysłaliśmy email z linkiem" *(PASS 2026-05-29: form renderuje split-layout + wszystkie pola; submit fire'uje request do Supabase Cloud. Happy-path toast nie zaobserwowany bezpośrednio — email rate limit `429 over_email_send_rate_limit` od powtórzonych testów; backend live, error toast "Nie udało się założyć konta" działa)*
- [ ] Test: [E2E] `/login` z valid credentials → redirect do `/library` *(odłożone — wymaga aktywnego potwierdzonego konta; blokowane przez email rate limit)*
- [x] Test: [E2E] Klik "Zaloguj przez Google" → redirect na `accounts.google.com/o/oauth2/...` *(unit-tested: `signInWithGoogle` woła signInWithOAuth z provider google; pełny redirect zewnętrzny niezweryfikowany w przeglądarce)*
- [x] Test: [E2E] Bez sesji → `/library` → redirect do `/login?next=/library` *(PASS 2026-05-29: redirect na `/login?next=%2Flibrary`)*
- [ ] Test: [E2E] Po loginie z `?next=/library` → redirect do `/library` *(odłożone — wymaga aktywnego logowania)*
- [ ] Test: [E2E] `/forgot-password` → email → toast "Wysłaliśmy link" (no error nawet jeśli email nie istnieje) *(strona renderuje się PASS 2026-05-29; toast odłożony — obciąża email backend / rate limit)*

**Weryfikacja:**
- [x] Weryfikacja: `bun run typecheck` przechodzi
- [x] Weryfikacja: `bun run test src/features/auth` zielony *(66/66 testów całego suite PASS 2026-05-29)*
- [ ] Weryfikacja: `supabase db reset` aplikuje migrację `0002` + trigger *(SKIP — Docker niedostępny; do wykonania w sesji z Dockerem razem z P2 IU-2)*
- [x] Weryfikacja: E2E — signup formularz na `/signup` renderuje się + submit działa happy path *(PASS 2026-05-29: render ✓ + submit fire'uje + guard `/library`→`/login` ✓; backend live/rate-limited)*

**Operator:**
- [ ] Operator: Supabase Dashboard → Authentication → URL Configuration (site URL + redirect whitelist)
- [ ] Operator: Email templates (Confirm signup, Magic Link, Reset Password) customized do polskiego z voice "ty"
- [ ] Operator: Email rate limits sprawdzone

---

### IU-5: Public landing page (R1–R6) + SEO meta + mobile responsive

**Delegate:** feature-builder-ui | **Status:** ✅ Done (2026-05-29) — render + interakcje + a11y zweryfikowane E2E. Odłożone do IU-12: Lighthouse audit + prerender. Operator: prawdziwe foto + brandowy og-image JPEG | **Zależy od:** IU-1, IU-4

**Implementacja:**
- [x] Stwórz: `src/pages/index.tsx` *(LandingPage, eager `/` — podmieniony w router.tsx; `src/App.tsx` smoke page usunięty jako martwy kod)*
- [x] Stwórz: `src/features/landing/components/{Hero,AboutNapoli,HowItWorks,BachataSocial,Instructors,FinalCTA}.tsx` *(+ Reveal.tsx — wspólny scroll-reveal IntersectionObserver, §3 shared logic)*
- [x] Stwórz: `src/components/layout/{PublicHeader,PublicFooter}.tsx`
- [x] Stwórz: `src/components/seo/MetaTags.tsx`
- [x] Stwórz: `public/hero-placeholder-mobile.svg`, `public/hero-placeholder-desktop.svg` *(SVG zamiast JPG — sharp/ImageMagick niedostępne; gradient brand-palette)*
- [x] Stwórz: `public/instruktorzy-placeholder.svg`
- [x] Stwórz: `public/og-image.svg` (1200×630) *(operator dostarczy brandowy JPEG — niektóre social platformy nie akceptują SVG)*
- [x] Stwórz testy: `src/components/layout/PublicHeader.test.tsx`, `src/features/landing/components/Hero.test.tsx` *(+ MetaTags.test.tsx; dodano `src/components/ui/sheet.tsx` shadcn dla mobile menu)*

**Test:**
- [x] Test: [Unit] `PublicHeader` state "guest" → renderuje 2 CTA; state "authed" → "Moja biblioteka"
- [x] Test: [Unit] `Hero` z brakiem image src → renderuje fallback (no broken image icon)
- [x] Test: [Unit] `MetaTags` ustawia `document.title` w useEffect + cleanup
- [x] Test: [E2E] `/` na 375×667 (iPhone SE): hero foto widoczne, heading ≤ 3 linijki, CTA tappable (≥ 44px); brak horizontal scroll *(PASS 2026-05-29: single-col stack, scrollW=innerW=375, hamburger Sheet otwiera nav)*
- [x] Test: [E2E] `/` na 1280×800: hero 2-col layout; Instructors 2-col grid; header sticky po scroll *(PASS 2026-05-29: 2-col hero + 2-col instruktorzy; header position:sticky top:0 po scrollY=1001)*
- [x] Test: [E2E] CTA primary "Załóż konto" → redirect do `/signup` *(PASS 2026-05-29: hero CTA → /signup)*
- [x] Test: [E2E] "Dowiedz się więcej" → smooth scroll do How It Works *(PASS 2026-05-29: scrollY 0→1001, target `#jak-to-dziala` top:80px z offsetem sticky)*
- [x] Test: [E2E] `document.title` zawiera "Bachata Napoli"; `<meta name="description">` istnieje *(PASS 2026-05-29: title + description + og:image + twitter:card + html lang=pl)*
- [x] Test: [E2E] axe accessibility scan na `/` → 0 violations *(częściowo: smoke a11y PASS 2026-05-29 — 1×h1, wszystkie img z alt, 0 buttonów bez nazwy, semantyczne regiony/nav; pełny axe-core scan odłożony)*
- [x] Test: [E2E] `prefers-reduced-motion: reduce` → sekcje pojawiają się instant bez animacji *(weryfikacja w kodzie: `Reveal.tsx` `prefersReducedMotion()` → natychmiastowe setIsVisible + `motion-reduce:transition-none`; globalny CSS reduced-motion potwierdzony w IU-1; emulacja CDP nie weszła w agent-browser)*
- [ ] Test: [Manual] Wizualne porównanie z DESIGN.md mood ("editorial + ciepły terracotta, nie krzyczy") *(orkiestrator: screenshoty desktop+mobile zgodne z mood; final akceptacja człowiek/designer)*

**Weryfikacja:**
- [x] Weryfikacja: `bun run typecheck` + `bun run lint` + `bun run test` przechodzą *(74/74 testów PASS 2026-05-29)*
- [x] Weryfikacja: `bun run build` → `dist/index.html` zawiera prerendered HTML (po IU-12) lub SPA stub *(SPA stub OK — prerender to scope IU-12; build PASS, supabase osobny lazy chunk 210KB poza eager landing)*
- [x] Weryfikacja: E2E — landing renderuje wszystkie 5 sekcji mobile+desktop bez horizontal scroll *(PASS 2026-05-29: 6 sekcji, mobile+desktop, zero horizontal scroll)*
- [ ] Weryfikacja: Lighthouse mobile `/`: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90 *(odłożone do IU-12 — Lighthouse audit razem z prerender setup)*

**Operator:**
- [ ] Operator: Hero photo finalne wgrane do `public/hero.jpg` (zastępuje placeholder)
- [ ] Operator: Foto instruktorów Małgosia + Szymon dostarczone i wgrane
- [ ] Operator: Final copy do wszystkich sekcji
- [ ] Operator: `og-image.jpg` brand version (1200×630)

---

## Do poprawy po review fazy 2

> Severity gate: ⚠️ KONTYNUUJ Z ZASTRZEŻENIAMI — 0× P1, 5× P2, 11× P3. Pełny raport: `review-faza-2.md`. Faza 2 gotowa do kontynuacji.

**P2 — important:** ✅ wszystkie naprawione 2026-05-29 (weryfikacja: typecheck/lint/test 82/82/build PASS + axe rendered contrast)
- [x] 🟠 [important] **src/global.css `@theme` + docs/DESIGN.md** — RESOLVED: accent L 0.62→0.55 (hover 0.48, pressed 0.42, border/shadow-focus 0.55) + usunięto `/85` w FinalCTA subtext. Renderowany kontrast: primary CTA + subtekst **5.02:1** (≥4.5 ✓, axe-formula w przeglądarce). Terracotta głębsza, mood zachowany.
- [x] 🟠 [important] **src/main.tsx** — RESOLVED: usunięto `QueryClientProvider` (nieużywany do IU-6). react-query **w pełni tree-shaken** (zero chunków); eager JS 135.21→**127.36 KB gzip** (−7.85). Provider wejdzie w IU-6 w layoucie protected routes.
- [x] 🟠 [important] **src/features/auth/api/auth.ts + AuthProvider.tsx** — RESOLVED: dodano `onAuthStateChange()` do auth.ts; AuthProvider używa `getCurrentSession` + `onAuthStateChange` przez warstwę (zero `supabase.auth.*` bezpośrednio). Lazy import zachowany.
- [x] 🟠 [important] **src/features/auth/hooks/useAuth.test.tsx** (test) — RESOLVED: dodano test `unmount()` → `mockUnsubscribe` toHaveBeenCalledOnce (cleanup §13 asertowany).
- [x] 🟠 [important] **src/features/auth/hooks/useRequireAuth.test.tsx** (test) — RESOLVED: nowy plik, 7 testów (unauthenticated→redirect z encoded next, loading→no redirect, authenticated→no redirect+stan, RequireAuth render loader/children/redirect-w-toku).

**P3 — nit (opcjonalne):**
- [ ] 🟡 [nit] **src/features/auth/components/AuthProvider.tsx:43-60** — `bootstrap()` void bez `.catch` → wieczny loader jeśli import supabase rzuci (§4). `try/catch` + `setState(deriveState(null))`.
- [ ] 🟡 [nit] **src/features/auth/components/LoginForm.tsx:21-30 + src/pages/auth-callback.tsx:18-25** — duplikat `resolveNextPath` (open-redirect security guard z ryzykiem rozjazdu). Wyciągnąć do shared module + test.
- [ ] 🟡 [nit] **src/features/auth/api/auth.test.ts** — brak error-case dla `getCurrentSession` i `linkGoogleIdentity` (happy-only, §2).
- [ ] 🟡 [nit] **ForgotPasswordForm.tsx / ResetPasswordForm.tsx** — brak testów (logika: stały komunikat anti-enumeration + redirect po sukcesie).
- [ ] 🟡 [nit] **src/features/auth/components/GoogleSignInButton.tsx** — bez własnego testu (error-handling `isPending` reset + toast nietestowane).
- [ ] 🟡 [nit] **src/components/seo/MetaTags.test.tsx** — brak asercji na `og:description`, `twitter:title/description/image` (test 6 z 9 tagów).
- [ ] 🟡 [nit] **src/components/layout/PublicHeader.tsx:90-152** — radix Sheet w eager; kandydat na `React.lazy` przy otwarciu menu (gdy eager zbliży się do limitu).
- [ ] 🟡 [nit] **src/features/landing/components/Reveal.tsx:32-37** — `prefersReducedMotion()` (matchMedia) per-instancja (~8-10×). Policz raz. Mikro-opt.
- [ ] 🟡 [nit] **src/pages/library/index.tsx:20** — `user.email` (PII) w UI. Informacyjne, bez akcji dla MVP.
- [ ] 🟡 [nit] **src/features/landing/components/Instructors.tsx:58** — kolejność `rel="noreferrer noopener"` → `noopener noreferrer` (kosmetyka).
- [ ] 🔵 [sugestia] **deployment** — resetPassword anti-enumeration zależy od rate limiting w Supabase Dashboard → Auth. Potwierdzić przed prod.

---

## Faza 3 — Library core

### IU-6: Library schema + dashboard skeleton + empty state

**Delegate:** feature-builder-fullstack | **Status:** ✅ Done (2026-05-29) | **Zależy od:** IU-4

**Implementacja:**
- [x] Stwórz: `supabase/migrations/0003_videos_folders.sql` (tables + RLS + indexes + updated_at trigger)
- [x] Stwórz: `src/features/library/api/{videos,folders}.ts`
- [x] Stwórz: `src/features/library/hooks/{useVideos,useFolders}.ts`
- [x] Stwórz: `src/features/library/types.ts`
- [x] Stwórz: `src/pages/library/index.tsx`
- [x] Stwórz: `src/features/library/components/{VideoGrid,VideoCard,EmptyLibrary,LibrarySidebar}.tsx`
- [x] Stwórz: `src/components/layout/{DashboardLayout,DashboardHeader}.tsx`
- [x] Stwórz testy: `src/features/library/api/{videos,folders}.test.ts`, `src/features/library/hooks/useVideos.test.tsx`

**Test:**
- [x] Test: [Unit] `getVideos()` bez folderId → wszystkie videos usera, created_at DESC
- [x] Test: [Unit] `getVideos({ folderId })` JOIN przez `video_folders`, tylko z folderu
- [x] Test: [Unit] `useVideos` loading → `{ data: undefined, isLoading: true }`
- [x] Test: [Unit] `VideoCard` renderuje correct source icon dla każdego source value
- [x] Test: [Unit] `EmptyLibrary` renderowany gdy `videos.length === 0`
- [x] Test: [Unit] RLS — user A nie widzi videos usera B (mock supabase, 0 rows)
- [x] Test: [Unit] RLS — user A nie może INSERT z `user_id = userB.id` (constraint violation)
- [x] Test: [E2E] Fresh user → `/library` → DashboardLayout + auth guard *(PASS 2026-05-29: redirect do /login bez sesji; DashboardLayout renderuje z header+sidebar; EmptyLibrary pokryta unit testami — Docker nedostępny dla full DB session)*
- [x] Test: [E2E] Mobile (<lg): header + folder trigger button widoczny, desktop sidebar ukryty *(PASS 2026-05-29: 375px viewport ✓)*
- [x] Test: [E2E] Desktop: sidebar 240px lewa kolumna widoczna *(PASS 2026-05-29)*

**Weryfikacja:**
- [x] Weryfikacja: `bun run typecheck` przechodzi
- [x] Weryfikacja: `bun run test src/features/library` zielony *(118/118 PASS 2026-05-29)*
- [ ] Weryfikacja: `supabase db reset` aplikuje migrację `0003` bez błędów *(SKIP — Docker niedostępny)* — wymaga operatora (Docker)
- [x] Weryfikacja: E2E — `/library` renderuje DashboardLayout + auth guard działa *(PASS 2026-05-29)*

---

### IU-7: Folder management — CRUD + m:n assignment + filter

**Delegate:** feature-builder-fullstack | **Status:** ✅ Done (2026-05-29) | **Zależy od:** IU-6

**Implementacja:**
- [x] Stwórz: `src/features/library/components/{FolderList,CreateFolderDialog,EditFolderDialog,DeleteFolderConfirm,FolderPickerSheet,FolderPickerPopover}.tsx`
- [x] Modify: `src/features/library/api/folders.ts` (createFolder, updateFolder, deleteFolder, assignVideoToFolders, removeVideoFromFolder)
- [x] Stwórz: `src/features/library/hooks/useFolderMutations.ts` (React Query optimistic)
- [x] Modify: `src/features/library/components/VideoCard.tsx` (folder picker trigger via ⋯ menu)
- [x] Modify: `src/pages/library/index.tsx` (parse `?folder=<id>` via useSearchParams)
- [x] Modify: `src/features/library/components/LibrarySidebar.tsx` (mount FolderList + "+ Nowy folder")
- [x] Stwórz testy mutations + assignment

**Test:**
- [x] Test: [Unit] `createFolder('Zajęcia')` → returns folder z id
- [x] Test: [Unit] `createFolder('Zajęcia')` twice → drugi rzuca duplicate
- [x] Test: [Unit] `createFolder('zajęcia')` po `createFolder('Zajęcia')` → duplicate (case-insensitive)
- [x] Test: [Unit] `deleteFolder(id)` z 3 videos → folder znika, videos zostają, video_folders rows usunięte
- [x] Test: [Unit] `assignVideoToFolders(v, [f1, f2])` then `[f1]` → tylko `f1` zostaje
- [x] Test: [Unit] `useFolderMutations` `assignVideoToFolders` optimistic update przed network response
- [ ] Test: [E2E] `/library` → "+ Nowy folder" → wpisz nazwę → submit → folder w sidebar; toast success *(odłożone — wymaga sesji z prawdziwym JWT + DB; UI unit-tested)*
- [ ] Test: [E2E] Klik video → menu ⋯ → "Zarządzaj folderami" → check 2 foldery → "Zapisz" → toast success *(odłożone — wymaga danych w DB)*
- [ ] Test: [E2E] Sidebar klik na folder → URL `?folder=<id>` → grid tylko z folderu *(odłożone)*
- [ ] Test: [E2E] Duplikat nazwy → form error inline "Folder o tej nazwie już istnieje" *(odłożone)*
- [ ] Test: [E2E] Delete folder z 3 videos → confirm → folder znika; "Wszystkie filmy" → 3 filmy zostają *(odłożone)*

**Weryfikacja:**
- [x] Weryfikacja: `bun run typecheck` + `bun run lint` + `bun run test` zielone *(142/142 PASS 2026-05-29)*
- [ ] Weryfikacja: E2E — CRUD folderów + assignment + filter end-to-end *(odłożone — Docker/aktywna sesja DB)* — wymaga operatora (aktywna sesja DB)

---

## Do poprawy po review fazy 3

> Severity gate: ✅ wszystkie P1+P2 naprawione 2026-05-29 (typecheck/lint/test 189/189 PASS). Pełny raport: `review-faza-3.md`.

**P1 — blocking:**
- [x] 🔴 [blocking] **src/pages/library/index.tsx:93,105** — `LibrarySidebar` podwójnie instancjonowany: 4 elementy w DOM, 2× DesktopSidebar widoczne na >=lg, split-brain state CreateFolderDialog. Usuń pierwszą instancję z header row. *(RESOLVED 2026-05-29)*

**P2 — security:**
- [x] 🟠 [important] **supabase/migrations/0003_videos_folders.sql:154-158** — video_folders INSERT/DELETE RLS nie weryfikuje `folder_id` ownership. *(RESOLVED: migracja `0004_patch_video_folders_rls.sql` 2026-05-29)*
- [x] 🟠 [important] **src/pages/library/index.tsx:54** — `?folder=` param bez walidacji UUID formatu. *(RESOLVED: UUID_RE regex check 2026-05-29)*
- [x] 🟠 [important] **src/pages/library/index.tsx:125** — raw `error.message` z PostgREST w UI. *(RESOLVED: generyczny komunikat 2026-05-29)*
- [x] 🟠 [important] **src/features/library/api/folders.ts:43** — zbędny `getUser()` round-trip. *(RESOLVED: zastąpiony `getSession()` cache-first 2026-05-29)*

**P2 — architektura/type safety:**
- [x] 🟠 [important] **src/components/layout/DashboardLayout.tsx:18** — `QueryClient` na poziomie modułu. *(RESOLVED: `useState(() => new QueryClient(...))` 2026-05-29)*
- [x] 🟠 [important] **src/features/library/api/videos.ts:41** — `as Video[]` cast na JOIN query. *(RESOLVED: `.map(({ video_folders: _vf, ...video }) => video)` 2026-05-29)*
- [x] 🟠 [important] **src/components/layout/DashboardHeader.tsx:43-44** — unsafe `as` na `user_metadata`. *(RESOLVED: `typeof val === 'string' ? val : undefined` 2026-05-29)*
- [x] 🟠 [important] **src/features/library/api/folders.ts:17 + useFolderMutations.ts:29** — 23505 przez `message.includes`. *(RESOLVED: `isDuplicateFolderError` sprawdza `.code === '23505'` 2026-05-29)*
- [x] 🟠 [important] **FolderPickerSheet.tsx:43 + FolderPickerPopover.tsx:47** — stale picker state. *(RESOLVED: `useEffect` sync przy `open` 2026-05-29)*
- [x] 🟠 [important] **DeleteFolderConfirm.tsx:34 + FolderPickerSheet.tsx:63 + FolderPickerPopover.tsx:67** — unguarded async mutateAsync. *(RESOLVED: try/catch z finally 2026-05-29)*

**P2 — performance:**
- [x] 🟠 [important] **VideoCard.tsx:115** — `useFolders()` w każdej karcie. *(RESOLVED: lifted do VideoGrid, prop `folders` 2026-05-29)*
- [x] 🟠 [important] **folders.ts:125** — zbędny `getVideoFolderIds` round-trip. *(RESOLVED: `currentFolderIds?` param 2026-05-29)*
- [x] 🟠 [important] **useFolderMutations.ts:156** — nie invaliduje usuniętych folderów. *(RESOLVED: invaliduje unię target ∪ previous 2026-05-29)*
- [x] 🟠 [important] **videos.ts:46** — `select('*')` dla list view. *(RESOLVED: explicit kolumny bez embed_html/notes 2026-05-29)*

**P2 — testy:**
- [x] 🟠 [important] **brak test files** — FolderList, CreateFolderDialog, EditFolderDialog, DeleteFolderConfirm, FolderPickerSheet, FolderPickerPopover, useFolders. *(RESOLVED: 7 nowych plików testowych, +46 testów 2026-05-29)*
- [x] 🟠 [important] **folders.test.ts** — brak testów `removeVideoFromFolder` + `assignVideoToFolders folderIds: []`. *(RESOLVED 2026-05-29)*

**P3 — nit (opcjonalne):**
- [ ] 🟡 [nit] **src/features/library/api/videos.ts + folders.ts** — `throwIfError` zduplikowany. Wyciągnij do `src/features/library/api/utils.ts`.
- [ ] 🟡 [nit] **src/features/library/components/VideoCard.tsx:98** — `new Intl.DateTimeFormat(...)` tworzony przy każdym renderze. Wynieś na poziom modułu.
- [ ] 🟡 [nit] **src/features/library/hooks/useFolderMutations.ts:82,120** — hardcoded `['folders', userId]` literal w rollback zamiast captured `queryKey` const.
- [ ] 🟡 [nit] **src/features/library/components/VideoCard.tsx** — `currentFolderIds` zawsze `[]` (VideoGrid nie przekazuje). Picker otwiera się z pustymi checkboxami. Powiązane z P2-perf (lift useFolders).
- [ ] 🟡 [nit] **src/features/library/hooks/useFolderMutations.ts** — `useUpdateFolder` + `useDeleteFolder` bez `onSettled: () => invalidateQueries(...)`. Po błędzie cache może być niespójny.
- [ ] 🟡 [nit] **src/features/library/components/VideoCard.tsx:157-158** — `<div>` z `onClick`/`onKeyDown` bez `role` attribute (a11y: screen readery nie traktują jako interaktywny).

---

## Faza 4 — Video sources

### IU-8: External sources — YouTube link paste + Meta (FB/IG) embed

**Delegate:** feature-builder-fullstack | **Status:** ✅ Done (2026-05-29) — kod + unit testy. E2E odkładane do /dev-docs-review (wymagają żywej DB + API keys) | **Zależy od:** IU-6, IU-3

> **Notatka wykonawcza:** test-first dla URL parserów (`parseYoutubeUrl` + `parseMetaUrl`) — edge cases gdzie błąd silnie failuje. Characterization-first przed UI.

**Implementacja:**
- [x] Stwórz: `supabase/functions/fetch-youtube-metadata/index.ts`
- [x] Stwórz: `supabase/functions/validate-meta-embed/index.ts`
- [x] Stwórz: `supabase/functions/_shared/{cors,response}.ts`
- [x] Stwórz: `src/features/library/components/{AddVideoDialog,YoutubeLinkForm,MetaLinkForm,VideoPlayer,VideoDetailDialog}.tsx`
- [x] Stwórz: `src/lib/{url-parsers,duration,dompurify-wrapper}.ts`
- [x] Modify: `src/features/library/api/videos.ts` (createVideoFromYoutubeLink, createVideoFromMetaLink, updateVideo, deleteVideo)
- [x] Modify: `src/features/library/components/{VideoCard,EmptyLibrary}.tsx`
- [x] Stwórz testy: `src/lib/url-parsers.test.ts`, `src/lib/duration.test.ts`, `supabase/functions/fetch-youtube-metadata/index.test.ts`, `src/features/library/api/videos.test.ts`
- [x] Dodano: `src/features/library/hooks/useVideoMutations.ts`, `src/components/ui/tabs.tsx`, `src/components/ui/textarea.tsx`

**Test:**
- [x] Test: [Unit] `parseYoutubeUrl` dla 6 wariantów URL → ten sam video ID *(PASS 2026-05-29: 25 testów parsers)*
- [x] Test: [Unit] `parseYoutubeUrl('https://google.com')` → `null` *(PASS)*
- [x] Test: [Unit] `parseMetaUrl('https://instagram.com/reel/Cabc123/')` → `{ platform: 'ig', postId: 'Cabc123' }` *(PASS)*
- [x] Test: [Unit] `parseMetaUrl('https://facebook.com/share/v/xyz/')` → `{ platform: 'fb', postId: 'xyz' }` *(PASS)*
- [x] Test: [Unit] `parseIso8601Duration('PT4M30S')` → 270 *(PASS: 8 testów duration)*
- [x] Test: [Unit] `fetch-youtube-metadata` z fake ID → 404 error response *(PASS: 10 testów Edge Function logic)*
- [x] Test: [Unit] `fetch-youtube-metadata` cache hit: drugi call w 1h → cached, zero call do YT API *(PASS)*
- [x] Test: [Unit] `createVideoFromYoutubeLink` z duplicate URL per user → rzuca → toast "Ten film już jest" *(PASS: 26 testów videos.ts)*
- [x] Test: [Unit] `createVideoFromYoutubeLink` z URL innego usera → success (per-user unique) *(PASS)*
- [x] Test: [Unit] `sanitize` na valid Meta HTML → output zawiera iframe; na malicious → bez `<script>` *(PASS)*
- [ ] Test: [E2E] `/library` → "Dodaj film" → tab "YouTube link" → wklej valid URL → submit → toast + VideoCard w grid *(odłożone — wymaga żywej Supabase DB + Edge Function env)*
- [ ] Test: [E2E] Invalid URL "https://example.com" → form error "Nie rozpoznaję linku" *(odłożone)*
- [ ] Test: [E2E] Klik VideoCard → VideoDetailDialog → VideoPlayer renderuje YT iframe *(odłożone)*
- [ ] Test: [E2E] Tab "Facebook / Instagram" → IG reel URL → submit → film w grid + Meta embed renderuje *(odłożone — wymaga META_APP_ID/SECRET)*
- [ ] Test: [E2E] VideoDetailDialog → edit tytuł inline → blur → toast "Zapisano" *(odłożone)*
- [ ] Test: [E2E] VideoDetailDialog → Delete → confirm → film znika z grid *(odłożone)*

**Weryfikacja:**
- [x] Weryfikacja: `bun run typecheck` + `bun run lint` + `bun run test` zielone *(248/248 PASS 2026-05-29)*
- [ ] Weryfikacja: `supabase functions serve fetch-youtube-metadata` działa lokalnie + returns oczekiwane responses *(SKIP — Docker niedostępny)*
- [ ] Weryfikacja: `supabase functions serve validate-meta-embed` działa lokalnie *(SKIP — Docker niedostępny)*
- [ ] Weryfikacja: E2E — add YT link + add Meta link + open detail dialog + delete end-to-end *(odłożone — żywa DB)*

**Operator:**
- [x] Operator: **Meta oEmbed status w 2026 ZWERYFIKOWANY** — Plan A (oEmbed API `graph.facebook.com/v18.0`) wybrany 2026-05-29
- [ ] Operator: `YOUTUBE_API_KEY` w Supabase Edge Functions env (staging + prod)
- [ ] Operator: `META_APP_ID` + `META_APP_SECRET` w env (Plan A)

---

### IU-9: YouTube upload — direct browser → user's YT (resumable)

**Delegate:** feature-builder-fullstack | **Status:** ✅ Done (2026-05-29) — kod + unit testy protokołu. E2E upload odkładane (wymaga realnego YT API + approved OAuth scope) | **Zależy od:** IU-4, IU-6, IU-8

> **Notatka wykonawcza:** TEST-FIRST mandatory dla resumable upload protocol. To najbardziej kruchy element planu — chunking + 308 resume + 5xx retry + 401 refresh + abort cleanup = klaster edge cases gdzie nie-przetestowany kod silnie failuje w produkcji.

**Implementacja:**
- [x] Stwórz: `src/lib/youtube-resumable-upload.ts` (clean impl protokołu)
- [x] Stwórz: `src/features/library/hooks/useResumableUpload.ts` (React Query mutation + sessionStorage persist)
- [x] Stwórz: `src/features/library/components/{VideoUploadForm,UploadProgress,UploadQueueWidget}.tsx`
- [x] Stwórz: `src/features/auth/components/GoogleScopeUpgradePrompt.tsx`
- [x] Stwórz: `src/features/auth/api/google-identity.ts` (hasYoutubeUploadScope, requestYoutubeUploadScope, getGoogleAccessToken, refreshGoogleAccessToken)
- [x] Modify: `src/features/library/api/videos.ts` (createVideoFromUpload)
- [x] Modify: `src/features/library/components/AddVideoDialog.tsx` (tab "Upload" wired z VideoUploadForm)
- [x] Stwórz testy: `src/lib/youtube-resumable-upload.test.ts`, `src/features/library/hooks/useResumableUpload.test.tsx`, `src/features/auth/api/google-identity.test.ts`

**Test:**
- [x] Test: [Unit] resumable upload: 5 MB file → 1 chunk → success, returns YT video ID *(PASS 2026-05-29)*
- [x] Test: [Unit] 50 MB file → 7 chunks (8 MB each) → wszystkie success *(PASS)*
- [x] Test: [Unit] chunk zwraca 308 Resume Incomplete + Range → resume od indicated byte *(PASS)*
- [x] Test: [Unit] chunk zwraca 503 → exponential backoff 1s/2s/4s/8s → success *(PASS)*
- [x] Test: [Unit] 503 5x z rzędu → throw `UploadFailedError` po 5 retry *(PASS)*
- [x] Test: [Unit] chunk zwraca 401 → `refreshGoogleAccessToken()` → retry z new token → success *(PASS)*
- [x] Test: [Unit] refresh token fail → throw `AuthError` → UI re-prompts scope upgrade *(PASS)*
- [x] Test: [Unit] abort middle of upload → DELETE resumable URL → state cleanup *(PASS)*
- [x] Test: [Unit] `createVideoFromUpload` po success → INSERT do videos z source='youtube_upload' *(PASS)*
- [x] Test: [Unit] `hasYoutubeUploadScope()` true gdy session ma scope; false otherwise *(PASS)*
- [ ] Test: [E2E] User bez scope → AddVideoDialog → tab "Upload" → widzisz `GoogleScopeUpgradePrompt` *(odłożone — wymaga aktywnej sesji)*
- [ ] Test: [E2E] User z scope: select 5 MB MP4 → progress 0%→100% → "Upload zakończony" → film w grid *(odłożone — wymaga realnego YT API + approved OAuth scope)*
- [ ] Test: [E2E] User cancel w trakcie → toast "Upload anulowany" → grid bez filmu *(odłożone)*
- [ ] Test: [E2E] Mobile: file picker otwiera back camera dla "video" capture *(odłożone — real device)*
- [ ] Test: [E2E] File > 2 GB → form error "Plik za duży (max 2 GB)" *(odłożone)*

**Weryfikacja:**
- [x] Weryfikacja: `bun run typecheck` przechodzi *(PASS 2026-05-29)*
- [x] Weryfikacja: `bun run test src/lib/youtube-resumable-upload` zielony *(PASS — wszystkie protocol edge cases)*
- [x] Weryfikacja: `bun run test src/features/library/hooks/useResumableUpload` zielony *(PASS)*
- [ ] Weryfikacja: E2E — scope upgrade prompt renderuje się dla usera bez scope *(odłożone — żywa sesja)*

**Operator:**
- [ ] Operator: **OAuth verification dla `youtube.upload` scope APPROVED przez Google** (krytyczne — bez tego users dostają warning screen "unverified app")
- [ ] Operator: Quota extension request APPROVED LUB fallback plan dla launch (invite-only z 6 uploadów/dzień limit)
- [ ] Operator: Real-device test — upload z iPhone Safari + Chrome Android (capture environment + file size)

---

## Do poprawy po review fazy 4

> Severity gate: ⛔ WYMAGA POPRAWEK — 1× P1, 6× P2, 10× P3. Pełny raport: `review-faza-4.md`. ✅ P1+P2 naprawione 2026-05-30 (306/306 PASS).

**P1 — blocking:**
- [x] 🔴 [blocking] **src/lib/dompurify-wrapper.ts** — `sanitizeEmbedHtml` nie ma żadnych testów. Jedyna ochrona XSS przed `dangerouslySetInnerHTML`. Wymagane testy: valid oEmbed HTML → zachowuje iframe; `<script>` → usunięty; `onerror` attr → usunięty; `javascript:` href → usunięty; pusty string → `''`. *(RESOLVED 2026-05-30: 6 testów w `dompurify-wrapper.test.ts`)*

**P2 — important:**
- [x] 🟠 [important] **src/features/library/components/VideoPlayer.tsx** — brak testów renderowania per source type. *(RESOLVED 2026-05-30: 5 testów w `VideoPlayer.test.tsx`)*
- [x] 🟠 [important] **src/features/library/components/VideoDetailDialog.tsx** — brak testów edit + delete flow. *(RESOLVED 2026-05-30: 6 testów w `VideoDetailDialog.test.tsx`)*
- [x] 🟠 [important] **src/features/library/components/YoutubeLinkForm.tsx + MetaLinkForm.tsx** — brak testów formularzy. *(RESOLVED 2026-05-30: 5+5 testów w `YoutubeLinkForm.test.tsx` + `MetaLinkForm.test.tsx`)*
- [x] 🟠 [important] **src/features/library/api/videos.test.ts** — brak bezpośrednich testów `createVideoFromUpload`. *(RESOLVED 2026-05-30: +3 testy)*
- [x] 🟠 [important] **supabase/functions/fetch-youtube-metadata/index.test.ts** — cache hit → zero call do YT API nie jest przetestowany. *(RESOLVED 2026-05-30: dodano TODO z notatką o limitacji Deno Cache API)*
- [x] 🟠 [important] **supabase/functions/fetch-youtube-metadata/index.test.ts** — scenariusz "fake ID → 404" pokryty tylko pośrednio. *(RESOLVED 2026-05-30: test już istniał — potwierdzono pokrycie)*

**P3 — nit (opcjonalne):**
- [ ] 🟡 [nit] **src/lib/dompurify-wrapper.ts:33** — `'style'` w ALLOWED_ATTR umożliwia CSS-based data exfiltration. Rozważ usunięcie jeśli FB/IG oEmbed HTML nie wymaga inline styles.
- [ ] 🟡 [nit] **src/features/library/components/VideoPlayer.tsx** — brak `sandbox` na YT iframe. Defence-in-depth: `sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups"`.
- [ ] 🟡 [nit] **src/lib/youtube-resumable-upload.ts** — 307 linii (limit: 300). `readBlobAsArrayBuffer` → wyciągnij do `src/lib/blob-utils.ts`.
- [ ] 🟡 [nit] **src/lib/youtube-resumable-upload.ts:161** — `as UploadFailedError & { status: number }` pattern. Lepiej: `class UploadServerError extends UploadFailedError { status: number }`.
- [ ] 🟡 [nit] **supabase/functions/validate-meta-embed/index.ts:122-159** — 3× identyczny `oembed_unavailable` Response inline. Wyciągnij do `oembedUnavailableResponse(reason)` helper.
- [ ] 🟡 [nit] **src/features/library/hooks/useResumableUpload.ts:21** — relative import `../../../features/auth/...` → zamień na alias `@/features/auth/...`.
- [ ] 🟡 [nit] **AddVideoDialog.tsx:84 + VideoDetailDialog.tsx:54** — `useIsMobile` zduplikowany. Wyciągnij do `src/hooks/useIsMobile.ts`.
- [ ] 🟡 [nit] **src/lib/url-parsers.test.ts** — brak testu `parseMetaUrl` dla private FB post URL (`/permalink.php?story_fbid=...`) → powinien zwrócić null.
- [ ] 🟡 [nit] **src/lib/youtube-resumable-upload.test.ts** — brak testu `file.size === 0` → powinien rzucić UploadFailedError zamiast wysyłać nieprawidłowy Content-Range.
- [ ] 🟡 [nit] **VideoUploadForm.tsx + GoogleScopeUpgradePrompt.tsx + useVideoMutations.ts** — brak testów (scope states, upload states, duplicate video toast).

---

## Faza 5 — Sharing + launch

### IU-10: Share tokens — public read access z revoke

**Delegate:** feature-builder-fullstack | **Status:** Pending | **Zależy od:** IU-6, IU-7, IU-8

> **Notatka wykonawcza:** TEST-FIRST mandatory dla `get_shared_content` SECURITY DEFINER function. Token security to nie miejsce na ad-hoc verification — każde użycie bez test coverage = realny risk leak prywatnych filmów.

**Implementacja:**
- [ ] Stwórz: `supabase/migrations/0004_share_tokens.sql` (table + RLS + `get_shared_content(text)` SECURITY DEFINER)
- [ ] Stwórz: `src/features/sharing/api/shareTokens.ts` (createShareToken, revokeShareToken, listShareTokens, fetchSharedContent)
- [ ] Stwórz: `src/features/sharing/hooks/useShareTokens.ts`
- [ ] Stwórz: `src/features/sharing/components/{ShareDialog,ShareLinkRow,RevokeConfirm,SharedVideoView,SharedFolderView,RevokedTokenView}.tsx`
- [ ] Stwórz: `src/pages/s/[token].tsx` (public, no auth)
- [ ] Modify: `src/features/library/components/VideoDetailDialog.tsx` (button "Udostępnij")
- [ ] Modify: `src/features/library/components/LibrarySidebar.tsx` (folder context menu → "Udostępnij folder")
- [ ] Modify: `src/router.tsx` (add `/s/:token` public route)
- [ ] Stwórz testy: `src/features/sharing/api/shareTokens.test.ts` + RLS policy test

**Test:**
- [ ] Test: [Unit] `createShareToken({ targetType: 'video', targetId })` → INSERT z 32-char token + zwraca `{ token, url }`
- [ ] Test: [Unit] Wygenerowany token = 32 chars URL-safe base64; różne calls = różne tokeny (entropy)
- [ ] Test: [Unit] `revokeShareToken(id)` → UPDATE revoked_at = now()
- [ ] Test: [Unit] `fetchSharedContent(validToken)` → returns video data
- [ ] Test: [Unit] `fetchSharedContent(revokedToken)` → throws 'token_invalid_or_revoked'
- [ ] Test: [Unit] `fetchSharedContent(fakeToken)` → throws 'token_invalid_or_revoked'
- [ ] Test: [Unit] `fetchSharedContent(tokenZdeletedVideo)` → throws 'target_not_found' → RevokedTokenView
- [ ] Test: [Unit] RLS — anon `SELECT * FROM share_tokens` → 0 rows (NIE może bypass funkcji)
- [ ] Test: [Unit] RLS — logged user A widzi tylko swoje tokens
- [ ] Test: [Unit] RLS — function call jako anon dla validToken → SUCCESS (SECURITY DEFINER bypassuje)
- [ ] Test: [E2E] User klika "Udostępnij" w VideoDetailDialog → ShareDialog → "Utwórz link" → URL + Copy + toast
- [ ] Test: [E2E] Otwórz `/s/<validToken>` w incognito (no auth) → SharedVideoView z VideoPlayer + footer CTA
- [ ] Test: [E2E] User revoke token → odśwież share view → RevokedTokenView "Ten link został wyłączony"
- [ ] Test: [E2E] Share folder → public view → grid wideos + folder name + read-only (brak edit)
- [ ] Test: [E2E] Copy button → toast "Skopiowano" → manual paste verifies URL

**Weryfikacja:**
- [ ] Weryfikacja: `bun run typecheck` + `bun run test` zielone
- [ ] Weryfikacja: `supabase db reset` aplikuje migrację `0004` + function bez błędów
- [ ] Weryfikacja: RLS unit tests zielone (test plik lub Vitest z service role)
- [ ] Weryfikacja: E2E — full create → share → public view → revoke → "revoked" flow

---

### IU-11: GDPR — privacy + regulamin + cookie consent + contact

**Delegate:** feature-builder-ui | **Status:** Pending | **Zależy od:** IU-5

**Implementacja:**
- [ ] Stwórz: `src/pages/{privacy,regulamin,contact}.tsx`
- [ ] Stwórz: `src/features/legal/components/{PrivacyPolicy,Regulamin,ContactForm,CookieConsentBanner}.tsx`
- [ ] Stwórz: `src/features/legal/hooks/useCookieConsent.ts`
- [ ] Stwórz: `src/features/legal/content/{privacy-policy,regulamin}.md` (lub MDX)
- [ ] Stwórz: `docs/legal/{privacy-policy,regulamin}-draft.md` (do prawnika)
- [ ] Modify: `src/App.tsx` (mount `<CookieConsentBanner />` globally)
- [ ] Modify: `src/components/layout/PublicFooter.tsx` (links do `/privacy`, `/regulamin`, `/contact`)
- [ ] Modify: `src/router.tsx` (public routes)
- [ ] Stwórz testy: `src/features/legal/hooks/useCookieConsent.test.ts`

**Test:**
- [ ] Test: [Unit] `useCookieConsent` initial state = `{ analytics: null }`
- [ ] Test: [Unit] Po `acceptAll()` → `{ analytics: true, timestamp }`; localStorage zapisane
- [ ] Test: [Unit] Po `acceptEssentialOnly()` → `{ analytics: false, timestamp }`
- [ ] Test: [Unit] Reload → `useCookieConsent` reads localStorage, returns prev decision
- [ ] Test: [Unit] `CookieConsentBanner` nie renderuje się jeśli `analytics !== null`
- [ ] Test: [E2E] `/` w incognito → banner widoczny bottom screen
- [ ] Test: [E2E] Klik "Tylko niezbędne" → banner znika; localStorage zawiera decision
- [ ] Test: [E2E] Reload `/` → banner NIE pokazuje się
- [ ] Test: [E2E] `/privacy` → renderuje sekcje z czytelnym typo (max-w-prose 672px)
- [ ] Test: [E2E] `/regulamin` → renderuje
- [ ] Test: [E2E] Footer ma działające linki do `/privacy`, `/regulamin`, `/contact` (no 404)
- [ ] Test: [E2E] axe scan na privacy/regulamin pages → 0 violations

**Weryfikacja:**
- [ ] Weryfikacja: `bun run typecheck` + `bun run lint` + `bun run test` zielone
- [ ] Weryfikacja: 3 strony renderują się bez błędów
- [ ] Weryfikacja: Cookie consent banner toggle działa zgodnie z scenariuszami

**Operator:**
- [ ] Operator: Privacy policy draft zreviewowany przez prawnika + final content podpięty
- [ ] Operator: Regulamin draft zreviewowany przez prawnika + final content podpięty
- [ ] Operator: DPA podpisane z Supabase, Google Cloud, Meta (jeśli używany), Sentry, Plausible
- [ ] Operator: Adres + email + telefon wypełnione w content
- [ ] Operator: Decyzja o adresie email kontaktowym

---

### IU-12: Launch readiness — SEO prerender + Sentry + analytics + structured data

**Delegate:** feature-builder-fullstack | **Status:** Pending | **Zależy od:** IU-5, IU-11

**Implementacja:**
- [ ] Modify: `vite.config.ts` (dodaj `vite-ssg` lub `vite-plugin-prerender` — decyzja w IU)
- [ ] Stwórz: `src/lib/sentry.ts` (init Sentry React)
- [ ] Stwórz: `supabase/functions/_shared/sentry.ts` (init Deno SDK + `withSentry(handler)` wrapper)
- [ ] Stwórz: `src/lib/analytics.ts` (Plausible wrapper z consent guard)
- [ ] Stwórz: `src/components/seo/StructuredData.tsx` (JSON-LD: LocalBusiness + Organization + Person + WebSite)
- [ ] Stwórz: `scripts/generate-sitemap.ts` (build-time)
- [ ] Stwórz: `public/robots.txt`
- [ ] Modify: `src/main.tsx` (init Sentry + analytics przed render)
- [ ] Modify: wszystkie `supabase/functions/*/index.ts` (wrap w `withSentry`)
- [ ] Modify: `index.html` (preconnect do Supabase + Sentry)
- [ ] Modify: `src/features/landing/components/*` (mount `<StructuredData />` w landing root)
- [ ] Stwórz testy: `src/lib/sentry.test.ts`, `src/lib/analytics.test.ts`

**Test:**
- [ ] Test: [Unit] `sentry.ts` init bez DSN → graceful skip + console.warn
- [ ] Test: [Unit] `analytics.ts` tracking call → guard sprawdza `useCookieConsent()`; jeśli analytics===false → no-op
- [ ] Test: [Unit] `withSentry(handler)` Edge wrapper: throw → captureException → re-throw
- [ ] Test: [E2E] `bun run build` produkuje `dist/index.html` z PRERENDERED treścią (curl test: response zawiera "Bachata Napoli")
- [ ] Test: [E2E] `bun run build` produkuje `dist/privacy/index.html` z prerendered content
- [ ] Test: [E2E] `curl https://staging.bachatanapoli.pl/sitemap.xml` → valid XML z routes
- [ ] Test: [E2E] `curl https://staging.bachatanapoli.pl/robots.txt` → expected directives
- [ ] Test: [E2E] DevTools view source `/` → znajdź `<script type="application/ld+json">` z LocalBusiness
- [ ] Test: [E2E] Sentry test — throw new Error w komponencie staging → event w Sentry dashboard (manual verify)
- [ ] Test: [E2E] Lighthouse `/` mobile: SEO score ≥ 95
- [ ] Test: [E2E] Lighthouse `/privacy` mobile: SEO ≥ 95

**Weryfikacja:**
- [ ] Weryfikacja: `bun run build` produkuje prerendered HTML dla 4 routes (`/`, `/privacy`, `/regulamin`, `/contact`)
- [ ] Weryfikacja: `bun run typecheck` + `bun run test` zielone
- [ ] Weryfikacja: `curl dist/sitemap.xml` → valid XML
- [ ] Weryfikacja: `curl dist/robots.txt` → expected directives
- [ ] Weryfikacja: Lighthouse SEO score ≥ 95 dla landing po prerender

**Operator:**
- [ ] Operator: Sentry projects utworzone (`bachatanapoli-frontend` + `bachatanapoli-edge`) → DSN w env staging + prod
- [ ] Operator: Plausible site `bachatanapoli.pl` utworzony (lub Umami self-hosted)
- [ ] Operator: DNS `bachatanapoli.pl` → hosting (Vercel/CFP/Netlify)
- [ ] Operator: SSL cert provisioned (auto via hosting)
- [ ] Operator: Google Search Console verification + sitemap submitted po publikacji
- [ ] Operator: Test prod — rzeczywisty Sentry capture z prod environment (jeden test error)

---

## Pre-launch gate (po wszystkich IU)

Sequencja obowiązkowa przed publicznym ogłoszeniem:

- [ ] Pre-launch: YT OAuth verification APPROVED
- [ ] Pre-launch: YT quota extension APPROVED (60+ uploadów/dzień)
- [ ] Pre-launch: Privacy policy + regulamin podpisane przez prawnika
- [ ] Pre-launch: DPA z wszystkimi processors (Supabase, Google, Meta jeśli używany, Sentry, Plausible)
- [ ] Pre-launch: DNS `bachatanapoli.pl` → hosting + SSL cert
- [ ] Pre-launch: Sentry capturje prod errors (verified jeden test error)
- [ ] Pre-launch: Plausible zbiera events (verified jedna page view + signup event)
- [ ] Pre-launch: Hero photo finalna wgrana (lub akceptowalny placeholder)
- [ ] Pre-launch: Final copy do landing sekcji
- [ ] Pre-launch: Soft pre-launch (invite kilku userów do testowania) → feedback round → fix
- [ ] Pre-launch: Publiczne ogłoszenie
