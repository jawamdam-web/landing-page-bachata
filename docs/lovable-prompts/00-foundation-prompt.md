# 00 — Foundation (Vite + React + TS + Tailwind v4 + shadcn + Supabase)

**Z planu:** IU-1 + IU-2 (część implementacyjna; IU-3 operator setup robisz ręcznie poza Lovable)
**Wymaga:** Supabase project utworzony (skopiowane URL + anon key), GitHub repo połączone z Lovable
**Output:** Project scaffolding gotowy do feature work

---

## Context (Lovable zakłada)

Pusty projekt Lovable. Połączone GitHub repo. Połączony Supabase project (staging).

## Pre-flight checklist (zrób PRZED wklejaniem promptu)

- [ ] W Supabase Dashboard → Settings → API: skopiuj `Project URL` + `anon public key`
- [ ] W Lovable Settings → Integrations → Supabase: wklej oba klucze
- [ ] W Supabase Auth → Providers: włącz Email (Confirm email = ON) — Google OAuth dolinkujesz w `01-auth`
- [ ] Domena bachatanapoli.pl gotowa (lub placeholder na razie)

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Tworzę MVP platformy społecznościowej **Bachata Napoli** — biblioteka filmów tanecznych + landing strona dla lokalnej społeczności w Lubinie/Legnicy/Polkowicach. Polski audience, mobile-first.

