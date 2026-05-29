/**
 * DeleteFolderConfirm — AlertDialog potwierdzenia usunięcia folderu.
 *
 * Copy DESIGN.md sekcja 2: "Usunąć folder? Filmy w środku zostają w bibliotece."
 * Destructive variant per DESIGN.md sekcja 10 Buttons.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteFolder } from '../hooks/useFolderMutations';
import type { Folder } from '../types';

interface DeleteFolderConfirmProps {
  folder: Folder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteFolderConfirm({
  folder,
  open,
  onOpenChange,
}: DeleteFolderConfirmProps) {
  const { mutateAsync, isPending } = useDeleteFolder();

  async function handleDelete() {
    await mutateAsync(folder.id);
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Usunąć folder &ldquo;{folder.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Filmy w środku zostają w bibliotece, tylko folder zniknie. Tej
            operacji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            aria-busy={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Usuwam...' : 'Usuń folder'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
