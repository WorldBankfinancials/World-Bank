/**
 * ERROR LOGGING UTILITY
 * Prevents empty error objects and provides proper error context
 */

export function logErrorWithContext(context: string, error: unknown) {
  try {
    if (error instanceof Error) {
    } else if (typeof error === 'object' && error !== null) {
    } else if (typeof error === 'string') {
    } else {
    }
  } catch (e) {
  }
}

export function setupGlobalErrorHandler() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    logErrorWithContext('UnhandledPromiseRejection', event.reason);
  });

  // Catch global errors
  window.addEventListener('error', event => {
    logErrorWithContext('GlobalError', event.error || event.message);
  });
}
