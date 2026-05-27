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
    ui/              # shadcn/ui primitives (button, input)
  lib/
    utils.ts         # cn() helper
  test/
    setup.ts         # Vitest + RTL setup
  App.tsx            # smoke page (IU-1) → landing (IU-5)
  main.tsx           # entry: RouterProvider + StrictMode
  router.tsx         # React Router 7 routes
  global.css         # Tailwind v4 + @theme tokens
```

## Plan

Pełny plan techniczny: [`docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md`](docs/plans/2026-05-27-001-feat-bachata-napoli-mvp-plan.md)

Aktywne zadania: [`docs/active/bachata-napoli-mvp/`](docs/active/bachata-napoli-mvp/)
