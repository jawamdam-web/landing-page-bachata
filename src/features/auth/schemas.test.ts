import { describe, expect, it } from 'vitest';
import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
  signupSchema,
} from './schemas';

describe('passwordSchema', () => {
  it('akceptuje hasło z literą i cyfrą, min 8 znaków', () => {
    const result = passwordSchema.safeParse('Pass1234');
    expect(result.success).toBe(true);
  });

  it('odrzuca za krótkie hasło (< 8 znaków)', () => {
    const result = passwordSchema.safeParse('Pass1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/co najmniej 8/);
    }
  });

  it('odrzuca hasło bez cyfry (same litery, 8+ znaków)', () => {
    const result = passwordSchema.safeParse('password');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/cyfrę/);
    }
  });

  it('odrzuca hasło bez litery (same cyfry, 8+ znaków)', () => {
    const result = passwordSchema.safeParse('12345678');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/literę/);
    }
  });
});

describe('emailSchema', () => {
  it('akceptuje poprawny email i normalizuje do lowercase', () => {
    const result = emailSchema.safeParse('Ty@Przyklad.PL');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('ty@przyklad.pl');
    }
  });

  it('przycina białe znaki', () => {
    const result = emailSchema.safeParse('  ty@przyklad.pl  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('ty@przyklad.pl');
    }
  });

  it('odrzuca niepoprawny email', () => {
    const result = emailSchema.safeParse('to-nie-email');
    expect(result.success).toBe(false);
  });

  it('odrzuca pusty email', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('akceptuje email + dowolne niepuste hasło (bez walidacji złożoności)', () => {
    const result = loginSchema.safeParse({
      email: 'ty@przyklad.pl',
      password: 'x',
    });
    expect(result.success).toBe(true);
  });

  it('odrzuca puste hasło', () => {
    const result = loginSchema.safeParse({
      email: 'ty@przyklad.pl',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('akceptuje poprawny email + złożone hasło', () => {
    const result = signupSchema.safeParse({
      email: 'ty@przyklad.pl',
      password: 'Pass1234',
    });
    expect(result.success).toBe(true);
  });

  it('odrzuca słabe hasło przy rejestracji', () => {
    const result = signupSchema.safeParse({
      email: 'ty@przyklad.pl',
      password: 'slabe',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('wymaga tylko poprawnego emaila', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'ty@przyklad.pl' });
    expect(result.success).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  it('akceptuje zgodne hasła spełniające złożoność', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Pass1234',
      confirmPassword: 'Pass1234',
    });
    expect(result.success).toBe(true);
  });

  it('odrzuca niezgodne hasła (path = confirmPassword)', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Pass1234',
      confirmPassword: 'Inne1234',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const mismatch = result.error.issues.find((issue) =>
        issue.path.includes('confirmPassword'),
      );
      expect(mismatch?.message).toMatch(/takie same/);
    }
  });
});
