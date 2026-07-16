/**
 * Error filtering for known non-critical browser quirks.
 * Network errors are NOT suppressed — they may indicate real API failures.
 */

const SUPPRESSED_ERROR_PATTERNS = [
  'ResizeObserver loop',
  'Non-Error promise rejection captured',
];

const CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Loading CSS chunk',
];

export function shouldSuppressError(message: string): boolean {
  const lower = message.toLowerCase();
  if (SUPPRESSED_ERROR_PATTERNS.some(p => lower.includes(p.toLowerCase()))) return true;
  if (CHUNK_ERROR_PATTERNS.some(p => lower.includes(p.toLowerCase()))) {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
    return true;
  }
  return false;
}

export function setupGlobalErrorSuppression() {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args.map(arg => (arg instanceof Error ? arg.message : String(arg))).join(' ');
    if (shouldSuppressError(message)) return;
    originalConsoleError(...args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
    if (shouldSuppressError(message)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (shouldSuppressError(message)) {
      event.preventDefault();
    }
  });
}
