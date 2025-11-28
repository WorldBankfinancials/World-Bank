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
export declare function useRealtimeSubscription(table: string, queryKey: string | string[], filter?: {
    column: string;
    value: any;
}, events?: ('INSERT' | 'UPDATE' | 'DELETE')[]): void;
/**
 * Multi-table real-time subscription hook
 * NOW OPTIMIZED: Reuses single shared channel for all tables
 */
export declare function useRealtimeSubscriptions(subscriptions: Array<{
    table: string;
    queryKey: string | string[];
    filter?: {
        column: string;
        value: any;
    };
}>): void;
/**
 * Real-time presence hook for tracking online users
 * Kept as separate channel for presence-specific features
 */
export declare function useRealtimePresence(userId: number | undefined): void;
