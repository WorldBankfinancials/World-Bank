/**
 * REAL-TIME ALERTS HOOK
 * Listens for live alerts and notifications using Supabase Realtime
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { authenticatedFetch } from '@/lib/queryClient';

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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          const event = (payload as { eventType?: string }).eventType;
          if (event === 'DELETE') {
            setAlerts(prev => prev.filter(a => a.id !== (payload as { old?: { id?: string } }).old?.id));
            return;
          }
          if (event === 'INSERT') {
            setAlerts(prev => {
              if (prev.some(a => a.id === (payload.new as Alert).id)) return prev;
              return [payload.new as Alert, ...prev];
            });
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = setInterval(async () => {
            try {
              const res = await authenticatedFetch('/api/alerts');
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                  setAlerts(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const newAlerts = data.filter((alert: Alert) => !existingIds.has(alert.id));
                    return [...prev, ...newAlerts];
                  });
                }
              }
            } catch (e) { console.error('Realtime alerts error:', e); }
          }, 10000);
        }
      });

    return () => {
      channel.unsubscribe();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [userId, enabled]);

  const unsubscribe = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, unsubscribe };
}
