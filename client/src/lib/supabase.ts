import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

async function initializeSupabase() {
  if (supabaseClient) return supabaseClient;

  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // If env vars not available at build time, fetch from backend
  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        supabaseUrl = config.supabaseUrl;
        supabaseAnonKey = config.supabaseAnonKey;
      }
    } catch (error) {
      console.warn('Failed to fetch Supabase config from /api/config:', error);
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not available');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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

  return supabaseClient;
}

// Initialize on first import
initializeSupabase().catch(error => {
  console.error('Failed to initialize Supabase:', error);
});

// Export a proxy that waits for initialization
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    if (!supabaseClient) {
      throw new Error('Supabase not initialized');
    }
    return (supabaseClient as any)[prop];
  },
}) as any;

export const supabaseClient_ = supabase;

export { supabase as default };

// For direct access after initialization
export async function getSupabaseClient() {
  return initializeSupabase();
}