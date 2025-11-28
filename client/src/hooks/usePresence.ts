/**
 * PRESENCE & ONLINE USERS HOOK
 * Track who's online in real-time
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function usePresence() {
  return null;
}

export function useOnlineUsers(callback?: (users: any[]) => void, enabled?: boolean) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    try {
      const channel = supabase.channel('online-users');

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const onlineUsers = Object.values(presenceState).flat();
          console.log('👥 Online users:', onlineUsers);
          callback?.(onlineUsers as any[]);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('✅ User joined:', newPresences);
          callback?.(Object.values(channel.presenceState()).flat() as any[]);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('❌ User left:', leftPresences);
          callback?.(Object.values(channel.presenceState()).flat() as any[]);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: `user_${Date.now()}`,
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
  }, [callback, enabled]);

  return null;
}

/**
 * ADMIN REALTIME SUBSCRIPTION
 * Listen for admin changes that need to broadcast to all users
 */
export function useAdminUpdates(onUpdate?: (action: any) => void, enabled?: boolean) {
  useEffect(() => {
    if (!enabled) return;

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
          console.log('📋 Admin action detected:', payload);
          onUpdate?.(payload.new);
          window.dispatchEvent(new CustomEvent('admin-update', { detail: payload.new }));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [onUpdate, enabled]);

  return null;
}
