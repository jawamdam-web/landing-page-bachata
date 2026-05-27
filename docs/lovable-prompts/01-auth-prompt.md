# 01 — Auth (Google OAuth + email/hasło + protected routes)

**Z planu:** IU-4
**Wymaga:** `00-foundation` zrealizowane + Google OAuth client utworzony w GCP + Supabase Auth Google provider włączony
**Output:** Auth flow end-to-end + `profiles` table + protected routes

---

## Context (Lovable zakłada)

Foundation z prompt 00 gotowy: Vite + React + Tailwind v4 + shadcn/ui + Supabase client w `src/lib/supabase.ts` + routes skeleton (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth-callback`, `/library`).

## Pre-flight checklist (zrób PRZED wklejaniem)

- [ ] W GCP Console: OAuth 2.0 Client ID utworzony (Web app type), redirect URI = `<SUPABASE_URL>/auth/v1/callback`
- [ ] W Supabase Dashboard → Authentication → Providers → Google: włącz, wklej Client ID + Secret
- [ ] W Supabase → Authentication → URL Configuration: Site URL = `http://localhost:5173` (dev) lub `https://bachatanapoli.pl` (prod); Redirect URLs whitelist: `/auth-callback`, `/reset-password`
- [ ] W Supabase → Authentication → Email Templates: zachowaj defaultowe (customize do polskiego po lądowaniu — operator step)

## Build

<!-- ============================ PASTE TO LOVABLE ============================ -->

Implementuję auth flow dla aplikacji Bachata Napoli. Dwie metody: **Google OAuth** ORAZ **email + hasło**. User wybiera jedną. Konto email/hasło może później dolinkować Google (do uploadu YT — w kolejnym etapie).

### Supabase migracja `0002_profiles_and_trigger.sql`

Wklej w Supabase SQL Editor:

```sql
-- 0002_profiles_and_trigger.sql

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- RLS: user widzi tylko swój profil
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Updated_at trigger
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on auth.users INSERT
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Pliki do utworzenia

**`src/features/auth/schemas.ts`** — Zod schemas:
```ts
import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Podaj email")
  .email("Nieprawidłowy format email");

export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć min. 8 znaków")
  .regex(/[a-zA-Z]/, "Hasło musi zawierać literę")
  .regex(/[0-9]/, "Hasło musi zawierać cyfrę");

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Podaj hasło"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

**`src/features/auth/api/auth.ts`** — API layer:
```ts
import { supabase } from "@/lib/supabase";

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth-callback` },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth-callback`,
      // Basic scopes only — youtube.upload będzie dolinkowane później przez linkIdentity
      scopes: "openid email profile",
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
```

**`src/features/auth/hooks/useAuth.ts`** — current user state:
```ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

**`src/features/auth/hooks/useRequireAuth.ts`** — protected route guard:
```ts
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // lub TanStack Router equivalent
import { useAuth } from "./useAuth";

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
    }
  }, [user, loading, navigate, location]);

  return { user, loading };
}
```

**`src/features/auth/components/AuthLayout.tsx`** — wspólny layout dla auth pages:
- Mobile: full-screen padding, logo "Bachata Napoli" u góry, treść wycentrowana
- Desktop: split layout — lewa kolumna z hero image (placeholder gradient terracotta), prawa kolumna z formularzem (max-w-narrow 32rem)
- Footer link "← Wróć do strony głównej"

**`src/features/auth/components/LoginForm.tsx`** — RHF + Zod + shadcn Form:
- Pola: email + password
- "Zaloguj się" primary button (full-width)
- "Albo" divider
- GoogleSignInButton (full-width, outline variant)
- Linki: "Nie masz konta? Załóż konto" → `/signup`, "Zapomniałeś hasła?" → `/forgot-password`
- Loading state na submit (button spinner + disabled)
- Error toast (Sonner) jeśli auth fail (PL message: "Nieprawidłowy email lub hasło")
- Po success: `navigate(searchParams.get('next') ?? '/library')`

**`src/features/auth/components/SignupForm.tsx`** — analogicznie:
- Pola: email + password (z hint "min. 8 znaków, litera + cyfra")
- "Załóż konto" primary
- GoogleSignInButton
- Link "Masz już konto? Zaloguj się" → `/login`
- Po success: toast "Wysłaliśmy email z linkiem aktywacyjnym. Sprawdź skrzynkę." + redirect do `/login` (lub stay on success page z resend option)

**`src/features/auth/components/ForgotPasswordForm.tsx`**:
- Pole: email
- "Wyślij link" primary
- Po success: toast "Jeśli konto istnieje, wysłaliśmy link do resetu hasła." (security best practice — nie ujawniaj czy email istnieje)
- Link "← Wróć do logowania"

**`src/features/auth/components/ResetPasswordForm.tsx`** (na `/reset-password`):
- Pole: nowe hasło
- "Ustaw nowe hasło" primary
- Po success: toast "Hasło zmienione" + redirect do `/library`
- Działa tylko jeśli URL ma valid Supabase session token (Supabase auto-handles po `resetPasswordForEmail` redirect)

**`src/features/auth/components/GoogleSignInButton.tsx`**:
- Outline variant z Google logo (SVG inline lub Lucide Chrome icon jako fallback)
- Text: "Zaloguj się przez Google"
- onClick → `signInWithGoogle()` → loading state → redirect happens auto

**`src/pages/login.tsx`, `/signup`, `/forgot-password`, `/reset-password`** — strony używające AuthLayout + odpowiedni form.

**`src/pages/auth-callback.tsx`** — strona handle'ująca OAuth redirect:
```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        toast.error("Nie udało się zalogować. Spróbuj jeszcze raz.");
        navigate("/login");
        return;
      }
      if (data.session) navigate("/library");
      else navigate("/login");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-fg-muted">Logujemy Cię...</p>
    </div>
  );
}
```

### Protected route wrapper

W `src/App.tsx` (lub router config):
```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Ładowanie...</p></div>;
  if (!user) return null; // useRequireAuth zrobi redirect
  return <>{children}</>;
}

