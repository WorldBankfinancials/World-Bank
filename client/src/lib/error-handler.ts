/**
 * UNIFIED ERROR HANDLER
 * Centralized error handling for all API calls and async operations
 */

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(data: string, fallback?: T): T | null {
  try {
    if (!data || typeof data !== 'string') {
      return fallback ?? null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    return fallback ?? null;
  }
}

/**
 * Safe API response handler
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  try {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }));
      throw new APIError(
        response.status,
        'API_ERROR',
        errorData?.error || `Request failed with status ${response.status}`,
        errorData
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    throw new APIError(500, 'PARSE_ERROR', error?.message || 'Failed to parse response');
  }
}

/**
 * Error logging with context
 */
export function logError(context: string, error: any, severity: 'low' | 'medium' | 'high' = 'medium') {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  
  const severityEmoji = {
    low: '⚠️',
    medium: '❌',
    high: '🔴'
  };


  // In production, send to error tracking service
  if (typeof window !== 'undefined' && (window as any).__ERROR_TRACKING__) {
    (window as any).__ERROR_TRACKING__({ context, error, severity, timestamp });
  }
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: any): string {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return 'Please check your input and try again.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

/**
 * Retry logic for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}
