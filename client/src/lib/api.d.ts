/**
 * Authenticated fetch wrapper that automatically adds user email to requests
 */
export declare function apiFetch(url: string, options?: RequestInit): Promise<Response>;
/**
 * Get current user email from Supabase Auth
 */
export declare function getCurrentUserEmail(): Promise<string | null>;
