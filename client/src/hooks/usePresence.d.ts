/**
 * Custom hook to broadcast user presence (online/offline) using Supabase Realtime
 * This allows admin dashboards to see which customers are currently online
 */
export declare function usePresence(userId: number | undefined, userName: string | undefined): void;
/**
 * Custom hook to subscribe to online users presence
 * Used by admin dashboards to see which customers are online
 */
export declare function useOnlineUsers(onUsersUpdate: (users: any[]) => void): void;
