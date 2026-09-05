// Hand-written to match supabase/migrations/0001_init.sql.
// Once the Supabase project is live, prefer regenerating with:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = "admin" | "resident" | "viewer";
export type PantryStatus = "free" | "occupied";
export type TicketStatus = "open" | "resolved";
export type HostelRepSection = "office" | "council";

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          email: string;
          roll_number: string;
          role: Role;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          email: string;
          roll_number: string;
          role?: Role;
          full_name?: string | null;
        }
      >;
      residents: Table<
        {
          id: number;
          roll_number: string;
          added_by: string | null;
          created_at: string;
        },
        {
          roll_number: string;
          added_by?: string | null;
        }
      >;
      pantry_room: Table<
        {
          id: number;
          label: string;
          location: string | null;
          status: PantryStatus;
          occupied_by: string | null;
          occupied_by_roll_number: string | null;
          started_at: string | null;
          end_time: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          label: string;
          location?: string | null;
          status?: PantryStatus;
          occupied_by?: string | null;
          occupied_by_roll_number?: string | null;
          started_at?: string | null;
          end_time?: string | null;
        }
      >;
      hostel_reps: Table<
        {
          id: number;
          section: HostelRepSection;
          name: string;
          role_title: string | null;
          phone: string | null;
          email: string | null;
          photo_path: string | null;
          extra: Json | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        },
        {
          section: HostelRepSection;
          name: string;
          role_title?: string | null;
          phone?: string | null;
          email?: string | null;
          photo_path?: string | null;
          extra?: Json | null;
          sort_order?: number;
        }
      >;
      wifi_troubleshooting_blocks: Table<
        { id: number; title: string; sort_order: number; created_at: string },
        { title: string; sort_order?: number }
      >;
      wifi_troubleshooting_tips: Table<
        { id: number; block_id: number; tip: string; sort_order: number },
        { block_id: number; tip: string; sort_order?: number }
      >;
      wifi_tickets: Table<
        {
          id: number;
          raised_by: string;
          smail_id: string;
          room_number: string;
          contact_number: string | null;
          mac_address: string | null;
          issue_description: string;
          mail_sent: boolean;
          status: TicketStatus;
          created_at: string;
        },
        {
          raised_by: string;
          smail_id: string;
          room_number: string;
          contact_number?: string | null;
          mac_address?: string | null;
          issue_description: string;
          mail_sent: boolean;
          status?: TicketStatus;
        }
      >;
      first_aid_info: Table<
        {
          id: number;
          contents: string | null;
          guidelines: string | null;
          updated_by: string | null;
          updated_at: string;
        },
        {
          id?: number;
          contents?: string | null;
          guidelines?: string | null;
          updated_by?: string | null;
        }
      >;
      emergency_contacts: Table<
        {
          id: number;
          name: string;
          role_title: string | null;
          phone: string;
          extra: Json | null;
          sort_order: number;
        },
        {
          name: string;
          phone: string;
          role_title?: string | null;
          extra?: Json | null;
          sort_order?: number;
        }
      >;
      secretary_portfolios: Table<
        { id: number; name: string },
        { name: string }
      >;
      budget_items: Table<
        {
          id: number;
          portfolio_id: number;
          item: string;
          budget: number;
          spent: number;
          balance: number;
          bill_path: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          portfolio_id: number;
          item: string;
          budget?: number;
          spent?: number;
          bill_path?: string | null;
          created_by?: string | null;
        }
      >;
      hostel_settings: Table<
        {
          id: number;
          per_head_amount: number;
          total_resident_count_override: number | null;
        },
        {
          id?: number;
          per_head_amount?: number;
          total_resident_count_override?: number | null;
        }
      >;
      notices: Table<
        {
          id: number;
          title: string;
          description: string;
          event_date: string;
          poster_path: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          title: string;
          description: string;
          event_date: string;
          poster_path?: string | null;
          created_by?: string | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
