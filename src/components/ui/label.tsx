import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Label — prosty primitive zgodny z DESIGN.md (forms). small (14px) + medium
 * weight. Powiązanie z inputem przez `htmlFor` (a11y — WCAG 2.2, sekcja 12).
 */
type LabelProps = ComponentProps<'label'>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium text-fg select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export type { LabelProps };
