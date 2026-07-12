export const packageName = 'metrics';
export function trackMetric(name: string, value: number, tags?: Record<string, string>): void {
  if (typeof window !== 'undefined') {
    console.info(`[metric] ${name}: ${value}`, tags);
  }
}
