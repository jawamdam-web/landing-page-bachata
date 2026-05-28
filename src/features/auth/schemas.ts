import { z } from 'zod';

/**
 * Auth Zod schemas — źródło prawdy typów dla warstwy danych (auth.ts) i UI
 * (formularze RHF). Walidacja na granicy systemu: input użytkownika → schema →
 * wywołanie Supabase Auth.
 *
 * Voice komunikatów: polski, "ty", ciepło (DESIGN.md sekcja 2).
 */

const MIN_PASSWORD_LENGTH = 8;

/** Email — restrykcyjny (z.email), trim + lowercase dla spójności. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Podaj swój email.')
  .email('To nie wygląda na poprawny email.')
  .toLowerCase();

/**
 * Hasło — zbalansowane wymagania (plan IU-4): min 8 znaków, min 1 cyfra,
 * min 1 litera. Ani za luźne, ani za rygorystyczne dla casual users.
 */
export const passwordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`,
  )
  .regex(/\p{L}/u, 'Hasło musi zawierać co najmniej jedną literę.')
  .regex(/\d/, 'Hasło musi zawierać co najmniej jedną cyfrę.');

/** Logowanie — przy logowaniu nie walidujemy złożoności hasła (tylko niepuste). */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Podaj hasło.'),
});

/** Rejestracja — pełna walidacja złożoności hasła. */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** Reset hasła krok 1 — tylko email. */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/** Reset hasła krok 2 — nowe hasło + potwierdzenie (muszą być zgodne). */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Powtórz hasło.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są takie same.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
