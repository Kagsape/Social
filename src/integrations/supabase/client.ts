import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://twefkeisilxfvikfwmlm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZWZrZWlzaWx4ZnZpa2Z3bWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzk1NzUsImV4cCI6MjA4OTk1NTU3NX0.ogWCRyV1pwq2uWKasQOVCWFyKbz5gqgc-tNZu18SNbA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);