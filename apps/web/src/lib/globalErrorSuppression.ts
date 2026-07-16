/**
 * Error filtering for known non-critical errors that don't require user notification.
 * This suppresses console noise from expected network failures and browser quirks.
 */

const SUPPRESSED_ERROR_PATTERNS = [
  'ResizeObserver loop',
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  'Non-Error promise rejection captured',
  'chunk',
  'ChunkLoadError',
];

export function shouldSuppressError(message: string): boolean {
  return SUPPRESSED_ERROR_PATTERNS.some(pattern =>
    message.toLowerCase().includes(pattern.toLowerCase())
  );
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
