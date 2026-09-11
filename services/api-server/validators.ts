/**
 * Safe validation utilities for server-side input
 */

export function validateId(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('ID must be a string or number');
  }
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('Invalid ID format');
  }
  return parsed;
}

export function validateAmount(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Amount must be a string or number');
  }
  const parsed = parseFloat(String(value));
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('Amount must be a positive number');
  }
  if (parsed > 1000000) {
    throw new Error('Amount exceeds maximum transfer limit');
  }
  return parsed;
}

export function validateEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Email must be a string');
  }
  const trimmed = value.trim();
  if (!trimmed.includes('@') || trimmed.length < 5) {
    throw new Error('Invalid email format');
  }
  return trimmed;
}

export function validatePin(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('PIN must be a string');
  }
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    throw new Error('PIN must be 4 digits');
  }
  return trimmed;
}

export function validateString(value: unknown, minLength = 1, maxLength = 1000): string {
  if (typeof value !== 'string') {
    throw new Error('Value must be a string');
  }
  const trimmed = value.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new Error(`String length must be between ${minLength} and ${maxLength}`);
  }
  return trimmed;
}
