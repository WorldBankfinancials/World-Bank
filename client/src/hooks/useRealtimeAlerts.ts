/**
 * REAL-TIME ALERTS HOOK
 * Listens for live alerts and notifications using Supabase Realtime
 * Automatically refreshes the alerts UI when new alerts arrive
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export function useRealtimeAlerts(userId?: number | undefined, enabled?: boolean) {
  const handleAlertReceived = useCallback((alert: any) => {
    if (!alert) return;
    // Invalidate alerts cache so the UI refreshes immediately
    queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
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
          filter: `user_id=eq.${userId}`
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
