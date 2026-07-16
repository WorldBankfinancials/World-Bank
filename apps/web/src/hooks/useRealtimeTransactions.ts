/**
 * REAL-TIME TRANSACTIONS HOOK
 * Listens for live transaction updates using Supabase Realtime
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { authenticatedFetch } from '@/lib/queryClient';

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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          const event = (payload as { eventType?: string }).eventType;
          if (event === 'INSERT') {
            setTransactions(prev => {
              if (prev.some(t => t.id === (payload.new as Transaction).id)) return prev;
              return [payload.new as Transaction, ...prev];
            });
          } else if (event === 'UPDATE') {
            setTransactions(prev => prev.map(t => t.id === (payload.new as Transaction).id ? payload.new as Transaction : t));
          } else if (event === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== (payload as { old?: { id?: string } }).old?.id));
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = setInterval(async () => {
            try {
              const res = await authenticatedFetch('/api/transactions');
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                  setTransactions(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newTxs = data.filter((tx: Transaction) => !existingIds.has(tx.id));
                    return [...prev, ...newTxs];
                  });
                }
              }
            } catch (e) { console.error('Realtime transactions error:', e); }
          }, 10000);
        }
      });

    return () => {
      channel.unsubscribe();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [userId, handleTransactionUpdate]);

  return { transactions };
}
