
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

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event, session?.user?.email);
  if (event === 'SIGNED_IN' && session) {
    console.log('✅ Successfully signed in:', session.user.email);
  }
  if (event === 'SIGNED_OUT') {
    console.log('✅ Successfully signed out');
  }
});

const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('📍 Project URL:', supabaseUrl);
    
    await supabase.auth.getSession();
    console.log('✅ Supabase connection restored successfully');
    console.log('🔐 Auth system ready for real authentication');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection issue:', error);
    return false;
  }
};

testConnection();
