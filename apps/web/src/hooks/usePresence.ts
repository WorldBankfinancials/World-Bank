/**
 * PRESENCE & ONLINE USERS HOOK
 * Track who's online in real-time
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PresenceUser {
  user_id?: string;
  online_at?: string;
  [key: string]: unknown;
}

export function usePresence() {
  const [isPresent, setIsPresent] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        setIsPresent(Object.keys(presenceState).length > 0);
      })
      .on('presence', { event: 'join' }, () => {
        setIsPresent(true);
      })
      .on('presence', { event: 'leave' }, () => {
        const presenceState = channel.presenceState();
        setIsPresent(Object.keys(presenceState).length > 0);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
          setIsPresent(true);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { isPresent };
}

export function useOnlineUsers(callback?: (users: PresenceUser[]) => void, enabled?: boolean) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    try {
      const channel = supabase.channel('online-users');

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const users = Object.values(presenceState).flat() as PresenceUser[];
          setOnlineUsers(users);
          callback?.(users);
        })
        .on('presence', { event: 'join' }, () => {
          const users = Object.values(channel.presenceState()).flat() as PresenceUser[];
          setOnlineUsers(users);
          callback?.(users);
        })
        .on('presence', { event: 'leave' }, () => {
          const users = Object.values(channel.presenceState()).flat() as PresenceUser[];
          setOnlineUsers(users);
          callback?.(users);
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
      // Silently handle subscription errors
    }

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [callback, enabled]);

  return { onlineUsers };
}

/**
 * ADMIN REALTIME SUBSCRIPTION
 * Listen for admin changes that need to broadcast to all users
 */
interface AdminUpdate {
  id?: string;
  action?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function useAdminUpdates(onUpdate?: (action: AdminUpdate) => void, enabled?: boolean) {
  const [lastUpdate, setLastUpdate] = useState<AdminUpdate | null>(null);

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
          const update = payload.new as AdminUpdate;
          setLastUpdate(update);
          onUpdate?.(update);
          window.dispatchEvent(new CustomEvent('admin-update', { detail: update }));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [onUpdate, enabled]);

  return { lastUpdate };
}
