/**
 * RevokedTokenView — widok dla nieaktywnego lub nieistniejącego tokenu.
 *
 * Wyświetlany gdy get_shared_content rzuci 'token_invalid_or_revoked'.
 * DESIGN.md: centered, editorial, friendly copy.
 */

import { Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RevokedTokenViewProps {
  onGoHome?: () => void;
}

export function RevokedTokenView({ onGoHome }: RevokedTokenViewProps) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-5 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-bg-muted">
        <Link2Off
          className="size-8 text-fg-subtle"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-fg">
          Ten link nie jest już aktywny
        </h1>
        <p className="text-sm text-fg-muted">
          Właściciel cofnął dostęp lub link wygasł.
        </p>
      </div>

      <Button
        variant="outline"
        size="md"
        onClick={onGoHome}
        className="min-w-[160px]"
      >
        Przejdź na stronę główną
      </Button>
    </div>
  );
}
