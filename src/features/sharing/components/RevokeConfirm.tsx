/**
 * RevokeConfirm — AlertDialog z potwierdzeniem cofnięcia dostępu.
 *
 * Pojawia się przy kliknięciu "Cofnij dostęp" w ShareLinkRow.
 * Po potwierdzeniu wywołuje onConfirm (mutation w hooku).
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

interface RevokeConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function RevokeConfirm({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: RevokeConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Cofnąć dostęp?</AlertDialogTitle>
          <AlertDialogDescription>
            Ten link przestanie działać natychmiast. Osoby z linkiem nie będą
            mogły już otworzyć udostępnionej treści.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            Cofnij dostęp
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
