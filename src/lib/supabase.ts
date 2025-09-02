import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgxmfpirkjlomzfaqqzr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG1mcGlya2psb216ZmFxcXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzM0MzIsImV4cCI6MjA2NDU0OTQzMn0.y7YhuW22z-p2JiGLHGEGJligvqnnJS8JfF856O-z8IY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)