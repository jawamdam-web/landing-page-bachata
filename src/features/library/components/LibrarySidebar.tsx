/**
 * LibrarySidebar — lista folderów użytkownika.
 *
 * Desktop (>=lg): statyczny panel 240px po lewej stronie.
 * Mobile (<lg): bottom sheet (shadcn Sheet side="bottom").
 *
 * IU-7: FolderList z akcjami (edytuj/usuń) + "+ Nowy folder" button.
 * DESIGN.md sekcja 10 (Navigation): active indicator = accent left-bar.
 * Sekcja 11: tap targets ≥ 44px.
 */

import { useState } from 'react';
import {
  FolderOpen,
  FolderIcon,
  FolderPlus,
  Library,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FolderList } from './FolderList';
import { CreateFolderDialog } from './CreateFolderDialog';
import type { Folder } from '../types';

interface LibrarySidebarProps {
  folders: Folder[];
  activeFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderItemProps {
  folder: Folder | null;
  isActive: boolean;
  onSelect: () => void;
}

function FolderItem({ folder, isActive, onSelect }: FolderItemProps) {
  const label = folder ? folder.name : 'Wszystkie filmy';
  const Icon = folder ? (isActive ? FolderOpen : FolderIcon) : Library;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-[120ms]',
        isActive
          ? 'bg-accent-soft font-medium text-accent-soft-foreground'
          : 'text-fg-muted hover:bg-bg-muted hover:text-fg',
      ].join(' ')}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Desktop sidebar — statyczny, widoczny >=lg. */
function DesktopSidebar({
  folders,
  activeFolderId,
  onFolderSelect,
}: LibrarySidebarProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block" aria-label="Foldery">
        <nav className="flex flex-col gap-1">
          <FolderItem
            folder={null}
            isActive={activeFolderId === null}
            onSelect={() => onFolderSelect(null)}
          />
          <FolderList
            folders={folders}
            activeFolderId={activeFolderId}
            onFolderSelect={onFolderSelect}
          />
        </nav>

        {/* "+ Nowy folder" */}
        <div className="mt-2 border-t border-border pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-fg-muted hover:text-fg"
            onClick={() => setCreateOpen(true)}
          >
            <FolderPlus
              className="size-4"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            Nowy folder
          </Button>
        </div>
      </aside>

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

/** Mobile trigger + bottom sheet z listą folderów. */
function MobileFolderSheet({
  folders,
  activeFolderId,
  onFolderSelect,
}: LibrarySidebarProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const activeLabel =
    activeFolderId === null
      ? 'Wszystkie filmy'
      : (folders.find((f) => f.id === activeFolderId)?.name ?? 'Folder');

  function handleSelect(folderId: string | null) {
    onFolderSelect(folderId);
    setOpen(false);
  }

  return (
    <>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              aria-label={`Aktywny folder: ${activeLabel}. Zmień folder`}
            >
              <SlidersHorizontal
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="max-w-[140px] truncate">{activeLabel}</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[80dvh] flex flex-col">
            <SheetHeader className="shrink-0">
              <SheetTitle>Wybierz folder</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              <FolderItem
                folder={null}
                isActive={activeFolderId === null}
                onSelect={() => handleSelect(null)}
              />
              <FolderList
                folders={folders}
                activeFolderId={activeFolderId}
                onFolderSelect={(folderId) => handleSelect(folderId)}
              />

              {/* "+ Nowy folder" */}
              <div className="border-t border-border pt-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-fg-muted"
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <FolderPlus
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  Nowy folder
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

/**
 * LibrarySidebar — renderuje odpowiedni wariant zależnie od breakpointa.
 * Desktop: statyczny panel. Mobile: bottom sheet przez trigger button.
 */
export function LibrarySidebar(props: LibrarySidebarProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileFolderSheet {...props} />
    </>
  );
}
