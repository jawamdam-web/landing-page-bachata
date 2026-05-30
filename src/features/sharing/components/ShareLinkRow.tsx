/**
 * ShareLinkRow — jeden wiersz aktywnego linku udostępniania.
 *
 * Wyświetla skrócony URL + przycisk kopiowania + przycisk "Cofnij dostęp".
 * DESIGN.md: editorial, compact row z truncate na URL.
 */

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2Off } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RevokeConfirm } from '@/features/sharing/components/RevokeConfirm';
import type {
  ShareToken,
  ShareTargetType,
} from '@/features/sharing/api/shareTokens';

interface ShareLinkRowProps {
  shareToken: ShareToken;
  targetType: ShareTargetType;
  targetId: string;
  onRevoke: (params: {
    id: string;
    targetType: ShareTargetType;
    targetId: string;
  }) => void;
  isRevoking?: boolean;
}

export function ShareLinkRow({
  shareToken,
  targetType,
  targetId,
  onRevoke,
  isRevoking = false,
}: ShareLinkRowProps) {
  const [copied, setCopied] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shareUrl = `${window.location.origin}/s/${shareToken.token}`;

  // Cleanup timera przy unmount (np. po revoke) — §13.
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Skopiowano.');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nie udało się skopiować. Zaznacz link ręcznie.');
    }
  }

  function handleRevokeConfirm() {
    setRevokeOpen(false);
    onRevoke({ id: shareToken.id, targetType, targetId });
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg-subtle px-3 py-2">
        {/* URL display — truncated */}
        <span
          className="min-w-0 flex-1 truncate font-mono text-xs text-fg-muted"
          title={shareUrl}
        >
          {shareUrl}
        </span>

        {/* Copy button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2"
          onClick={() => void handleCopy()}
          aria-label="Skopiuj link"
          title="Skopiuj link"
        >
          {copied ? (
            <Check className="size-3.5 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
        </Button>

        {/* Revoke button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-error hover:text-error"
          onClick={() => setRevokeOpen(true)}
          disabled={isRevoking}
          aria-label="Cofnij dostęp do tego linku"
          title="Cofnij dostęp"
        >
          <Link2Off className="size-3.5" aria-hidden="true" />
        </Button>
      </div>

      <RevokeConfirm
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        onConfirm={handleRevokeConfirm}
        isPending={isRevoking}
      />
    </>
  );
}
