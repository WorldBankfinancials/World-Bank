import { pgTable, text, serial, decimal, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ==================== VALIDATION SCHEMAS ====================
export const transferPinSchema = z.object({
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN must be at most 6 digits'),
});

export const transferSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount exceeds maximum limit'),
  recipientAccount: z.string().min(1, 'Recipient account is required'),
  transferPin: z.string().min(4, 'PIN is required'),
  purpose: z.string().optional(),
  description: z.string().optional(),
});

export const verifyPinSchema = z.object({
  email: z.string().email('Valid email required'),
  pin: z.string().min(4, 'PIN required'),
});

export type TransferPinInput = z.infer<typeof transferPinSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type VerifyPinInput = z.infer<typeof verifyPinSchema>;

// ==================== CORE TABLES ====================
export const users = pgTable('bank_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  username: text('username').notNull().unique(),
  phone: text('phone'),
  profession: text('profession'),
  accountId: serial('account_id'),
  accountNumber: text('account_number'),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0.00'),
  dateOfBirth: text('date_of_birth'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  postalCode: text('postal_code'),
  annualIncome: text('annual_income'),
  idType: text('id_type'),
  idNumber: text('id_number'),
  transferPin: text('transfer_pin'),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(false),
  isVerified: boolean('is_verified').default(false),
  role: text('role').default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accounts = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').notNull(),
  accountNumber: text('account_number').notNull().unique(),
  accountType: text('account_type').notNull(),
  currency: text('currency').default('USD'),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0.00'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  fromAccountId: serial('from_account_id'),
  toAccountId: serial('to_account_id'),
  fromUserId: serial('from_user_id'),
  toUserId: serial('to_user_id'),
  transactionId: text('transaction_id'),
  transactionType: text('transaction_type'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  type: text('type').notNull(),
  status: text('status').default('pending'),
  description: text('description'),
  referenceNumber: text('reference_number').unique(),
  fee: decimal('fee', { precision: 15, scale: 2 }).default('0.00'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }),
  countryCode: text('country_code'),
  recipientName: text('recipient_name'),
  recipientAccount: text('recipient_account'),
  recipientAddress: text('recipient_address'),
  recipientCountry: text('recipient_country'),
  bankName: text('bank_name'),
  swiftCode: text('swift_code'),
  transferPurpose: text('transfer_purpose'),
  category: text('category'),
  adminNotes: text('admin_notes'),
  approvedBy: serial('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: serial('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adminActions = pgTable('admin_actions', {
  id: serial('id').primaryKey(),
  adminId: serial('admin_id'),
  action: text('action').notNull(),
  targetId: serial('target_id'),
  targetType: text('target_type'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: serial('user_id'),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  status: text('status').default('open'),
  priority: text('priority').default('normal'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  userId: serial('user_id'),
  documentType: text('document_type').notNull(),
  url: text('url').notNull(),
  status: text('status').default('pending'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  verifiedAt: timestamp('verified_at'),
});

export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  accountId: serial('account_id'),
  cardNumber: text('card_number').notNull(),
  cardType: text('card_type').notNull(),
  status: text('status').default('active'),
  expiryMonth: text('expiry_month'),
  expiryYear: text('expiry_year'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const investments = pgTable('investments', {
  id: serial('id').primaryKey(),
  userId: serial('user_id'),
  type: text('type').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  rate: decimal('rate', { precision: 5, scale: 2 }).default('0.00'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: serial('sender_id'),
  senderRole: text('sender_role').default('customer'),
  recipientId: serial('recipient_id'),
  recipientRole: text('recipient_role').default('admin'),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  userId: serial('user_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==================== DRIZZLE TYPE EXPORTS ====================
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = typeof adminActions.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ==================== ZOD VALIDATION SCHEMAS ====================
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  verifiedAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

// ==================== FORM VALIDATION SCHEMAS ====================
// Unified schemas for all forms - single source of truth

export const transferFormSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount exceeds maximum transfer limit'),
  recipientName: z.string().min(2, 'Recipient name must be at least 2 characters').max(100, 'Recipient name too long'),
  recipientCountry: z.string().optional(),
  recipientAddress: z.string().optional(),
  recipientCity: z.string().optional(),
  bankName: z.string().optional(),
  bankAddress: z.string().optional(),
  bankCity: z.string().optional(),
  bankCountry: z.string().optional(),
  swiftCode: z.string().optional(),
  accountNumber: z.string().min(5, 'Account number must be at least 5 digits'),
  routingNumber: z.string().optional(),
  cardNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  mobileProvider: z.string().optional(),
  purpose: z.string().min(2, 'Purpose required'),
  reference: z.string().optional()
});

export const pinVerificationSchema = z.object({
  pin: z.string().length(4, 'PIN must be 4 digits').regex(/^[0-9]{4}$/, 'PIN must be 4 digits')
});

export const balanceUpdateSchema = z.object({
  accountId: z.number().int().positive('Invalid account ID'),
  amount: z.number().refine(val => Math.abs(val) <= 1000000, 'Amount exceeds maximum limit'),
  reason: z.string().min(5, 'Reason must be at least 5 characters')
});

// ==================== FORM TYPE EXPORTS ====================
export type TransferForm = z.infer<typeof transferFormSchema>;
export type PinVerification = z.infer<typeof pinVerificationSchema>;
export type BalanceUpdate = z.infer<typeof balanceUpdateSchema>;
