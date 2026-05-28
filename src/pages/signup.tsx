import { Link } from 'react-router';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { SignupForm } from '@/features/auth/components/SignupForm';

/**
 * /signup — strona rejestracji. Lazy-loaded w router.tsx.
 */
export function SignupPage() {
  return (
    <AuthLayout
      title="Załóż konto"
      subtitle="Zacznij porządkować swoje filmy z zajęć."
      footer={
        <>
          Masz już konto?{' '}
          <Link
            to="/login"
            className="font-medium text-accent-soft-foreground underline-offset-4 hover:underline"
          >
            Zaloguj się
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}

export default SignupPage;
