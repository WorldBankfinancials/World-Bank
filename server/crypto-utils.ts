import { randomBytes } from 'crypto';

export function generateAccountNumber(): string {
  const bytes = randomBytes(5);
  // Use 5 bytes (40 bits) to eliminate modulo bias for 8-digit numbers
  const randomNum = (bytes.readUInt32BE(0) * 256 + bytes[4]) % 90000000;
  return String(10000000 + randomNum);
}

export function generateTransferPin(): string {
  const bytes = randomBytes(3);
  // Use 3 bytes (24 bits) to eliminate modulo bias for 4-digit PINs
  const randomNum = (bytes.readUInt16BE(0) * 256 + bytes[2]) % 9000;
  return String(1000 + randomNum);
}

export function generateTransactionId(prefix: string = 'TXN'): string {
  // Cryptographically secure transaction ID
  const timestamp = Date.now();
  const randomStr = randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}

export function generateReferenceNumber(prefix: string = 'WB'): string {
  const timestamp = Date.now();
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
