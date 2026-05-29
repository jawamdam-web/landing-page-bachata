/**
 * FolderList — lista folderów w sidebarze z akcjami (edytuj/usuń).
 *
 * Każdy wiersz:
 * - Klik na nazwę → zmiana aktywnego folderu (filter library)
 * - ⋯ button → DropdownMenu z "Zmień nazwę" i "Usuń folder"
 * - Aktywny folder: accent left-bar (DESIGN.md sekcja 10 Navigation)
 * - Tap target ≥ 44px (DESIGN.md sekcja 11)
 */

import { useState } from 'react';
import {
  FolderIcon,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/features/sharing/components/ShareDialog';
import { EditFolderDialog } from './EditFolderDialog';
import { DeleteFolderConfirm } from './DeleteFolderConfirm';
import type { Folder } from '../types';

interface FolderListProps {
  folders: Folder[];
  activeFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderRowProps {
  folder: Folder;
  isActive: boolean;
  onSelect: () => void;
}

function FolderRow({ folder, isActive, onSelect }: FolderRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const Icon = isActive ? FolderOpen : FolderIcon;

  return (
    <>
      <div
        className={[
          'group relative flex min-h-11 w-full items-center rounded-md transition-colors duration-[120ms]',
          isActive
            ? 'bg-accent-soft text-accent-soft-foreground font-medium'
            : 'text-fg-muted hover:bg-bg-muted hover:text-fg',
        ].join(' ')}
      >
        {/* Active indicator — left bar */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent"
            aria-hidden="true"
          />
        )}

        {/* Folder name button */}
        <button
          type="button"
          onClick={onSelect}
          aria-current={isActive ? 'page' : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left text-sm"
        >
          <Icon
            className="size-4 shrink-0"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span className="truncate">{folder.name}</span>
        </button>

        {/* ⋯ actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 size-7 shrink-0 p-0 opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Opcje folderu ${folder.name}`}
            >
              <MoreHorizontal
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onSelect={() => setEditOpen(true)}
              className="gap-2"
            >
              <Pencil
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Zmień nazwę
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setShareOpen(true)}
              className="gap-2"
            >
              <Share2
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Udostępnij folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Usuń folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditFolderDialog
        folder={folder}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteFolderConfirm
        folder={folder}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        targetType="folder"
        targetId={folder.id}
        targetLabel={folder.name}
      />
    </>
  );
}

export function FolderList({
  folders,
  activeFolderId,
  onFolderSelect,
}: FolderListProps) {
  if (folders.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {folders.map((folder) => (
        <FolderRow
          key={folder.id}
          folder={folder}
          isActive={activeFolderId === folder.id}
          onSelect={() => onFolderSelect(folder.id)}
        />
      ))}
    </div>
  );
}
