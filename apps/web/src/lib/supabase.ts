/**
 * UNIFIED SUPABASE CLIENT - SINGLE SOURCE OF TRUTH
 * All Supabase operations use this single instance to prevent conflicts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Authentication will not work.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Get current authenticated user from Supabase session
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  } catch (error) {
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
      return null;
    }
    return session;
  } catch (error) {
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
    return null;
  }
}

/**
 * Subscribe to real-time updates
 */
export function subscribeToRealtimeUpdates(
  table: string,
  callback: (payload: Record<string, unknown>) => void
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
    return null;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

/**
 * Sign out
 */
export async function signOut() {
  return await supabase.auth.signOut();
}
