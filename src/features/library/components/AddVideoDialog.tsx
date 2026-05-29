/**
 * AddVideoDialog — dialog (desktop) / Sheet (mobile) do dodawania filmów.
 *
 * 3 taby:
 * - "YouTube link" → YoutubeLinkForm
 * - "Facebook / Instagram" → MetaLinkForm
 * - "Upload plik" → VideoUploadForm (IU-9)
 *
 * DESIGN.md sekcja 10: desktop Dialog, mobile Sheet.
 * Responsive: < md → Sheet bottom (onOpenChange kontrolowany z zewnątrz).
 */

import { useEffect, useState } from 'react';
import { UploadCloud, Youtube, Facebook } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YoutubeLinkForm } from './YoutubeLinkForm';
import { MetaLinkForm } from './MetaLinkForm';
import { VideoUploadForm } from './VideoUploadForm';

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Domyślnie aktywny tab. */
  defaultTab?: 'youtube' | 'meta' | 'upload';
}

/** Wspólna zawartość dialogu — taby + formularze. */
function AddVideoContent({
  onSuccess,
  defaultTab = 'youtube',
}: {
  onSuccess: () => void;
  defaultTab?: AddVideoDialogProps['defaultTab'];
}) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="youtube" className="gap-1.5">
          <Youtube className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">YouTube</span>
        </TabsTrigger>
        <TabsTrigger value="meta" className="gap-1.5">
          <Facebook className="size-4" strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:inline">FB / IG</span>
        </TabsTrigger>
        <TabsTrigger value="upload" className="gap-1.5">
          <UploadCloud
            className="size-4"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Upload</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="youtube" className="mt-4">
        <YoutubeLinkForm onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="meta" className="mt-4">
        <MetaLinkForm onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="upload" className="mt-4">
        <VideoUploadForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
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

export function AddVideoDialog({
  open,
  onOpenChange,
  defaultTab = 'youtube',
}: AddVideoDialogProps) {
  const isMobile = useIsMobile();

  function handleSuccess() {
    onOpenChange(false);
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-xl px-5 pb-safe-bottom pt-5"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Dodaj film</SheetTitle>
          </SheetHeader>
          <AddVideoContent onSuccess={handleSuccess} defaultTab={defaultTab} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Dodaj film</DialogTitle>
        </DialogHeader>
        <AddVideoContent onSuccess={handleSuccess} defaultTab={defaultTab} />
      </DialogContent>
    </Dialog>
  );
}
