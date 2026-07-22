/**
 * PRESENCE & ONLINE USERS HOOK
 * Track who's online in real-time
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useOnlineUsers(callback?: (users: Array<Record<string, unknown>>) => void, enabled?: boolean) {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || !user?.id) return;

    try {
      const channel = supabase.channel('online-users');

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const onlineUsers = Object.values(presenceState).flat();
          callbackRef.current?.(onlineUsers as Array<Record<string, unknown>>);
        })
        .on('presence', { event: 'join' }, () => {
          callbackRef.current?.(Object.values(channel.presenceState()).flat() as Array<Record<string, unknown>>);
        })
        .on('presence', { event: 'leave' }, () => {
          callbackRef.current?.(Object.values(channel.presenceState()).flat() as Array<Record<string, unknown>>);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              email: user.email,
              online_at: new Date().toISOString()
            });
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Presence subscription error:', error);
    }

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [enabled, user?.id]);

  return null;
}

/**
 * ADMIN REALTIME SUBSCRIPTION
 * Listen for admin changes - admin only
 */
export function useAdminUpdates(onUpdate?: (action: Record<string, unknown>) => void, enabled?: boolean) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user || user.role !== 'admin') return;

    const channel = supabase.channel('admin-actions');

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_actions'
        },
        (payload) => {
          onUpdate?.(payload.new as Record<string, unknown>);
          window.dispatchEvent(new CustomEvent('admin-update', { detail: payload.new }));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [onUpdate, enabled, user?.role]);

  return null;
}
