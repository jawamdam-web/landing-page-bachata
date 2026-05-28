/**
 * Database types — RĘCZNIE rozszerzony stub (Docker niedostępny, generator
 * `bun gen-db-types` nie był uruchamiany w tej sesji).
 *
 * ⚠️ MANUAL TYPES — DO REGENERACJI ⚠️
 * Typy tabeli `profiles` poniżej wpisano ręcznie, zgodnie z migracją
 * `supabase/migrations/0002_profiles_and_trigger.sql`. Format naśladuje wyjście
 * `supabase gen types typescript --local`, więc pierwszy `bun gen-db-types` na
 * maszynie z Dockerem nadpisze ten plik czysto (wraz z tym komentarzem).
 *
 * Po regeneracji: zweryfikuj diff i potwierdź zgodność z migracjami 0001+0002.
 *
 * Regeneracja:
 *   bunx supabase start && bunx supabase db reset && bun gen-db-types
 */

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type { Json };
