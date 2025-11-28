/**
 * UNIFIED FETCH CLIENT - Frontend
 * Handles both authenticated and public API calls
 * Automatically includes auth headers when available
 */

import { getAccessToken } from './supabase';

/**
 * Unauthenticated fetch for public endpoints (registration, login, etc)
 * @example
 * const response = await publicFetch('/api/auth/check-email', {
 *   method: 'POST',
 *   body: JSON.stringify({ email: 'test@example.com' })
 * });
 */
export async function publicFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

/**
 * Authenticated fetch for protected endpoints
 * Automatically includes Bearer token from Supabase session
 * @example
 * const response = await authenticatedFetch('/api/user/profile');
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Not authenticated. Please login first.');
  }

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

/**
 * Helper to make authenticated POST requests
 */
export async function authPost(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Helper to make authenticated GET requests
 */
export async function authGet(url: string): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'GET',
  });
}

/**
 * Helper to make public POST requests
 */
export async function publicPost(url: string, data: any): Promise<Response> {
  return publicFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
