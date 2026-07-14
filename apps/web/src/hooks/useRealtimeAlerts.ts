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
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const interval = setInterval(async () => {
            try {
              const { authenticatedFetch } = await import('@/lib/queryClient');
              const res = await authenticatedFetch('/api/alerts');
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                  setAlerts(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const newAlerts = data.filter((alert: any) => !existingIds.has(alert.id));
                    return [...prev, ...newAlerts];
                  });
                }
              }
            } catch {}
          }, 10000);
          return () => clearInterval(interval);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId, enabled, handleAlertReceived]);

  const unsubscribe = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, unsubscribe };
}