// Użycie:
<Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
```

### Toast provider

Mount `<Toaster />` z Sonner globally w `App.tsx`:
```tsx
import { Toaster } from "sonner";
// ... w App return:
<Toaster position="bottom-center" toastOptions={{ duration: 4000 }} />
```

### DashboardHeader skeleton (dla `/library` placeholder)

`src/components/layout/DashboardHeader.tsx` z user menu (Avatar dropdown):
- Logo "Bachata Napoli" (text, link do `/library`)
- Avatar (z `profile.avatar_url` lub initials z `display_name`)
- Dropdown: "Mój profil" (placeholder), "Wyloguj" → `signOut()` → redirect `/`

### Tymczasowy content `/library`

```tsx
<DashboardHeader />
<main className="container mx-auto px-5 md:px-8 py-12">
  <h1 className="text-3xl font-semibold">Moja biblioteka</h1>
  <p className="text-fg-muted mt-2">Tu pojawią się Twoje filmy. (Funkcjonalność w kolejnym etapie.)</p>
</main>
```

## Constraints (DON'T)

- ❌ NIE przechowuj hasła w żadnym custom storage — Supabase auth zarządza
- ❌ NIE używaj `localStorage` dla user data — używaj `useAuth` hooka
- ❌ NIE rób ForgotPassword z "Email nie istnieje" message — security: zawsze pokazuj generic success message
- ❌ NIE wyłączaj Confirm email w Supabase — wymagaj email verification
- ❌ NIE skip RLS na `profiles` — każda business table MUSI mieć RLS
- ❌ NIE używaj `useEffect` z async bezpośrednio (`useEffect(async ...)`) — ZAWSZE wrap w `.then()` lub `void async fn()`
- ❌ NIE używaj angielskich error messages — wszystko PL: "Nieprawidłowy email lub hasło", "Hasło musi mieć min. 8 znaków" etc.

<!-- ============================ END PASTE ============================ -->

## Acceptance — sprawdź zanim przejdziesz do 02-landing

- [ ] `/signup` z valid email+password → submit → toast "Wysłaliśmy email z linkiem aktywacyjnym"
- [ ] Sprawdź Supabase Studio → Authentication → Users: nowy user pojawił się; `confirmed_at` jest null dopóki nie kliknie linka w mailu
- [ ] Sprawdź `profiles` table: row dla nowego usera **auto-utworzony** przez trigger (`display_name` = część przed @)
- [ ] Kliknij link aktywacyjny w mailu (Mailpit/Inbucket lokalnie lub real email staging) → `/auth-callback` → redirect do `/library`
- [ ] `/login` z poprawnymi credentials → redirect do `/library`
- [ ] `/login` z błędnymi → toast error PL
- [ ] Klik "Zaloguj się przez Google" → redirect do `accounts.google.com/o/oauth2/...` → po zgodzie → redirect do `/library`
- [ ] `/library` bez sesji → redirect do `/login?next=/library`
- [ ] Po loginie z `?next=/library` → redirect do `/library`
- [ ] `/forgot-password` z dowolnym email → zawsze toast success (nie ujawniaj istnienia)
- [ ] DashboardHeader → klik Avatar → "Wyloguj" → redirect `/` + sesja wyczyszczona
- [ ] **RLS test:** Supabase Studio → Table Editor → profiles → impersonate jako user A → `SELECT * FROM profiles` → tylko 1 row (swój). NIGDY nie zwraca innych userów.

## Common gotchas

- **Google OAuth redirect 400 redirect_uri_mismatch** — w GCP Console redirect URI musi być DOKŁADNIE `<SUPABASE_URL>/auth/v1/callback` (z `/v1/`, ze ścieżką `/callback`). NIE Twoja domena ani localhost.
- **Trigger nie tworzy profile** — sprawdź czy `security definer` jest w funkcji. Bez tego trigger nie ma uprawnień do INSERT do `public.profiles`.
- **Email verification link redirect na `localhost` po deploy** — w Supabase → URL Configuration ustaw production Site URL.
- **Lovable proponuje "magic link" zamiast password** — zachowaj password flow zgodnie z R7. Magic link można dodać jako opcję v1.1.
- **`useEffect` async warning** — używaj `void asyncFn()` lub `.then()`, nie `useEffect(async () => {...})`.
