import { Link } from 'react-router';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

/**
 * /login — strona logowania. Lazy-loaded w router.tsx (ściąga supabase tylko
 * przy wejściu na trasę, nie do eager startup chain).
 */
export function LoginPage() {
  return (
    <AuthLayout
      title="Zaloguj się"
      subtitle="Wróć do swojej biblioteki tańca."
      footer={
        <>
          Nie masz konta?{' '}
          <Link
            to="/signup"
            className="font-medium text-accent-soft-foreground underline-offset-4 hover:underline"
          >
            Załóż konto
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
