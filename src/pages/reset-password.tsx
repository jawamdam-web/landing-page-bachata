import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

/**
 * /reset-password — strona docelowa recovery linku z emaila. Lazy-loaded.
 * Supabase ekstrahuje tymczasową sesję z URL (detectSessionInUrl), formularz
 * ustawia nowe hasło.
 */
export function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Ustaw nowe hasło"
      subtitle="Wpisz nowe hasło do swojego konta."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}

export default ResetPasswordPage;
