/**
 * GLOBAL ERROR SUPPRESSION
 * Filters out noise from browser console while preserving real errors
 */

export function setupErrorFiltering() {
  // List of error messages to suppress (they're not real user-facing errors)
  const suppressedPatterns = [
    'Network request failed',
    'Failed to fetch',
    'CORS',
    'WebSocket',
    'abort',
    'HTTP Error',
    'The request was aborted',
    'did not match the expected pattern',
    'AuthRetryableFetchError',
    'Vite',
    '@vite',
  ];

    const message = args[0]?.toString() || args.join(' ');
    
    // Check if this is a suppressed error
    const isSuppressed = suppressedPatterns.some(pattern => 
      message.includes(pattern)
    );

    // Check for empty object errors
    if (args[0] === '{}' || (typeof args[0] === 'object' && 
        Object.keys(args[0]).length === 0 && 
        args[0].__isAuthError === undefined)) {
      return; // Suppress empty error objects
    }

    // Only log if not suppressed
    if (!isSuppressed) {
      originalError.apply(console, args);
    }
  };
}
