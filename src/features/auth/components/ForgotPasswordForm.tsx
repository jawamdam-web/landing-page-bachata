import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { resetPassword } from '../api/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';
import { FormField } from './FormField';

/**
 * ForgotPasswordForm — wysyła link do resetu hasła.
 *
 * Security best practice: NIE ujawniamy czy email istnieje. Po submit zawsze
 * pokazujemy ten sam komunikat sukcesu (nawet gdy email nieznany). Realne
 * błędy (np. rate limit / sieć) → toast błędu.
 */

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput): Promise<void> {
    try {
      await resetPassword(values.email);
      setSent(true);
      toast.success('Wysłaliśmy link do resetu hasła.');
    } catch {
      toast.error('Nie udało się wysłać linku. Spróbuj jeszcze raz.');
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-lg border border-border bg-bg-subtle p-6 text-center"
      >
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <p className="text-base font-medium text-fg text-balance">
          Sprawdź swój email
        </p>
        <p className="text-small text-fg-muted text-pretty">
          Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia
          nowego hasła.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="ty@przyklad.pl"
        error={errors.email?.message}
        registration={register('email')}
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
        Wyślij link do resetu
      </Button>
    </form>
  );
}
