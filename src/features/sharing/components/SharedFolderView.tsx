/**
 * SharedFolderView — publiczny widok udostępnionego folderu.
 *
 * Pokazuje nazwę folderu + read-only grid kart filmów (bez edit/delete).
 * Kliknięcie karty → inline VideoDetailDialog w trybie read-only.
 * Footer CTA jak w SharedVideoView.
 *
 * DESIGN.md sekcja 10: cards z hairline border, grid mobile-first.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Folder as FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/features/library/components/VideoPlayer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Video } from '@/features/library/types';

interface SharedFolder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface SharedFolderViewProps {
  folder: SharedFolder;
  videos: Video[];
}

/** Karta read-only dla gridu publicznego. */
function PublicVideoCard({
  video,
  onClick,
}: {
  video: Video;
  onClick: () => void;
}) {
  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-bg-subtle transition-colors duration-[120ms] hover:border-border-strong active:scale-[0.98]"
      aria-label={video.title}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
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
      </div>

      {/* Title */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-fg">
          {video.title}
        </h3>
      </div>
    </article>
  );
}

/** Dialog z odtwarzaczem dla klikniętej karty (read-only, bez edycji). */
function PublicVideoDialog({
  video,
  open,
  onOpenChange,
}: {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{video.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <VideoPlayer
            source={video.source}
            sourceId={video.source_id}
            embedHtml={video.embed_html}
            title={video.title}
          />
          <h2 className="text-base font-semibold text-fg">{video.title}</h2>
          {video.notes && (
            <p className="whitespace-pre-wrap text-sm text-fg-muted">
              {video.notes}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SharedFolderView({ folder, videos }: SharedFolderViewProps) {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleVideoClick(video: Video) {
    setSelectedVideo(video);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8 md:px-8">
        {/* Folder header */}
        <div className="flex items-center gap-3">
          <FolderIcon
            className="size-6 shrink-0 text-fg-muted"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <h1 className="text-2xl font-semibold text-fg">{folder.name}</h1>
        </div>

        {/* Videos grid */}
        {videos.length === 0 ? (
          <p className="text-sm text-fg-muted">Ten folder jest pusty.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <PublicVideoCard
                key={video.id}
                video={video}
                onClick={() => handleVideoClick(video)}
              />
            ))}
          </div>
        )}

        {/* CTA footer */}
        <footer className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-border bg-bg-subtle p-5 text-center">
          <p className="text-sm text-fg-muted">
            Udostępnione przez{' '}
            <span className="font-medium text-fg">Bachata Napoli</span> — załóż
            konto i organizuj własne filmy z zajęć.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => void navigate('/signup')}
            className="min-w-[160px]"
          >
            Załóż konto
          </Button>
        </footer>
      </div>

      <PublicVideoDialog
        video={selectedVideo}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
