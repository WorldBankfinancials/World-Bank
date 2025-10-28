import { useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Custom hook to broadcast user presence (online/offline) using Supabase Realtime
 * This allows admin dashboards to see which customers are currently online
 */
export function usePresence(userId: number | undefined, userName: string | undefined) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase || !userId || !userName) {
      return;
    }

    // Create a presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId.toString(),
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Broadcast presence
          await channel.track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
      }
    };
  }, [userId, userName]);
}

/**
 * Custom hook to subscribe to online users presence
 * Used by admin dashboards to see which customers are online
 */
export function useOnlineUsers(onUsersUpdate: (users: any[]) => void) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUsers = Object.values(state).flat();
        onUsersUpdate(onlineUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('New users joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Users left:', leftPresences);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [onUsersUpdate]);
}
