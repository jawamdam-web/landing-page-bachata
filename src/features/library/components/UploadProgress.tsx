/**
 * UploadProgress — determinate progress bar z cancel + estimated time remaining.
 *
 * DESIGN.md:
 * - Tokeny z @theme (bg-accent, text-fg-muted)
 * - tabular-nums dla bajtów / czasu
 * - active:scale-[0.96] na cancel button
 * - WCAG 2.2 AA: role="progressbar", aria-valuenow/valuemin/valuemax
 */

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m ${sec}s`;
}

// ─── Typy ─────────────────────────────────────────────────────────────────────

interface UploadProgressProps {
  uploadedBytes: number;
  totalBytes: number;
  onCancel: () => void;
  className?: string;
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function UploadProgress({
  uploadedBytes,
  totalBytes,
  onCancel,
  className,
}: UploadProgressProps) {
  const progress = totalBytes > 0 ? Math.min(uploadedBytes / totalBytes, 1) : 0;
  const progressPercent = Math.round(progress * 100);

  // Szacowanie pozostałego czasu na podstawie prędkości ostatnich sekund
  const startTimeRef = useRef<number>(Date.now());
  const prevUploadedRef = useRef<number>(uploadedBytes);
  const [eta, setEta] = useState<number>(0);

  useEffect(() => {
    if (uploadedBytes === 0) {
      startTimeRef.current = Date.now();
      prevUploadedRef.current = 0;
      setEta(0);
      return;
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (elapsed < 1) return;

    const speed = uploadedBytes / elapsed; // bytes/s
    const remaining = totalBytes - uploadedBytes;
    const etaSeconds = speed > 0 ? remaining / speed : 0;
    setEta(etaSeconds);
  }, [uploadedBytes, totalBytes]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Pasek postępu */}
      <div
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Postęp wysyłania"
        className="h-2 w-full overflow-hidden rounded-full bg-bg-muted"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Informacje + cancel */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm tabular-nums text-fg-muted">
          {formatBytes(uploadedBytes)} z {formatBytes(totalBytes)}
          {eta > 0 && (
            <span className="ml-2 text-fg-subtle">
              · {formatTime(eta)} pozostało
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'flex min-h-9 min-w-9 items-center justify-center rounded-sm',
            'text-sm text-fg-muted',
            'hover:bg-bg-muted hover:text-fg',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            'transition-colors duration-120',
            'active:scale-[0.96]',
          )}
          aria-label="Anuluj upload"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Anuluj</span>
        </button>
      </div>
    </div>
  );
}
