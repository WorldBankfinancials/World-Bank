/**
 * Validation helper utilities
 */

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^\+?[\d\s\-\(\)]{7,20}$/.test(phone);
}

export function validateAmount(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

export function validatePin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
