// Tipos do banco gerados pelo Supabase CLI.
// Placeholder até o schema existir (Milestone 2 — workspaces/leads/deals + RLS).
// Regerar depois com:
//   supabase gen types typescript --linked > src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
