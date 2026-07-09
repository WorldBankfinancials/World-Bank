/**
 * server/validation-schemas.ts
 * Zod schemas. accountId/userId are UUID strings, not integers.
 */
import { z } from 'zod';

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validateRequest(schema, req.body);
    if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.errors });
    req.validatedBody = result.data;
    next();
  };
}

export const transferSchema = z.object({
  amount:           z.number().positive().max(1_000_000),
  recipientName:    z.string().min(1).max(200).optional(),
  recipientAccount: z.string().min(1).max(100),
  recipientBank:    z.string().max(200).optional(),
  recipientCountry: z.string().max(100).optional(),
  swiftCode:        z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code').optional(),
  transferPin:      z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits'),
  description:      z.string().max(500).optional(),
  transferPurpose:  z.string().max(200).optional(),
  idempotencyKey:   z.string().optional(),
});

// accountId is a UUID string
export const balanceUpdateSchema = z.object({
  accountId:   z.string().min(1, 'accountId required'),
  amount:      z.number().positive('Amount must be positive'),
  description: z.string().min(1).max(500),
  type:        z.enum(['credit', 'debit']),
});

export const registrationSchema = z.object({
  email:       z.string().email(),
  password:    z.string().min(8).regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Requires uppercase, lowercase, number'),
  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  phone:       z.string().min(7).max(20).optional(),
  dateOfBirth: z.string().optional(),
  address:     z.string().max(300).optional(),
  city:        z.string().max(100).optional(),
  state:       z.string().max(100).optional(),
  country:     z.string().max(100).optional(),
  postalCode:  z.string().max(20).optional(),
  profession:  z.string().max(200).optional(),
  annualIncome: z.string().max(50).optional(),
  idType:      z.string().max(50).optional(),
  idNumber:    z.string().max(100).optional(),
  transferPin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits').default('0192'),
});

// registrationId is a UUID string
export const approvalSchema = z.object({
  registrationId: z.string().min(1),
  initialBalance: z.number().min(0).optional().default(0),
  notes:          z.string().max(500).optional(),
});

export const rejectionSchema = z.object({
  registrationId: z.string().min(1),
  reason:         z.string().max(1000).optional(),
});

export const pinChangeSchema = z.object({
  currentPin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits'),
  newPin:     z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits'),
});

export const supportTicketSchema = z.object({
  subject:     z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  category:    z.string().min(1).max(100).optional(),
});
