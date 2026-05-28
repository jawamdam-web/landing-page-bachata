---
title: "feat: Bachata Napoli MVP — landing + biblioteka filmów + społeczność"
type: feat
status: active
date: 2026-05-27
origin: docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md
design_md: ./docs/DESIGN.md
figma_spec: null
figma_screens: {}
---

# feat: Bachata Napoli MVP — landing + biblioteka filmów + społeczność

## Przegląd

Greenfield MVP platformy społecznościowej dla bachateros z Lubina/Legnicy/Polkowic/Głogowa. Plan dostarcza w jednej iteracji: publiczny landing page (R1–R6), system auth (Google OAuth + email/hasło, R7), osobistą bibliotekę filmów z trzema źródłami (R8–R14: paste YT, embed FB/IG, upload pliku → konto YT usera), zarządzanie folderami (R12–R13), publiczne linki tokenowe z możliwością revoke (R15–R17), oraz baseline GDPR + SEO + observability (przygotowanie do launchu).

Stack: **Vite SPA + React 19 + TypeScript + TailwindCSS v4 + shadcn/ui + Supabase** (Auth + Postgres + RLS + Edge Functions). YouTube jest backend storage'm dla wideo (zero hostowanych plików po naszej stronie), Supabase trzyma metadata + tokeny + linki. Krytyczna ścieżka równoległa do kodu: **YouTube sensitive scope verification** (~2-6 tygodni; uruchomić w IU-3 zanim zacznie się kod uploadu).

## Ujęcie problemu

Z dokumentu źródłowego (zob. źródło: `docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md`):

- **User pain point:** dancerzy nagrywają figury telefonem podczas zajęć; filmy gubią się w rolce między selfies — brak organizacji, brak powiązania z zajęciami/instruktorem, brak łatwego powrotu do figury sprzed tygodnia
- **Biznesowy/społeczny cel:** właściciel Jarek chce wokół lokalu pizzerii Napoli w Lubinie zbudować lokalną społeczność bachatową, używając cyklicznych spotkań "Bachata Napoli — Social & Practise" + lekcji od Andrzejewskich (szkoła Bachata Rebel) jako seed społeczności
- **Strategiczna ambicja:** po walidacji w PL — platforma globalna dla bachateros (i potencjalnie innych styli)

## Śledzenie wymagań

Mapowanie wymagań brainstorma na Implementation Units:

| Wymaganie | Opis (skrót) | IU |
|---|---|---|
| **R1** | Landing, główne CTA = rejestracja | IU-5 |
| **R2** | Hero foto z Jarkiem + instruktorami | IU-5 (+ operator: photoshoot) |
| **R3** | Hero wymienialny przez admina | IU-5 (placeholder + admin path) |
| **R4** | Sekcja "Dlaczego Napoli?" | IU-5 |
| **R5** | Sekcja Bachata Napoli Social | IU-5 (statyczne info — RSVP odroczone) |
| **R6** | Sekcja Instruktorzy | IU-5 |
| **R7** | Logowanie Google OAuth + email/hasło | IU-4 |
| **R8** | Profil + osobista biblioteka, default prywatne | IU-4 + IU-6 |
| **R9** | Źródło: YT link (paste + embed) | IU-8 |
| **R10** | Źródło: upload pliku → konto YT usera | IU-9 |
| **R11** | Źródło: FB/IG public post embed | IU-8 |
| **R12** | Foldery — user tworzy własne | IU-7 |
| **R13** | Film w wielu folderach (m:n) | IU-7 |
| **R14** | Film: tytuł, link, data, notatki | IU-6 (+ IU-8 polish) |
| **R15** | Publiczny link z tokenem | IU-10 |
| **R16** | Revoke linku | IU-10 |
| **R17** | Brak feedu/follow/listy znajomych | non-goal — explicite pominięte |
| **R18** | Mobile-first responsive | przekrojowo (DESIGN.md sekcja 11) |

## Granice scope'u

Explicite **non-goals w MVP** (z brainstorma, przeniesione):

- Auto-import/auto-download z FB/IG (problemy prawne, ToS, niestabilność)
- Integracja z Google Drive
- Publiczne profile, discovery, feed, follow/friends, likes, komentarze
- Predefiniowane tagi (poziom/styl/kategoria) — tylko własne foldery usera
- Aplikacja natywna iOS/Android
- Wielojęzyczne UI (tylko polski)
- System płatności, premium, ticketing na spotkania
- Weryfikacja/certyfikacja instruktorów
- RSVP na spotkania w MVP (zacznijmy od statycznego info — odroczone do v1.1)
- PWA installable + offline + push (responsive web only — odroczone do v1.1)
- Dark mode (deferred do v1.1 — placeholder w DESIGN.md)

## Kontekst i research

### Relevantny kod i wzorce

Repo jest **greenfield** — brak istniejącego kodu. Artefakty referencyjne:

- **`docs/DESIGN.md`** — design system projektu (tokeny OKLCH terracotta przygaszony + warm-neutral, font Geist, motion respecting reduced-motion, polish reguły jak concentric radius / tabular nums / scale 0.96 on press). **WSZYSTKIE komponenty UI muszą czytać z tych tokenów przez `@theme {}` w `src/global.css`.**
- **`docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md`** — dokument źródłowy z product intent + decyzjami biznesowymi
- **`.claude/rules/coding-rules.md`** — coding standards (zero `any`, plik <300 linii, funkcja <50 linii, RLS na każdym endpoint, zod na granicach systemu, structured logging zamiast console.log)
- **`.claude/agents/feature-builder-{ui,data,fullstack}.md`** — agenci wykonawczy, znają konwencje `src/components/`, `src/features/`, `src/lib/`, `src/hooks/`, `supabase/migrations/`, `supabase/functions/`

### Wiedza instytucjonalna

`docs/solutions/` nie istnieje (greenfield) — brak past solutions do leverage. Każdy IU produkuje świeże decyzje; sukces/porażki tej iteracji zostaną udokumentowane via `/dev-compound` po landingu.

### Referencje zewnętrzne

Kluczowe dokumenty technologiczne (do konsultacji w trakcie wykonania):

- **Supabase Auth** — Google OAuth + email/password + identity linking (`linkIdentity` API)
- **Supabase RLS** — pattern `WHERE user_id = auth.uid()` + `SECURITY DEFINER` functions dla anonymous public read (share tokens)
- **Supabase Edge Functions (Deno)** — proxy do YT Data API (hide API key), Meta oEmbed validation
- **YouTube Data API v3** — `videos.list` (metadata fetch z link), resumable upload protocol (chunked PUT z Content-Range)
- **YouTube sensitive scope verification** — proces Google dla `https://www.googleapis.com/auth/youtube.upload` (~2-6 tyg., privacy policy URL + demo video + justification)
- **Meta Graph API oEmbed** — wymaga aktywnej App z product "oEmbed Read" + prawdopodobnie App Review (status w 2026 do weryfikacji w IU-8)
- **Tailwind v4** — `@theme {}` directive, no `tailwind.config.js`, native OKLCH support
- **shadcn/ui** — komponenty bazują na CSS variables z `@theme` (DESIGN.md sekcja 13)
- **Vite + React 19** — standardowy stack; prerender przez `vite-ssg` lub `vite-plugin-prerender` dla SEO landing
- **Sentry React + Sentry Deno** — error capture (frontend + Edge Functions)

## Kluczowe decyzje techniczne

| Decyzja | Uzasadnienie |
|---|---|
| **Stack: Vite SPA + React 19 + TS + Tailwind v4 + shadcn/ui + Supabase** | Zgodne z konfiguracją projektu (`.claude/agents` + `.claude/skills`). Minimalne tarcie, Supabase pokrywa Auth/DB/RLS/Edge/Storage out-of-box (zob. źródło: brainstorm sugerował Next.js+Supabase albo własne API, decyzja wybrana w `/dev-plan` po prezentacji trade-offów) |
| **YT jako de facto storage wideo** | Brainstorm decyzja: zero hostingu wideo po naszej stronie, ucieczka przed kosztami transferu i copyright responsibility. Backend trzyma metadata + linki (zob. źródło) |
| **YT upload: direct browser → YT (resumable upload protocol)** | Niższe koszty (zero transferu przez nasze serwery), szybciej dla usera. Trade-off: bardziej skomplikowany flow OAuth tokens (refresh, scope upgrade) — adresowane w IU-9 z osobnym `useResumableUpload` hook + characterization tests |
| **OAuth scope upgrade: incremental** | User loguje się Google z basic scopes (openid, email, profile) bez tarcia. Scope `youtube.upload` (sensitive) requested **dopiero** przy pierwszej próbie uploadu — pokazujemy explainer dlaczego potrzebujemy zgody. Best practice Google + lepsza conversion (sign-up bez wymagania pełnego trustu) |
| **Share tokens: 192-bit random + RLS przez `SECURITY DEFINER` function** | 24 bajty z `crypto.randomBytes` = 32-char URL-safe base64. Anon access TYLKO przez `get_shared_content(token text)` function — nigdy bezpośredni SELECT z `share_tokens`. Token check + `revoked_at IS NULL` w funkcji |
| **Identity model: Google OAuth + email/hasło + linkIdentity** | Z brainstorma — email/hasło user może później dolinkować Google żeby uploadować na YT. Supabase wspiera natywnie przez `auth.linkIdentity()` |
| **SEO: prerender (vite-plugin-ssg lub vite-plugin-prerender) dla landing/privacy/regulamin/contact** | Vite SPA bez SSR — landing musi być statycznym HTML dla Google. Auth routes (`/library`, `/settings`, `/s/*`) zostają SPA-only. Decyzja konkretnego pluginu odroczona do implementacji (IU-12) |
| **Routing: TanStack Router LUB React Router 7** | Obie spełniają requirementy (typed routing, code-splitting, file-based opcjonalne). Decyzja deferred — IU-1 wybierze po krótkim spike (TanStack Router prawdopodobnie wybór; better TS DX, ale React Router 7 ma większą społeczność i shadcn examples są pod RR) |
| **State management: React Query (server) + Zustand (UI state) + React state (locality)** | React Query for everything Supabase. Zustand TYLKO dla globalnego UI state którego nie da się wyrazić server state'm (np. modal open, theme). Nie wprowadzamy Redux/MobX/Recoil — overkill dla scope MVP |
| **Forms: React Hook Form + Zod** | Standard, type-safe, shadcn/ui `Form` primitive bazuje na RHF |
| **Notifications: Sonner** | Lekki, shadcn-friendly, dobry mobile pattern |
| **Email transactional: Supabase default SMTP w MVP, Resend jako upgrade** | Supabase ma built-in SMTP dla auth emails. Volume w MVP < 100/dzień. Resend = opcja gdy potrzebujemy custom email templates lub większego volume (odroczone do v1.1) |
| **Hosting: Vercel LUB Cloudflare Pages** | Obie wspierają Vite SPA + edge functions. Decyzja operacyjna odroczona do IU-12 / launch (operator decyzja) |
| **DB region: Supabase EU (Frankfurt)** | GDPR — dane userów PL w EU |
| **Brak Supabase Storage w MVP** | Zero plików po naszej stronie — YT jest storage. Storage może być potrzebny dla hero photo i avatars instruktorów, ale to placeholder JPEGi w `public/` — nie wymaga bucketów |
| **File size cap dla YT upload: 2 GB** | Realistyczne max dla nagrania z telefonu (zwykle <500MB). Większe = warn user. Hard 2GB = uniknięcie skrajnych edge cases bez ograniczania happy path |

## Otwarte pytania

### Rozwiązane podczas planowania

- **Stack** → Vite SPA + React 19 + Supabase (decyzja z `/dev-plan`, sekcja kluczowych decyzji)
- **DESIGN.md** → stworzony w `docs/DESIGN.md` (terracotta przygaszony, sans-only Geist, voice "ty/ciepło")
- **YT upload direct vs proxy** → direct (resumable, koszty)
- **OAuth scope timing** → incremental (best practice + lepsza conversion)
- **Share token security model** → 192-bit token + `SECURITY DEFINER` function (jedyne wyjście dla anon access pod RLS)
- **RSVP na spotkania w MVP** → odroczone do v1.1 (zob. źródło: brainstorm sugerował "statyczne info" jako start)
- **Email provider** → Supabase default w MVP, Resend odroczone

### Odroczone do implementacji

- **Wybór routera (TanStack Router vs React Router 7)** — IU-1 zrobi krótki spike i wybierze. Decyzja kosmetyczna, oba spełniają wymagania
- **Konkretny prerender plugin (`vite-ssg` vs `vite-plugin-prerender`)** — IU-12 zweryfikuje aktualny stan ekosystemu i wybierze
- **Meta oEmbed widget current state w 2026** — IU-8 sprawdzi czy App Review dla "oEmbed Read" jest nadal wymagany i jaki dokładnie flow (Meta historycznie często zmienia politykę embedów). Jeśli zablokowane → fallback plan: prosić usera o screenshot + manual title input zamiast embed, lub całkowicie usunąć R11 z MVP (decyzja z biznesem)
- **Konkretne nazewnictwo helperów** w `src/lib/url-parsers.ts`, `src/lib/youtube-resumable-upload.ts` — niska wartość pre-decyzji
- **Final SQL details** (np. exact constraint syntax) — finalizowane przy pisaniu migracji
- **Hero photo source** — placeholder JPEG (stock fotka lub szybki snapshot) lądowanie w IU-5; docelowe zdjęcie z photoshoot dostarczy operator po launch (przewidziane przez R3: hero wymienialny)
- **Decyzja "auth before content" vs "browse first, signup at action"** dla landingu — IU-5 zacznie od standardu "auth required dla /library", ale można rozważyć preview empty library bez konta. Niska wartość do decyzji upfront

