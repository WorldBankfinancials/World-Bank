import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uynzevdqzqejhgwlrsxb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bnpldmRxenFlamhnd2xyc3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTg1NzMsImV4cCI6MjA3MDA5NDU3M30.8xbfkoCFj-Y6xj9sqw-Z5TdwpFV3r2oKdO_Cs2jGpWc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});