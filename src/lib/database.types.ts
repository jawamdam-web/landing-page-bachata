/**
 * Database types — RĘCZNIE rozszerzony stub (Docker niedostępny, generator
 * `bun gen-db-types` nie był uruchamiany w tej sesji).
 *
 * ⚠️ MANUAL TYPES — DO REGENERACJI ⚠️
 * Typy tabel poniżej wpisano ręcznie, zgodnie z migracjami 0002 i 0003.
 * Format naśladuje wyjście `supabase gen types typescript --local`,
 * więc pierwszy `bun gen-db-types` na maszynie z Dockerem nadpisze ten plik
 * czysto (wraz z tym komentarzem).
 *
 * Po regeneracji: zweryfikuj diff i potwierdź zgodność z migracjami 0001-0003.
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

export type VideoSource = 'youtube_link' | 'youtube_upload' | 'meta_embed';

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
      videos: {
        Row: {
          id: string;
          user_id: string;
          source: VideoSource;
          source_url: string;
          source_id: string;
          title: string;
          notes: string | null;
          thumbnail_url: string | null;
          embed_html: string | null;
          duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: VideoSource;
          source_url: string;
          source_id: string;
          title: string;
          notes?: string | null;
          thumbnail_url?: string | null;
          embed_html?: string | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: VideoSource;
          source_url?: string;
          source_id?: string;
          title?: string;
          notes?: string | null;
          thumbnail_url?: string | null;
          embed_html?: string | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'folders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      video_folders: {
        Row: {
          video_id: string;
          folder_id: string;
          added_at: string;
        };
        Insert: {
          video_id: string;
          folder_id: string;
          added_at?: string;
        };
        Update: {
          video_id?: string;
          folder_id?: string;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'video_folders_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_folders_folder_id_fkey';
            columns: ['folder_id'];
            isOneToOne: false;
            referencedRelation: 'folders';
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