## Implementation Units

### Faza 1 — Foundation (IU 1–3): Setup, infrastruktura, konta zewnętrzne

- [x] **Unit 1: Bootstrap Vite SPA + design tokens + shadcn/ui** ✅ (2026-05-28)

**Cel:** Greenfield project scaffolding gotowy do feature work — Vite działa, Tailwind v4 czyta tokeny z DESIGN.md przez `@theme`, shadcn/ui zainicjowany, Geist font ładuje się, routing skeleton, testy + lint + typecheck przechodzą na CI.

**Wymagania:** Foundation dla wszystkich pozostałych

**Zależności:** Brak

**Pliki:**
- Stwórz: `package.json`, `bun.lockb` (lub `package-lock.json` — zależnie od wybranego package managera)
- Stwórz: `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
- Stwórz: `index.html` (z preload Geist Variable + meta viewport)
- Stwórz: `src/main.tsx`, `src/App.tsx`, `src/global.css` (z `@theme {}` mapującym tokeny z `docs/DESIGN.md` 1:1)
- Stwórz: `src/router.tsx` (TanStack Router lub React Router 7 — decyzja w IU)
- Stwórz: `components.json` (shadcn/ui config)
- Stwórz: `src/lib/utils.ts` (cn helper)
- Stwórz: `src/components/ui/button.tsx`, `src/components/ui/input.tsx` (initial shadcn dla smoke test)
- Stwórz: `.gitignore`, `.env.example`, `.eslintrc.json`, `.prettierrc.json`, `README.md`
- Stwórz: `.github/workflows/ci.yml` (typecheck + lint + test + build)
- Test (unit): `src/lib/utils.test.ts`
- Test (e2e): Scenariusz: Otwórz `http://localhost:5173`, zweryfikuj że strona ładuje "Hello Bachata Napoli" + Button primary w accent terracotta + brak warnings w konsoli

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- Vite 6+, React 19, TypeScript 5.7+ strict mode
- Tailwind v4 z `@theme {}` w `src/global.css` — **1:1 mapping z `docs/DESIGN.md` YAML tokens** (color, typography, spacing, radius, shadow, motion). Bez `tailwind.config.js`
- shadcn/ui init z path alias `@/` → `src/`, color base "neutral" override z DESIGN tokenami
- Geist Variable preload w `index.html` z `<link rel="preload" as="font" type="font/woff2" crossorigin>` + `font-display: swap`
- ESLint + Prettier + Husky pre-commit (lint-staged: format + typecheck zmienionych plików)
- Strict TS — `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`
- Bun jako package manager (decyzja — szybszy niż npm, używamy w skillach przy `bun run X` references)

**Wzorce do naśladowania:**
- Tailwind v4 `@theme` directive dokumentacja
- shadcn/ui Vite installation guide
- `docs/DESIGN.md` sekcja 13 (Implementation mapping) — przykładowy `@theme {}` block

**Scenariusze testowe:**
- [Unit] `cn()` helper łączy klasy i resolves conflicts (Tailwind merge)
- [E2E] Otwórz `/` → renderuje H1 "Bachata Napoli" z fontem Geist + Button primary z `accent.DEFAULT` bg
- [E2E] DevTools: brak console errors/warnings; Lighthouse Performance > 90 (pusta strona, baseline)
- [E2E] `prefers-reduced-motion` test: ustaw flagę w DevTools → button hover nie ma transition

**Weryfikacja:**
- `bun run typecheck` przechodzi bez błędów
- `bun run lint` przechodzi bez błędów
- `bun run test` (Vitest) zielony
- `bun run build` produkuje `dist/` poniżej 200KB initial bundle (smoke benchmark)
- Dev server na `:5173` renderuje smoke page z brand color (terracotta accent widoczny w Button)

**Operator checklist:** brak

---

- [x] **Unit 2: Supabase init — projekt + schema baseline + RLS pattern + client** ✅ (2026-05-28)

**Cel:** Lokalny Supabase stack działa, schema baseline (auth wbudowane + przygotowany pattern RLS-on-by-default), Supabase client w aplikacji singleton + types auto-gen.

**Wymagania:** R7, R8 (auth foundation), R9–R16 (data foundation)

**Zależności:** IU-1

**Pliki:**
- Stwórz: `supabase/config.toml`
- Stwórz: `supabase/migrations/0001_init_baseline.sql` (kompozyt: enable extensions [pgcrypto, uuid-ossp] + RLS-on-default helpers + pattern komentarz)
- Stwórz: `src/lib/supabase.ts` (singleton client z @supabase/supabase-js)
- Stwórz: `src/lib/database.types.ts` (auto-gen z `supabase gen types typescript`)
- Stwórz: `scripts/gen-db-types.sh` (wrapper na supabase CLI)
- Modify: `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Modify: `src/main.tsx` (verify Supabase client init nie crashuje przy missing env w dev)
- Modify: `README.md` (sekcja "Local Supabase setup")
- Test (unit): `src/lib/supabase.test.ts` (singleton behavior)

**Delegate to:** feature-builder-data

**Skills in play:** supabase-dev-guidelines, security, sentry-integration

**Podejście:**
- `supabase init` + `supabase start` dla lokalnego stacku (Postgres + Studio + Auth + Edge Functions runner)
- Migracja `0001_init_baseline.sql` ZERO business tables — tylko:
  - Enable `pgcrypto` (do `gen_random_uuid()` + `gen_random_bytes()` dla share tokens later)
  - Komentarz w SQL z konwencją: **WSZYSTKIE business tables MUSZĄ mieć `ENABLE ROW LEVEL SECURITY` + minimum 1 policy. Bez tego = security review fail.**
- Supabase client (`createClient` z `@supabase/supabase-js`) jako singleton w `src/lib/supabase.ts`. Eksport: `supabase` instance
- Types auto-gen: `supabase gen types typescript --local > src/lib/database.types.ts` — uruchamiać po każdej migracji
- Brak SSR client (`@supabase/ssr`) — Vite SPA = client-only

**Wzorce do naśladowania:**
- Supabase docs: "Use Supabase with React" + "Generating TypeScript types"
- `.claude/skills/supabase-dev-guidelines` (skill jest aktywny w `feature-builder-data`)

**Scenariusze testowe:**
- [Unit] `supabase` import zwraca singleton (ponowny import = ten sam reference)
- [Unit] Brak `VITE_SUPABASE_URL` w env → init rzuca jasny error message (fail-fast)
- [E2E] `window.supabase.auth.getSession()` w DevTools zwraca `{ session: null }` (anon, brak sesji)

**Weryfikacja:**
- `supabase start` uruchamia stack lokalnie bez błędów
- `supabase db reset` aplikuje migrację `0001` bez błędów
- `bun run typecheck` przechodzi z importem `supabase` z `@/lib/supabase`
- `bun gen-db-types` produkuje `src/lib/database.types.ts` bez warnings

**Operator checklist:**
- [ ] Stworzony Supabase Cloud project `bachatanapoli-staging` w regionie EU (Frankfurt) → skopiowane URL + anon key do `.env.staging`
- [ ] Stworzony Supabase Cloud project `bachatanapoli-prod` → `.env.production`

---

- [x] **Unit 3: GCP + YouTube Data API + Meta Developer + OAuth client setup (operator-heavy)** ✅ (2026-05-28 — kod/docs gotowe; operator checklist w toku)

**Cel:** Wszystkie konta zewnętrzne gotowe + runbooki utworzone + krytyczna ścieżka YT sensitive scope verification ZAPALONA wcześnie.

**Wymagania:** R7 (Google OAuth identity), R9 (YT metadata fetch), R10 (YT upload — sensitive scope), R11 (Meta embed)

**Zależności:** IU-1 (znamy domenę produkcyjną), IU-2 (znamy callback URL Supabase)

**Pliki:**
- Stwórz: `docs/operations/gcp-setup.md` (operator runbook: GCP project, OAuth client, APIs enablement, scope verification kickoff)
- Stwórz: `docs/operations/youtube-scope-verification-checklist.md` (sensitive scope verification — Google's checklist + nasz tracking)
- Stwórz: `docs/operations/meta-developer-setup.md` (Meta App, oEmbed Read product, App Review jeśli wymagany)
- Modify: `.env.example` (`VITE_GOOGLE_OAUTH_CLIENT_ID`, `YOUTUBE_API_KEY` [server-side, Edge Function env], `META_APP_ID`, `META_APP_SECRET` [Edge Function env])
- Modify: Supabase Auth config (przez Supabase Dashboard, dokumentowane w runbooku) — Google OAuth provider enabled z client ID

**Delegate to:** feature-builder-data

**Skills in play:** supabase-dev-guidelines, security, sentry-integration

**Podejście:**
- **GCP setup (przez Dashboard Google Cloud Console — operator wykonuje):**
  - Projekt `bachatanapoli-prod` + `bachatanapoli-staging`
  - APIs enabled: YouTube Data API v3, Google+ API (deprecated, ale niektóre OAuth scopes go potrzebują), People API
  - OAuth 2.0 client: Web application
  - Authorized redirect URIs: `https://<supabase-project>.supabase.co/auth/v1/callback` + `http://localhost:54321/auth/v1/callback`
  - Scopes podstawowe: `openid`, `email`, `profile` (non-sensitive, automatyczna approval)
  - Scope sensitive: `https://www.googleapis.com/auth/youtube.upload` — **wymaga OAuth verification**
- **YT sensitive scope verification kickoff:**
  - Privacy policy URL (placeholder z bachatanapoli.pl/privacy — IU-11 dostarczy realny content, ale URL musi działać już teraz, nawet jako "Coming soon" stub)
  - Demo video YT (screen recording flow: login → biblioteka → upload → film widoczny)
  - Justification text (dlaczego potrzebujemy youtube.upload — "User uploads personal dance practice videos to their own YT account as unlisted, our app indexes metadata")
  - Process: ~2-6 tygodni (Google security review). **Submit ASAP — nie blokuje development, ale blokuje public launch.**
- **Quota extension request:**
  - Default YT Data API quota: 10,000 jednostek/dzień. Upload = 1,600 jednostek → ~6 uploadów/dzień GLOBALNIE
  - Target: 100k–500k jednostek (60–300 uploadów/dzień) — submit razem ze scope verification
- **Meta Developer setup (operator):**
  - Stwórz App w Meta for Developers
  - Add product: "oEmbed Read" (jeśli nadal istnieje w 2026 — verify w IU-8)
  - App Review jeśli wymagane (Meta zmieniała politykę kilkukrotnie — runbook ma checkbox "verify current policy")

**Wzorce do naśladowania:**
- Google Cloud OAuth verification docs
- Meta App Review documentation (status do weryfikacji w 2026)

**Scenariusze testowe:**
- [Manual] Operator uruchamia `gcp-setup.md` step-by-step → kończy z working Client ID + Secret w env staging
- [Manual] OAuth basic scopes flow (`openid` + `email`) działa w Supabase Auth Studio testing mode

**Weryfikacja:**
- `docs/operations/gcp-setup.md` istnieje i ma checkboxy w sekcjach Step 1–N
- `docs/operations/youtube-scope-verification-checklist.md` istnieje z tracking sekcji (Submitted / In Review / Approved)
- `.env.example` zawiera wszystkie required vars Google/Meta

**Operator checklist:**
- [ ] Stworzony GCP project `bachatanapoli-prod` + `bachatanapoli-staging`
- [ ] Enabled YouTube Data API v3 w obu projektach
- [ ] Stworzony OAuth 2.0 client (Web app) + redirect URIs (Supabase callback + localhost)
- [ ] Skopiowane CLIENT_ID/SECRET do staging + prod env
- [ ] **Submitted OAuth consent screen verification dla scope `youtube.upload`** (krytyczna ścieżka, ~2-6 tygodni)
- [ ] Submitted privacy policy URL (placeholder OK na start)
- [ ] Submitted quota extension request (target 100k+ units/day)
- [ ] Stworzony Meta App + dodany oEmbed Read product (lub current 2026 alternative)
- [ ] Meta App Review submitted jeśli wymagany dla naszego use case
- [ ] Supabase Auth: Google provider enabled z prawidłowymi credentials

---

### Faza 2 — Auth + landing (IU 4–5): Pierwsze touch-pointy z userem

- [ ] **Unit 4: Supabase Auth — Google OAuth + email/hasło + account linking + protected routes**

**Cel:** User może się zarejestrować i zalogować obiema metodami; identyfikatory można linkować; protected routes działają; profile auto-creation via DB trigger.

**Wymagania:** R7, R8

**Zależności:** IU-1, IU-2, IU-3 (Google OAuth client ID gotowy)

