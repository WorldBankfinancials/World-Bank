/**
 * Authenticated fetch wrapper
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    throw new Error('User not authenticated');
  }

  const userData = JSON.parse(user);
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options?.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get current user email
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const user = localStorage.getItem('user');
  if (!user) return null;
  return JSON.parse(user).email;
}
