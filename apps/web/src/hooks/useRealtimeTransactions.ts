import { useEffect, useState, useRef } from 'react';
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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`transactions:${userId}`);

    const handlePayload = (payload: unknown) => {
      const p = payload as { eventType?: string; new?: Transaction; old?: { id?: string } };
      const event = p.eventType;
      if (event === 'INSERT') {
        const newTxn = p.new as Transaction;
        setTransactions(prev => prev.some(t => t.id === newTxn.id) ? prev : [newTxn, ...prev]);
        onTransactionUpdate?.(newTxn);
      } else if (event === 'UPDATE') {
        const newTxn = p.new as Transaction;
        setTransactions(prev => prev.map(t => t.id === newTxn.id ? newTxn : t));
        onTransactionUpdate?.(newTxn);
      } else if (event === 'DELETE') {
        setTransactions(prev => prev.filter(t => t.id !== p.old?.id));
      }
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `from_user_id=eq.${userId}` },
        handlePayload
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `to_user_id=eq.${userId}` },
        handlePayload
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
                  setTransactions(data);
                }
              }
            } catch (e) { console.error('Realtime transactions error:', e); }
          }, 10000);
        } else if (status === 'SUBSCRIBED') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      });
    return () => {
      channel.unsubscribe();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [userId, onTransactionUpdate]);

  return { transactions };
}
