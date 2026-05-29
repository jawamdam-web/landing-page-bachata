/**
 * FolderPickerSheet — mobile bottom sheet do przypisywania filmów do folderów (m:n).
 *
 * Stan: lokalny uncommitted (checkbox state). "Zapisz" → commit mutation.
 * "Anuluj" lub zamknięcie sheetu → odrzuca zmiany.
 * Tap targets 48px row height (DESIGN.md sekcja 11 mobile rules).
 * Drag-to-dismiss obsługiwany przez shadcn Sheet natywnie.
 *
 * Zawiera inline akcję "+ Nowy folder" → CreateFolderDialog.
 */

import { useEffect, useState } from 'react';
import { Check, FolderIcon, FolderPlus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CreateFolderDialog } from './CreateFolderDialog';
import { useAssignVideoToFolders } from '../hooks/useFolderMutations';
import type { Folder } from '../types';

interface FolderPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
  folders: Folder[];
  currentFolderIds: string[];
}

export function FolderPickerSheet({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  folders,
  currentFolderIds,
}: FolderPickerSheetProps) {
  const [selected, setSelected] = useState<string[]>(currentFolderIds);
  const [createOpen, setCreateOpen] = useState(false);
  const { mutateAsync, isPending } = useAssignVideoToFolders();

  // Sync stan lokalny gdy picker jest otwierany — currentFolderIds mogło się zmienić
  // między dwoma otwarciami (invalidacja cache). Celowo tylko 'open' w deps.
  useEffect(() => {
    if (open) setSelected(currentFolderIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // Discard uncommitted changes on close
      setSelected(currentFolderIds);
    }
    onOpenChange(nextOpen);
  }

  function toggleFolder(folderId: string) {
    setSelected((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId],
    );
  }

  async function handleSave() {
    try {
      await mutateAsync({ videoId, folderIds: selected });
      onOpenChange(false);
    } catch {
      // onError w hooku obsługuje toast — nie zamykamy sheetu przy błędzie
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-left">Zarządzaj folderami</SheetTitle>
            <p className="text-sm text-fg-muted truncate text-left">
              {videoTitle}
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {folders.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-muted">
                Nie masz jeszcze żadnych folderów.
              </p>
            ) : (
              <ul role="list" className="flex flex-col gap-0.5">
                {folders.map((folder) => {
                  const isChecked = selected.includes(folder.id);
                  return (
                    <li key={folder.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        onClick={() => toggleFolder(folder.id)}
                        className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-[120ms] hover:bg-bg-muted active:scale-[0.98]"
                      >
                        <FolderIcon
                          className="size-4 shrink-0 text-fg-muted"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate">{folder.name}</span>
                        {isChecked && (
                          <Check
                            className="size-4 shrink-0 text-accent"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <SheetFooter className="shrink-0 flex-col gap-2 pt-2 pb-[env(safe-area-inset-bottom)]">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <FolderPlus
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Nowy folder
            </Button>
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Anuluj
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleSave}
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending ? 'Zapisuję...' : 'Zapisz'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
