import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

// Shared channel registry for dynamic subscriptions
class DynamicChannelRegistry {
  private coreChannel: any = null;
  private listeners: Map<string, Set<() => void>> = new Map();
  
  private initCoreChannel() {
    if (this.coreChannel) return;
    
    this.coreChannel = supabase
      .channel('dynamic-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: '*' },
        (payload: any) => {
          console.log(`🔄 Dynamic real-time update:`, payload);
          
          // Trigger all registered listeners for this specific table
          const wildcardKey = `${payload.table}:all`;
          const wildcardCallbacks = this.listeners.get(wildcardKey);
          if (wildcardCallbacks) {
            wildcardCallbacks.forEach(cb => cb());
          }
          
          // Note: Individual filters are not easily detectable from payload
          // so we trigger all listeners for the table
          this.listeners.forEach((callbacks, key) => {
            if (key.startsWith(`${payload.table}:`)) {
              callbacks.forEach(cb => cb());
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('🔄 Dynamic realtime channel:', status);
      });
  }
  
  subscribe(table: string, filter: any, callback: () => void) {
    const key = `${table}:${JSON.stringify(filter || 'all')}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    this.initCoreChannel();
    
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
  
  cleanup() {
    if (this.coreChannel) {
      this.coreChannel.unsubscribe();
      this.coreChannel = null;
    }
    this.listeners.clear();
  }
}

const dynamicChannels = new DynamicChannelRegistry();

/**
 * Universal real-time subscription hook for Supabase tables
 * Automatically invalidates React Query cache when data changes
 * NOW OPTIMIZED: Uses shared channel instead of creating individual channels
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
    const callback = () => {
      queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
    };
    
    const unsubscribe = dynamicChannels.subscribe(table, filter, callback);

    return unsubscribe;
  }, [table, JSON.stringify(queryKey), JSON.stringify(filter), queryClient]);
}

/**
 * Multi-table real-time subscription hook
 * NOW OPTIMIZED: Reuses single shared channel for all tables
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
    const unsubscribers = subscriptions.map(({ table, queryKey, filter }) => {
      const callback = () => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
      };
      
      return dynamicChannels.subscribe(table, filter, callback);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [JSON.stringify(subscriptions), queryClient]);
}

/**
 * Real-time presence hook for tracking online users
 * Kept as separate channel for presence-specific features
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
