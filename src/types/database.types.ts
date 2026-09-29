export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'parent' | 'child' | 'admin';
export type BookStatus = 'reading' | 'completed' | 'dropped';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_id: string | null;
          parent_id: string | null;
          role: UserRole;
          display_name: string;
          avatar_url: string | null;
          pin_hash: string | null;
          xp: number;
          level: number;
          current_streak: number;
          last_read_date: string | null;
          timezone: string;
          mock_days_offset: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          parent_id?: string | null;
          role?: UserRole;
          display_name: string;
          avatar_url?: string | null;
          pin_hash?: string | null;
          xp?: number;
          level?: number;
          current_streak?: number;
          last_read_date?: string | null;
          timezone?: string;
          mock_days_offset?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          parent_id?: string | null;
          role?: UserRole;
          display_name?: string;
          avatar_url?: string | null;
          pin_hash?: string | null;
          xp?: number;
          level?: number;
          current_streak?: number;
          last_read_date?: string | null;
          timezone?: string;
          mock_days_offset?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne?: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      books: {
        Row: {
          id: string;
          child_id: string;
          title: string;
          author: string | null;
          cover_url: string;
          total_pages: number;
          current_page: number;
          status: BookStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          title: string;
          author?: string | null;
          cover_url?: string;
          total_pages: number;
          current_page?: number;
          status?: BookStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          title?: string;
          author?: string | null;
          cover_url?: string;
          total_pages?: number;
          current_page?: number;
          status?: BookStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'books_child_id_fkey';
            columns: ['child_id'];
            isOneToOne?: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      reading_sessions: {
        Row: {
          id: string;
          book_id: string;
          child_id: string;
          duration_minutes: number;
          start_page: number;
          end_page: number;
          xp_earned: number;
          session_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          child_id: string;
          duration_minutes: number;
          start_page: number;
          end_page: number;
          xp_earned?: number;
          session_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          child_id?: string;
          duration_minutes?: number;
          start_page?: number;
          end_page?: number;
          xp_earned?: number;
          session_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reading_sessions_book_id_fkey';
            columns: ['book_id'];
            isOneToOne?: false;
            referencedRelation: 'books';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reading_sessions_child_id_fkey';
            columns: ['child_id'];
            isOneToOne?: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      reading_stats_daily: {
        Row: {
          child_id: string | null;
          session_date: string | null;
          total_minutes: number | null;
          pages_read: number | null;
          total_xp: number | null;
          session_count: number | null;
        };
        Relationships: [];
      };
      reading_stats_weekly: {
        Row: {
          child_id: string | null;
          week_start: string | null;
          total_minutes: number | null;
          pages_read: number | null;
          total_xp: number | null;
          session_count: number | null;
        };
        Relationships: [];
      };
      reading_stats_monthly: {
        Row: {
          child_id: string | null;
          month_start: string | null;
          total_minutes: number | null;
          pages_read: number | null;
          total_xp: number | null;
          session_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_parent_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      is_own_child: {
        Args: {
          p_child_id: string;
        };
        Returns: boolean;
      };
      log_reading_session: {
        Args: {
          p_book_id: string;
          p_child_id: string;
          p_duration_minutes: number;
          p_end_page: number;
        };
        Returns: LogReadingSessionResult;
      };
    };
    Enums: {
      user_role: UserRole;
      book_status: BookStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type LogReadingSessionResult = {
  success: boolean;
  xp_earned: number;
  pages_read: number;
  level_up: boolean;
  new_level: number;
  current_streak: number;
  book_completed: boolean;
};

// Convenient Entity Aliases
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type BookRow = Database['public']['Tables']['books']['Row'];
export type BookInsert = Database['public']['Tables']['books']['Insert'];
export type BookUpdate = Database['public']['Tables']['books']['Update'];

export type ReadingSessionRow = Database['public']['Tables']['reading_sessions']['Row'];
export type ReadingSessionInsert = Database['public']['Tables']['reading_sessions']['Insert'];
export type ReadingSessionUpdate = Database['public']['Tables']['reading_sessions']['Update'];

export type DailyStatsRow = Database['public']['Views']['reading_stats_daily']['Row'];
export type WeeklyStatsRow = Database['public']['Views']['reading_stats_weekly']['Row'];
export type MonthlyStatsRow = Database['public']['Views']['reading_stats_monthly']['Row'];
