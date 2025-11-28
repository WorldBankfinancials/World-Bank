import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔐 Supabase Init - URL:', supabaseUrl ? '✅' : '❌', supabaseUrl?.substring(0, 30) + '...');
console.log('🔐 Supabase Init - Key:', supabaseAnonKey ? '✅' : '❌', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Supabase credentials missing!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
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

console.log('✅ Supabase client initialized');

export const supabaseClient = supabase;

export default supabase;