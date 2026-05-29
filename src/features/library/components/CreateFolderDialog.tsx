/**
 * CreateFolderDialog — dialog do tworzenia nowego folderu.
 *
 * Formularz z walidacją Zod: nazwa 1-100 znaków.
 * Błąd duplikatu (23505) → inline error (nie toast).
 * DESIGN.md sekcja 10: modal desktop, sheet mobile (tutaj dialog — per plan).
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
import { useCreateFolder } from '../hooks/useFolderMutations';
import { isDuplicateFolderError } from '../api/folders';

const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Podaj nazwę folderu.')
    .max(100, 'Nazwa może mieć maksymalnie 100 znaków.'),
});

type CreateFolderFields = z.infer<typeof createFolderSchema>;

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
}: CreateFolderDialogProps) {
  const { mutateAsync, isPending } = useCreateFolder();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateFolderFields>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: { name: '' },
  });

  // Reset form on close
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function handleCreate(data: CreateFolderFields) {
    try {
      await mutateAsync(data.name);
      onOpenChange(false);
    } catch (error) {
      if (isDuplicateFolderError(error)) {
        setError('name', { message: 'Folder o tej nazwie już istnieje.' });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nowy folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleCreate)} noValidate>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="folder-name">Nazwa folderu</Label>
              <Input
                id="folder-name"
                autoFocus
                placeholder="np. Zajęcia sensual"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'folder-name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p
                  id="folder-name-error"
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
              {isPending ? 'Tworzę...' : 'Utwórz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
