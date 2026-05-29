/**
 * FolderPickerPopover — desktop popover do przypisywania filmów do folderów (m:n).
 *
 * Widoczny >=md. Command-style search + checkbox list + "+ Nowy folder" inline.
 * Stan: lokalny uncommitted. "Zapisz" → commit mutation. "Anuluj" lub klik poza → discard.
 * DESIGN.md: shadow-lg dla lifted elements (sekcja 7).
 */

import { useState } from 'react';
import { Check, FolderIcon, FolderPlus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { CreateFolderDialog } from './CreateFolderDialog';
import { useAssignVideoToFolders } from '../hooks/useFolderMutations';
import type { Folder } from '../types';

interface FolderPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  folders: Folder[];
  currentFolderIds: string[];
  children: React.ReactNode;
}

export function FolderPickerPopover({
  open,
  onOpenChange,
  videoId,
  folders,
  currentFolderIds,
  children,
}: FolderPickerPopoverProps) {
  const [selected, setSelected] = useState<string[]>(currentFolderIds);
  const [createOpen, setCreateOpen] = useState(false);
  const { mutateAsync, isPending } = useAssignVideoToFolders();

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
    await mutateAsync({ videoId, folderIds: selected });
    onOpenChange(false);
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-0 shadow-lg" align="start">
          <Command>
            <CommandInput placeholder="Szukaj folderów..." />
            <CommandList>
              <CommandEmpty>Brak folderów.</CommandEmpty>
              <CommandGroup>
                {folders.map((folder) => {
                  const isChecked = selected.includes(folder.id);
                  return (
                    <CommandItem
                      key={folder.id}
                      value={folder.name}
                      onSelect={() => toggleFolder(folder.id)}
                      className="gap-2"
                    >
                      <FolderIcon
                        className="size-4 shrink-0 text-fg-muted"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span
                        className={[
                          'flex size-4 shrink-0 items-center justify-center rounded-xs border border-border',
                          isChecked ? 'bg-accent border-accent' : '',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {isChecked && (
                          <Check
                            className="size-3 text-accent-foreground"
                            strokeWidth={2.5}
                          />
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>

            <CommandSeparator />

            <div className="p-1">
              <CommandItem
                onSelect={() => {
                  setCreateOpen(true);
                }}
                className="gap-2 text-fg-muted"
              >
                <FolderPlus
                  className="size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Nowy folder
              </CommandItem>
            </div>
          </Command>

          <div className="flex gap-2 border-t border-border p-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSave}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? 'Zapisuję...' : 'Zapisz'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
