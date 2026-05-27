# Bachata Napoli MVP — plan wykonawczy

**Branch:** `feature/bachata-napoli-mvp`
**Ostatnia aktualizacja:** 2026-05-27
**Status:** active

## Cele i zakres

Greenfield MVP platformy społecznościowej dla bachateros (Lubin/Legnica/Polkowice/Głogów). Jedna iteracja dostarcza:

- **Landing page** (R1–R6): hero z foto, sekcje About/Social/Instruktorzy, główne CTA = rejestracja
- **Auth** (R7): Google OAuth + email/hasło + account linking dla późniejszego upload na YT
- **Biblioteka filmów** (R8, R12–R14): osobista, domyślnie prywatna, foldery m:n, notatki
- **3 źródła filmów** (R9, R10, R11): paste YT link, upload na konto YT usera (resumable), embed FB/IG publicznych postów
- **Share tokens** (R15–R17): publiczne linki tokenowe + revoke, brak feedu/follow
- **Mobile-first** (R18): główny use case = telefon po zajęciach
- **GDPR + SEO + observability**: prerender landing, Sentry, Plausible, sitemap, regulamin, privacy

**Non-goals w MVP** (świadome wykluczenia z brainstorma): auto-import FB/IG, Google Drive, publiczne profile/feed/follow, predefiniowane tagi, aplikacja natywna, multilang, płatności/premium, certyfikacja instruktorów, RSVP na spotkania, PWA installable, dark mode.

## Stack (rozstrzygnięty)

- **Frontend:** Vite + React 19 + TypeScript 5.7+ strict + Tailwind v4 (`@theme {}`) + shadcn/ui + Geist Variable
- **Backend:** Supabase (Auth + Postgres + RLS + Edge Functions Deno)
- **Routing:** TanStack Router lub React Router 7 (decyzja w IU-1)
- **State:** React Query (server) + Zustand (UI) + RHF + Zod (forms)
- **Notyfikacje:** Sonner. **Errors:** Sentry. **Analytics:** Plausible.
- **Wideo storage:** YouTube (zero hostingu po naszej stronie)

## Fazy z zadaniami

### Faza 1 — Foundation (IU 1–3)

Cel: Project scaffolding + konta zewnętrzne + uruchomienie krytycznej ścieżki YT scope verification (~2-6 tyg.).

- **IU-1: Bootstrap Vite SPA + design tokens + shadcn/ui** [feature-builder-fullstack]
  - Vite 6+ / React 19 / TS strict / Tailwind v4 z `@theme` 1:1 mapping z `docs/DESIGN.md`
  - shadcn/ui init + Geist Variable preload + ESLint/Prettier/Husky
  - Smoke test: button primary w terracotta
- **IU-2: Supabase init — schema baseline + RLS pattern + client** [feature-builder-data]
  - `supabase init` + lokalny stack + migracja `0001_init_baseline` (extensions, RLS-on-default pattern)
  - Singleton `src/lib/supabase.ts` + auto-gen types
- **IU-3: GCP + YouTube Data API + Meta Developer setup (operator-heavy)** [feature-builder-data]
  - Runbooki: `docs/operations/{gcp-setup,youtube-scope-verification-checklist,meta-developer-setup}.md`
  - **KRYTYCZNE:** operator submits OAuth verification dla `youtube.upload` scope (~2-6 tyg.) + quota extension

### Faza 2 — Auth + landing (IU 4–5)

Cel: User może zarejestrować się i wejść na publiczną stronę. Soft pre-launch możliwe.

- **IU-4: Supabase Auth — Google OAuth + email/hasło + account linking + protected routes** [feature-builder-fullstack]
  - Migracja `0002_profiles_and_trigger` (profiles + auto-create na auth.users INSERT)
  - LoginForm/SignupForm/ForgotPassword + `useAuth` + `useRequireAuth`
  - Identity linking via `supabase.auth.linkIdentity` dla późniejszego YT upload
- **IU-5: Public landing page (R1–R6) + SEO meta + mobile responsive** [feature-builder-ui]
  - Sekcje: Hero, About Napoli, How It Works, Bachata Social, Instructors, Final CTA
  - PublicHeader (mobile Sheet menu) + PublicFooter
  - Hero photo placeholder z swap path (R3)
  - Statyczne info o spotkaniach (RSVP odroczone do v1.1)

### Faza 3 — Library core (IU 6–7)

Cel: Schema biblioteki + dashboard z empty state + foldery CRUD + m:n assignment.

- **IU-6: Library schema + dashboard skeleton + empty state** [feature-builder-fullstack]
  - Migracja `0003_videos_folders` (videos + folders + video_folders m:n + RLS)
  - DashboardLayout + VideoGrid + VideoCard skeleton + EmptyLibrary z CTA "Dodaj film"
