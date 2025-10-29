import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Helper to get Authorization header with Supabase token
 * EXPORTED for use in components that need direct fetch() calls
 * CRITICAL FIX: Waits for session with retry logic instead of proceeding without auth
 */
export async function getAuthHeaders(retries = 5, delayMs = 300): Promise<Record<string, string>> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    }
    
    // If no session and not last attempt, wait and retry
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 1.5, 2000); // Exponential backoff with cap
    }
  }
  
  // After all retries failed, throw error instead of returning empty headers
  throw new Error('Authentication required: No valid session available. Please log in.');
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
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
      credentials: "include",
    });
    
    return response;
  } catch (error) {
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(url, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
