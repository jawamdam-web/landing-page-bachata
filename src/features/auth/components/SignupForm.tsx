import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signUpWithEmail } from '../api/auth';
import { signupSchema, type SignupInput } from '../schemas';
import { FormField } from './FormField';
import { GoogleSignInButton } from './GoogleSignInButton';
import { OrDivider } from './OrDivider';

/**
 * SignupForm — rejestracja email/hasło + Google OAuth.
 *
 * Z włączonym "Confirm email" rejestracja NIE loguje od razu — pokazujemy
 * stan "sprawdź email" (toast + inline success panel). Voice DESIGN.md:
 * "Wysłaliśmy link aktywacyjny na Twój email".
 */

export function SignupForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: SignupInput): Promise<void> {
    try {
      await signUpWithEmail(values.email, values.password);
      setSubmittedEmail(values.email);
      toast.success('Wysłaliśmy link aktywacyjny na Twój email.');
    } catch {
      toast.error('Nie udało się założyć konta. Spróbuj jeszcze raz.');
    }
  }

  if (submittedEmail) {
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
          Wysłaliśmy link aktywacyjny na <strong>{submittedEmail}</strong>.
          Kliknij go, żeby dokończyć zakładanie konta.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GoogleSignInButton />
      <OrDivider label="Albo email i hasło" />
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
        <FormField
          id="password"
          label="Hasło"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register('password')}
        />
        <p className="text-small text-fg-subtle">
          Minimum 8 znaków, w tym litera i cyfra.
        </p>
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
          Załóż konto
        </Button>
      </form>
    </div>
  );
}
