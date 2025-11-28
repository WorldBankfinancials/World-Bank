/**
 * UNIFIED SUPABASE CLIENT - SINGLE SOURCE OF TRUTH
 * All Supabase operations use this single instance to prevent conflicts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Get current authenticated user from Supabase session
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Get user error:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('❌ Get user exception:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Get session error:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('❌ Get session exception:', error);
    return null;
  }
}

/**
 * Get access token for authenticated API calls
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('❌ Get access token error:', error);
    return null;
  }
}

/**
 * Subscribe to real-time updates
 */
export function subscribeToRealtimeUpdates(
  table: string,
  callback: (payload: any) => void
) {
  try {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (callback) {
          callback(payload);
        }
      })
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('❌ Subscribe to realtime error:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  try {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  } catch (error) {
    console.error('❌ Sign in error:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(email: string, password: string) {
  try {
    return await supabase.auth.signUp({
      email,
      password,
    });
  } catch (error) {
    console.error('❌ Sign up error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error('❌ Sign out error:', error);
    throw error;
  }
}
