/**
 * Global error suppression for non-critical errors
 * Prevents console spam from Vite HMR, WebSocket connection errors, etc.
 */

const SUPPRESSED_PATTERNS = [
  'did not match the expected pattern',
  'HTTP Error',
  '@vite/client',
  'WebSocket',
  'fetch',
  'abort',
  'AuthRetryableFetchError',
  'Failed to fetch',
  'Network request failed',
];

function shouldSuppress(error: any): boolean {
  const msg = error?.message || error?.toString() || '';
  const stack = error?.stack || '';
  return SUPPRESSED_PATTERNS.some(pattern => msg.includes(pattern) || stack.includes(pattern));
}

export function setupErrorFiltering() {
  window.addEventListener('unhandledrejection', (event) => {
    if (shouldSuppress(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (shouldSuppress(event.error)) {
      event.preventDefault();
    }
  });
}
