/**
 * ERROR LOGGING UTILITY
 * Prevents empty error objects and provides proper error context
 */

export function logErrorWithContext(context: string, error: unknown) {
  try {
    if (error instanceof Error) {
      console.error(`❌ [${context}] ${error.name}: ${error.message}`);
      if (error.stack) console.error('Stack:', error.stack);
    } else if (typeof error === 'object' && error !== null) {
      console.error(`❌ [${context}]`, JSON.stringify(error));
    } else if (typeof error === 'string') {
      console.error(`❌ [${context}] ${error}`);
    } else {
      console.error(`❌ [${context}] Unknown error:`, error);
    }
  } catch (e) {
    console.error(`❌ [${context}] Failed to log error`, e);
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
