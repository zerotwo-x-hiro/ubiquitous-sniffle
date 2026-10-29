import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  "https://shnyegteinsibwaagnkv.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobnllZ3RlaW5zaWJ3YWFnbmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjQ5MzIsImV4cCI6MjEwODcwMDkzMn0.PB2QyDKSZDrNCC4cjrd5gqgzuWksmwqgnyRV56j5suo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "kdw_supabase_session",
  },
});

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WatchlistEntry = {
  id: string;
  user_id: string;
  drama_slug: string;
  status: "want-to-watch" | "watching" | "completed" | "dropped";
  added_at?: string;
  updated_at?: string;
};

export type UserRating = {
  id: string;
  user_id: string;
  drama_slug: string;
  score: number;
  review: string | null;
  created_at?: string;
  updated_at?: string;
};