- **IU-7: Folder management — CRUD + m:n assignment + filter by folder** [feature-builder-fullstack]
  - CreateFolderDialog, EditFolderDialog, DeleteFolderConfirm
  - FolderPickerSheet (mobile) + FolderPickerPopover (desktop) z React Query optimistic updates
  - URL `?folder=<id>` dla filter

### Faza 4 — Video sources (IU 8–9)

Cel: Pełna funkcjonalność dodawania filmów z 3 źródeł.

- **IU-8: External sources — YouTube link paste + Meta (FB/IG) embed** [feature-builder-fullstack]
  - Edge Functions: `fetch-youtube-metadata`, `validate-meta-embed`
  - AddVideoDialog z 3 tabami (YT / FB-IG / Upload — IU-9)
  - VideoPlayer (3 source renderers) + VideoDetailDialog
  - **Notatka wykonawcza:** test-first dla URL parserów (edge cases)
  - **Operator:** weryfikuj aktualny stan Meta oEmbed w 2026 przed kodowaniem (fallback Plan B/C)
- **IU-9: YouTube upload — direct browser → user's YT (resumable)** [feature-builder-fullstack]
  - Incremental OAuth scope upgrade via `GoogleScopeUpgradePrompt`
  - `src/lib/youtube-resumable-upload.ts` (clean impl protokołu: chunking, resume 308, retry 5xx, refresh 401)
  - VideoUploadForm + UploadProgress + UploadQueueWidget (background)
  - **Notatka wykonawcza:** TEST-FIRST dla resumable upload — najbardziej kruchy element planu

### Faza 5 — Sharing + launch (IU 10–12)

Cel: Share tokens + GDPR + SEO/observability → **public launch ready**.

- **IU-10: Share tokens — public read access z revoke** [feature-builder-fullstack]
  - Migracja `0004_share_tokens` + `get_shared_content(token)` SECURITY DEFINER function
  - ShareDialog, SharedVideoView, SharedFolderView, RevokedTokenView
  - `/s/<token>` public route bez auth guard
  - **Notatka wykonawcza:** test-first dla RLS function (security-critical)
- **IU-11: GDPR — privacy policy + regulamin + cookie consent + contact** [feature-builder-ui]
  - Drafty w `docs/legal/{privacy-policy,regulamin}-draft.md` do prawnika
  - CookieConsentBanner z `useCookieConsent` hook
  - Static pages `/privacy`, `/regulamin`, `/contact`
- **IU-12: Launch readiness — SEO prerender + Sentry + analytics + structured data** [feature-builder-fullstack]
  - vite-plugin-ssg (lub alternative) dla landing/privacy/regulamin/contact prerender
  - Sentry React + Sentry Deno (Edge Functions wrapper `withSentry`)
  - Plausible analytics z consent guard
  - StructuredData (LocalBusiness + Organization + Person), sitemap.xml, robots.txt

## Kryteria akceptacji

### Per Faza

- **Faza 1 done:** `bun run dev` renderuje smoke page z brand color; `supabase start` lokalny stack działa; runbooki GCP/YT/Meta istnieją; YT scope verification submitted
- **Faza 2 done:** User może signup Google + email/hasło; landing renderuje wszystkie 5 sekcji mobile+desktop; Lighthouse SEO ≥ 90; axe scan 0 violations
- **Faza 3 done:** Fresh user widzi EmptyLibrary z CTA; foldery CRUD działa; filter by folder URL działa; RLS verified (anon/cross-user no access)
- **Faza 4 done:** Wszystkie 3 sources działają end-to-end; YT upload przeszedł test-suite z resumable protocol edge cases; Meta oEmbed status zaadresowany (Plan A/B/C)
- **Faza 5 done:** Share token full flow (create → public view → revoke); privacy/regulamin podpisane przez prawnika; prerender produces static HTML; Sentry capturje prod errors; sitemap + robots

### Per IU

Każdy IU ma własne kryteria PASS/FAIL w sekcji **Weryfikacja** w planie technicznym (przeniesione do `bachata-napoli-mvp-zadania.md` jako checkboxy `Weryfikacja:`).

## Krytyczne ścieżki (sequence-critical)

1. **YT OAuth verification** (IU-3 operator) → ~2-6 tygodni → blocker dla IU-9 do public users
2. **Meta oEmbed status check** (IU-3/IU-8 operator) → decyzja Plan A/B/C **przed** napisaniem kodu IU-8 Meta path
3. **Prawnik review privacy + regulamin** (IU-11 operator) → blocker public launch
4. **Hero photoshoot** (operator) → placeholder OK w MVP, docelowe swap po launch (R3)

## Źródła

- **Requirements doc:** `docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md`
- **Plan techniczny:** `docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md`
