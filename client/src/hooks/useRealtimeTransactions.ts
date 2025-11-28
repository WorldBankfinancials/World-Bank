/**
 * REAL-TIME TRANSACTIONS & ALERTS HOOK
 * Listens for live transaction updates, admin approvals, and alerts
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Export useRealtimeAlerts for backward compatibility
export { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';

export function useRealtimeTransactions(userId?: string, enabled?: boolean) {
  const handleTransactionUpdate = useCallback((transaction: any) => {
    console.log('🔄 Transaction updated:', transaction);
    // Dispatch to global state or trigger refetch
    window.dispatchEvent(new CustomEvent('transaction-updated', { detail: transaction }));
  }, []);

  useEffect(() => {
    if (!userId || !enabled) return;

    const channel = supabase.channel(`transactions:${userId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          handleTransactionUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, enabled, handleTransactionUpdate]);

  return null;
}

/**
 * SUPPORT TICKETS REAL-TIME
 */
export function useRealtimeSupportTickets(userId?: string, enabled?: boolean) {
  const handleTicketUpdate = useCallback((ticket: any) => {
    console.log('🎫 Support ticket updated:', ticket);
    window.dispatchEvent(new CustomEvent('ticket-updated', { detail: ticket }));
  }, []);

  useEffect(() => {
    if (!userId || !enabled) return;

    const channel = supabase.channel(`tickets:${userId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          handleTicketUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, enabled, handleTicketUpdate]);

  return null;
}
