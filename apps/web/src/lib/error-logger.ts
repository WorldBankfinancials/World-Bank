/**
 * Error logger utility
 */

export function logError(error: Error | string, context?: string) {
  const timestamp = new Date().toISOString();
  const message = typeof error === 'string' ? error : error.message;
  const stack = error instanceof Error ? error.stack : '';
  
  console.error(`[${timestamp}] [${context || 'App'}] ${message}`);
  if (stack) {
    console.error(stack);
  }
}

export function logApiError(url: string, error: any) {
  logError(error, `API: ${url}`);
}
