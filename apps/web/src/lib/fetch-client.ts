/**
 * Fetch client utility for making API requests.
 * Provides a thin wrapper around fetch with error handling.
 */

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function fetchClient<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers as Record<string, string>,
  };

  if (!skipAuth) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...fetchOptions, headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}
