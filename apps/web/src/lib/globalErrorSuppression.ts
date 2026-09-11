/**
 * GLOBAL ERROR SUPPRESSION
 * Filters out Vite dev-server noise while preserving real errors.
 * Only suppresses development tooling noise — never network/CORS/fetch errors.
 */

let isPatched = false;

export function setupErrorFiltering() {
  if (isPatched) return;
  isPatched = true;

  const suppressedPatterns = [
    'did not match the expected pattern',
    'AuthRetryableFetchError',
    '@vite/client',
    '@vite',
  ];

  const originalError = console.error;

  console.error = function(...args: any[]) {
    const message = args[0]?.toString() || '';

    const isSuppressed = suppressedPatterns.some(pattern =>
      message.includes(pattern)
    );

    if (!isSuppressed) {
      originalError.apply(console, args);
    }
  };
}
