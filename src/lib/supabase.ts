import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://icbsxmrmorkdgxtumamu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTkxMDksImV4cCI6MjA3MDMzNTEwOX0.GDBjj7flp-6sLjfHh3mil31zPq_97Tvfw47Oz5KxKqk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)