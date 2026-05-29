/**
 * GoogleScopeUpgradePrompt — explainer + CTA dla youtube.upload scope.
 *
 * Wyświetlany gdy user nie ma scope youtube.upload.
 * Komunikat wyjaśnia co i dlaczego, podkreśla prywatność (unlisted).
 *
 * DESIGN.md:
 * - Voice: "Daj zgodę na upload" (czasownik rozkazujący)
 * - accent.soft dla callout area
 * - primary button dla CTA
 * - WCAG 2.2 AA
 */

import { useState } from 'react';
import { ShieldCheck, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestYoutubeUploadScope } from '../api/google-identity';
import { cn } from '@/lib/utils';

// ─── Typy ─────────────────────────────────────────────────────────────────────

interface GoogleScopeUpgradePromptProps {
  /** Wywołane po udanym przekierowaniu do Google (niezależnie od wyniku consent). */
  onScopeRequested?: () => void;
  className?: string;
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function GoogleScopeUpgradePrompt({
  onScopeRequested,
  className,
}: GoogleScopeUpgradePromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGrantAccess() {
    setIsRequesting(true);
    setError(null);
    try {
      await requestYoutubeUploadScope();
      onScopeRequested?.();
      // Supabase przekierowuje do Google consent — dalej obsługuje auth-callback
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Nie udało się uzyskać zgody.';
      setError(message);
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Callout z wyjaśnieniem */}
      <div className="rounded-lg bg-accent-soft p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-accent-soft-foreground"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-accent-soft-foreground">
              Twoje filmy będą prywatne
            </p>
            <p className="text-sm text-fg-muted text-pretty">
              Aby uploadować na YouTube potrzebujemy Twojej zgody na publikację
              filmów. Filmy będą <strong>unlisted</strong> — nikt nie znajdzie
              ich w wyszukiwarce YT, tylko Ty i osoby z bezpośrednim linkiem.
              Możesz cofnąć zgodę w dowolnym momencie w ustawieniach Google.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => void handleGrantAccess()}
          disabled={isRequesting}
          className={cn(
            'w-full gap-2',
            'min-h-11', // 44px touch target
            'active:scale-[0.96]',
          )}
          aria-busy={isRequesting}
        >
          <Youtube className="size-4" strokeWidth={1.75} aria-hidden="true" />
          {isRequesting ? 'Przekierowuję do Google…' : 'Daj zgodę na upload'}
        </Button>

        {error && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-error text-center"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
