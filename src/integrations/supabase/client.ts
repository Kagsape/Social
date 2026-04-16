import { createClient } from '@supabase/supabase-js';

// Esta é a ÚNICA instância do Supabase em todo o projeto.
// Nunca chame createClient em outros arquivos ou componentes.

const SUPABASE_URL = "https://twefkeisilxfvikfwmlm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZWZrZWlzaWx4ZnZpa2Z3bWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk1NzUsImV4cCI6MjA4OTk1NTU3NX0.ogWCRyV1pwq2uWKasQOVCWFyKbz5gqgc-tNZu18SNbA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ciep165-auth-token',
  }
});