import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Get Supabase credentials from secure environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      friend_circles: {
        Row: {
          id: string;
          name: string;
          code: string;
          description?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          max_members?: number;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          max_members?: number;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string;
          created_by?: string;
          updated_at?: string;
          is_active?: boolean;
          max_members?: number;
        };
      };
      circle_members: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          circle_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          circle_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
          is_active?: boolean;
        };
      };
      social_sidequests: {
        Row: {
          id: string;
          title: string;
          description?: string;
          category: string;
          difficulty: 'easy' | 'medium' | 'hard';
          status: 'not_started' | 'in_progress' | 'completed';
          created_by: string;
          circle_id?: string;
          visibility: 'private' | 'circle' | 'public';
          due_date?: string;
          created_at: string;
          updated_at: string;
          completed_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          category: string;
          difficulty: 'easy' | 'medium' | 'hard';
          status?: 'not_started' | 'in_progress' | 'completed';
          created_by: string;
          circle_id?: string;
          visibility?: 'private' | 'circle' | 'public';
          due_date?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          status?: 'not_started' | 'in_progress' | 'completed';
          created_by?: string;
          circle_id?: string;
          visibility?: 'private' | 'circle' | 'public';
          due_date?: string;
          updated_at?: string;
          completed_at?: string;
        };
      };
      sidequest_activities: {
        Row: {
          id: string;
          sidequest_id: string;
          user_id: string;
          activity_type: 'created' | 'started' | 'updated' | 'completed' | 'commented';
          description?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sidequest_id: string;
          user_id: string;
          activity_type: 'created' | 'started' | 'updated' | 'completed' | 'commented';
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sidequest_id?: string;
          user_id?: string;
          activity_type?: 'created' | 'started' | 'updated' | 'completed' | 'commented';
          description?: string;
          created_at?: string;
        };
      };
    };
  };
} 