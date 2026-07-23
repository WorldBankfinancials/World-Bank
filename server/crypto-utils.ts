import { randomBytes } from 'crypto';

export function generateAccountNumber(): string {
  return String(cryptoRandomInt(10000000, 100000000));
}

export function generateTransferPin(): string {
  return String(cryptoRandomInt(100000, 1000000));
}

export function generateTransactionId(prefix: string = 'TXN'): string {
  const timestamp = Date.now();
  const randomStr = randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}

export function cryptoRandomInt(min: number, max: number): number {
  const range = max - min;
  if (range <= 0) throw new Error('Invalid range');
  if (range > 2 ** 32) throw new Error('Range too large');
  const maxVal = 2 ** 32;
  const threshold = maxVal - (maxVal % range);
  let val: number;
  do {
    const buf = randomBytes(4);
    val = buf.readUInt32BE(0);
  } while (val >= threshold);
  return min + (val % range);
}

export function generateReferenceNumber(prefix: string = 'WB'): string {
  const timestamp = Date.now();
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
