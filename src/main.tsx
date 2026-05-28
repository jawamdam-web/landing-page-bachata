import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { router } from './router';
import './global.css';

/**
 * Root bootstrap.
 *
 * Kolejność providerów (zewn. → wewn.):
 *   QueryClientProvider — cache server-state (React Query), używany od IU-6+.
 *   AuthProvider        — stan sesji. NIE importuje @/lib/supabase top-level
 *                         (lazy import w useEffect), więc dev startuje bez env.
 *   RouterProvider      — data router; trasy auth/protected lazy-ładują strony.
 *   Toaster (sonner)    — feedback. bottom-center mobile, bottom-right desktop
 *                         (DESIGN.md sekcja 10). richColors dla success/error.
 *
 * Żaden z tych providerów nie ściąga supabase do eager startup chain.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root nie został znaleziony w index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
