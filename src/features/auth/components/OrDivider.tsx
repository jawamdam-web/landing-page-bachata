/**
 * OrDivider — pozioma linia z etykietą pośrodku ("Albo email i hasło").
 * Dekoracyjna; linie mają aria-hidden, sam tekst jest czytelny dla SR.
 */
interface OrDividerProps {
  label: string;
}

export function OrDivider({ label }: OrDividerProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <span className="text-small text-fg-muted">{label}</span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}
