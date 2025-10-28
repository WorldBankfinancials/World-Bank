import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { queryClient } from '@/lib/queryClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Custom hook to subscribe to real-time transaction updates
 * Automatically invalidates queries when transactions are created, updated, or deleted
 */
export function useRealtimeTransactions(enabled: boolean = true) {
  useEffect(() => {
    if (!supabase || !enabled) {
      return;
    }

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction change detected:', payload);
          
          // Invalidate all transaction-related queries
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
          
          // Show notification for new pending transactions
          if (payload.eventType === 'INSERT' && payload.new) {
            const transaction = payload.new as any;
            if (transaction.status === 'pending') {
              console.log('🔔 New pending transfer requires approval:', transaction);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [enabled]);
}

/**
 * Custom hook to subscribe to real-time support ticket updates
 */
export function useRealtimeSupportTickets(enabled: boolean = true) {
  useEffect(() => {
    if (!supabase || !enabled) {
      return;
    }

    const channel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          console.log('Support ticket change detected:', payload);
          
          // Invalidate support ticket queries
          queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [enabled]);
}

/**
 * Custom hook to subscribe to real-time alert updates
 */
export function useRealtimeAlerts(userId: number | undefined, enabled: boolean = true) {
  useEffect(() => {
    if (!supabase || !enabled || !userId) {
      return;
    }

    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Alert change detected for user:', payload);
          
          // Invalidate alert queries
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
          queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, enabled]);
}
