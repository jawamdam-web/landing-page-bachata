/**
 * DashboardLayout — layout wrapper dla tras zalogowanych.
 *
 * Montuje QueryClientProvider (React Query) — zgodnie z notatką w main.tsx,
 * provider wchodzi tu (lazy route), nie w eager chain landingu.
 *
 * Struktura:
 *   DashboardHeader (sticky top)
 *   main (children)
 *
 * QueryClient konfiguracja: staleTime 60s, retry 1 (zamiast domyślnego 3).
 */

import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardHeader } from './DashboardHeader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-dvh flex-col bg-bg">
        <DashboardHeader />
        <main className="flex-1">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
