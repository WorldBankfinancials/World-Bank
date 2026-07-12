import { z } from 'zod';

/**
 * COMPREHENSIVE INPUT VALIDATION SCHEMAS
 * Protects all financial endpoints from invalid or malicious data
 * CRITICAL for security and data integrity
 */

// ==================== TRANSFER VALIDATION ====================

export const transferSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount exceeds maximum transfer limit')
    .refine(val => val > 0.01, 'Amount must be at least $0.01'),
  recipientName: z.string()
    .min(2, 'Recipient name must be at least 2 characters')
    .max(100, 'Recipient name too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Recipient name contains invalid characters'),
  recipientAccount: z.string()
    .min(5, 'Account number must be at least 5 digits')
    .max(20, 'Account number too long')
    .regex(/^[0-9]+$/, 'Account number must contain only digits'),
  recipientCountry: z.string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country name too long')
    .optional(),
  bankName: z.string().max(100, 'Bank name too long').optional(),
  swiftCode: z.string()
    .regex(/^[A-Z0-9]{8,11}$/, 'Invalid SWIFT code format')
    .optional(),
  transferPin: z.string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^[0-9]{4}$/, 'PIN must be 4 digits'),
  transferPurpose: z.string().max(200, 'Purpose description too long').optional()
});

// ==================== BALANCE UPDATE VALIDATION ====================

export const balanceUpdateSchema = z.object({
  accountId: z.number().int().positive('Invalid account ID'),
  amount: z.number()
    .refine(val => Math.abs(val) <= 1000000, 'Amount exceeds maximum limit')
    .refine(val => Math.abs(val) >= 0.01, 'Amount must be at least $0.01'),
  reason: z.string()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason too long'),
  adminNotes: z.string().max(1000, 'Admin notes too long').optional()
});

// ==================== USER REGISTRATION VALIDATION ====================

export const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Last name contains invalid characters'),
  phone: z.string()
    .regex(/^\+?[0-9\-\s()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number too short'),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  address: z.string().min(5, 'Address too short').max(200, 'Address too long').optional(),
  city: z.string().min(2, 'City name too short').max(50, 'City name too long').optional(),
  state: z.string().min(2, 'State too short').max(50, 'State too long').optional(),
  country: z.string().min(2, 'Country too short').max(50, 'Country too long').optional(),
  postalCode: z.string()
    .min(3, 'Postal code too short')
    .max(10, 'Postal code too long')
    .optional(),
  profession: z.string().min(2, 'Profession too short').max(100, 'Profession too long').optional(),
  annualIncome: z.string().min(1, 'Annual income required').optional(),
  idType: z.string().min(2, 'ID type required').optional(),
  idNumber: z.string()
    .min(5, 'ID number too short')
    .max(30, 'ID number too long')
    .regex(/^[A-Z0-9\-]+$/i, 'ID number contains invalid characters')
    .optional(),
  transferPin: z.string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^[0-9]{4}$/, 'PIN must be 4 digits')
});

// ==================== APPROVAL VALIDATION ====================

export const approvalSchema = z.object({
  registrationId: z.number().int().positive('Invalid registration ID'),
  initialBalance: z.number()
    .nonnegative('Initial balance cannot be negative')
    .max(1000000, 'Initial balance exceeds maximum')
    .optional()
});

export const rejectionSchema = z.object({
  registrationId: z.number().int().positive('Invalid registration ID'),
  reason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason too long')
});

// ==================== PIN VALIDATION ====================

export const pinChangeSchema = z.object({
  currentPin: z.string()
    .length(4, 'Current PIN must be 4 digits')
    .regex(/^[0-9]{4}$/, 'PIN must be 4 digits'),
  newPin: z.string()
    .length(4, 'New PIN must be 4 digits')
    .regex(/^[0-9]{4}$/, 'PIN must be 4 digits')
    .refine(val => val !== '0000' && val !== '1111' && val !== '2222' && val !== '3333' && val !== '4444' && val !== '5555' && val !== '6666' && val !== '7777' && val !== '8888' && val !== '9999' && val !== '1234' && val !== '4321', 'PIN cannot be sequential or repeated digits')
});

// SECURITY: PIN cannot be weak patterns
export const securePinValidator = (pin: string): boolean => {
  const weakPatterns = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '1357', '2468'];
  return !weakPatterns.includes(pin);
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate request body against a schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: any): 
  { success: true; data: T } | { success: false; errors: string[] } {
  
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Middleware to validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validateRequest(schema, req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.errors
      });
    }
    
    // Attach validated data to request
    req.validatedBody = result.data;
    next();
  };
}