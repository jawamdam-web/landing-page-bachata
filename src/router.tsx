import { createBrowserRouter } from 'react-router';
import LandingPage from './pages/index';

/**
 * Router — React Router 7 (`createBrowserRouter` data router).
 *
 * Trasy:
 *   /                — publiczny landing (LandingPage, IU-5). EAGER (LCP + SEO
 *                      critical). Łańcuch importów `/` NIE ściąga supabase ani
 *                      api/auth — useAuth w PublicHeader czyta tylko kontekst.
 *   /login, /signup, /forgot-password, /reset-password, /auth-callback — auth.
 *   /library         — protected (RequireAuth guard). Placeholder; IU-6 rozbuduje.
 *
 * KLUCZOWE (ograniczenie środowiska #3): wszystkie trasy auth + /library
 * używają route-level `lazy` (dynamic import). Strony te transytywnie importują
 * `@/lib/supabase` (fail-fast na brak env), więc lazy-load trzyma supabase POZA
 * eager startup chain (main.tsx → router.tsx → LandingPage). `bun run dev`
 * bootuje i renderuje `/` bez `.env.local`. Supabase ładuje się dopiero przy
 * wejściu na trasę auth/protected (klient-side, gdzie env już są).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    // Publiczna trasa share tokenu — lazy, bez auth guard.
    // KLUCZOWE: transytywnie importuje @/lib/supabase przez shareTokens.ts.
    // Lazy-load trzyma supabase poza eager startup chain (ograniczenie #3).
    path: '/s/:token',
    lazy: async () => {
      const { SharedTokenPage } = await import('./pages/s/[token]');
      return { Component: SharedTokenPage };
    },
  },
  {
    path: '/privacy',
    lazy: async () => {
      const { PrivacyPage } = await import('./pages/privacy');
      return { Component: PrivacyPage };
    },
  },
  {
    path: '/regulamin',
    lazy: async () => {
      const { RegulaminPage } = await import('./pages/regulamin');
      return { Component: RegulaminPage };
    },
  },
  {
    path: '/contact',
    lazy: async () => {
      const { ContactPage } = await import('./pages/contact');
      return { Component: ContactPage };
    },
  },
  {
    path: '/login',
    lazy: async () => {
      const { LoginPage } = await import('./pages/login');
      return { Component: LoginPage };
    },
  },
  {
    path: '/signup',
    lazy: async () => {
      const { SignupPage } = await import('./pages/signup');
      return { Component: SignupPage };
    },
  },
  {
    path: '/forgot-password',
    lazy: async () => {
      const { ForgotPasswordPage } = await import('./pages/forgot-password');
      return { Component: ForgotPasswordPage };
    },
  },
  {
    path: '/reset-password',
    lazy: async () => {
      const { ResetPasswordPage } = await import('./pages/reset-password');
      return { Component: ResetPasswordPage };
    },
  },
  {
    path: '/auth-callback',
    lazy: async () => {
      const { AuthCallbackPage } = await import('./pages/auth-callback');
      return { Component: AuthCallbackPage };
    },
  },
  {
    path: '/library',
    lazy: async () => {
      const [{ RequireAuth }, { LibraryPage }] = await Promise.all([
        import('./features/auth/components/RequireAuth'),
        import('./pages/library/index'),
      ]);
      return {
        Component: () => (
          <RequireAuth>
            <LibraryPage />
          </RequireAuth>
        ),
      };
    },
  },
]);
