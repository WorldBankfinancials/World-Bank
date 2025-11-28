import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

async function initializeSupabase() {
  if (supabaseClient) return supabaseClient;

  try {
    // Try to fetch config from backend endpoint first (runtime injection)
    const configResponse = await fetch('/api/config');
    if (configResponse.ok) {
      const config = await configResponse.json();
      const { supabaseUrl, supabaseAnonKey } = config;
      
      if (supabaseUrl && supabaseAnonKey) {
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
    }
  } catch (error) {
    console.warn('Failed to fetch Supabase config from endpoint:', error);
  }

  // Fallback to build-time environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
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

// Initialize synchronously for imports but fetch config async
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!supabaseClient) {
      initializeSupabase();
    }
    return (supabaseClient as any)?.[prop];
  }
}) as any;

export const supabaseClient_ = supabase;

export async function getSupabaseClient() {
  return initializeSupabase();
}

// Also export as default for dynamic imports
export default supabase;