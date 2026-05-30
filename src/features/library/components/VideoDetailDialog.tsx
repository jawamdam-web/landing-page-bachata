/**
 * VideoDetailDialog — modal z detalami i playerem dla klikniętego VideoCard.
 *
 * Desktop: Dialog (max-w-2xl)
 * Mobile: Sheet full-screen z back button
 *
 * Zawiera:
 * - VideoPlayer (YT iframe lub Meta embed)
 * - Tytuł edytowalny inline (save on blur)
 * - Textarea notatek
 * - Przyciski akcji: Share (placeholder), Delete, Zarządzaj folderami
 *
 * DESIGN.md sekcja 10: modal centered desktop, bottom sheet mobile.
 */

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Share2, Trash2 } from 'lucide-react';
import { ShareDialog } from '@/features/sharing/components/ShareDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDeleteVideo, useUpdateVideo } from '../hooks/useVideoMutations';
import type { Video } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface VideoDetailDialogProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VideoDetailContentProps {
  video: Video;
  onClose: () => void;
}

function VideoDetailContent({ video, onClose }: VideoDetailContentProps) {
  const [title, setTitle] = useState(video.title);
  const [notes, setNotes] = useState(video.notes ?? '');
  const [shareOpen, setShareOpen] = useState(false);
  const { mutate: updateVideo } = useUpdateVideo();
  const { mutate: deleteVideoMutate, isPending: isDeleting } = useDeleteVideo();
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync state when video changes (e.g. cache update)
  useEffect(() => {
    setTitle(video.title);
    setNotes(video.notes ?? '');
  }, [video.id, video.title, video.notes]);

  function handleTitleBlur() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === video.title) return;
    updateVideo({ id: video.id, title: trimmed });
  }

  function handleNotesBlur() {
    if (notes === (video.notes ?? '')) return;
    updateVideo({ id: video.id, notes: notes || null });
  }

  function handleDelete() {
    deleteVideoMutate(video.id);
    onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video Player */}
      <VideoPlayer
        source={video.source}
        sourceId={video.source_id}
        embedHtml={video.embed_html}
        title={video.title}
      />

      {/* Tytuł edytowalny inline */}
      <div className="flex flex-col gap-1">
        <label htmlFor="video-title" className="sr-only">
          Tytuł filmu
        </label>
        <input
          ref={titleRef}
          id="video-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full rounded-md border border-transparent bg-transparent px-1 text-base font-semibold text-fg outline-none transition-colors duration-[120ms] hover:border-border focus:border-accent focus:bg-bg-subtle focus:ring-2 focus:ring-accent/32"
          aria-label="Tytuł filmu (edytowalny)"
        />
      </div>

      {/* Notatki */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="video-notes"
          className="text-xs font-medium text-fg-muted"
        >
          Notatki
        </label>
        <Textarea
          id="video-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Dodaj notatki do tego filmu..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Share — otwiera ShareDialog (IU-10) */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShareOpen(true)}
          aria-label="Udostępnij film"
        >
          <Share2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Udostępnij
        </Button>

        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          targetType="video"
          targetId={video.id}
          targetLabel={video.title}
        />

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5 text-error hover:text-error"
              disabled={isDeleting}
            >
              <Trash2
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Usuń
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć ten film?</AlertDialogTitle>
              <AlertDialogDescription>
                Film zostanie usunięty z biblioteki. Tej operacji nie można
                cofnąć.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete}>
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function VideoDetailDialog({
  video,
  open,
  onOpenChange,
}: VideoDetailDialogProps) {
  const isMobile = useIsMobile();

  if (!video) return null;

  function handleClose() {
    onOpenChange(false);
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] rounded-t-xl px-5 pt-3 pb-safe-bottom"
        >
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0"
                onClick={handleClose}
                aria-label="Zamknij"
              >
                <ArrowLeft
                  className="size-5"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Button>
              <SheetTitle className="flex-1 text-left text-base">
                {video.title}
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto pb-6">
            <VideoDetailContent video={video} onClose={handleClose} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{video.title}</DialogTitle>
        </DialogHeader>
        <VideoDetailContent video={video} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