Stack (MUSZĄ być te wersje):
- **Vite 6+** (nie Next.js, nie Astro — czysty SPA z prerender'em później dla SEO)
- **React 19** z TypeScript 5.7+ w **strict mode** (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** (NIE v3!) — używamy `@theme {}` directive w `src/global.css`, **bez** `tailwind.config.js`
- **shadcn/ui** z path alias `@/` → `src/`
- **Supabase** (już podłączony) — Auth + Postgres + RLS + Edge Functions
- **TanStack Router** (preferowany dla TS DX) lub React Router 7 — twój wybór, oba OK
- **React Query** dla server state
- **React Hook Form + Zod** dla formularzy
- **Sonner** dla toastów
- **Lucide React** dla ikon

### Design tokens — WKLEJ DOKŁADNIE TO w `src/global.css` jako `@theme {}` block

```css
@import "tailwindcss";

@theme {
  /* === Colors (OKLCH, warm-neutral primary + terracotta accent) === */
  --color-bg: oklch(0.99 0.004 70);
  --color-bg-subtle: oklch(0.97 0.006 70);
  --color-bg-muted: oklch(0.94 0.008 70);
  --color-bg-inverse: oklch(0.18 0.01 70);

  --color-fg: oklch(0.22 0.01 70);
  --color-fg-muted: oklch(0.50 0.01 70);
  --color-fg-subtle: oklch(0.68 0.01 70);
  --color-fg-inverse: oklch(0.97 0.004 70);

  --color-border: oklch(0.90 0.008 70);
  --color-border-strong: oklch(0.82 0.01 70);

  --color-accent: oklch(0.62 0.13 38);
  --color-accent-hover: oklch(0.55 0.14 38);
  --color-accent-pressed: oklch(0.48 0.14 38);
  --color-accent-foreground: oklch(0.99 0 0);
  --color-accent-soft: oklch(0.96 0.03 38);
  --color-accent-soft-foreground: oklch(0.45 0.13 38);

  --color-success: oklch(0.62 0.13 145);
  --color-warning: oklch(0.74 0.14 78);
  --color-error: oklch(0.58 0.20 25);
  --color-info: oklch(0.62 0.11 230);

  /* === Typography === */
  --font-sans: "Geist", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* === Radii (concentric: child = parent - padding) === */
  --radius-xs: 0.25rem;
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;

  /* === Shadows (warm-tinted, oszczędne) === */
  --shadow-xs: 0 1px 2px 0 oklch(0.20 0.01 70 / 0.04);
  --shadow-sm: 0 1px 3px 0 oklch(0.20 0.01 70 / 0.06), 0 1px 2px -1px oklch(0.20 0.01 70 / 0.04);
  --shadow-md: 0 4px 6px -2px oklch(0.20 0.01 70 / 0.06), 0 2px 4px -2px oklch(0.20 0.01 70 / 0.04);
  --shadow-lg: 0 10px 15px -3px oklch(0.20 0.01 70 / 0.08), 0 4px 6px -4px oklch(0.20 0.01 70 / 0.04);
  --shadow-xl: 0 20px 25px -5px oklch(0.20 0.01 70 / 0.10), 0 8px 10px -6px oklch(0.20 0.01 70 / 0.04);
  --shadow-focus: 0 0 0 3px oklch(0.62 0.13 38 / 0.32);

  /* === Motion === */
  --ease-standard: cubic-bezier(0.2, 0.0, 0.0, 1.0);
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --ease-exit: cubic-bezier(0.4, 0.0, 1.0, 1.0);

  /* === Breakpointy (mobile-first) === */
  --breakpoint-xs: 23.4375rem;
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
}

/* Respect prefers-reduced-motion globally */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Font smoothing */
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  background-color: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-sans);
}
```

### Font loading

W `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono&display=swap">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<html lang="pl">
```

### Routing skeleton

Stwórz routes (jeszcze puste strony — content w kolejnych promptach):
- `/` (public — landing)
- `/login` (public — auth)
- `/signup` (public)
- `/forgot-password` (public)
- `/reset-password` (public)
- `/auth-callback` (public — Supabase OAuth redirect target)
- `/library` (**protected** — wymaga sesji)
- `/privacy` (public)
- `/regulamin` (public)
- `/contact` (public)
- `/s/:token` (public — share view)

Dla każdej route w MVP wystarczy placeholder component z `<h1>` z nazwą strony — content będzie w kolejnych promptach.

### Komponenty shadcn/ui do dodania w foundation

- Button
- Input
- Label
- Form (z RHF integration)
- Dialog
- Sheet (mobile bottom sheet)
- Tabs
- Card
- AlertDialog
- DropdownMenu
- Popover
- Toast (Sonner-based)

### Smoke test (dodaj na `/`)

Tymczasowy content na `/` (zastąpiony w prompt 02-landing):
```tsx
<main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
  <h1 className="text-5xl font-semibold tracking-tight">Bachata Napoli</h1>
  <p className="text-fg-muted text-lg">Twoja biblioteka tańca + spotkania w Lubinie</p>
  <Button className="bg-accent text-accent-foreground hover:bg-accent-hover active:scale-[0.96] transition-all duration-150">
    Załóż konto
  </Button>
</main>
```

### Plik `src/lib/supabase.ts`

Singleton client (Lovable powinno to mieć z Supabase integration, ale weryfikuj):
```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars. Check .env.example.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Supabase migracja `0001_init_baseline.sql`

Wklej w Supabase SQL Editor:
```sql
-- 0001_init_baseline.sql — Foundation
-- WSZYSTKIE business tables MUSZĄ mieć ENABLE ROW LEVEL SECURITY + minimum 1 policy.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Reusable updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

## Constraints (DON'T)

- ❌ NIE używaj Tailwind v3 — używamy v4 z `@theme {}` directive (bez `tailwind.config.js`)
- ❌ NIE używaj Material-UI / Chakra / Mantine — używamy shadcn/ui
- ❌ NIE dodawaj Redux / MobX / Recoil — wystarczy React Query + Zustand jeśli potrzebny global UI state
- ❌ NIE dodawaj `any` type — strict TS, użyj `unknown` + type guards lub zdefiniuj interface
- ❌ NIE używaj inline styles dla brand colors — wszystko przez tokeny (`bg-accent`, `text-fg-muted` etc.)
- ❌ NIE używaj angielskich labelek w UI — voice "ty/ciepło" PO POLSKU ("Załóż konto", nie "Sign up")

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 01-auth

- [ ] `/` renderuje smoke page z H1 "Bachata Napoli" + tagline + button "Załóż konto"
- [ ] Button ma background **terracotta** (sprawdź visually — powinno wyglądać jak ceramika/glina, NIE niebieski/zielony/szary)
- [ ] Hover: button ciemniejszy; press: button scale 0.96
- [ ] Routes: wszystkie public routes renderują placeholder; `/library` redirect do `/login` (po prompt 01)
- [ ] DevTools console: zero errors/warnings
- [ ] Font Geist załadowany (sprawdź DevTools → Network: `geist` font request 200 OK)
- [ ] Mobile (DevTools 375×667): brak horizontal scroll, button tappable (height ≥ 44px)
- [ ] Supabase client działa: `await supabase.auth.getSession()` zwraca `{ session: null }` w DevTools console

## Common gotchas

- **Lovable proponuje Tailwind v3** — odmów, naciskaj na v4 z `@theme`. Jeśli się sprzeciwia, pokaż dokumentację: https://tailwindcss.com/docs/v4-beta
- **Lovable używa generic blue accent** — sprawdź czy `@theme {}` ma `--color-accent: oklch(0.62 0.13 38)` i czy button używa `bg-accent`. Jeśli widzisz blue → Lovable zignorował token, popraw.
- **Geist nie ładuje się** — sprawdź czy `<link>` w `<head>` jest dodany; Lovable czasem inline'uje fonts inaczej
- **Supabase types.ts nie wygenerowany** — Lovable Supabase integration powinno to auto-generować po pierwszej migracji; jeśli nie → ręcznie z `npx supabase gen types typescript --linked > src/lib/database.types.ts`
