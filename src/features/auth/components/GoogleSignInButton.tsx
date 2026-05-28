import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '../api/auth';

/**
 * GoogleSignInButton — inicjuje OAuth flow (redirect do accounts.google.com).
 *
 * Variant outline (DESIGN.md sekcja 10): biały/transparent bg z border-strong,
 * oficjalny multi-color logotyp Google + label "Zaloguj się przez Google"
 * (voice z DESIGN.md sekcja 2). Po kliknięciu blokuje przycisk (isPending) do
 * momentu przekierowania; przy błędzie pokazuje toast i odblokowuje.
 */

function GoogleLogo() {
  return (
    <svg
      viewBox="0 0 18 18"
      width="18"
      height="18"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleClick(): Promise<void> {
    setIsPending(true);
    try {
      await signInWithGoogle();
      // Sukces = redirect do Google; nie resetujemy isPending (strona zniknie).
    } catch {
      toast.error('Nie udało się połączyć z Google. Spróbuj jeszcze raz.');
      setIsPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <GoogleLogo />
      )}
      Zaloguj się przez Google
    </Button>
  );
}
