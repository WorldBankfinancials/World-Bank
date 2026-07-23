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
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('getCurrentUser error:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.error('getCurrentUser exception:', error);
    return null;
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('getSession error:', error.message);
      return null;
    }
    return session;
  } catch (error) {
    console.error('getSession exception:', error);
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('getAccessToken error:', error);
    return null;
  }
}

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
    console.error('subscribeToRealtimeUpdates error:', error);
    return null;
  }
}

export async function signInWithPassword(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string) {
  return await supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}
