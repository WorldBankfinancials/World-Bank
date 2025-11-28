/**
 * Custom hook to subscribe to real-time transaction updates
 * Automatically invalidates queries when transactions are created, updated, or deleted
 */
export declare function useRealtimeTransactions(enabled?: boolean): void;
/**
 * Custom hook to subscribe to real-time support ticket updates
 */
export declare function useRealtimeSupportTickets(enabled?: boolean): void;
/**
 * Custom hook to subscribe to real-time alert updates
 */
export declare function useRealtimeAlerts(userId: number | undefined, enabled?: boolean): void;
