/**
 * UploadQueueWidget — floating widget pokazywany gdy upload odbywa się w tle
 * (user zamknął AddVideoDialog ale upload nadal trwa).
 *
 * Pozycja: right-bottom desktop / bottom-sticky mobile.
 * Zawiera: mini progress bar + cancel + dismiss.
 *
 * DESIGN.md:
 * - z-index: raised (10) — poniżej modalów, overlay
 * - shadow-md (lifted but not modal)
 * - safe-area-inset-bottom dla iPhone X+
 * - WCAG 2.2 AA: role="status", aria-live="polite"
 */

import { X, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadState } from '../hooks/useResumableUpload';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Typy ─────────────────────────────────────────────────────────────────────

interface UploadQueueWidgetProps {
  uploadState: UploadState;
  title: string;
  onCancel: () => void;
  onDismiss: () => void;
  className?: string;
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export function UploadQueueWidget({
  uploadState,
  title,
  onCancel,
  onDismiss,
  className,
}: UploadQueueWidgetProps) {
  if (uploadState.status !== 'uploading') return null;

  const { progress, uploadedBytes, totalBytes } = uploadState;
  const progressPercent = Math.round(progress * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Upload w toku: ${progressPercent}%`}
      className={cn(
        'fixed bottom-4 right-4 z-10 w-72 rounded-lg bg-bg shadow-md',
        'border border-border p-4',
        'pb-[calc(1rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {/* Header: ikona + tytuł + dismiss */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <UploadCloud
            className="size-4 shrink-0 text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <p className="truncate text-sm font-medium text-fg">{title}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'shrink-0 flex size-6 items-center justify-center rounded-xs',
            'text-fg-subtle hover:text-fg hover:bg-bg-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            'transition-colors duration-120',
          )}
          aria-label="Ukryj widget"
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Postęp wysyłania"
          className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs tabular-nums text-fg-muted">
            {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)} ·{' '}
            {progressPercent}%
          </p>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'text-xs text-fg-subtle underline-offset-2',
              'hover:text-error hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              'transition-colors duration-120',
            )}
            aria-label="Anuluj upload"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
