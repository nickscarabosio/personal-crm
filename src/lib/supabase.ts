import { createClient } from '@supabase/supabase-js';

// Public client credentials — anon key is safe to expose (RLS protects data)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://smljaakhppjiyaodbvwr.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbGphYWtocHBqaXlhb2RidndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjY4MDYsImV4cCI6MjA4ODUwMjgwNn0.i6Ja6Bt7GWffwlIuWOSoUAdpzFgRYEhGfzpzLoZIuVs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
