/**
 * Database types — auto-generated stub.
 *
 * Ten plik jest regenerowany komendą `bun gen-db-types` (wrapper na
 * `supabase gen types typescript --local`), która wymaga:
 *   - uruchomionego lokalnego stacku Supabase (`bunx supabase start`),
 *   - dostępnego Dockera.
 *
 * TODO (po IU-2): pierwszy `bun gen-db-types` nadpisze ten plik wygenerowanymi
 * typami z aktualnej migracji. Do tego czasu używamy minimalnego stubu —
 * `createClient<Database>(...)` pozostaje typowalny, query buildery zwracają
 * `unknown` (bo `Tables = Record<string, never>`).
 *
 * NIE edytuj ręcznie — po pierwszej regeneracji ten komentarz zniknie.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
