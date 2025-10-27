import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Helper to add email parameter to API URLs
 */
async function addEmailToUrl(url: string): Promise<string> {
  // Skip if not an API call or already has email parameter
  if (!url.startsWith('/api/') || url.includes('email=')) {
    return url;
  }
  
  // Get current user email from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    console.warn(`⚠️ No user email available for API call: ${url}`);
    return url;
  }
  
  // Add email parameter
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}email=${encodeURIComponent(user.email)}`;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add email to URL automatically
  const finalUrl = await addEmailToUrl(url);
  
  const res = await fetch(finalUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
    // Automatically add email parameter to API calls
    const url = await addEmailToUrl(queryKey[0] as string);
    
    const res = await fetch(url, {
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
