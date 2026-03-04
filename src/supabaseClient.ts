import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://cqpqyhehoiybggjuljzn.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcHF5aGVob2l5YmdnanVsanpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTQyODQsImV4cCI6MjA4MDA5MDI4NH0.H9PR8iNGM42wvJDfA7ntcz-aj5GWD1L7cl0VlGvFsBs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
