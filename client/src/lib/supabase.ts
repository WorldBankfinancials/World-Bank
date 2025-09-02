import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://icbsxmrmorkdgxtumamu.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTkxMDksImV4cCI6MjA3MDMzNTEwOX0.GDBjj7flp-6sLjfHh3mil31zPq_97Tvfw47Oz5KxKqk';

console.log('🔧 Environment Check:');
console.log('VITE_SUPABASE_URL available:', !!import.meta.env?.VITE_SUPABASE_URL);
console.log('Using URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

console.log('🔧 Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key prefix:', supabaseAnonKey.substring(0, 20) + '...');

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
    await supabase.auth.getSession();
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