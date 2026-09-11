export const packageName = 'feature-flags';
const flags: Record<string, boolean> = {};
export function setFlag(name: string, value: boolean): void { flags[name] = value; }
export function isFeatureEnabled(name: string): boolean { return flags[name] ?? false; }
