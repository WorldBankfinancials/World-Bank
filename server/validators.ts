/**
 * server/validators.ts
 * Input validators. IDs are UUID strings — do NOT parseInt.
 */

/** Validate and return a UUID string ID. */
export function validateId(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Invalid ID: must be a non-empty string');
  }
  const id = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Invalid ID: must be a valid UUID');
  }
  return id;
}

export function validateAmount(value: unknown): number {
  const n = parseFloat(String(value));
  if (isNaN(n) || n <= 0) throw new Error('Invalid amount: must be a positive number');
  if (n > 1_000_000) throw new Error('Amount exceeds maximum allowed value');
  return n;
}

export function validateEmail(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid email');
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email format');
  return email;
}

export function validatePin(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid PIN');
  if (!/^\d{4,6}$/.test(value)) throw new Error('PIN must be 4-6 digits');
  return value;
}

export function validateString(value: unknown, min = 1, max = 500): string {
  if (typeof value !== 'string') throw new Error('Invalid string value');
  const s = value.trim();
  if (s.length < min) throw new Error(`Must be at least ${min} characters`);
  if (s.length > max) throw new Error(`Must be at most ${max} characters`);
  return s;
}
