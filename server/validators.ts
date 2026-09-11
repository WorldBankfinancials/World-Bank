/**
 * server/validators.ts
 * Low-level input validators.
 * IDs are UUID strings — do NOT parseInt them.
 */

/** Validate and return a UUID string ID. Throws on invalid input. */
export function validateId(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Invalid ID: must be a non-empty string');
  }
  return value.trim();
}

/** Validate a numeric amount. Returns the number. */
export function validateAmount(value: unknown): number {
  const n = parseFloat(String(value));
  if (isNaN(n) || n <= 0) throw new Error('Invalid amount: must be a positive number');
  if (n > 1_000_000) throw new Error('Amount exceeds maximum allowed value');
  return n;
}

/** Validate and normalize an email address. */
export function validateEmail(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid email');
  const email = value.trim().toLowerCase();
  if (!email.includes('@') || email.length < 5) throw new Error('Invalid email format');
  return email;
}

/** Validate a 4-6 digit PIN. */
export function validatePin(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid PIN');
  if (!/^\d{4,6}$/.test(value)) throw new Error('PIN must be 4-6 digits');
  return value;
}

/** Validate a string with min/max length. */
export function validateString(value: unknown, min = 1, max = 500): string {
  if (typeof value !== 'string') throw new Error('Invalid string value');
  const s = value.trim();
  if (s.length < min) throw new Error(`Must be at least ${min} characters`);
  if (s.length > max) throw new Error(`Must be at most ${max} characters`);
  return s;
}
