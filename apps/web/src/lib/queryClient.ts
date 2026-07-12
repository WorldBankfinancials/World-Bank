import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorMsg = text.substring(0, 200);
    throw new Error(`${res.status}: ${errorMsg}`);
  }
}

/**
 * Get authorization headers from Supabase JWT token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = localStorage.getItem('token');
  if (!token) {
    return {};
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...options?.headers,
          'Accept-Encoding': 'gzip, deflate',
        },
        credentials: "include",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && !url.includes('/api/auth/refresh')) {
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            if (refreshResponse.ok) {
              const newTokens = await refreshResponse.json();
              localStorage.setItem('token', newTokens.token);
              localStorage.setItem('refresh_token', newTokens.refreshToken || '');
              // Retry original request with new token
              const headers = new Headers(options?.headers);
              headers.set('Authorization', `Bearer ${newTokens.token}`);
              return fetch(url, { ...options, headers });
            }
          } catch {
            // Refresh failed, fall through to logout
          }
        }
        // Clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return response;
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 10s');
    }
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...authHeaders,
        ...(data ? { "Content-Type": "application/json" } : {}),
        'Accept-Encoding': 'gzip, deflate',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 10s');
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const res = await fetch(url, {
        headers: {
          ...authHeaders,
          'Accept-Encoding': 'gzip, deflate',
        },
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 10s');
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
      staleTime: 60000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
