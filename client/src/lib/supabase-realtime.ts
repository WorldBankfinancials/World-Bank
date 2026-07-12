/**
 * Supabase Realtime client utilities
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let realtimeClient: ReturnType<typeof createClient> | null = null;

export function getRealtimeClient() {
  if (!realtimeClient) {
    realtimeClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return realtimeClient;
}

export function subscribeToAlerts(userId: string, callback: (payload: any) => void) {
  const client = getRealtimeClient();
  return client
    .channel(`alerts:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts', filter: `user_id=eq.${userId}` }, callback)
    .subscribe();
}

export function subscribeToTransactions(userId: string, callback: (payload: any) => void) {
  const client = getRealtimeClient();
  return client
    .channel(`transactions:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `from_user_id=eq.${userId}` }, callback)
    .subscribe();
}

export function subscribeToMessages(userId: string, callback: (payload: any) => void) {
  const client = getRealtimeClient();
  return client
    .channel(`messages:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, callback)
    .subscribe();
}
