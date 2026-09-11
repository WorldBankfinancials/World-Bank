/**
 * client/src/hooks/useRealtimeAlerts.ts
 * Real-time alerts subscription. userId is string UUID.
 */
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export function useRealtimeAlerts(userId?: string | undefined, enabled?: boolean) {
  const handleAlertReceived = useCallback((_alert: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
  }, []);

  useEffect(() => {
    if (!userId || !enabled) return;
    const channel = supabase.channel(`alerts:${userId}`);
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alerts',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        handleAlertReceived(payload.new);
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [userId, enabled, handleAlertReceived]);

  return null;
}
