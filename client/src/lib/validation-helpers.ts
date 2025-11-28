/**
 * SAFE VALIDATION HELPERS - Prevent silent failures
 * Use these instead of raw operations to validate and parse safely
 */

export function safeParseFloat(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(String(value));
  return isNaN(num) ? 0 : num;
}

export function safeToLocaleString(value: unknown, options?: Intl.NumberFormatOptions): string {
  try {
    const num = safeParseFloat(value);
    return num.toLocaleString('en-US', options || { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch (e) {
    return '0.00';
  }
}

export function safeGetStorageItem(key: string, defaultValue?: any): any {
  try {
    const item = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
}

export function safeValidateToken(token: unknown): boolean {
  return typeof token === 'string' && token.length > 0;
}

export function safeToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}
