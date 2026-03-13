import { User as SupabaseUser } from "@supabase/supabase-js";

export interface User extends SupabaseUser {
  username?: string; 
  user_role: 'user' | 'moderator' | 'admin';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  tabular_data?: any[];
}

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

