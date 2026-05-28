import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signInWithEmail } from '../api/auth';
import { loginSchema, type LoginInput } from '../schemas';
import { FormField } from './FormField';
import { GoogleSignInButton } from './GoogleSignInButton';
import { OrDivider } from './OrDivider';

/**
 * LoginForm — logowanie email/hasło + Google OAuth.
 *
 * Po sukcesie redirect do `?next` (z protected route guard) lub `/library`.
 * Błąd logowania → toast (voice DESIGN.md: "Nie udało się zalogować...").
 * Walidacja inline (RHF + Zod), submit blokowany podczas mutacji.
 */

function resolveNextPath(raw: string | null): string {
  if (!raw) return '/library';
  // Tylko ścieżki względne (zaczynają się od "/", nie "//") — ochrona przed
  // open-redirect (np. //evil.com). Decode bezpieczne, bo walidujemy prefix.
  const decoded = decodeURIComponent(raw);
  if (decoded.startsWith('/') && !decoded.startsWith('//')) {
    return decoded;
  }
  return '/library';
}

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = resolveNextPath(searchParams.get('next'));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput): Promise<void> {
    try {
      await signInWithEmail(values.email, values.password);
      await navigate(nextPath, { replace: true });
    } catch {
      toast.error('Nie udało się zalogować. Sprawdź email i hasło.');
    }
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
        <div className="flex flex-col gap-1.5">
          <FormField
            id="password"
            label="Hasło"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            registration={register('password')}
          />
          <Link
            to="/forgot-password"
            className="self-end text-small text-accent-soft-foreground underline-offset-4 hover:underline"
          >
            Nie pamiętasz hasła?
          </Link>
        </div>
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
          Zaloguj się
        </Button>
      </form>
    </div>
  );
}
