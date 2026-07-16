/**
 * Error filtering for known non-critical errors that don't require user notification.
 * Instead of monkey-patching console.error, we provide a helper function
 * that can be called explicitly to check if an error should be suppressed.
 */
export function isNonCriticalError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('WebSocket') ||
    (message.includes('fetch') && message.includes('abort')) ||
    message.includes('AuthRetryableFetchError')
  );
}

export function setupErrorFiltering(): void {
  // No longer monkey-patches console.error
  // Callers should use isNonCriticalError() to decide whether to log/suppress
}
