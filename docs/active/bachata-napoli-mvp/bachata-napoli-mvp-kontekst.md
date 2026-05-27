# Bachata Napoli MVP — kontekst wykonawczy

**Branch:** `feature/bachata-napoli-mvp`
**Ostatnia aktualizacja:** 2026-05-27
**Status:** active

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

## Źródła

- **Requirements doc:** `docs/dev-brainstorms/2026-05-27-bachata-napoli-platform-requirements.md`
- **Plan techniczny:** `docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md`
