import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — komponent zgodny z DESIGN.md sekcja 10 (Komponenty/Button).
 *
 * Warianty: primary (accent terracotta), secondary, ghost, outline, destructive, link.
 * Rozmiary: sm (h-8), md (h-10 default), lg (h-12 mobile-friendly).
 * Press feedback: active:scale-[0.96] zgodnie z polish principles (sekcja 9).
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium select-none',
    'rounded-sm',
    'transition-[background-color,color,border-color,box-shadow,transform]',
    'duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
    'active:scale-[0.96]',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none',
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-accent text-accent-foreground',
          'hover:bg-accent-hover',
          'active:bg-accent-pressed',
        ],
        secondary: [
          'bg-bg-subtle text-fg border border-border-strong',
          'hover:bg-bg-muted',
        ],
        ghost: ['text-fg', 'hover:bg-bg-subtle'],
        outline: [
          'bg-transparent text-fg border border-border-strong',
          'hover:bg-bg-subtle',
        ],
        destructive: ['bg-error text-error-foreground', 'hover:opacity-90'],
        link: [
          'text-accent-soft-foreground underline-offset-4',
          'hover:underline',
          'active:scale-100',
          'rounded-none',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
export type { ButtonProps };