**Pliki:**
- Stwórz: `supabase/migrations/0002_profiles_and_trigger.sql` (table `profiles` + trigger na `auth.users` INSERT → auto-create profile row)
- Stwórz: `src/features/auth/api/auth.ts` (`signUpWithEmail`, `signInWithEmail`, `signInWithGoogle`, `signOut`, `resetPassword`, `linkGoogleIdentity`)
- Stwórz: `src/features/auth/components/LoginForm.tsx`
- Stwórz: `src/features/auth/components/SignupForm.tsx`
- Stwórz: `src/features/auth/components/AuthLayout.tsx` (split layout dla mobile + desktop)
- Stwórz: `src/features/auth/components/GoogleSignInButton.tsx`
- Stwórz: `src/features/auth/components/ForgotPasswordForm.tsx`
- Stwórz: `src/features/auth/hooks/useAuth.ts` (current user state, loading, sign in/out)
- Stwórz: `src/features/auth/hooks/useRequireAuth.ts` (redirect to `/login` if no session)
- Stwórz: `src/features/auth/schemas.ts` (Zod schemas: emailSchema, passwordSchema z complexity requirements)
- Stwórz: `src/pages/login.tsx`, `src/pages/signup.tsx`, `src/pages/forgot-password.tsx`, `src/pages/reset-password.tsx`, `src/pages/auth-callback.tsx`
- Modify: `src/App.tsx` (auth provider w root + protected route wrapper)
- Modify: `src/router.tsx` (auth routes + protected route guard)
- Test (unit): `src/features/auth/api/auth.test.ts`, `src/features/auth/hooks/useAuth.test.tsx`, `src/features/auth/schemas.test.ts`
- Test (e2e): scenariusze auth flow (login, signup, forgot, protected redirect)

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- Supabase Auth built-in: Google OAuth provider (skonfigurowany w Dashboard Supabase) + email/password (enable "Confirm email" — wymaga email verification przed pierwszym loginem)
- `profiles` table (jeden-do-jednego z `auth.users` via shared `id`):
  - `id` (uuid pk, FK do `auth.users.id` ON DELETE CASCADE)
  - `display_name` (text — default = part przed @ z email; user może edytować)
  - `avatar_url` (text nullable — z Google OAuth provider data)
  - `created_at`, `updated_at`
- Trigger `handle_new_user()` na `INSERT INTO auth.users` → insert do `profiles` z extracted Google metadata (lub email-derived defaults)
- RLS na `profiles`: SELECT/UPDATE WHERE `id = auth.uid()` (user widzi tylko swój profil; UPDATE tylko swoje pola)
- Recovery hasła: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`
- Identity linking (do uploadu YT later): `supabase.auth.linkIdentity({ provider: 'google', options: { scopes: 'youtube.upload' } })` — flow incremental, używane w IU-9
- Email transactional: Supabase default SMTP w MVP (customize templates w Dashboard żeby brzmiały po polsku, voice "ty")
- Protected routes: `useRequireAuth()` hook w komponentach guards (`<RequireAuth><LibraryPage /></RequireAuth>`)
- Auth callback page (`/auth-callback`): Supabase obsługuje session ekstrakcję z hash/query → redirect do `/library`
- Forms: React Hook Form + Zod, shadcn/ui `<Form>` primitive
- Zod password schema: min 8 chars, min 1 cyfra, min 1 litera (zbalansowane: ani za luźne, ani za rygorystyczne dla casual users)
- Voice w UI (z DESIGN.md sekcja 2): "Załóż konto", "Zaloguj się", "Nie masz konta?", "Wysłaliśmy link aktywacyjny na Twój email"

**Wzorce do naśladowania:**
- Supabase Auth React quickstart
- shadcn/ui Form pattern (RHF + Zod)
- DESIGN.md sekcja 10 (Patterns: Button variants, Input)

**Scenariusze testowe:**
- [Unit] `signUpWithEmail` z valid email + password → resolves z `{ user, session }`
- [Unit] `signUpWithEmail` z duplicate email → rejects z error code 422 (Supabase pattern)
- [Unit] `signInWithGoogle` wywołuje `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [Unit] `useAuth` initial state = `{ loading: true, user: null }`; po `getSession` → `{ loading: false, user: ... }`
- [Unit] Zod password schema: "Pass123" pass, "pass" fail (short), "12345678" fail (no letter)
- [Unit] `handle_new_user` trigger: INSERT do `auth.users` → row pojawia się w `profiles` z auto-extracted `display_name`
- [E2E] Otwórz `/signup` → wypełnij email + password → submit → toast "Wysłaliśmy email z linkiem aktywacyjnym"
- [E2E] Otwórz `/login` z istniejącymi credentials → submit → redirect do `/library`
- [E2E] Klik "Zaloguj się przez Google" na `/login` → window.location zmienia się na `accounts.google.com/o/oauth2/...` (zatrzymaj weryfikację na external page)
- [E2E] Bez sesji → otwórz `/library` → redirect do `/login` z `?next=/library`
- [E2E] Po loginie z `?next=/library` → po success redirect do `/library`
- [E2E] `/forgot-password` → wypełnij email → toast "Wysłaliśmy link do resetu hasła" (no błąd nawet jeśli email nie istnieje — security best practice)

**Weryfikacja:**
- `bun run typecheck` przechodzi
- `bun run test src/features/auth` zielony
- `supabase db reset` aplikuje migrację `0002` + trigger
- E2E: signup formularz na `/signup` renderuje się + submit działa happy path

**Operator checklist:**
- [ ] Supabase Dashboard → Authentication → URL Configuration: site URL = `https://bachatanapoli.pl`, redirect URLs whitelist (`/auth-callback`, `/reset-password`)
- [ ] Email templates (Confirm signup, Magic Link, Reset Password) customized do polskiego (voice "ty/ciepło", brand wording)
- [ ] Email rate limits sprawdzone (default Supabase = generous, OK na MVP)

---

- [ ] **Unit 5: Public landing page — wszystkie sekcje (R1–R6) + SEO meta + mobile responsive**

**Cel:** Pierwsze publiczne wrażenie. 5–6 sekcji editorial layout, hero z foto, CTA prowadzące do `/signup`, w pełni responsive (mobile-first), gotowe meta tagi dla SEO + social sharing.

**Wymagania:** R1, R2, R3, R4, R5, R6, R18

**Zależności:** IU-1 (foundation + DESIGN tokens), IU-4 (CTA "Załóż konto" linkuje do `/signup`)

**Pliki:**
- Stwórz: `src/pages/index.tsx` (root `/`)
- Stwórz: `src/features/landing/components/Hero.tsx`
- Stwórz: `src/features/landing/components/AboutNapoli.tsx`
- Stwórz: `src/features/landing/components/HowItWorks.tsx` (sekcja explainer: 3 sources)
- Stwórz: `src/features/landing/components/BachataSocial.tsx`
- Stwórz: `src/features/landing/components/Instructors.tsx`
- Stwórz: `src/features/landing/components/FinalCTA.tsx`
- Stwórz: `src/components/layout/PublicHeader.tsx` (sticky, mobile = hamburger Sheet)
- Stwórz: `src/components/layout/PublicFooter.tsx`
- Stwórz: `src/components/seo/MetaTags.tsx` (helper na document.title + og: + twitter: meta — bez react-helmet-async, prosty hook bo to MVP)
- Stwórz: `public/hero-placeholder.jpg` (placeholder 4:5 mobile + 16:9 desktop variants → `public/hero-placeholder-mobile.jpg`, `public/hero-placeholder-desktop.jpg`)
- Stwórz: `public/instruktorzy-placeholder.jpg`
- Stwórz: `public/og-image.jpg` (1200×630 dla og:image)
- Test (unit): `src/components/layout/PublicHeader.test.tsx`, `src/features/landing/components/Hero.test.tsx`
- Test (e2e): scenariusze landing page (mobile + desktop)

**Delegate to:** feature-builder-ui

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, figma:figma-use, figma:figma-implement-design

**Podejście:**
- Layout: editorial, max-width `container.max` (1152px), padding mobile/tablet/desktop z DESIGN.md sekcja 5
- **Hero (mobile-first):**
  - Mobile: foto aspect 4:5 (portrait) jako tło + gradient overlay subtle → display heading + tagline + 2 CTA stack pionowo
  - Desktop (>=md): foto aspect 16:9 obok lub jako wide background → display heading lewa kolumna + foto prawa
  - 2 CTA: primary "Załóż konto" (terracotta) → `/signup`, secondary "Dowiedz się więcej" (ghost) → scroll do `#jak-to-dziala`
  - Foto: `<picture>` z AVIF/WebP fallback + `srcset` dla retina; `loading="eager"`, `fetchpriority="high"` (LCP critical)
- **About Napoli (R4):** prose section, `max-w-prose`, opowieść o związku z pizzerią. Placeholder copy, do dopracowania
- **How It Works:** 3-column grid (desktop) / stack (mobile) — 3 sources: "Wklej link YT", "Wklej post FB/IG", "Wgraj plik z telefonu". Każda kolumna: ikona Lucide + heading + 1 zdanie
- **Bachata Social (R5):** card z meeting info — gdzie (pizzeria Napoli, Lubin, adres), kiedy (placeholder "Czwartki 19:00"), co (lekcja + practise + integracja). **Statyczne info, brak RSVP w MVP** (zob. źródło: brainstorm decyzja)
- **Instructors (R6):** 2-column grid (mobile 1-col) z foto + bio Małgosi i Szymona + link do Bachata Rebel
- **Final CTA:** kolejny terracotta block z "Załóż konto" — daje user another shot na conversion
- Header sticky: logo "Bachata Napoli" (text-only, brak logo image w MVP) + nav links + "Zaloguj się" / "Załóż konto". Mobile = Sheet z hamburger
- Footer: copyright + linki do `/privacy`, `/regulamin`, `/contact` (te strony tworzone w IU-11)
- SEO meta (`MetaTags` component):
  - `<title>Bachata Napoli — Twoja biblioteka tańca + spotkania w Lubinie</title>`
  - `<meta name="description" content="Zapisuj filmy z zajęć bachaty z YouTube, Facebooka i własnego telefonu. Lokalna społeczność dancerów w Lubinie.">`
  - `og:title`, `og:description`, `og:image` (public/og-image.jpg), `og:type=website`
  - `twitter:card=summary_large_image`
  - `<html lang="pl">` (z IU-1)
- Animations: respect `prefers-reduced-motion` (z DESIGN.md sekcja 8). Sekcje fade-in + slideY 8px on scroll (Intersection Observer, max 6 staggered)

**Wzorce do naśladowania:**
- DESIGN.md sekcja 4 (typography hierarchy), sekcja 5 (spacing rhythm), sekcja 10 (Button variants, Card patterns)
- shadcn/ui Sheet (mobile menu), Button, Card

**Scenariusze testowe:**
- [Unit] `PublicHeader` w state "guest" renderuje 2 CTA buttons; w state "authed" renderuje "Moja biblioteka" link
- [Unit] `Hero` z brakiem image src → renderuje fallback (no broken image icon)
- [Unit] `MetaTags` ustawia `document.title` w useEffect + cleanup w return
- [E2E] Otwórz `/` na viewport 375×667 (iPhone SE) — sprawdź:
  - Hero foto widoczne, heading czytelne (max 3 linijki), CTA primary tappable (height ≥ 44px)
  - Brak horizontal scroll (sprawdź `document.documentElement.scrollWidth === window.innerWidth`)
  - Sekcje Bachata Social + Instructors widoczne po scroll
- [E2E] Otwórz `/` na 1280×800 — sprawdź:
  - Hero 2-col layout (foto + heading obok)
  - Instructors 2-col grid
  - Header sticky widoczny po scroll
- [E2E] Klik CTA primary "Załóż konto" → redirect do `/signup`
- [E2E] Klik link "Dowiedz się więcej" → smooth scroll do sekcji How It Works
- [E2E] `document.title` zawiera "Bachata Napoli"; `<meta name="description">` istnieje
- [E2E] axe accessibility scan na `/` zwraca 0 violations
- [E2E] `prefers-reduced-motion: reduce` → sekcje pojawiają się instant bez animacji
- [Manual] Wizualne porównanie z DESIGN.md mood (operator/designer verifies vibe = "editorial + ciepły terracotta akcent, nie krzyczy")

**Weryfikacja:**
- `bun run typecheck` + `bun run lint` + `bun run test` przechodzą
- `bun run build` → `dist/index.html` zawiera prerendered HTML z sekcjami (po IU-12 prerender setup; przed IU-12 = SPA HTML stub OK)
- E2E: landing renderuje wszystkie 5 sekcji na mobile + desktop bez horizontal scroll
- Lighthouse mobile audit na `/`: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90

**Operator checklist:**
- [ ] Hero photo: docelowe zdjęcie z sesji photoshoot wgrane do `public/hero.jpg` (zastępuje placeholder po IU-5 land)
- [ ] Foto instruktorów Małgosia + Szymon dostarczone i wgrane do `public/`
- [ ] Final copy do wszystkich sekcji dostarczone przez biznes (zastępuje placeholder copy)
- [ ] `og-image.jpg` (1200×630) — wersja brandowa dla social sharing

---

### Faza 3 — Library core (IU 6–7): Osobista biblioteka + foldery

- [ ] **Unit 6: Library schema + dashboard skeleton + empty state**

**Cel:** DB schema dla videos/folders/m:n + dashboard route `/library` z empty state + grid videos + sidebar foldery. Brak jeszcze sources (przyjdą w IU-8/9) — dashboard działa "na pusto" z CTA do dodania.

**Wymagania:** R8, R12, R13, R14

**Zależności:** IU-4 (auth required)

