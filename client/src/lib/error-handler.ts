/**
 * Centralized error handler for API responses
 */

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

export function handleApiError(error: any): ApiError {
  if (error?.response) {
    return {
      message: error.response.data?.message || error.response.data?.error || 'API Error',
      status: error.response.status,
      details: error.response.data,
    };
  }
  if (error?.request) {
    return {
      message: 'No response from server',
      status: 503,
    };
  }
  return {
    message: error?.message || 'Unknown error',
    status: 500,
  };
}

export function isRetryable(error: ApiError): boolean {
  return [502, 503, 504, 429].includes(error.status);
}
