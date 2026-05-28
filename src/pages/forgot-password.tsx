import { Link } from 'react-router';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

/**
 * /forgot-password — wysyłka linku do resetu hasła. Lazy-loaded w router.tsx.
 */
export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset hasła"
      subtitle="Podaj email — wyślemy Ci link do ustawienia nowego hasła."
      footer={
        <Link
          to="/login"
          className="font-medium text-accent-soft-foreground underline-offset-4 hover:underline"
        >
          Wróć do logowania
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
