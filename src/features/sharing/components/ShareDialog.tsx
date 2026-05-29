/**
 * ShareDialog — dialog (desktop) / sheet (mobile) z zarządzaniem linkami udostępniania.
 *
 * Desktop: Dialog max-w-md
 * Mobile (< 768px): Sheet side="bottom"
 *
 * Zawiera:
 * - Listę aktywnych tokenów (ShareLinkRow per link)
 * - Przycisk "Utwórz nowy link"
 * - Loading/empty states
 *
 * DESIGN.md sekcja 10: modal centered desktop, bottom sheet mobile.
 */

import { useEffect, useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useShareTokens,
  useCreateShareToken,
  useRevokeShareToken,
} from '../hooks/useShareTokens';
import { ShareLinkRow } from './ShareLinkRow';
import type { ShareTargetType } from '../api/shareTokens';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ShareTargetType;
  targetId: string;
  targetLabel: string;
}

/** Hook do detekcji mobile breakpoint (< md = 768px). */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

function ShareDialogContent({
  targetType,
  targetId,
}: {
  targetType: ShareTargetType;
  targetId: string;
}) {
  const { data: tokens, isLoading } = useShareTokens(targetType, targetId);
  const { mutate: createToken, isPending: isCreating } = useCreateShareToken();
  const { mutate: revokeToken, isPending: isRevoking } = useRevokeShareToken();

  function handleCreate() {
    createToken({ targetType, targetId });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Lista aktywnych linków */}
      <div className="flex flex-col gap-2">
        {isLoading && (
          <p className="text-sm text-fg-muted">Ładowanie linków...</p>
        )}

        {!isLoading && (!tokens || tokens.length === 0) && (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-6 text-center">
            <Link2
              className="size-8 text-fg-subtle"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <p className="text-sm text-fg-muted">Brak aktywnych linków.</p>
            <p className="text-xs text-fg-subtle">
              Utwórz link, aby podzielić się treścią.
            </p>
          </div>
        )}

        {tokens && tokens.length > 0 && (
          <div className="flex flex-col gap-2">
            {tokens.map((token) => (
              <ShareLinkRow
                key={token.id}
                shareToken={token}
                targetType={targetType}
                targetId={targetId}
                onRevoke={revokeToken}
                isRevoking={isRevoking}
              />
            ))}
          </div>
        )}
      </div>

      {/* Utwórz nowy link */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleCreate}
        disabled={isCreating}
      >
        <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {isCreating ? 'Tworzenie...' : 'Utwórz nowy link'}
      </Button>
    </div>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: ShareDialogProps) {
  const isMobile = useIsMobile();
  const title = `Udostępnij: ${targetLabel}`;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[80dvh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <ShareDialogContent targetType={targetType} targetId={targetId} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ShareDialogContent targetType={targetType} targetId={targetId} />
      </DialogContent>
    </Dialog>
  );
}
