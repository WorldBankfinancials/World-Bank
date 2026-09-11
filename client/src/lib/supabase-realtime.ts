/**
 * Supabase Realtime client utilities
 * Re-uses the unified Supabase client to avoid creating a second client instance.
 */

import { supabase } from './supabase';

export function getRealtimeClient() {
  return supabase;
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
