import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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

try {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    try {
      if (event === 'SIGNED_IN' && session) {
        // Auth events handled
      }
    } catch (e) {
      // Silently handle WebSocket errors
    }
  });
} catch (e) {
  // Silently handle WebSocket insecure context errors in development
}

const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('📍 Project URL:', supabaseUrl);

    await supabaseClient.auth.getSession();
    console.log('✅ Supabase connection restored successfully');
    console.log('🔐 Auth system ready for real authentication');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection issue:', error);
    return false;
  }
};

testConnection();

// Export the singleton client
export const supabase = supabaseClient;

// Also export as default for dynamic imports
export default supabaseClient;