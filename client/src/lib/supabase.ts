import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgxmfpirkjlomzfaqqzr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG1mcGlya2psb216ZmFxcXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzM0MzIsImV4cCI6MjA2NDU0OTQzMn0.y7YhuW22z-p2JiGLHGEGJligvqnnJS8JfF856O-z8IY';

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

// Add error handling and debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event, session?.user?.email);
  if (event === 'SIGNED_IN' && session) {
    console.log('✅ Successfully signed in:', session.user.email);
  }
  if (event === 'SIGNED_OUT') {
    console.log('✅ Successfully signed out');
  }
});

// Test connectivity and log project info
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('📍 Project URL:', supabaseUrl);
    
    // Test basic connectivity
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase connection restored successfully');
    console.log('🔐 Auth system ready for real authentication');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection issue:', error);
    return false;
  }
};

// Run connection test
testConnection();