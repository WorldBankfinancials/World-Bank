/**
 * Validation helper utilities
 */

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^\+?[\d\s\-\(\)]{7,20}$/.test(phone) && digits.length >= 7 && digits.length <= 15;
}

export function validateAmount(amount: string | number, max = 1000000): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || !isFinite(num) || num <= 0) return false;
  if (num > max) return false;
  const decimals = String(num).split('.')[1];
  if (decimals && decimals.length > 2) return false;
  return true;
}

export function validatePin(pin: string): boolean {
  if (!/^\d{4,6}$/.test(pin)) return false;
  if (/^(\d)\1+$/.test(pin)) return false;
  const sequential = '0123456789';
  const reversed = '9876543210';
  if (sequential.includes(pin) || reversed.includes(pin)) return false;
  return true;
}

export function validatePassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}

export function sanitizeInput(input: string): string {
  if (input == null) return '';
  return input.trim().replace(/[<>"'`]/g, '');
}
