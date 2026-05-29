/**
 * EditFolderDialog — dialog do zmiany nazwy folderu.
 *
 * Prefilled input z aktualną nazwą folderu.
 * Błąd duplikatu (23505) → inline error.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateFolder } from '../hooks/useFolderMutations';
import type { Folder } from '../types';

const editFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Podaj nazwę folderu.')
    .max(100, 'Nazwa może mieć maksymalnie 100 znaków.'),
});

type EditFolderFields = z.infer<typeof editFolderSchema>;

interface EditFolderDialogProps {
  folder: Folder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFolderDialog({
  folder,
  open,
  onOpenChange,
}: EditFolderDialogProps) {
  const { mutateAsync, isPending } = useUpdateFolder();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditFolderFields>({
    resolver: zodResolver(editFolderSchema),
    defaultValues: { name: folder.name },
  });

  // Sync form when folder or open state changes
  useEffect(() => {
    if (open) reset({ name: folder.name });
  }, [open, folder.name, reset]);

  async function handleEdit(data: EditFolderFields) {
    try {
      await mutateAsync({ id: folder.id, name: data.name });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('23505')) {
        setError('name', { message: 'Folder o tej nazwie już istnieje.' });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Zmień nazwę folderu</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleEdit)} noValidate>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-folder-name">Nazwa folderu</Label>
              <Input
                id="edit-folder-name"
                autoFocus
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={
                  errors.name ? 'edit-folder-name-error' : undefined
                }
                {...register('name')}
              />
              {errors.name && (
                <p
                  id="edit-folder-name-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending ? 'Zapisuję...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
