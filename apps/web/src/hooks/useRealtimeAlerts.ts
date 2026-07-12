/**
 * REAL-TIME ALERTS HOOK
 * Listens for live alerts and notifications using Supabase Realtime
 */

import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Alert {
  id?: string;
  user_id?: string | number;
  message?: string;
  type?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function useRealtimeAlerts(userId?: string | number | undefined, enabled?: boolean) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const handleAlertReceived = useCallback((alert: Alert) => {
    setAlerts((prev) => [...prev, alert]);
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
          handleAlertReceived(payload.new as Alert);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, enabled, handleAlertReceived]);

  const unsubscribe = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, unsubscribe };
}
