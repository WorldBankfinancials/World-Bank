import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
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
supabaseClient.auth.onAuthStateChange((event, session) => {
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
        await supabaseClient.auth.getSession();
        console.log('✅ Supabase connection restored successfully');
        console.log('🔐 Auth system ready for real authentication');
        return true;
    }
    catch (error) {
        console.log('❌ Supabase connection issue:', error);
        return false;
    }
};
testConnection();
// Export the singleton client
export const supabase = supabaseClient;
// Also export as default for dynamic imports
export default supabaseClient;
