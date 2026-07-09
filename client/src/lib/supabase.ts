/**
 * UNIFIED SUPABASE CLIENT - SINGLE SOURCE OF TRUTH
 * All Supabase operations use this single instance to prevent conflicts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://icbsxmrmorkdgxtumamu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTkxMDksImV4cCI6MjA3MDMzNTEwOX0.GDBjj7flp-6sLjfHh3mil31zPq_97Tvfw47Oz5KxKqk';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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
    throw error;
  }
}
