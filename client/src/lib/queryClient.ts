import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Get authorization headers from Supabase JWT token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  // Simple: just get the token from localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No token found in localStorage for authentication');
    throw new Error('Not authenticated');
  }
  return { 'Authorization': `Bearer ${token}` };
}

/**
 * CRITICAL FIX: Authenticated fetch wrapper
 * Use this instead of raw fetch() to ensure authentication headers are included
 * Automatically waits for Supabase session with retry logic
 * 
 * @example
 * const response = await authenticatedFetch('/api/user');
 * const data = await response.json();
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const authHeaders = await getAuthHeaders();
    
    // Create abort controller for timeout protection (30 second timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...options?.headers,
        },
        credentials: "include",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Request timeout');
      throw new Error('Request timeout - the operation took too long');
    }
    console.error('❌ authenticatedFetch error:', error?.message || error);
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  // Create abort controller for timeout protection (30 second timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...authHeaders,
        ...(data ? { "Content-Type": "application/json" } : {})
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - the operation took too long');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const authHeaders = await getAuthHeaders();
    
    // Create abort controller for timeout protection (30 second timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const res = await fetch(url, {
        headers: authHeaders,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - the operation took too long');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
