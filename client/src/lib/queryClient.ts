import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorMsg = text.substring(0, 200);
    throw new Error(`${res.status}: ${errorMsg}`);
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}

export async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const authHeaders = await getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...authHeaders, ...options?.headers, 'Accept-Encoding': 'gzip, deflate' },
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('refresh_token');
        const isAdminPage = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/simple-admin');
        window.location.href = isAdminPage ? '/admin-login' : '/login';
      }
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error('Request timeout after 10s');
    throw error;
  }
}

export async function apiRequest(method: string, url: string, data?: unknown | undefined): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      method,
      headers: { ...authHeaders, ...(data ? { "Content-Type": "application/json" } : {}), 'Accept-Encoding': 'gzip, deflate' },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error('Request timeout after 10s');
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const authHeaders = await getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        headers: { ...authHeaders, 'Accept-Encoding': 'gzip, deflate' },
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (unauthorizedBehavior === "returnNull" && res.status === 401) return null;
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new Error('Request timeout after 10s');
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
    mutations: { retry: 1, retryDelay: 1000 },
  },
});

export async function publicFetch(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error('Request timeout');
    throw error;
  }
}

export async function publicPost(url: string, data?: unknown): Promise<Response> {
  return publicFetch(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
}
