import type { ComponentProps, Ref } from 'react';
import { cn } from '@/lib/utils';

/**
 * Input — komponent zgodny z DESIGN.md sekcja 10 (Komponenty/Input).
 *
 * Wymagania kluczowe:
 * - text-base (16px) na mobile → BEZ tego iOS Safari zoomuje przy focus
 * - focus: border-accent + ring-2 ring-accent/32 (focus-visible w global.css)
 * - h-10 default (md); użyj `h-12` przez className dla mobile-lg variant
 *
 * `ref` jako prop (React 19 — bez forwardRef) forwardowany do natywnego
 * <input>, żeby React Hook Form `register()` mógł go zarejestrować.
 */
type InputProps = ComponentProps<'input'> & { ref?: Ref<HTMLInputElement> };

export function Input({ className, type = 'text', ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full min-w-0 rounded-sm border border-border bg-bg px-3 py-1',
        'text-base text-fg',
        'placeholder:text-fg-subtle',
        'transition-[border-color,box-shadow] duration-[var(--duration-fast)]',
        'focus-visible:border-accent focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-error',
        'file:text-fg file:bg-transparent file:border-0 file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  );
}

export type { InputProps };
