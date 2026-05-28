import { type ComponentProps } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * FormField — label + input + komunikat błędu, spięte przez a11y atrybuty.
 *
 * Dostępność (DESIGN.md sekcja 12, ux-ui-guidelines):
 * - `htmlFor`/`id` wiąże label z inputem
 * - `aria-invalid` gdy błąd (input dostaje border-error przez aria-invalid:)
 * - `aria-describedby` wskazuje na komunikat błędu
 * - błąd ma `role="alert"` (screen reader ogłasza inline)
 *
 * WAŻNE: rejestrację z React Hook Form przekazujemy przez prop `registration`
 * (zwrotka `register(...)`), którą spread'ujemy na <Input> — NIE na <FormField>.
 * `register()` zawiera klucz `ref`; gdyby trafił w spread na komponent
 * funkcyjny FormField, React 19 potraktowałby go jako specjalny `ref` i przy
 * re-renderze gubił reconciliation (znikał tekst labela). Spread na Input
 * (który jawnie deklaruje `ref` jako prop) jest bezpieczny.
 */

type NativeInputProps = Omit<
  ComponentProps<'input'>,
  'id' | keyof UseFormRegisterReturn
>;

interface FormFieldProps extends NativeInputProps {
  id: string;
  label: string;
  error?: string;
  /** Zwrotka `register('field')` z React Hook Form. */
  registration?: UseFormRegisterReturn;
}

export function FormField({
  id,
  label,
  error,
  registration,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="h-12"
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        {...inputProps}
        {...registration}
      />
      {hasError ? (
        <p id={errorId} role="alert" className="text-small text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
