/**
 * VideoCard — karta pojedynczego filmu w gridzie biblioteki.
 *
 * IU-6: thumbnail 16:9 + title + meta row.
 * IU-7: ⋯ menu (DropdownMenu) z "Zarządzaj folderami" → FolderPickerSheet (mobile)
 *       lub FolderPickerPopover (desktop >=md).
 * - Source icon: Youtube / Facebook / UploadCloud dla każdego source value.
 * - Duration w tabular nums (DESIGN.md sekcja 4 — font-feature numeric).
 * - Relative date "2 dni temu" — Intl.RelativeTimeFormat.
 * - Click → placeholder (VideoDetailDialog w IU-8).
 * - DESIGN.md sekcja 7: flat card, hairline border, no shadow.
 * - DESIGN.md sekcja 8: scale 0.98 on press (interactive card).
 */

import { useState } from 'react';
import {
  Facebook,
  FolderKanban,
  MoreHorizontal,
  UploadCloud,
  Youtube,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FolderPickerSheet } from './FolderPickerSheet';
import { FolderPickerPopover } from './FolderPickerPopover';
import { VideoDetailDialog } from './VideoDetailDialog';
import type { Folder, Video, VideoSource } from '../types';

const SOURCE_ICON: Record<VideoSource, React.ReactElement> = {
  youtube_link: (
    <Youtube
      className="size-4 text-fg-muted"
      strokeWidth={1.75}
      aria-hidden="true"
    />
  ),
  youtube_upload: (
    <UploadCloud
      className="size-4 text-fg-muted"
      strokeWidth={1.75}
      aria-hidden="true"
    />
  ),
  meta_embed: (
    <Facebook
      className="size-4 text-fg-muted"
      strokeWidth={1.75}
      aria-hidden="true"
    />
  ),
};

const SOURCE_LABEL: Record<VideoSource, string> = {
  youtube_link: 'YouTube',
  youtube_upload: 'YouTube (upload)',
  meta_embed: 'Facebook/Instagram',
};

/** Formatuje sekundy do "mm:ss" lub "hh:mm:ss". */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Zwraca względną datę w języku polskim ("przed chwilą", "5 min temu", itp.). */
function relativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'przed chwilą';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins} min temu`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} godz. temu`;
  }
  if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return days === 1 ? 'wczoraj' : `${days} dni temu`;
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

interface VideoCardProps {
  video: Video;
  /** Lista folderów usera — przekazywana z VideoGrid (jeden useFolders per grid). */
  folders: Folder[];
  /** Aktualne foldery do których należy film — przekazane z cache. */
  currentFolderIds?: string[];
}

export function VideoCard({
  video,
  folders,
  currentFolderIds = [],
}: VideoCardProps) {
  const sourceIcon = SOURCE_ICON[video.source];
  const sourceLabel = SOURCE_LABEL[video.source];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  function handleCardClick() {
    setDetailOpen(true);
  }

  return (
    <>
      <article
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-bg-subtle transition-colors duration-[120ms] hover:border-border-strong active:scale-[0.98]"
        aria-label={video.title}
        data-testid="video-card"
        data-source={video.source}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* Thumbnail 16:9 */}
        <div className="relative aspect-video w-full overflow-hidden bg-bg-muted">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              style={{ boxShadow: 'inset 0 0 0 1px oklch(0.90 0.008 70)' }}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.94 0.008 70) 0%, oklch(0.90 0.008 70) 100%)',
              }}
              aria-hidden="true"
            />
          )}

          {/* ⋯ menu — desktop popover */}
          <div
            className="absolute right-2 top-2 hidden md:block"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <FolderPickerPopover
              open={popoverOpen}
              onOpenChange={setPopoverOpen}
              videoId={video.id}
              folders={folders}
              currentFolderIds={currentFolderIds}
            >
              <Button
                variant="secondary"
                size="sm"
                className="size-7 p-0 opacity-0 shadow-sm transition-opacity duration-[120ms] group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Zarządzaj folderami"
                tabIndex={-1}
              >
                <MoreHorizontal
                  className="size-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Button>
            </FolderPickerPopover>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-fg">
            {video.title}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <span aria-label={`Źródło: ${sourceLabel}`}>{sourceIcon}</span>

            {video.duration_seconds !== null &&
              video.duration_seconds !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className="tabular-nums"
                    aria-label={`Czas trwania: ${formatDuration(video.duration_seconds)}`}
                  >
                    {formatDuration(video.duration_seconds)}
                  </span>
                </>
              )}

            <span aria-hidden="true">·</span>
            <time
              dateTime={video.created_at}
              title={new Date(video.created_at).toLocaleDateString('pl-PL')}
            >
              {relativeDate(video.created_at)}
            </time>

            {/* Mobile: foldery akcja na końcu meta row */}
            <span
              className="ml-auto md:hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0"
                    aria-label="Opcje filmu"
                    tabIndex={-1}
                  >
                    <MoreHorizontal
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => setSheetOpen(true)}
                    className="gap-2"
                  >
                    <FolderKanban
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    Zarządzaj folderami
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </div>
        </div>

        {/* Mobile folder picker sheet */}
        <FolderPickerSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          videoId={video.id}
          videoTitle={video.title}
          folders={folders}
          currentFolderIds={currentFolderIds}
        />
      </article>

      {/* VideoDetailDialog — otwierany po kliknięciu karty */}
      <VideoDetailDialog
        video={video}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
