/**
 * EmptyLibrary — empty state wyświetlany gdy user nie ma jeszcze żadnych filmów.
 *
 * DESIGN.md sekcja 2 (voice: "Twoja biblioteka czeka…").
 * CTA "Dodaj film" otwiera AddVideoDialog (IU-8).
 */

import { useState } from 'react';
import { VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddVideoDialog } from './AddVideoDialog';

export function EmptyLibrary() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div
        className="flex flex-col items-center gap-6 px-5 py-16 text-center"
        data-testid="empty-library"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-bg-muted">
          <VideoOff
            className="size-8 text-fg-muted"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-fg">
            Twoja biblioteka czeka na pierwszy film
          </h2>
          <p className="max-w-sm text-base text-fg-muted text-pretty">
            Wklej link, dodaj embed lub wgraj plik z telefonu — wszystko trafi
            tu, uporządkowane.
          </p>
        </div>

        <Button size="lg" onClick={() => setDialogOpen(true)}>
          Dodaj film
        </Button>
      </div>

      <AddVideoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
