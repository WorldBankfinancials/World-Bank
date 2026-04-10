/**
 * REAL-TIME TRANSACTIONS HOOK
 * Listens for live transaction updates using Supabase Realtime
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeTransactions(userId?: string, onTransactionUpdate?: (transaction: any) => void) {
  const handleTransactionUpdate = useCallback((transaction: any) => {
    if (onTransactionUpdate) {
      onTransactionUpdate(transaction);
    }
  }, [onTransactionUpdate]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to transactions channel
    const channel = supabase.channel(`transactions:${userId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `from_user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            handleTransactionUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, handleTransactionUpdate]);

  return null;
}
