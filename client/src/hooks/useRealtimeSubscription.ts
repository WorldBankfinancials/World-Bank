import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Universal real-time subscription hook for Supabase tables
 * Automatically invalidates React Query cache when data changes
 * 
 * @param table - Supabase table name
 * @param queryKey - React Query key to invalidate on changes
 * @param filter - Optional filter for specific rows (e.g., { column: 'user_id', value: userId })
 * @param events - Events to listen for (default: all CRUD operations)
 */
export function useRealtimeSubscription(
  table: string,
  queryKey: string | string[],
  filter?: { column: string; value: any },
  events: ('INSERT' | 'UPDATE' | 'DELETE')[] = ['INSERT', 'UPDATE', 'DELETE']
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Create a unique channel name
    const channelName = `realtime:${table}:${JSON.stringify(filter || 'all')}`;
    
    // Build the channel
    let channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        (payload) => {
          console.log(`🔄 Real-time update on ${table}:`, payload);
          
          // Invalidate the query to trigger refetch
          queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Real-time subscription ${channelName}:`, status);
      });

    // Cleanup on unmount
    return () => {
      console.log(`🔌 Unsubscribing from ${channelName}`);
      channel.unsubscribe();
    };
  }, [table, JSON.stringify(queryKey), JSON.stringify(filter), queryClient]);
}

/**
 * Multi-table real-time subscription hook
 * Useful for pages that need updates from multiple tables
 */
export function useRealtimeSubscriptions(
  subscriptions: Array<{
    table: string;
    queryKey: string | string[];
    filter?: { column: string; value: any };
  }>
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channels = subscriptions.map(({ table, queryKey, filter }) => {
      const channelName = `realtime:${table}:${JSON.stringify(filter || 'all')}`;
      
      return supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
          },
          (payload) => {
            console.log(`🔄 Real-time update on ${table}:`, payload);
            queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
          }
        )
        .subscribe((status) => {
          console.log(`📡 Real-time subscription ${channelName}:`, status);
        });
    });

    // Cleanup on unmount
    return () => {
      channels.forEach((channel, index) => {
        console.log(`🔌 Unsubscribing from channel ${index}`);
        channel.unsubscribe();
      });
    };
  }, [JSON.stringify(subscriptions), queryClient]);
}

/**
 * Real-time presence hook for tracking online users
 */
export function useRealtimePresence(userId: number | undefined) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('👥 Online users:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('✅ User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);
}
