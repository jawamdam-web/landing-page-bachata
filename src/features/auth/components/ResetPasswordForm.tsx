import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { updatePassword } from '../api/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas';
import { FormField } from './FormField';

/**
 * ResetPasswordForm — ustawia nowe hasło po wejściu z recovery linku.
 *
 * Recovery link tworzy tymczasową sesję (detectSessionInUrl), więc
 * updatePassword działa na zalogowanym (przez link) userze. Po sukcesie
 * redirect do /login z toastem.
 */

export function ResetPasswordForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordInput): Promise<void> {
    try {
      await updatePassword(values.password);
      toast.success('Hasło zmienione. Możesz się zalogować.');
      await navigate('/login', { replace: true });
    } catch {
      toast.error('Nie udało się zmienić hasła. Link mógł wygasnąć.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        id="password"
        label="Nowe hasło"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        registration={register('password')}
      />
      <FormField
        id="confirmPassword"
        label="Powtórz hasło"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        registration={register('confirmPassword')}
      />
      <Button
        type="submit"
        size="lg"
        className="mt-2 w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Ustaw nowe hasło
      </Button>
    </form>
  );
}
