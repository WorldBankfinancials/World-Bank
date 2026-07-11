/**
 * Public fetch utilities (no auth required)
 * Used for registration, login, and other public endpoints
 */

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
  return publicFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}
