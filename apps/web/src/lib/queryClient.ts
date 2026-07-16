import { QueryClient, type QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  await throwIfResNotOk(res);
  return res.json();
}

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  await throwIfResNotOk(res);
  return res;
};

type UnauthorizedBehavior = "redirect" | "returnNull";

export const getQueryFn: <T>(options?: { on401?: UnauthorizedBehavior }) => QueryFunction<T> =
  (options) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(queryKey[0] as string, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (options?.on401 === "redirect" && res.status === 401) {
      window.location.href = '/login';
      return null as T;
    }

    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
