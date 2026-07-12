/**
 * REAL-TIME TRANSACTIONS HOOK
 * Listens for live transaction updates using Supabase Realtime
 */

import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id?: string;
  from_user_id?: string;
  to_user_id?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function useRealtimeTransactions(userId?: string, onTransactionUpdate?: (transaction: Transaction) => void) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleTransactionUpdate = useCallback(
    (transaction: Transaction) => {
      setTransactions((prev) => [...prev, transaction]);
      if (onTransactionUpdate) {
        onTransactionUpdate(transaction);
      }
    },
    [onTransactionUpdate]
  );

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
            handleTransactionUpdate(payload.new as Transaction);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, handleTransactionUpdate]);

  return { transactions };
}
