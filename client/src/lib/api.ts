import { supabase } from './supabase';

/**
 * Authenticated fetch wrapper that automatically adds user email to requests
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  // Get current user from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) {
    throw new Error('User not authenticated');
  }

  // Add email parameter to URL if it's a GET request and doesn't already have it
  let finalUrl = url;
  if ((!options?.method || options.method === 'GET') && !url.includes('email=')) {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}email=${encodeURIComponent(user.email)}`;
  }

  // For POST/PUT/PATCH, add email to body if not present
  if (options?.method && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
    try {
      const body = options.body ? JSON.parse(options.body as string) : {};
      if (!body.email) {
        body.email = user.email;
        options.body = JSON.stringify(body);
      }
    } catch (e) {
      // If body is not JSON, skip
    }
  }

  return fetch(finalUrl, options);
}

/**
 * Get current user email from Supabase Auth
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email || null;
}