**Pliki:**
- Stwórz: `supabase/migrations/0003_videos_folders.sql` (tables `videos`, `folders`, `video_folders` + RLS)
- Stwórz: `src/features/library/api/videos.ts` (`getVideos(folderId?)`, `getVideoById(id)`)
- Stwórz: `src/features/library/api/folders.ts` (`getFolders()`)
- Stwórz: `src/features/library/hooks/useVideos.ts` (React Query wrapper)
- Stwórz: `src/features/library/hooks/useFolders.ts`
- Stwórz: `src/features/library/types.ts` (re-export z `database.types.ts` z app-specific aliases)
- Stwórz: `src/pages/library/index.tsx`
- Stwórz: `src/features/library/components/VideoGrid.tsx`
- Stwórz: `src/features/library/components/VideoCard.tsx`
- Stwórz: `src/features/library/components/EmptyLibrary.tsx`
- Stwórz: `src/features/library/components/LibrarySidebar.tsx` (mobile: bottom sheet)
- Stwórz: `src/components/layout/DashboardLayout.tsx` (header + sidebar + main)
- Stwórz: `src/components/layout/DashboardHeader.tsx`
- Test (unit): `src/features/library/api/videos.test.ts`, `src/features/library/api/folders.test.ts`, `src/features/library/hooks/useVideos.test.tsx`
- Test (e2e): scenariusze dashboard fresh user

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- **Schema (`0003_videos_folders.sql`):**
  - `videos`:
    - `id` (uuid pk default `gen_random_uuid()`)
    - `user_id` (uuid FK `auth.users(id)` ON DELETE CASCADE, NOT NULL)
    - `source` (text NOT NULL, CHECK IN `('youtube_link', 'youtube_upload', 'meta_embed')`)
    - `source_url` (text NOT NULL — original URL podany przez usera)
    - `source_id` (text NOT NULL — YT video ID, FB post ID — extracted)
    - `title` (text NOT NULL)
    - `notes` (text — user notes, max via app-level Zod 2000 chars)
    - `thumbnail_url` (text nullable)
    - `embed_html` (text nullable — tylko dla `meta_embed` source; YT renderuje przez iframe URL)
    - `duration_seconds` (integer nullable)
    - `created_at` (timestamptz default now())
    - `updated_at` (timestamptz default now() — trigger updates on UPDATE)
    - UNIQUE INDEX `(user_id, source, source_id)` — zapobiega duplikatom per user
    - INDEX `(user_id, created_at DESC)` — dla list views
  - `folders`:
    - `id` (uuid pk)
    - `user_id` (uuid FK CASCADE, NOT NULL)
    - `name` (text NOT NULL, CHECK length(name) BETWEEN 1 AND 100)
    - `created_at`, `updated_at`
    - UNIQUE INDEX `(user_id, lower(name))` — case-insensitive uniqueness per user
  - `video_folders` (junction m:n):
    - `video_id` (uuid FK `videos(id)` ON DELETE CASCADE)
    - `folder_id` (uuid FK `folders(id)` ON DELETE CASCADE)
    - `added_at` (timestamptz default now())
    - PRIMARY KEY `(video_id, folder_id)`
    - INDEX `(folder_id, video_id)` — dla filtered list views
- **RLS policies (każda table):**
  - `videos`: ALL operations WHERE `user_id = auth.uid()`
  - `folders`: ALL operations WHERE `user_id = auth.uid()`
  - `video_folders`: ALL operations WHERE `video_id IN (SELECT id FROM videos WHERE user_id = auth.uid())` (przez weryfikację parent video)
- **Updated_at trigger:** uniwersalny `update_updated_at_column()` function + trigger na `videos` i `folders`
- **API layer (`videos.ts`, `folders.ts`):**
  - Cienkie wrappers nad `supabase.from('videos').select(...)` — return typed promises
  - `getVideos({ folderId? })`: jeśli `folderId` podane → JOIN przez `video_folders`
- **React Query:**
  - Query keys: `['videos', userId]`, `['videos', userId, { folderId }]`, `['folders', userId]`
  - `staleTime: 60_000` (1 min — videos się nie zmieniają często)
  - Invalidate po mutations w IU-7/8/9
- **Dashboard layout:**
  - Desktop (>=lg): sidebar 240px lewa kolumna z folderami + main grid wideos
  - Mobile (<lg): main grid pełna szerokość; folder selector via top tabs (horizontal scroll) lub FAB → bottom sheet z folder list
- **VideoCard (skeleton — pełna implementacja w IU-8):**
  - Thumbnail 16:9 (placeholder gradient dopóki source nie zwróci) + title + meta row (source icon Lucide [`Youtube` / `Facebook` / `Instagram` / `UploadCloud`] + duration tabular nums + relative date "2 dni temu")
  - Click → otwiera VideoPlayer modal (implementacja w IU-8)
- **EmptyLibrary:**
  - SVG illustration placeholder (lucide `VideoOff` lub custom inline SVG; full custom illustration odroczone)
  - Heading: "Twoja biblioteka czeka na pierwszy film"
  - Body: "Wklej link, dodaj embed lub wgraj plik z telefonu — wszystko trafi tu, uporządkowane."
  - CTA primary "Dodaj film" (otwiera AddVideoDialog z IU-8)
- **DashboardHeader:** logo + user menu (Avatar dropdown z "Mój profil", "Wyloguj")

**Wzorce do naśladowania:**
- Supabase RLS pattern (`auth.uid()` z policies)
- shadcn/ui Sheet (mobile folder picker), DropdownMenu (user avatar), Card
- DESIGN.md sekcja 7 (Card: flat z hairline border, nie shadow), sekcja 11 (Mobile-specific tap targets ≥ 44px)

**Scenariusze testowe:**
- [Unit] `getVideos()` bez folderId zwraca wszystkie videos usera, sortowane created_at DESC
- [Unit] `getVideos({ folderId })` JOIN'uje przez `video_folders`, zwraca tylko z folderu
- [Unit] `useVideos` w stanie loading zwraca `{ data: undefined, isLoading: true }`
- [Unit] `VideoCard` renderuje correct source icon dla każdego source value
- [Unit] `EmptyLibrary` jest renderowany gdy `videos.length === 0`
- [Unit] RLS test (psql z service role + impersonation): user A nie może SELECT videos usera B (0 rows)
- [Unit] RLS test: user A nie może INSERT video z `user_id = userB.id` (constraint violation)
- [E2E] Zaloguj się jako fresh user → otwórz `/library` → widzisz EmptyLibrary z CTA "Dodaj film"
- [E2E] Mobile (<lg): brak sidebar, jest FAB / top tabs dla foldery
- [E2E] Desktop: sidebar 240px lewa kolumna widoczna

**Weryfikacja:**
- `bun run typecheck` przechodzi
- `bun run test src/features/library` zielony
- `supabase db reset` aplikuje migrację `0003` bez błędów
- E2E: `/library` po loginie renderuje EmptyLibrary + working DashboardLayout

**Operator checklist:** brak

---

- [ ] **Unit 7: Folder management — CRUD + m:n assignment + filter library by folder**

**Cel:** User tworzy/edytuje/usuwa foldery; przypisuje film do wielu folderów inline; filtruje library by folder (`?folder=<id>`).

**Wymagania:** R12, R13

**Zależności:** IU-6

**Pliki:**
- Stwórz: `src/features/library/components/FolderList.tsx` (sidebar item — folder name + count + click)
- Stwórz: `src/features/library/components/CreateFolderDialog.tsx`
- Stwórz: `src/features/library/components/EditFolderDialog.tsx`
- Stwórz: `src/features/library/components/DeleteFolderConfirm.tsx`
- Stwórz: `src/features/library/components/FolderPickerSheet.tsx` (mobile m:n)
- Stwórz: `src/features/library/components/FolderPickerPopover.tsx` (desktop m:n)
- Modify: `src/features/library/api/folders.ts` (add: `createFolder(name)`, `updateFolder(id, name)`, `deleteFolder(id)`, `assignVideoToFolders(videoId, folderIds[])`, `removeVideoFromFolder(videoId, folderId)`)
- Stwórz: `src/features/library/hooks/useFolderMutations.ts` (React Query mutations z optimistic updates)
- Modify: `src/features/library/components/VideoCard.tsx` (dodaj button/menu z "Zarządzaj folderami" trigger picker)
- Modify: `src/pages/library/index.tsx` (parse `?folder=<id>` query param, filter videos)
- Modify: `src/features/library/components/LibrarySidebar.tsx` (sidebar mount FolderList + "+ Nowy folder")
- Test (unit): folder mutations + assignment tests

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- **CRUD operations:**
  - `createFolder(name)`: INSERT z user_id = auth.uid(); jeśli duplicate (case-insensitive) → constraint violation → toast "Folder o tej nazwie już istnieje"
  - `updateFolder(id, name)`: UPDATE WHERE id = ... AND user_id = auth.uid() (RLS dba o filter)
  - `deleteFolder(id)`: DELETE WHERE id = ...; CASCADE usuwa rows z `video_folders` ALE NIE z `videos` (filmy zostają w bibliotece, tylko folder znika)
- **Assignment m:n:**
  - `assignVideoToFolders(videoId, folderIds)`: pattern "diff and apply" — pobierz aktualne folders dla video, oblicz diff z target, INSERT/DELETE odpowiednio
  - Idempotentne — re-assignment do tego samego folderu = no-op
- **UI patterns:**
  - **Create folder:** Dialog (desktop) lub Sheet (mobile) z 1 input + Submit. Inline w sidebar przycisk "+ Nowy folder" otwiera dialog
  - **Edit folder:** klik na folder w sidebar → ⋯ dropdown → "Zmień nazwę" → Dialog z prefilled input
  - **Delete folder:** ⋯ dropdown → "Usuń folder" → AlertDialog z confirm "Usunąć folder \"X\"? Filmy w środku zostają w bibliotece, tylko folder zniknie."
  - **Assignment popup:**
    - Desktop (>=md): Popover z checkbox list folderów + Command-style search (shadcn/ui Command) + "+ Nowy folder" inline action
    - Mobile: Sheet z większymi tap targets (48px row height), drag-to-dismiss
  - Popup state: lokalny (uncommitted changes); "Zapisz" commit'uje, "Anuluj" odrzuca
- **React Query optimistic updates:**
  - `assignVideoToFolders` mutation: instantly update cache `['videos', userId, { folderId }]` dla każdego affected folderu, rollback przy error z toast
- **Filter by folder:**
  - URL: `/library?folder=<uuid>` — friendly dla bookmarków
  - `LibraryPage` reads `searchParams.get('folder')` → passes to `useVideos({ folderId })`
  - "Wszystkie filmy" = brak `?folder` param
  - Active folder w sidebar visual indicator (left border accent, lub bold + accent text — DESIGN.md sekcja 10 navigation)

**Wzorce do naśladowania:**
- shadcn/ui Dialog, AlertDialog, Popover, Sheet, Command (search w popover)
- React Query optimistic updates pattern (`onMutate` → snapshot → modify cache → `onError` rollback)

**Scenariusze testowe:**
- [Unit] `createFolder('Zajęcia')` → returns folder z id
- [Unit] `createFolder('Zajęcia')` twice → drugi call rzuca duplicate error
- [Unit] `createFolder('zajęcia')` po `createFolder('Zajęcia')` → duplicate error (case-insensitive)
- [Unit] `deleteFolder(id)` z 3 videos → folder znika, videos zostają (count `videos` table bez zmian), `video_folders` rows dla tego folder usunięte
- [Unit] `assignVideoToFolders(v, [f1, f2])` then `assignVideoToFolders(v, [f1])` → tylko `f1` zostaje w `video_folders`, `f2` removed
- [Unit] `useFolderMutations` `assignVideoToFolders` optimistic update: cache zmienia się przed network response
- [E2E] Otwórz `/library` → sidebar pokazuje "+ Nowy folder" → klik → dialog → wpisz "Andrzejewscy zajęcia" → submit → folder pojawia się w sidebar; toast "Folder utworzony"
- [E2E] Klik na video (po IU-8 dodaniu 1 wideo) → menu ⋯ → "Zarządzaj folderami" → checkbox 2 foldery → "Zapisz" → toast success
- [E2E] Sidebar klik na folder "Andrzejewscy zajęcia" → URL `?folder=<id>` → grid pokazuje tylko film z tego folderu
- [E2E] Próba duplikatu nazwy folderu → form error inline "Folder o tej nazwie już istnieje" (nie pełny crash)
- [E2E] Delete folder z 3 wideos → confirm dialog → "Usuń" → folder znika; refresh widoku "Wszystkie filmy" → 3 filmy nadal widoczne

**Weryfikacja:**
- `bun run typecheck` + `bun run lint` + `bun run test` zielone
- E2E: CRUD foldery + assignment + filter działa end-to-end

**Operator checklist:** brak

---

### Faza 4 — Video sources (IU 8–9): Trzy źródła filmów

- [ ] **Unit 8: External video sources — YouTube link paste + Meta (FB/IG) embed**

**Cel:** User wkleja URL z YT lub publicznego posta FB/IG → metadata fetch przez Edge Function → film w bibliotece + odpowiedni embed renderowany w VideoPlayer.

**Wymagania:** R9, R11, R14

**Zależności:** IU-6 (library schema), IU-3 (API keys w Edge Function env)

