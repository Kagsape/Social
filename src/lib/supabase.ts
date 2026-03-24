import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase URL and anon key
// Ensure you set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);