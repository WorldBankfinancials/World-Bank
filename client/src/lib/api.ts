/**
 * Authenticated fetch wrapper with proper error handling
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      throw new Error('User not authenticated');
    }

    let userData;
    try {
      userData = JSON.parse(user);
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Invalid user data');
    }

    if (!userData?.id) {
      throw new Error('Invalid user format');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok && response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Session expired');
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;
    const userData = JSON.parse(user);
    if (!userData?.email) return null;
    return userData.email;
  } catch (error) {
    return null;
  }
}

export async function apiCall<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const response = await apiFetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { error: errorData?.error || `API error: ${response.status}` };
    }
    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error?.message || 'Network error' };
  }
}