**Pliki:**
- Stwórz: `supabase/functions/fetch-youtube-metadata/index.ts` (Deno Edge Function — proxy do YT Data API, ukrywa API key)
- Stwórz: `supabase/functions/validate-meta-embed/index.ts` (proxy do Meta oEmbed endpoint)
- Stwórz: `supabase/functions/_shared/cors.ts`, `supabase/functions/_shared/response.ts` (shared utilities)
- Stwórz: `src/features/library/components/AddVideoDialog.tsx` (root: Dialog desktop / Sheet mobile, z 3 tabami: YouTube link / Facebook-Instagram / Upload plik)
- Stwórz: `src/features/library/components/YoutubeLinkForm.tsx`
- Stwórz: `src/features/library/components/MetaLinkForm.tsx`
- Stwórz: `src/features/library/components/VideoPlayer.tsx` (renderer dla 3 source types: YT iframe, Meta embed dangerouslySetInnerHTML, YT upload iframe)
- Stwórz: `src/features/library/components/VideoDetailDialog.tsx` (modal otwierany z VideoCard click — player + tytuł + notatki + edit + share buttons)
- Stwórz: `src/lib/url-parsers.ts` (`parseYoutubeUrl(url) → { videoId } | null`, `parseMetaUrl(url) → { platform: 'fb' | 'ig', postId } | null`)
- Stwórz: `src/lib/duration.ts` (`parseIso8601Duration('PT4M30S') → 270`)
- Stwórz: `src/lib/dompurify-wrapper.ts` (sanitize Meta embed HTML — defense in depth nawet jeśli Meta jest trusted)
- Modify: `src/features/library/api/videos.ts` (`createVideoFromYoutubeLink(url)`, `createVideoFromMetaLink(url)`, `updateVideo({ id, title, notes })`, `deleteVideo(id)`)
- Modify: `src/features/library/components/VideoCard.tsx` (full implementation — click → VideoDetailDialog)
- Modify: `src/features/library/components/EmptyLibrary.tsx` (CTA "Dodaj film" otwiera AddVideoDialog)
- Test (unit): `src/lib/url-parsers.test.ts`, `src/lib/duration.test.ts`, `supabase/functions/fetch-youtube-metadata/index.test.ts`, `src/features/library/api/videos.test.ts`
- Test (e2e): AddVideoDialog scenarios per tab

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- **URL parsers (`src/lib/url-parsers.ts`):**
  - `parseYoutubeUrl` akceptuje wszystkie warianty: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/`, `m.youtube.com/watch?v=`, query params kolejność (`?v=X&t=10s` lub `?t=10s&v=X`)
  - `parseMetaUrl` rozróżnia FB vs IG, rozróżnia post/reel/video; akceptuje `fb.watch/`, `facebook.com/share/v/`, `facebook.com/<page>/videos/<id>`, `instagram.com/p/<code>/`, `instagram.com/reel/<code>/`, `instagram.com/tv/<code>/`
- **YouTube Edge Function (`fetch-youtube-metadata`):**
  - Input: `{ videoId: string }` (POST body)
  - Calls `GET https://www.googleapis.com/youtube/v3/videos?id=<id>&part=snippet,contentDetails&key=<YOUTUBE_API_KEY>`
  - Returns: `{ title, description, thumbnailUrl, duration, channelTitle }` lub `{ error: 'not_found' | 'private' | 'rate_limited' }`
  - Edge cache: 1h TTL per video ID (oszczędność quoty — popularne filmy często share'owane)
  - Auth: requires Supabase auth JWT (no anonymous calls)
- **Meta Edge Function (`validate-meta-embed`):**
  - Input: `{ platform: 'fb' | 'ig', url: string }`
  - Calls oEmbed endpoint (specific URL w 2026 do weryfikacji — historycznie `graph.facebook.com/v18.0/oembed_video` dla FB, `graph.facebook.com/v18.0/instagram_oembed` dla IG)
  - Auth do Meta: `?access_token=<META_APP_ID>|<META_APP_SECRET>`
  - Returns: `{ embedHtml, thumbnailUrl, title, authorName }` lub error
  - **Implementation notatka:** **Weryfikuj aktualny stan Meta oEmbed API w 2026 PRZED napisaniem kodu.** Meta historycznie kilkukrotnie zmieniało politykę. Fallback plan jeśli oEmbed deprecated dla naszego use case:
    - Plan B: Manual entry — user wkleja URL + title + thumbnail URL ręcznie, my zapisujemy jako "external link" bez embed (klik = otwiera w nowej karcie)
    - Plan C: Usunięcie R11 z MVP (decyzja z biznesem)
- **`AddVideoDialog`:** desktop Dialog / mobile Sheet z 3 tabami — Tabs primitive shadcn/ui
  - Tab "YouTube link": input URL + przykład hint + submit → calls `createVideoFromYoutubeLink(url)` → loading → toast success + close dialog + auto-scroll w grid do nowego filmu
  - Tab "Facebook / Instagram": input URL + hint + submit (analogicznie)
  - Tab "Upload plik": placeholder w IU-8, full implementation w IU-9
- **`VideoPlayer`** (responsive aspect-video):
  - `source = 'youtube_link' | 'youtube_upload'`: `<iframe src="https://www.youtube-nocookie.com/embed/<source_id>?rel=0&modestbranding=1" allowfullscreen>`
  - `source = 'meta_embed'`: `<div ref={ref} dangerouslySetInnerHTML={{ __html: sanitize(embed_html) }} />` + useEffect: po mount call `window.FB?.XFBML.parse(ref.current)` (FB JS SDK loaded conditionally; IG embed używa FB SDK też w 2025+)
  - FB SDK loader: lazy load tylko gdy strona renderuje meta_embed; script z `connect.facebook.net/en_US/sdk.js`
- **`VideoDetailDialog`:** (modal z VideoCard click)
  - VideoPlayer + tytuł edytowalny (inline edit z save on blur) + notes textarea + action buttons (Share — IU-10, Delete, Manage folders — IU-7)
  - Mobile: Sheet full-screen z back button

**Notatka wykonawcza:** zacznij od failing integration tests dla URL parserów (`parseYoutubeUrl` + `parseMetaUrl`) — to klastra edge cases gdzie błąd silently broken (user wkleja link → "nie rozpoznaję" mimo że link jest valid). Characterization-first dla parsers, potem dopiero UI.

**Wzorce do naśladowania:**
- Supabase Edge Functions docs (Deno, env, CORS)
- shadcn/ui Dialog, Sheet, Tabs, Form
- DOMPurify dla sanitization (defense in depth nawet z trusted Meta source)
- YouTube embed best practices (nocookie domain, parameters)

**Scenariusze testowe:**
- [Unit] `parseYoutubeUrl` dla 6 wariantów URL → zwraca ten sam video ID
- [Unit] `parseYoutubeUrl('https://google.com')` → `null`
- [Unit] `parseMetaUrl('https://instagram.com/reel/Cabc123/')` → `{ platform: 'ig', postId: 'Cabc123' }`
- [Unit] `parseMetaUrl('https://facebook.com/share/v/xyz/')` → `{ platform: 'fb', postId: 'xyz' }`
- [Unit] `parseIso8601Duration('PT4M30S')` → 270
- [Unit] `fetch-youtube-metadata` z fake video ID → returns 404 / error response
- [Unit] `fetch-youtube-metadata` cache hit: drugi call w 1h → cached response, zero call do YT API
- [Unit] `createVideoFromYoutubeLink` z URL filmu już dodanego przez tego usera → rzuca duplicate error → toast "Ten film już jest w Twojej bibliotece"
- [Unit] `createVideoFromYoutubeLink` z URL filmu już dodanego przez **innego** usera → success (per-user unique constraint)
- [Unit] `sanitize` na valid Meta embed HTML → output zawiera oryginalny iframe; na malicious HTML → output bez `<script>`
- [E2E] Otwórz `/library` → klik "Dodaj film" → tab "YouTube link" → wklej `https://youtube.com/watch?v=dQw4w9WgXcQ` → submit → toast "Dodano film" + dialog zamyka się + VideoCard pojawia się w grid
- [E2E] Wklej invalid URL "https://example.com" → form error "Nie rozpoznaję linku. Wklej URL z YouTube."
- [E2E] Klik VideoCard → VideoDetailDialog otwiera się → VideoPlayer renderuje YT iframe (no broken player)
- [E2E] Tab "Facebook / Instagram" → wklej IG reel URL → submit → film pojawia się w grid + VideoPlayer renderuje Meta embed
- [E2E] VideoDetailDialog → edit tytuł inline → save on blur → toast "Zapisano"
- [E2E] VideoDetailDialog → Delete → AlertDialog confirm → film znika z grid

**Weryfikacja:**
- `bun run typecheck` + `bun run lint` + `bun run test` zielone
- `supabase functions serve fetch-youtube-metadata` działa lokalnie + returns oczekiwane responses dla test ID
- `supabase functions serve validate-meta-embed` działa lokalnie (z stub Meta jeśli oEmbed unavailable w trakcie dev)
- E2E: end-to-end add YT link + add Meta link + open detail dialog + delete

**Operator checklist:**
- [ ] Meta oEmbed status zweryfikowany w 2026 — wybrany flow (oEmbed lub fallback Plan B/C) przed implementacją kodu
- [ ] `YOUTUBE_API_KEY` w Supabase Edge Functions env (oba: staging + prod)
- [ ] `META_APP_ID` + `META_APP_SECRET` w env (jeśli Plan A — oEmbed)

---

- [ ] **Unit 9: YouTube upload — direct browser → user's YT account (resumable)**

**Cel:** Zalogowany user uploaduje plik wideo z urządzenia bezpośrednio na swoje konto YouTube (jako unlisted) z incremental OAuth scope upgrade; film auto-pojawia się w bibliotece po success.

**Wymagania:** R10

**Zależności:** IU-4 (auth + identity linking), IU-6 (library), IU-8 (AddVideoDialog skeleton z tabem Upload)

**Pliki:**
- Stwórz: `src/lib/youtube-resumable-upload.ts` (clean implementation YouTube resumable upload protocol — chunking, resume, retry, abort)
- Stwórz: `src/features/library/hooks/useResumableUpload.ts` (React Query mutation + local state dla progress; persisted w sessionStorage żeby przetrwać F5)
- Stwórz: `src/features/library/components/VideoUploadForm.tsx`
- Stwórz: `src/features/library/components/UploadProgress.tsx` (progress bar + cancel + estimated time)
- Stwórz: `src/features/library/components/UploadQueueWidget.tsx` (floating widget gdy upload background — user może zamknąć dialog, nadal widzi progress)
- Stwórz: `src/features/auth/components/GoogleScopeUpgradePrompt.tsx` (explainer + CTA "Daj zgodę na upload")
- Stwórz: `src/features/auth/api/google-identity.ts` (`hasYoutubeUploadScope()`, `requestYoutubeUploadScope()`, `getGoogleAccessToken()`, `refreshGoogleAccessToken()`)
- Modify: `src/features/library/api/videos.ts` (add: `createVideoFromUpload({ youtubeVideoId, title })` — wywoływane po success upload)
- Modify: `src/features/library/components/AddVideoDialog.tsx` (tab "Upload plik" → mount VideoUploadForm)
- Test (unit): `src/lib/youtube-resumable-upload.test.ts` (MSW mocks), `src/features/library/hooks/useResumableUpload.test.tsx`, `src/features/auth/api/google-identity.test.ts`

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- **Incremental OAuth scope upgrade:**
  - User klika "Upload plik" w AddVideoDialog
  - `hasYoutubeUploadScope()` sprawdza czy aktualny identity ma scope `youtube.upload` (Supabase session zawiera `provider_token` + scopes — sprawdzić w `user.app_metadata` lub `getSession().data.session.provider_token` + decode lub explicit field)
  - Jeśli BRAK scope → `GoogleScopeUpgradePrompt` (explainer: "Aby uploadować na YouTube potrzebujemy Twojej zgody na publikację filmów na Twoim koncie. Filmy będą **unlisted** — nikt nie znajdzie ich w wyszukiwarce YT, tylko Ty i osoby z bezpośrednim linkiem. Możesz cofnąć zgodę w dowolnym momencie w ustawieniach Google.")
  - Klik "Daj zgodę" → `requestYoutubeUploadScope()` → `supabase.auth.linkIdentity({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/youtube.upload' } })` (incremental)
  - Po success → reload identity state → continue do upload form
- **Access token management:**
  - Supabase store provider tokens (access_token + refresh_token) w session
  - `getGoogleAccessToken()` zwraca aktualny token; jeśli expired (>55 min od issue) → `refreshGoogleAccessToken()` używa refresh_token
  - Refresh fail (user revoked scope w GCP console) → throw `AuthError` → UI re-prompts
- **Resumable upload protocol (clean impl w `youtube-resumable-upload.ts`):**
  1. **Initiate session:**
     - `POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`
     - Headers: `Authorization: Bearer <access_token>`, `Content-Type: application/json`, `X-Upload-Content-Length: <fileSize>`, `X-Upload-Content-Type: <mime>`
     - Body: `{ snippet: { title }, status: { privacyStatus: 'unlisted' } }`
     - Response 200 → `Location` header zawiera resumable URL
  2. **Upload chunks:**
     - Chunk size: 8 MB (good balance — minimum 256 KB per spec, większe = mniej requestów, ale wolniejszy retry przy fail)
     - Każdy chunk: `PUT <resumableUrl>` z `Content-Range: bytes <start>-<end>/<total>` + binary body
     - Response 308 Resume Incomplete + `Range: bytes=0-<bytesReceived>` → kontynuuj od `bytesReceived + 1`
     - Response 200/201 → upload done, body zawiera video resource z `id` (YT video ID)
     - Response 401 → refresh token + retry tego chunk
     - Response 5xx → exponential backoff retry (max 5 prób, 1s/2s/4s/8s/16s)
     - Response 403 quotaExceeded → throw `QuotaExceededError` → UI shows "Dziś osiągnęliśmy limit YT API. Spróbuj jutro." + log do Sentry
  3. **Cancel:** `DELETE <resumableUrl>` → cleanup partial upload na YT
- **UX:**
  - VideoUploadForm: file input (capture="environment" mobile = back camera; accept="video/*") + title input (default = filename bez extension) + Submit
  - File size check: jeśli > 2 GB → block z "Plik za duży (max 2 GB). Skróć film lub skompresuj."
  - File size warn: jeśli > 500 MB i navigator.connection.effectiveType = '3g'/'2g' → warn "To może chwilę potrwać i zjeść transfer mobilny. Połącz się z Wi-Fi?"
  - UploadProgress: determinate bar 0-100% + "Wgrano X.X MB z Y.Y MB" + estimated time remaining (na podstawie current speed) + Cancel button
  - Background upload: useResumableUpload state trzyma się w React context provider; user może zamknąć AddVideoDialog → UploadQueueWidget pojawia się w right-bottom (desktop) / bottom-sticky (mobile) z mini progress; klik → reopen detail
  - Persistencja przez F5: sessionStorage zapisuje `{ resumableUrl, fileSize, uploadedBytes, title }` — przy reload widget proponuje "Wznów upload?" (file musi być re-selected przez user — security ograniczenie browser File API)
  - Post-success: `createVideoFromUpload({ youtubeVideoId, title })` zapisuje row w `videos` table z source='youtube_upload', source_id=youtubeVideoId, source_url=`https://www.youtube.com/watch?v=<id>`, thumbnail_url=`https://i.ytimg.com/vi/<id>/mqdefault.jpg`
- **Quota awareness:**
  - YT upload = 1600 jednostek per upload (default quota 10k/dzień = ~6 uploadów/dzień GLOBALNIE)
  - Operator (IU-3) złożył quota extension request — target 100k+ jednostek (60+ uploads/dzień)
  - Frontend handles `403 quotaExceeded` graceful + alert do Sentry żeby monitor

**Notatka wykonawcza:** **Resumable upload protocol implementuj test-first.** To najbardziej kruchy kawałek całego planu — chunking + resume po 308 + retry po 5xx + refresh token po 401 + abort cleanup to klastra edge cases gdzie nie-przetestowany kod silnie failuje w produkcji. Zacznij od failing integration testów dla każdego scenariusza przed napisaniem UI.

**Wzorce do naśladowania:**
- Google YouTube Data API v3: "Resumable Uploads" docs
- Pattern z `gapi.client` (Google's official lib) — ale piszemy własną minimalną wersję bez 300KB SDK

**Scenariusze testowe:**
- [Unit] `youtube-resumable-upload` z 5 MB file → 1 chunk → success, returns YT video ID
- [Unit] z 50 MB file → 7 chunks (8 MB each) → wszystkie success → success
- [Unit] chunk 3 z 7 zwraca 308 Resume Incomplete + Range header → resume od indicated byte → continue
- [Unit] chunk zwraca 503 → exponential backoff 1s/2s/4s/8s → success → continue
- [Unit] chunk zwraca 503 5x z rzędu → throw `UploadFailedError` po 5 retry
- [Unit] chunk zwraca 401 → call `refreshGoogleAccessToken()` → retry chunk z new token → success
- [Unit] refresh token fail → throw `AuthError` → UI re-prompts scope upgrade
- [Unit] abort middle of upload → DELETE resumable URL → state cleanup
- [Unit] `createVideoFromUpload` po success → INSERT do videos z source='youtube_upload'
- [Unit] `hasYoutubeUploadScope()` zwraca true gdy session ma scope; false w przeciwnym razie
- [E2E] Zaloguj się jako user bez scope → AddVideoDialog → tab "Upload" → widzisz `GoogleScopeUpgradePrompt`
- [E2E] User z scope: select 5 MB MP4 → upload → progress bar od 0% do 100% → "Upload zakończony" → film pojawia się w grid
- [E2E] User cancel w trakcie uploadu → toast "Upload anulowany" → grid bez tego filmu, YT bez resztki (verify manualnie w YT Studio)
- [E2E] Mobile: file picker otwiera back camera dla "video" capture
- [E2E] File > 2 GB → form error "Plik za duży (max 2 GB)"

**Weryfikacja:**
- `bun run typecheck` przechodzi
- `bun run test src/lib/youtube-resumable-upload` zielony (z wszystkimi protocol edge cases pokrytymi MSW mocks)
- `bun run test src/features/library/hooks/useResumableUpload` zielony (z mocked YT API)
- E2E: scope upgrade prompt renderuje się dla usera bez scope; (optional) full upload flow w środowisku staging z real YT API

**Operator checklist:**
- [ ] **OAuth verification dla `youtube.upload` scope APPROVED przez Google** (krytyczne — bez tego production users dostają warning screen "unverified app")
- [ ] Quota extension request approved lub fallback plan dla launch (np. invite-only launch z ograniczeniem 6 uploads/dzień)
- [ ] Real-device test: upload z iPhone Safari + Chrome Android (capture environment + file size limits)

---

### Faza 5 — Sharing + launch (IU 10–12): Udostępnianie i przygotowanie do publicznego startu

- [ ] **Unit 10: Share tokens — public read access z revoke**

**Cel:** User generuje publiczny link tokenowy dla filmu lub folderu; każdy z linkiem widzi treść read-only bez konta; user może revoke link (istniejące linki przestają działać).

**Wymagania:** R15, R16, R17

**Zależności:** IU-6 (videos schema), IU-7 (folders schema), IU-8 (VideoPlayer)

**Pliki:**
- Stwórz: `supabase/migrations/0004_share_tokens.sql` (table `share_tokens` + RLS + `get_shared_content(text)` SECURITY DEFINER function)
- Stwórz: `src/features/sharing/api/shareTokens.ts` (`createShareToken({ targetType, targetId })`, `revokeShareToken(id)`, `listShareTokens()`, `fetchSharedContent(token)`)
- Stwórz: `src/features/sharing/hooks/useShareTokens.ts`
- Stwórz: `src/features/sharing/components/ShareDialog.tsx` (z VideoDetailDialog / Folder header trigger)
- Stwórz: `src/features/sharing/components/ShareLinkRow.tsx` (item w lista aktywnych linków z copy + revoke)
- Stwórz: `src/features/sharing/components/RevokeConfirm.tsx`
- Stwórz: `src/features/sharing/components/SharedVideoView.tsx` (public view single video)
- Stwórz: `src/features/sharing/components/SharedFolderView.tsx` (public view folder z grid wideos)
- Stwórz: `src/features/sharing/components/RevokedTokenView.tsx`
- Stwórz: `src/pages/s/[token].tsx` (public route, NO auth required)
- Modify: `src/features/library/components/VideoDetailDialog.tsx` (dodaj button "Udostępnij" → opens ShareDialog dla single video)
- Modify: `src/features/library/components/LibrarySidebar.tsx` (folder context menu → "Udostępnij folder" → opens ShareDialog dla folder)
- Modify: `src/router.tsx` (add `/s/:token` route, public, brak auth guard)
- Test (unit): `src/features/sharing/api/shareTokens.test.ts`, RLS test dla `share_tokens` + function

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- **Schema:**
  - `share_tokens`:
    - `id` (uuid pk)
    - `user_id` (uuid FK `auth.users(id)` ON DELETE CASCADE — usunięcie konta = wszystkie share tokens znikają)
    - `token` (text UNIQUE NOT NULL — generowany z `encode(gen_random_bytes(24), 'base64')` + replace `+/` na `-_` = 32-char URL-safe; 192 bits entropy)
    - `target_type` (text CHECK IN `('video', 'folder')`)
    - `target_id` (uuid NOT NULL — UWAGA: weak reference, app-level integrity, **nie FK** żeby pozwolić usunąć video bez kaskadowego usuwania tokena, choć w praktyce gdy parent znika token revoked implicit przez funkcję — patrz function logic)
    - `revoked_at` (timestamptz nullable)
    - `created_at`, `last_accessed_at`
  - RLS na `share_tokens`:
    - Owner (`user_id = auth.uid()`): SELECT, INSERT, UPDATE (revoked_at)
    - Anon: **żaden direct access** — wszystko przez funkcję
- **`get_shared_content(token text)` SECURITY DEFINER function:**
  - Lookup row WHERE token = arg AND revoked_at IS NULL
  - Jeśli not found → `RAISE EXCEPTION 'token_invalid_or_revoked'`
  - Jeśli target_type='video': SELECT z `videos` WHERE id = target_id → return JSON `{ type: 'video', video: {...} }`
  - Jeśli target_type='folder': SELECT z `folders` WHERE id = target_id + JOIN videos przez video_folders → return JSON `{ type: 'folder', folder: {...}, videos: [...] }`
  - Jeśli target row not found (parent deleted): RAISE EXCEPTION 'target_not_found' (frontend traktuje jak revoked)
  - UPDATE `share_tokens.last_accessed_at = now()` (analytics)
- **Anon RPC call:** `supabase.rpc('get_shared_content', { token })` — działa bez auth header (anon key wystarcza dla SECURITY DEFINER function)
- **Token URL:** `https://bachatanapoli.pl/s/<token>` — krótka ścieżka łatwa do skopiowania w SMS/WhatsApp/Messenger
- **Public view:**
  - Single video: VideoPlayer (full width) + title + notes + footer "Udostępnione przez Bachata Napoli — Załóż konto i organizuj własne filmy" + CTA "Załóż konto"
  - Folder: heading folder name + read-only grid VideoCard (klik = inline expand do VideoPlayer; brak akcji edit/delete/share) + footer CTA
  - Layout: PublicHeader (zalogowany może mieć inną nawigację — sprawdź session, ale BRAK auth required)
- **Revoke flow:**
  - W VideoDetailDialog / Folder context menu: "Zarządzaj linkami" → lista aktywnych linków z URL + copy + revoke
  - Revoke confirm: "Cofnąć link? Osoby, którym go wysłałeś, stracą dostęp."
  - Optimistic update: link instant disabled w UI; backend UPDATE revoked_at = now()
- **Lista aktywnych linków** per video/folder (cap: pokazuj max 5; jeśli więcej "+ 3 starsze" expandable)
- **Copy to clipboard:** `navigator.clipboard.writeText(url)` + toast "Skopiowano"

**Notatka wykonawcza:** **Napisz failing integration tests dla `get_shared_content` SECURITY DEFINER function PRZED jakimkolwiek UI.** Token security to nie miejsce na ad-hoc verification — każde wykorzystanie w produkcji bez test coverage = realny risk leak'u prywatnych filmów. Pokrycie: valid token, revoked token, fake token, deleted target, cross-user attempt.

**Wzorce do naśladowania:**
- Supabase docs: "Using Postgres functions" + "SECURITY DEFINER" pattern
- Linear share links UX (per-resource share dialog)

**Scenariusze testowe:**
- [Unit] `createShareToken({ targetType: 'video', targetId })` → INSERT row z 32-char token + zwraca `{ token, url }`
- [Unit] Wygenerowany token = 32 chars URL-safe base64; różne calls = różne tokeny (entropia OK)
- [Unit] `revokeShareToken(id)` → UPDATE revoked_at = now()
- [Unit] `fetchSharedContent(validToken)` → returns video data
- [Unit] `fetchSharedContent(revokedToken)` → throws z error code 'token_invalid_or_revoked'
- [Unit] `fetchSharedContent(fakeToken)` → throws z 'token_invalid_or_revoked'
- [Unit] `fetchSharedContent(tokenZdeletedVideo)` → throws z 'target_not_found' (frontend pokazuje RevokedTokenView)
- [Unit] RLS test: anon user `SELECT * FROM share_tokens` → 0 rows (NIE może bypass funkcji)
- [Unit] RLS test: logged user A widzi tylko swoje tokens (nie B's)
- [Unit] RLS test: function call jako anon dla validToken → SUCCESS (bo SECURITY DEFINER bypassuje RLS dla auth.users wewnątrz funkcji)
- [E2E] User klika "Udostępnij" w VideoDetailDialog → ShareDialog → klik "Utwórz link" → URL token pojawia się + Copy button + toast "Link utworzony"
- [E2E] Otwórz `bachatanapoli.pl/s/<validToken>` w incognito (no auth) → SharedVideoView renderuje z VideoPlayer + title + footer CTA
- [E2E] User revoke token → odśwież share view → RevokedTokenView "Ten link został wyłączony"
- [E2E] Share folder → public view pokazuje grid wideos + folder name + read-only (brak edit buttons)
- [E2E] Copy button → toast "Skopiowano" → manualne paste w nowej karcie verifies URL

**Weryfikacja:**
- `bun run typecheck` + `bun run test` zielone
- `supabase db reset` aplikuje migrację `0004` + function bez błędów
- RLS unit tests zielone (test plik `0004_share_tokens.test.sql` lub Vitest z service role)
- E2E: full create → share → public view → revoke → public view "revoked" flow

**Operator checklist:** brak

---

- [ ] **Unit 11: GDPR compliance — privacy policy + regulamin + cookie consent + contact**

**Cel:** Strona spełnia minimum prawne GDPR + polskie wymagania (regulamin świadczenia usług, polityka prywatności, cookie consent, kontakt) — blocker dla publicznego launchu.

**Wymagania:** Założenie z brainstorma — "GDPR/PL prywatność: wymagana polityka prywatności, regulamin, cookie consent. Standard EU."

**Zależności:** IU-5 (landing exists, footer linki point tutaj)

**Pliki:**
- Stwórz: `src/pages/privacy.tsx`
- Stwórz: `src/pages/regulamin.tsx`
- Stwórz: `src/pages/contact.tsx`
- Stwórz: `src/features/legal/components/PrivacyPolicy.tsx` (renderuje markdown content)
- Stwórz: `src/features/legal/components/Regulamin.tsx`
- Stwórz: `src/features/legal/components/ContactForm.tsx`
- Stwórz: `src/features/legal/components/CookieConsentBanner.tsx`
- Stwórz: `src/features/legal/hooks/useCookieConsent.ts` (localStorage state z key `bachatanapoli.cookie-consent` = `{ analytics: boolean, timestamp: number }`)
- Stwórz: `docs/legal/privacy-policy-draft.md` (do review przez prawnika)
- Stwórz: `docs/legal/regulamin-draft.md` (do review przez prawnika)
- Stwórz: `src/features/legal/content/privacy-policy.mdx` lub plain markdown (rendered w PrivacyPolicy component)
- Stwórz: `src/features/legal/content/regulamin.mdx`
- Modify: `src/App.tsx` (mount `<CookieConsentBanner />` globally)
- Modify: `src/components/layout/PublicFooter.tsx` (links do `/privacy`, `/regulamin`, `/contact`)
- Modify: `src/router.tsx` (add public routes)
- Test (unit): `src/features/legal/hooks/useCookieConsent.test.ts`
- Test (e2e): cookie consent flow + linki w footer

**Delegate to:** feature-builder-ui

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, figma:figma-use, figma:figma-implement-design

**Podejście:**
- **Privacy policy content** musi pokrywać (draft w `docs/legal/privacy-policy-draft.md` do prawnika):
  - Identyfikacja administratora (właściciel domeny + adres + email kontaktowy)
  - Zakres zbieranych danych (email, OAuth profile [name, avatar], video metadata, IP adres w logach, cookies session)
  - Cel zbierania (świadczenie usługi, kontakt, analityka jeśli zgoda)
  - Podstawa prawna (art. 6 RODO — umowa + uzasadniony interes + zgoda dla analityki)
  - Okres przechowywania (do usunięcia konta + 30 dni backup retention)
  - Odbiorcy danych (Supabase [DPA], Google [DPA], Meta [DPA], Sentry [DPA])
  - Transfer do państw trzecich (Supabase EU region — Frankfurt; Google, Sentry mają adekwatne mechanizmy SCC/Privacy Shield successor)
  - Prawa userów (dostęp, sprostowanie, usunięcie, ograniczenie, portability, sprzeciw, cofnięcie zgody)
  - Procedury wykonywania praw (email do administratora)
  - Cookies (session auth, opcjonalnie analytics jeśli zgoda)
- **Regulamin** content sekcje (draft do prawnika):
  - Definicje
  - Świadczone usługi
  - Konto użytkownika (warunki, weryfikacja email, usunięcie)
  - Treści usera (filmy, foldery, linki) — user oświadcza że ma prawo do publikowania; my mamy ograniczoną licencję na hosting metadata
  - Ograniczenia (zakaz spam, nielegalnych treści, etc.)
  - Odpowiedzialność (limity, force majeure)
  - Reklamacje (procedura, terminy)
  - Cross-reference do polityki prywatności
  - Postanowienia końcowe (właściwe prawo PL, sąd)
- **Cookie consent:**
  - Banner pojawia się bottom-center (mobile) / bottom-right (desktop) przy pierwszym wejściu bez zapisanego consent
  - Treść: "Używamy cookies do działania serwisu. Cookies analityczne (opcjonalne) pomagają nam ulepszyć platformę."
  - Buttons: "Akceptuj wszystkie" (primary, terracotta) / "Tylko niezbędne" (ghost) / link "Dowiedz się więcej" → `/privacy#cookies`
  - Po wybór → close + zapisz w localStorage + `useCookieConsent` hook zwraca state dla guardów analytics (IU-12)
  - Dopóki user nie zaakceptuje analytics → analytics tracking OFF (Plausible/Umami integration w IU-12 sprawdza hook)
- **Contact page:**
  - Form: imię + email + temat + wiadomość → submit → email do adresu kontaktowego (przez Edge Function `send-contact-email` używając Supabase SMTP lub Resend; może w MVP = mailto: link jako simplest)
  - W MVP: prawdopodobnie `mailto:kontakt@bachatanapoli.pl` link + adres + telefon — najprostsze, bez infrastruktury
- **Markdown rendering:** `react-markdown` lub MDX (decyzja: react-markdown, simpler, MDX = overkill dla static legal pages)

**Wzorce do naśladowania:**
- Supabase / Vercel privacy + terms patterns (sekcje, language)
- Polskie kancelarie często publikują wzory regulaminów do dostosowania

**Scenariusze testowe:**
- [Unit] `useCookieConsent` initial state = `{ analytics: null }` (no decision yet)
- [Unit] Po `acceptAll()` → state = `{ analytics: true, timestamp }`; localStorage zapisane
- [Unit] Po `acceptEssentialOnly()` → `{ analytics: false, timestamp }`
- [Unit] Reload → `useCookieConsent` reads localStorage, returns prev decision
- [Unit] `CookieConsentBanner` nie renderuje się jeśli `analytics !== null`
- [E2E] Otwórz `/` w incognito → banner widoczny bottom screen
- [E2E] Klik "Tylko niezbędne" → banner znika; localStorage zawiera consent decision
- [E2E] Reload `/` po klik → banner NIE pokazuje się
- [E2E] Otwórz `/privacy` → strona renderuje sekcje z czytelnym typo (zgodne z DESIGN.md prose width 672px)
- [E2E] Otwórz `/regulamin` → strona renderuje
- [E2E] Footer ma działające linki do `/privacy`, `/regulamin`, `/contact` (no 404)
- [E2E] axe scan na privacy/regulamin pages = 0 violations

**Weryfikacja:**
- `bun run typecheck` + `bun run lint` + `bun run test` zielone
- Wszystkie 3 strony renderują się bez błędów
- Cookie consent banner toggle działa zgodnie z scenariuszami

**Operator checklist:**
- [ ] Privacy policy draft (`docs/legal/privacy-policy-draft.md`) zreviewowany przez prawnika + final content podpięty
- [ ] Regulamin draft zreviewowany przez prawnika + final content podpięty
- [ ] DPA podpisane z: Supabase, Google Cloud, Meta (jeśli oEmbed używany), Sentry
- [ ] Adres administratora + email kontaktowy + telefon → wypełnione w content
- [ ] Decyzja o adresie email kontaktowym (skrzynka pocztowa lub forwarding)

---

- [ ] **Unit 12: Launch readiness — SEO prerender + Sentry + analytics + structured data + sitemap**

**Cel:** Production-ready: landing/privacy/regulamin/contact są prerendered dla SEO; Sentry capturje błędy frontend + Edge Functions; lekka analityka (privacy-friendly); sitemap + structured data + robots.txt.

**Wymagania:** R1 (landing musi być SEO-discoverable), success metrics z brainstorma (rejestracje + retention wymagają trafficu z SEO + analityki)

**Zależności:** IU-5 (landing), IU-11 (legal pages)

**Pliki:**
- Modify: `vite.config.ts` (dodaj `vite-plugin-ssg` lub `vite-plugin-prerender` — decyzja deferred)
- Stwórz: `src/lib/sentry.ts` (init Sentry React: dsn, environment, integrations [browserTracing tracesSampleRate=0.1, replayIntegration sample 0% errors-only])
- Stwórz: `supabase/functions/_shared/sentry.ts` (init Sentry Deno SDK + wrapper `withSentry(handler)`)
- Stwórz: `src/lib/analytics.ts` (Plausible cloud lub Umami self-hosted — decyzja: Plausible, GDPR-compliant, ~1KB JS, no cookies = nie wymaga consent dla basic event tracking)
- Stwórz: `src/components/seo/StructuredData.tsx` (JSON-LD: LocalBusiness + Organization + Person dla instruktorów + WebSite)
- Stwórz: `scripts/generate-sitemap.ts` (build-time script generujący `dist/sitemap.xml` z static routes + ostatnia data modyfikacji)
- Stwórz: `public/robots.txt`
- Modify: `src/main.tsx` (init Sentry + analytics przed render — Sentry wcześnie żeby capture'ował init errors)
- Modify: wszystkie `supabase/functions/*/index.ts` (wrap handler w `withSentry`)
- Modify: `index.html` (preconnect do Supabase API + Sentry domain dla DNS prefetch)
- Modify: `src/features/landing/components/*` (mount StructuredData w landing root)
- Modify: `src/lib/analytics.ts` (guard tracking by `useCookieConsent()` — tylko jeśli analytics consent ===true; default Plausible jest cookieless ale opcja "tylko esential" wyłącza nawet to)
- Test (unit): `src/lib/sentry.test.ts` (init guards), `src/lib/analytics.test.ts` (consent guard)

**Delegate to:** feature-builder-fullstack

**Skills in play:** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration, figma:figma-use, figma:figma-implement-design

**Podejście:**
- **SEO prerender:**
  - Wybór pluginu (deferred do implementacji): `vite-ssg` (popular, dobrze utrzymywany dla Vue ale React fork OK) vs `vite-plugin-prerender` (chrome-headless, slower build ale prostszy setup)
  - Prerender routes: `/`, `/privacy`, `/regulamin`, `/contact` → output statyczny HTML w `dist/` z fully rendered content (meta tags + structured data + treść body)
  - Auth routes (`/library`, `/settings`, `/s/*`) NIE są prerendered — pozostają SPA-only (`index.html` fallback z routing client-side)
- **Sentry React init:**
  - DSN z env `VITE_SENTRY_DSN`; jeśli missing → graceful skip (`if (!dsn) return;`)
  - Integrations: `browserTracingIntegration({ tracesSampleRate: 0.1 })`, `replayIntegration({ replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 1.0, maskAllText: true, blockAllMedia: true })`
  - `environment: import.meta.env.MODE` (dev/staging/production)
  - `tracePropagationTargets: [/^https:\/\/.*\.supabase\.co/]`
  - Init wcześnie w `src/main.tsx` (przed React mount żeby capture'ował chunk load errors)
- **Sentry Deno (Edge Functions):**
  - `supabase/functions/_shared/sentry.ts` exports `Sentry` instance + `withSentry(handler)` wrapper
  - Każda funkcja: `export default withSentry(async (req) => { ... })`
  - W catch blocks: `Sentry.captureException(err)`
- **Analytics (Plausible cloud):**
  - Site setup: `bachatanapoli.pl` w Plausible
  - Script: `<script defer data-domain="bachatanapoli.pl" src="https://plausible.io/js/script.js"></script>` w `index.html`
  - Custom events przez `plausible('signup', { props: { method: 'google' } })` (wrapper w `src/lib/analytics.ts`)
  - Plausible jest cookieless → NIE wymaga consent dla basic page views; ale w spirit GDPR — guard za `useCookieConsent()` analytics flag (granular control)
- **Structured data (`StructuredData.tsx`):**
  - `<script type="application/ld+json">` z JSON:
    - WebSite z searchAction
    - LocalBusiness: name="Bachata Napoli", address (pizzeria Lubin), openingHoursSpecification (placeholder), url
    - Organization z founder, sameAs (FB/IG profile linki)
    - Person dla instruktorów (Małgosia, Szymon) z affiliation Bachata Rebel
  - Mount tylko na landing (`/`)
- **Sitemap:**
  - Build script generuje `dist/sitemap.xml` po prerender step
  - Routes: `/`, `/privacy`, `/regulamin`, `/contact`, `/signup`, `/login` (publiczne discoverable)
  - Exclude: `/library*`, `/settings*`, `/s/*` (auth lub private tokens)
  - Lastmod z git commit date (lub fixed do build time)
- **Robots.txt:**
  - `User-agent: *`
  - `Allow: /`
  - `Disallow: /library`
  - `Disallow: /settings`
  - `Disallow: /s/`
  - `Sitemap: https://bachatanapoli.pl/sitemap.xml`

**Wzorce do naśladowania:**
- Sentry official React quickstart (browserTracing + replayIntegration setup)
- Schema.org LocalBusiness + Organization examples
- Plausible custom events docs

**Scenariusze testowe:**
- [Unit] `sentry.ts` init bez DSN → nie crashuje, console.warn "Sentry DSN missing"
- [Unit] `analytics.ts` tracking call → guard sprawdza `useCookieConsent()`, jeśli analytics===false → no-op
- [Unit] `withSentry(handler)` Edge Function wrapper: throw w handler → captureException called → re-throw
- [E2E] `bun run build` produkuje `dist/index.html` z PRERENDERED treścią (curl test: response zawiera "Bachata Napoli" + sekcje, nie pusty SPA shell)
- [E2E] `bun run build` produkuje `dist/privacy/index.html` z prerendered privacy content
- [E2E] `curl https://staging.bachatanapoli.pl/sitemap.xml` zwraca valid XML z listą routes
- [E2E] `curl https://staging.bachatanapoli.pl/robots.txt` zwraca expected content z Sitemap directive
- [E2E] DevTools → view source `/` → znajdź `<script type="application/ld+json">` z LocalBusiness schema
- [E2E] Sentry test: throw new Error w komponencie staging → event pojawia się w Sentry dashboard (manual verify)
- [E2E] Lighthouse `/` mobile: SEO score ≥ 95 (po prerender)
- [E2E] Lighthouse `/privacy` mobile: SEO ≥ 95

**Weryfikacja:**
- `bun run build` przechodzi + produkuje prerendered HTML dla 4 routes (`/`, `/privacy`, `/regulamin`, `/contact`)
- `bun run typecheck` + `bun run test` zielone
- `curl dist/sitemap.xml` → valid XML
- `curl dist/robots.txt` → expected directives
- Lighthouse SEO score ≥ 95 dla landing po prerender

**Operator checklist:**
- [ ] Sentry project utworzony (`bachatanapoli-frontend` + `bachatanapoli-edge`) → DSN w env staging + prod
- [ ] Plausible site `bachatanapoli.pl` utworzony (lub Umami instance jeśli self-hosted preferred)
- [ ] DNS `bachatanapoli.pl` → hosting (Vercel / Cloudflare Pages / Netlify — decyzja operacyjna)
- [ ] SSL cert provisioned (auto via hosting)
- [ ] Google Search Console: verification + sitemap submitted po publikacji
- [ ] Test prod: rzeczywisty Sentry capture z prod environment (jeden test error)

---

## Wpływ systemowy

- **Graf interakcji:**
  - **Frontend ↔ Supabase Auth** — wszystkie chronione routes guard'owane przez `useRequireAuth`; provider tokens refresh ed silently
  - **Frontend ↔ Supabase DB** — RLS w 100% przypadków filtruje per user; mutations React Query invalidate odpowiednie keys
  - **Frontend ↔ Edge Functions** — proxy do zewnętrznych API (YT Data API, Meta oEmbed) ukrywa API keys + adds Sentry instrumentation
  - **Frontend ↔ YT Resumable Upload** — direct browser-to-YT (`googleapis.com/upload/...`), brak Supabase pośrednika; provider access_token zarządzany przez `google-identity.ts`
  - **Public `/s/<token>`** — anon RPC do `get_shared_content` SECURITY DEFINER function — jedyny ścieżka anonimowego dostępu do user content
- **Propagacja błędów:**
  - Edge Function errors → Sentry capture + structured JSON response `{ error: { code, message } }` → frontend → toast z user-friendly message
  - YT upload errors (quota / network / auth) → `useResumableUpload` error state → user vidzi specific message + retry button
  - Auth errors → Supabase Auth event listener w `useAuth` → redirect do `/login` z toast
  - Anon share view errors (revoked, deleted) → RevokedTokenView (graceful no-error UX)
- **Ryzyka cyklu życia stanu:**
  - YT upload w toku + user nawiguje away → UploadQueueWidget trzyma state w context provider; sessionStorage persistuje przez F5 (z ograniczeniem: file musi być re-selected)
  - Provider access_token expiry mid-upload → refresh w trakcie chunk; jeśli refresh fail → upload paused + UI prompts re-auth
  - User revoke scope w GCP console → następna refresh fail → re-prompt incremental auth
  - Share token target deleted (np. user usunął film) → `get_shared_content` zwraca 'target_not_found' → RevokedTokenView (graceful)
- **Parytet surface API:**
  - Video CRUD mutations propagują się przez React Query invalidation: dodanie video w `/library` → invalidate `['videos']` keys; usunięcie folder → invalidate `['folders']` + `['videos', ..., { folderId }]`
- **Pokrycie integracyjne:**
  - Test E2E full flow: signup → confirm email → login → scope upgrade → upload → share → public view → revoke
  - Test RLS w wielu rolach (anon, user A, user B): verifies że user A nie widzi B's content
  - Test YT resumable protocol: unit testy z mockowanym fetch dla każdej response code path (308/200/401/403/5xx)

## Ryzyka i zależności

| Ryzyko | Wpływ | Mitygacja |
|---|---|---|
| **YT OAuth verification odrzucona lub opóźniona** | Blocker public launchu (R10 nie działa dla unverified users) | Submit ASAP w IU-3; przygotuj jasny justification + demo video; rozważ invite-only launch jeśli verification w toku |
| **YT quota nie rozszerzona** | 6 uploadów/dzień globally — blokuje skalowanie | Submit quota extension w IU-3; monitor usage; w razie limit graceful error UX (toast "limit dziś") |
| **Meta oEmbed deprecated/zablokowane w 2026** | R11 nie działa | Plan B: manual entry (URL + title + thumbnail bez embed); Plan C: usuń R11 z MVP |
| **Resumable upload protocol bug** | Filmy się gubią mid-upload, frustracja userów, refundsless | Characterization tests w IU-9 dla wszystkich response codes; Sentry alerts na upload failure rate > 5% |
| **GDPR compliance gap** | Prawne ryzyko, kary do 4% revenue (lub €20M) | IU-11 + operator checklist: prawnik review privacy + regulamin; DPA podpisane z processors |
| **Hero photoshoot opóźniony** | Landing wygląda placeholder, słabszy first impression | Placeholder hero w IU-5 zaprojektowany dobrze (stock fotka editorial); admin może swapnąć po dostarczeniu |
| **Domena bachatanapoli.pl niezarejestrowana lub w użyciu** | Cały brand depends on it | Operator weryfikuje pre-launch w IU-12 |
| **Supabase cost spike** | Free tier OK do 50k MAU, ale przy success spike może zaskoczyć | Monitor metrics + ustaw budget alert; plan upgrade do Pro tier zarezerwowany |
| **Brak frekwencji na cyklicznym spotkaniu (success metric WS3)** | Społecznościowy cel niespełniony | Out of scope dla planu technicznego — kwestia marketingu + community management |

## Dokumentacja / Notatki operacyjne

- **README.md** (IU-1) — quickstart dla nowego dev'a: clone, env setup, `bun install`, `supabase start`, `bun run dev`
- **`docs/operations/gcp-setup.md`** (IU-3) — runbook GCP project + OAuth + APIs
- **`docs/operations/youtube-scope-verification-checklist.md`** (IU-3) — tracking sensitive scope verification
- **`docs/operations/meta-developer-setup.md`** (IU-3) — Meta App setup
- **`docs/legal/privacy-policy-draft.md`** (IU-11) — do prawnika
- **`docs/legal/regulamin-draft.md`** (IU-11) — do prawnika
- **Po landingu MVP:** `/dev-compound` żeby udokumentować critical learnings w `docs/solutions/` (np. resumable upload edge cases, Meta oEmbed quirks 2026, OAuth verification process timing)

## Rozważane alternatywy

| Podejście | Dlaczego nie wybrane |
|---|---|
| **Next.js + Supabase** zamiast Vite SPA | Wymagałoby przepisać konfigurację skilli `.claude/` (app/ paths zamiast src/), dodatkowe tarcie. Vite SPA + prerender dla landing daje wystarczający SEO przy zachowaniu spójności z project setup |
| **Direct upload przez nasz backend (proxy)** zamiast direct browser→YT | Wymagałoby transferu wideo przez nasze serwery = wysokie koszty hostingu + Supabase Edge Function timeout limits (60s default). Direct upload jest YT Native protocol, optymalna ścieżka |
| **Eager OAuth scope `youtube.upload` przy signup** zamiast incremental | Niższa conversion na signup (większe tarcie — user musi się zgodzić na coś czego jeszcze nie rozumie); also Google best practice = incremental |
| **Storage filmów w Supabase Storage** zamiast YT | Ogromne koszty bandwidth + odpowiedzialność za copyright + Supabase Storage 50GB free tier szybko wyczerpany. YT jako storage = decyzja brainstorma |
| **Mocno-typed routing przez TanStack Router od początku** vs prosty React Router | TanStack lepszy TS DX ale strome learning curve dla nowego devs; React Router 7 = większa społeczność + shadcn templates pod RR. Decyzja deferred do IU-1 spike |
| **Astro Islands** zamiast Vite SPA | Best SEO ale wymaga przepisać agentów (Astro paths różne). Overkill dla scope MVP |
| **RSVP w MVP** dla spotkań | Brainstorm sugerował zacząć od statycznego info + Messenger/FB group. Mniej kodu w MVP; RSVP = v1.1 jeśli walidacja pokaże potrzebę |
| **PWA installable + offline** w MVP | Brainstorm sugerował zacząć od responsive; PWA = v1.1. Dodatkowa złożoność (service worker, cache strategy, install prompt UX) bez clear MVP value |

## Metryki sukcesu

Z brainstorma (north star + supporting):

| Metryka | Target (3 miesiące po launch) | Pomiar |
|---|---|---|
| **North Star: średnia liczba zapisanych filmów na aktywnego usera** | ≥ 5 | Supabase query: `SUM(videos) / COUNT(DISTINCT users WHERE EXISTS video)` |
| **Rejestracje** | ≥ 50 | Supabase: `COUNT(*) FROM auth.users WHERE created_at > launch_date` |
| **Retencja w tyg 2-4 po rejestracji** | ≥ 30% | Plausible cohort analysis lub Supabase event tracking |
| **Frekwencja lokalnego spotkania** | Średnio ≥ 10 osób | Manual count po stronie biznesu (out of scope tego planu) |

Instrumentacja Plausible custom events (IU-12) dla:
- `signup` props: `method` ∈ {google, email}
- `video_added` props: `source` ∈ {youtube_link, youtube_upload, meta_embed}
- `share_created` props: `target_type` ∈ {video, folder}
- `meeting_info_viewed` (klik na sekcję Bachata Social w landing — proxy dla zainteresowania spotkaniami)

## Zależności / Wymagania wstępne

- **Domena bachatanapoli.pl** — zarejestrowana i kontrolowana
- **GCP project + OAuth client + YT Data API enabled** (IU-3 operator)
- **Supabase Cloud projects** (staging + prod) w regionie EU (IU-2 operator)
- **Meta Developer App** (jeśli Plan A oEmbed wybrany) — IU-3
- **Partnership Bachata Rebel** (gotowe — Małgosia + Szymon zaakceptowali)
- **Hero photoshoot** — placeholder OK w MVP, docelowe zdjęcie po launchu (R3 zapewnia ścieżkę admin swap)
- **Prawnik** do review privacy + regulamin (IU-11 operator)
- **Hosting account** (Vercel / Cloudflare Pages / Netlify) — operator decyzja (IU-12)

## Analiza ryzyk i mitygacja

(zobacz tabelę "Ryzyka i zależności" wyżej — kondensowane z dodaniem mitygacji per ryzyko)

## Fazowe dostarczanie

### Faza 1 — Foundation (IU 1–3)
**Co ląduje:** Project scaffolding, Supabase backbone, konta zewnętrzne. **Krytyczne uruchomienie YT scope verification w IU-3** (~2-6 tygodni — Sequence-critical). Brak żadnego user-facing feature jeszcze. Equivalent ~1-2 commits.

### Faza 2 — Auth + landing (IU 4–5)
**Co ląduje:** User może wejść na stronę publiczną i zarejestrować się. Brak biblioteki jeszcze — `/library` po loginie pokazuje empty placeholder. Tu można już zacząć **soft pre-launch** (zbierać emails od interested users). Equivalent ~2 commits.

### Faza 3 — Library core (IU 6–7)
**Co ląduje:** Schema + dashboard + foldery. Empty library bo brak source UI jeszcze, ale CRUD foldery działa. Equivalent ~2 commits.

### Faza 4 — Video sources (IU 8–9)
**Co ląduje:** Pełna funkcjonalność dodawania filmów (3 sources). YT link + Meta embed w IU-8 (mniejszy risk, można landować wcześniej); YT upload w IU-9 (większy risk + zależy od scope verification — może wymagać invite-only do approval). Equivalent ~2-3 commits.

### Faza 5 — Sharing + launch (IU 10–12)
**Co ląduje:** Share tokens (IU-10), GDPR (IU-11), SEO + observability (IU-12). Po IU-12 = **public launch ready**. Equivalent ~3 commits.

**Total: ~10-12 PRs across 5 fazy.**

## Plan dokumentacji

- IU-1: `README.md` quickstart
- IU-3: `docs/operations/*` (3 runbooki dla operatora)
- IU-11: `docs/legal/*` (drafty do prawnika)
- Po landing każdej fazy: opcjonalnie `/dev-docs-complete` żeby zarchiwizować phase learnings
- Po MVP launch: `/dev-compound` z critical learnings w `docs/solutions/` (resumable upload edge cases, Meta oEmbed quirks 2026, OAuth verification process timing, RLS SECURITY DEFINER pattern dla anon access)
- **DESIGN.md** (`docs/DESIGN.md`) — living document; aktualizować przy każdej zmianie tokenów z notatką w sekcji Changelog

## Notatki operacyjne / rolloutowe

- **Pre-launch checklist** (sekwencyjnie):
  1. YT OAuth verification APPROVED (krytyczne — bez tego upload nie działa dla non-test users)
  2. YT quota extension APPROVED (60+ uploadów/dzień)
  3. Privacy policy + regulamin podpisane przez prawnika
  4. DPA z wszystkimi processors (Supabase, Google, Meta, Sentry)
  5. DNS bachatanapoli.pl → hosting
  6. SSL cert provisioned
  7. Sentry capturing prod errors (verified jeden test error)
  8. Plausible analytics zbiera events
  9. Hero photo finalna wgrana (lub akceptowalny placeholder)
  10. Final copy do landing sekcji
  11. Soft pre-launch (invite kilku userów do testowania) → feedback round → fix → publiczne ogłoszenie
- **Monitoring po launchu:**
  - Sentry alerts: error rate > 1% w 5min window
  - Plausible: daily check rejestracji + video adds (north star metric)
  - YT API quota: weekly check usage % (Sentry alert jeśli > 80%)
  - Supabase: connection pool + DB size monitoring
- **Rollback plan:**
  - Vercel/Cloudflare Pages deploy = instant rollback do previous build
  - Supabase migracje = ZAWSZE forward-only (każda migracja musi być backwards-compatible przez 1 deploy cycle); rollback = nowa migracja revertująca
  - Feature flag NIE wprowadzamy w MVP — kod jest mały, deploy = full release

## Źródła i referencje

- **Dokument źródłowy:** [`docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md`](../dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md)
- **Design system:** [`docs/DESIGN.md`](../DESIGN.md)
- **Coding standards:** [`.claude/rules/coding-rules.md`](../../.claude/rules/coding-rules.md)
- **Skills referenced (`.claude/skills/`):** tailwind-react-guidelines, ux-ui-guidelines, supabase-dev-guidelines, security, sentry-integration
- **External docs (do konsultacji w trakcie wykonania):**
  - Supabase Auth + RLS — https://supabase.com/docs/guides/auth + https://supabase.com/docs/guides/database/postgres/row-level-security
  - YouTube Data API v3 (videos.insert, resumable uploads) — https://developers.google.com/youtube/v3/docs/videos/insert
  - YT OAuth sensitive scope verification — https://support.google.com/cloud/answer/9110914
  - Tailwind v4 + `@theme` directive — https://tailwindcss.com/docs (v4 release notes)
  - shadcn/ui — https://ui.shadcn.com
  - Vite SSG/Prerender plugins — npm: `vite-ssg`, `vite-plugin-prerender`
  - React Query — https://tanstack.com/query
  - Sentry React — https://docs.sentry.io/platforms/javascript/guides/react/
  - Plausible Analytics — https://plausible.io/docs
