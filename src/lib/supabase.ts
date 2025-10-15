
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://icbsxmrmorkdgxtumamu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTkxMDksImV4cCI6MjA3MDMzNTEwOX0.GDBjj7flp-6sLjfHh3mil31zPq_97Tvfw47Oz5KxKqk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event, session?.user?.email);
});

const testConnection = async () => {
  try {
    await supabase.auth.getSession();
    console.log('✅ Supabase connection established');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

testConnection();
