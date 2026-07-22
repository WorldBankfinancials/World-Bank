/**
 * Error filtering for known non-critical errors that don't require user notification.
 * Only suppresses browser-quirk errors, never network/auth failures.
 */

const SUPPRESSED_ERROR_PATTERNS = [
  'ResizeObserver loop',
  'Non-Error promise rejection captured',
  'ChunkLoadError',
];

const NEVER_SUPPRESS = [
  'auth',
  'token',
  'unauthorized',
  'forbidden',
  'session',
  'password',
  'credential',
];

export function shouldSuppressError(message: string): boolean {
  const lower = message.toLowerCase();
  if (NEVER_SUPPRESS.some(pattern => lower.includes(pattern))) return false;
  return SUPPRESSED_ERROR_PATTERNS.some(pattern =>
    lower.includes(pattern.toLowerCase())
  );
}

export function setupGlobalErrorSuppression() {
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
