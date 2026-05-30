// Sentry musi być inicjalizowany PRZED wszystkim żeby wychwytywał błędy init
import { initSentry } from './lib/sentry';
initSentry();

// Analytics: dla powracających userów którzy wcześniej wyrazili zgodę.
// initAnalytics() jest no-op gdy brak zgody — guard wewnątrz.
// Świeża zgoda (pierwsza wizyta) ładuje skrypt z CookieConsentBanner.
import { initAnalytics } from './lib/analytics';
initAnalytics();

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { CookieConsentBanner } from './features/legal/components/CookieConsentBanner';
import { router } from './router';
import './global.css';

/**
 * Root bootstrap.
 *
 * Kolejność providerów (zewn. → wewn.):
 *   AuthProvider        — stan sesji. NIE importuje @/lib/supabase top-level
 *                         (lazy import w useEffect), więc dev startuje bez env.
 *   RouterProvider      — data router; trasy auth/protected lazy-ładują strony.
 *   Toaster (sonner)    — feedback. bottom-center mobile, bottom-right desktop
 *                         (DESIGN.md sekcja 10). richColors dla success/error.
 *
 * QueryClientProvider (React Query) NIE jest tu montowany — landing `/` jest
 * eager, a React Query jest używany dopiero od IU-6 (biblioteka). Trzymanie go
 * poza eager chain trzyma martwy kod z dala od bundla landingu (review-faza-2
 * P2-1). Provider wejdzie w IU-6 w layoucie protected routes (lazy).
 *
 * Żaden z tych providerów nie ściąga supabase do eager startup chain.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root nie został znaleziony w index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-center" richColors closeButton />
      <CookieConsentBanner />
    </AuthProvider>
  </StrictMode>,
);
