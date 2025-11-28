import { QueryClient, QueryFunction } from "@tanstack/react-query";
/**
 * Helper to get Authorization header with Supabase token
 * EXPORTED for use in components that need direct fetch() calls
 * CRITICAL FIX: Waits for session with retry logic instead of proceeding without auth
 */
export declare function getAuthHeaders(retries?: number, delayMs?: number): Promise<Record<string, string>>;
/**
 * CRITICAL FIX: Authenticated fetch wrapper
 * Use this instead of raw fetch() to ensure authentication headers are included
 * Automatically waits for Supabase session with retry logic
 *
 * @example
 * const response = await authenticatedFetch('/api/user');
 * const data = await response.json();
 */
export declare function authenticatedFetch(url: string, options?: RequestInit): Promise<Response>;
export declare function apiRequest(method: string, url: string, data?: unknown | undefined): Promise<Response>;
type UnauthorizedBehavior = "returnNull" | "throw";
export declare const getQueryFn: <T>(options: {
    on401: UnauthorizedBehavior;
}) => QueryFunction<T>;
export declare const queryClient: QueryClient;
export {};
