import { pgTable, text, uuid, decimal, timestamp, boolean, jsonb, inet, date, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User profiles table - extends Supabase auth.users with banking-specific fields
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(), // References auth.users(id)
  fullName: text('full_name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: date('date_of_birth'),
  phoneNumber: text('phone_number'),
  countryCode: text('country_code').default('+1'),
  address: jsonb('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  occupation: text('occupation'),
  employer: text('employer'),
  annualIncome: decimal('annual_income', { precision: 15, scale: 2 }),
  identificationType: text('identification_type'),
  identificationNumber: text('identification_number'),
  kycStatus: text('kyc_status').default('pending'),
  accountType: text('account_type').default('personal'),
  preferredLanguage: text('preferred_language').default('en'),
  emailVerified: boolean('email_verified').default(false),
  phoneVerified: boolean('phone_verified').default(false),
  identityVerified: boolean('identity_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bank accounts with realistic UUIDs and account numbers
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  accountNumber: text('account_number').notNull().unique(),
  routingNumber: text('routing_number').default('123456789'),
  iban: text('iban').unique(),
  swiftCode: text('swift_code').default('WORLDBNK'),
  accountType: text('account_type').notNull(),
  currency: text('currency').default('USD'),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0.00'),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 }).default('0.00'),
  status: text('status').default('active'),
  interestRate: decimal('interest_rate', { precision: 5, scale: 4 }).default('0.0000'),
  minimumBalance: decimal('minimum_balance', { precision: 15, scale: 2 }).default('0.00'),
  accountNickname: text('account_nickname'),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Transactions with comprehensive UUID tracking
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromAccountId: uuid('from_account_id'), // References bank_accounts(id)
  toAccountId: uuid('to_account_id'), // References bank_accounts(id)
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }).default('1.000000'),
  convertedAmount: decimal('converted_amount', { precision: 15, scale: 2 }),
  transactionType: text('transaction_type').notNull(),
  category: text('category'),
  status: text('status').default('pending'),
  description: text('description'),
  merchantName: text('merchant_name'),
  merchantCategory: text('merchant_category'),
  referenceNumber: text('reference_number').notNull().unique(),
  externalReference: text('external_reference'),
  processingFee: decimal('processing_fee', { precision: 15, scale: 2 }).default('0.00'),
  memo: text('memo'),
  location: jsonb('location'),
  deviceInfo: jsonb('device_info'),
  ipAddress: inet('ip_address'),
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: uuid('approved_by'), // References auth.users(id)
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  processedAt: timestamp('processed_at'),
  completedAt: timestamp('completed_at'),
});

// Real-time chat messages for customer support
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id').notNull(), // References auth.users(id)
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull(),
  message: text('message').notNull(),
  messageType: text('message_type').default('text'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  conversationId: uuid('conversation_id'),
  replyTo: uuid('reply_to'), // References messages(id)
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Real-time alerts and notifications
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // References auth.users(id)
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  category: text('category'),
  priority: text('priority').default('normal'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  actionUrl: text('action_url'),
  actionLabel: text('action_label'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Transaction approvals for admin workflow
export const transactionApprovals = pgTable('transaction_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull(), // References transactions(id)
  adminId: uuid('admin_id'), // References auth.users(id)
  status: text('status').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Cards and payment methods
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull(), // References bank_accounts(id)
  cardNumber: text('card_number').notNull(), // Encrypted/masked in real implementation
  cardType: text('card_type').notNull(),
  brand: text('brand'),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  cardholderName: text('cardholder_name').notNull(),
  status: text('status').default('active'),
  dailyLimit: decimal('daily_limit', { precision: 15, scale: 2 }).default('1000.00'),
  monthlyLimit: decimal('monthly_limit', { precision: 15, scale: 2 }).default('10000.00'),
  isContactless: boolean('is_contactless').default(true),
  pinSet: boolean('pin_set').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas for validation
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  accountNumber: true,
  routingNumber: true,
  iban: true,
  swiftCode: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  referenceNumber: true,
  createdAt: true,
  processedAt: true,
  completedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

// TypeScript types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Card = typeof cards.$inferSelect;
export type TransactionApproval = typeof transactionApprovals.$inferSelect;