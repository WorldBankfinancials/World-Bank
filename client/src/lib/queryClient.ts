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
  // CRITICAL: Must use raw localStorage since storage-utils adds "wb_" prefix
  // Token is stored as "wb_jwt_token" by storage-utils
  const token = localStorage.getItem('wb_jwt_token') || localStorage.getItem('wb_token') || localStorage.getItem('jwt_token') || localStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ queryClient: No authentication token found');
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
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
      credentials: "include",
    });
    
    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('wb_jwt_token');
      localStorage.removeItem('wb_token');
      localStorage.removeItem('wb_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return response;
  } catch (error: any) {
    console.error('❌ authenticatedFetch failed:', error?.message);
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
