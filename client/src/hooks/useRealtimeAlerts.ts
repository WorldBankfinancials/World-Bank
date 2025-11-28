/**
 * REAL-TIME ALERTS HOOK
 * Listens for live alerts and notifications using Supabase Realtime
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeAlerts(userId?: number | undefined, enabled?: boolean) {
  const handleAlertReceived = useCallback((alert: any) => {
    console.log('🔔 Real-time alert received:', alert);
  }, []);

  useEffect(() => {
    if (!userId || !enabled) return;

    // Subscribe to alerts channel
    const channel = supabase.channel(`alerts:${userId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          handleAlertReceived(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, enabled, handleAlertReceived]);

  return null;
}
