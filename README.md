# Bachata Napoli

> Twoja biblioteka tańca + spotkania w Lubinie.

Aplikacja webowa do organizacji filmów z zajęć tańca bachaty. MVP buduje
core flow: konto → biblioteka filmów (YouTube/upload) → udostępnianie + landing
z informacjami o lokalnych spotkaniach w Lubinie.

## Stack

- **Vite 6** + **React 19** + **TypeScript 5.7** (strict)
- **Tailwind v4** (CSS-first config przez `@theme {}`)
- **shadcn/ui** komponenty (path alias `@/` → `src/`)
- **React Router 7** (data router)
- **Supabase** (Postgres + Auth + Edge Functions) — IU-2+
- **Vitest** + **React Testing Library** dla testów
- **ESLint 9** (flat config) + **Prettier** + **Husky** pre-commit
- **Bun** jako package manager

## Quickstart

```bash
# Install deps
bun install

# Dev server
bun run dev

# Typecheck + lint + test
bun run typecheck
bun run lint
bun run test

# Production build
bun run build
```

Dev server: <http://localhost:5173>

## Local Supabase setup

Aplikacja używa Supabase (Postgres + Auth + Edge Functions). Do dev wymagany
jest [Docker Desktop](https://www.docker.com/products/docker-desktop/) — bez
niego `supabase start` nie uruchomi lokalnego stacku.

Supabase CLI jest zainstalowany jako devDependency (`bunx supabase ...`).
Opcjonalnie globalnie: `brew install supabase/tap/supabase`.

```bash
# 1. Uruchom lokalny stack (Postgres + Studio + Auth + Edge runtime)
bunx supabase start
# Stack na:
#   API:    http://127.0.0.1:54321
#   DB:     postgresql://postgres:postgres@127.0.0.1:54322/postgres
#   Studio: http://127.0.0.1:54323
#   Inbucket (e-maile dev): http://127.0.0.1:54324

# 2. Pokaż URL + anon key — skopiuj do .env.local
bunx supabase status

# 3. Aplikuj migracje na świeżą bazę (drop + replay wszystkich SQL-i)
bunx supabase db reset

# 4. Po każdej nowej migracji — zregeneruj typy TypeScript
bun gen-db-types
# (równoważne: bunx supabase gen types typescript --local > src/lib/database.types.ts)

# 5. Zatrzymaj stack
bunx supabase stop
```

**Konwencja RLS:** każda nowa tabela MUSI mieć `ENABLE ROW LEVEL SECURITY`
+ minimum jedną explicit policy. Szczegóły i wzorce w
[`supabase/migrations/0001_init_baseline.sql`](supabase/migrations/0001_init_baseline.sql)
(blok komentarzy "KONWENCJA PROJEKTU").

## Design system

Tokeny (kolory, typografia, spacing, radius, shadow, motion) zdefiniowane
w [`docs/DESIGN.md`](docs/DESIGN.md) i mapowane 1:1 na CSS custom properties
w `src/global.css` przez dyrektywę `@theme {}` Tailwinda v4.

**Akcent terracotta** — primary CTA, focus ring, linki. Używany oszczędnie
(<10% powierzchni widoku) — reszta to warm-neutral cream.

## Struktura

```
src/
  components/
    ui/                  # shadcn/ui primitives (button, input)
  lib/
    utils.ts             # cn() helper
    supabase.ts          # singleton @supabase/supabase-js client (IU-2)
    database.types.ts    # auto-gen z `bun gen-db-types` (IU-2)
  test/
    setup.ts             # Vitest + RTL setup
  App.tsx                # smoke page (IU-1) → landing (IU-5)
  main.tsx               # entry: RouterProvider + StrictMode
  router.tsx             # React Router 7 routes
  global.css             # Tailwind v4 + @theme tokens
supabase/
  config.toml            # lokalny stack (porty 54321/2/3, OAuth)
  migrations/
    0001_init_baseline.sql  # extensions + RLS pattern (IU-2)
scripts/
  gen-db-types.sh        # wrapper na `supabase gen types`
```

## Plan

Pełny plan techniczny: [`docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md`](docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md)

Aktywne zadania: [`docs/active/bachata-napoli-mvp/`](docs/active/bachata-napoli-mvp/)
