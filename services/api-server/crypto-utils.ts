import { randomBytes } from 'crypto';

/**
 * Cryptographically secure utilities for banking operations
 */

export function generateAccountNumber(): string {
  // Generate 8-digit account number using crypto
  const bytes = randomBytes(4);
  const randomNum = bytes.readUInt32BE(0) % 90000000;
  return String(10000000 + randomNum);
}

export function generateTransferPin(): string {
  // Generate 4-digit PIN using crypto
  const bytes = randomBytes(2);
  const randomNum = bytes.readUInt16BE(0) % 9000;
  return String(1000 + randomNum);
}

export function generateTransactionId(): string {
  // Cryptographically secure transaction ID
  const timestamp = Date.now();
  const randomStr = randomBytes(8).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${randomStr}`;
}

export function generateReferenceNumber(prefix: string = 'WB'): string {
  const timestamp = Date.now();
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
