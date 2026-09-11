export const packageName = 'monitoring';
export function trackError(error: Error, context?: Record<string, unknown>): void {
  console.error(`[error] ${error.message}`, { ...context, stack: error.stack });
}
export function trackPageView(page: string): void {
  if (typeof window !== 'undefined') {
    console.info(`[pageview] ${page}`);
  }
}
