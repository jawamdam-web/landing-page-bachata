import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Łączy klasy Tailwind z resolveniem konfliktów (np. `px-2` + `px-4` → `px-4`).
 * Standardowy helper shadcn/ui używany w cn={cn(...)} prop.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
