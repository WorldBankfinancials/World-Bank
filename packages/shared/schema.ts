/**
 * shared/schema.ts
 *
 * Single source of truth for database schema, types, and Zod validators.
 * Imported by BOTH client (via @packages/shared/schema) and server (via @packages/shared/schema).
 *
 * Database: Supabase Postgres
 * Primary user table : users          (id uuid = auth.uid())
 * Accounts table     : accounts       (id uuid)
 * Transactions table : transactions   (id uuid, uses transaction_type not type)
 * Supporting tables  : alerts, messages, cards, investments,
 *                      support_tickets, admin_actions  — all uuid PKs
 *
 * All primary-key IDs are UUID strings throughout.
 */

import {
  pgTable,
  text,
  uuid,
  numeric,
  timestamp,
  boolean,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================
// VALIDATION-ONLY SCHEMAS  (no DB table)
// ============================================================

export const transferPinSchema = z.object({
  pin: z.string().length(4),
});

export const transferSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  recipientAccount: z.string().min(1),
  transferPin: z.string().length(4),
  purpose: z.string().optional(),
  description: z.string().optional(),
});

export const verifyPinSchema = z.object({
  email: z.string().email(),
  pin: z.string().length(4),
});

export const transferFormSchema = z.object({
  amount:           z.number().min(0.01, 'Amount must be greater than 0').max(1_000_000),
  recipientName:    z.string().min(1, 'Recipient name is required').max(200),
  recipientCountry: z.string().min(1, 'Country is required').max(100),
  recipientAddress: z.string().max(300).optional().default(''),
  recipientCity:    z.string().max(100).optional().default(''),
  bankName:         z.string().max(200).optional().default(''),
  bankAddress:      z.string().max(300).optional().default(''),
  bankCity:         z.string().max(100).optional().default(''),
  bankCountry:      z.string().max(100).optional().default(''),
  swiftCode:        z.string().max(20).optional().default(''),
  accountNumber:    z.string().max(50).optional().default(''),
  routingNumber:    z.string().max(20).optional().default(''),
  iban:             z.string().max(50).optional().default(''),
  purpose:          z.string().max(200).optional().default(''),
  description:      z.string().max(500).optional().default(''),
  transferPin:      z.string().min(4, 'PIN is required').max(6),
});

export type TransferForm = z.infer<typeof transferFormSchema>;

export type TransferPinInput = z.infer<typeof transferPinSchema>;
export type TransferInput    = z.infer<typeof transferSchema>;
export type VerifyPinInput   = z.infer<typeof verifyPinSchema>;

// ============================================================
// CORE TABLE: users
// ============================================================

export const users = pgTable('users', {
  id:                   uuid('id').primaryKey(),
  email:                text('email').notNull(),
  fullName:             text('full_name').notNull(),
  firstName:            text('first_name'),
  lastName:             text('last_name'),
  dateOfBirth:          text('date_of_birth'),
  phoneNumber:          text('phone_number'),
  countryCode:          text('country_code').default('+1'),
  address:              jsonb('address'),
  city:                 text('city'),
  state:                text('state'),
  postalCode:           text('postal_code'),
  country:              text('country'),
  occupation:           text('occupation'),
  employer:             text('employer'),
  annualIncome:         numeric('annual_income', { precision: 15, scale: 2 }),
  identificationType:   text('identification_type'),
  identificationNumber: text('identification_number'),
  kycStatus:            text('kyc_status').default('pending'),
  accountType:          text('account_type').default('personal'),
  role:                 text('role').default('customer'),
  isActive:             boolean('is_active').default(false),
  isVerified:           boolean('is_verified').default(false),
  transferPin:          text('transfer_pin'),
  passwordHash:         text('password_hash'),
  preferredLanguage:    text('preferred_language').default('en'),
  notificationPreferences: jsonb('notification_preferences').default('{}'),
  privacyPreferences:   jsonb('privacy_preferences').default('{}'),
  displayPreferences:   jsonb('display_preferences').default('{}'),
  securityPreferences:  jsonb('security_preferences').default('{}'),
  securityQuestion1:   text('security_question_1'),
  securityAnswer1:     text('security_answer_1'),
  securityQuestion2:   text('security_question_2'),
  securityAnswer2:     text('security_answer_2'),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userProfiles = users;

// ============================================================
// BANK ACCOUNTS TABLE
// ============================================================

export const bankAccounts = pgTable('accounts', {
  id:               uuid('id').primaryKey(),
  userId:           uuid('user_id').notNull(),
  accountNumber:    text('account_number').notNull(),
  routingNumber:    text('routing_number').default('123456789'),
  iban:             text('iban'),
  swiftCode:        text('swift_code').default('APEXBNK'),
  accountType:      text('account_type').notNull(),
  currency:         text('currency').default('USD'),
  balance:          numeric('balance', { precision: 18, scale: 2 }).default('0.00'),
  availableBalance: numeric('available_balance', { precision: 18, scale: 2 }).default('0.00'),
  status:           text('status').default('active'),
  interestRate:     numeric('interest_rate', { precision: 6, scale: 4 }).default('0.0000'),
  minimumBalance:   numeric('minimum_balance', { precision: 18, scale: 2 }).default('0.00'),
  accountNickname:  text('account_nickname'),
  isPrimary:        boolean('is_primary').default(false),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// TRANSACTIONS TABLE
// ============================================================

export const transactions = pgTable('transactions', {
  id:               uuid('id').primaryKey(),
  fromAccountId:    uuid('from_account_id'),
  toAccountId:      uuid('to_account_id'),
  fromUserId:       uuid('from_user_id'),
  amount:           numeric('amount', { precision: 18, scale: 2 }).notNull(),
  currency:         text('currency').notNull(),
  exchangeRate:     numeric('exchange_rate', { precision: 10, scale: 6 }).default('1.000000'),
  convertedAmount:  numeric('converted_amount', { precision: 18, scale: 2 }),
  transactionType:  text('transaction_type').notNull(),
  category:         text('category'),
  status:           text('status').default('pending'),
  description:      text('description'),
  merchantName:     text('merchant_name'),
  merchantCategory: text('merchant_category'),
  referenceNumber:  text('reference_number').notNull(),
  externalReference: text('external_reference'),
  processingFee:    numeric('processing_fee', { precision: 18, scale: 2 }).default('0.00'),
  memo:             text('memo'),
  location:         jsonb('location'),
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy:       uuid('approved_by'),
  approvedAt:      timestamp('approved_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  processedAt:      timestamp('processed_at', { withTimezone: true }),
  completedAt:      timestamp('completed_at', { withTimezone: true }),
  recipientName:    text('recipient_name'),
  recipientAccount: text('recipient_account'),
  recipientCountry: text('recipient_country'),
  bankName:         text('bank_name'),
  swiftCode:        text('swift_code'),
  accountNumber:    text('account_number'),
  transferPurpose:  text('transfer_purpose'),
  adminNotes:       text('admin_notes'),
});

// ============================================================
// ADMIN ACTIONS TABLE
// ============================================================

export const adminActions = pgTable('admin_actions', {
  id:         uuid('id').primaryKey(),
  adminId:    uuid('admin_id').notNull(),
  action:     text('action').notNull(),
  targetType: text('target_type'),
  targetId:   uuid('target_id'),
  details:    jsonb('details'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// SUPPORT TICKETS TABLE
// ============================================================

export const supportTickets = pgTable('support_tickets', {
  id:          uuid('id').primaryKey(),
  userId:      uuid('user_id').notNull(),
  subject:     text('subject').notNull(),
  description: text('description').notNull(),
  status:      text('status').default('open'),
  priority:    text('priority').default('medium'),
  adminNotes:  text('admin_notes'),
  category:    text('category'),
  assignedTo:  uuid('assigned_to'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// CARDS TABLE
// ============================================================

export const cards = pgTable('cards', {
  id:                 uuid('id').primaryKey(),
  userId:             uuid('user_id').notNull(),
  accountId:          uuid('account_id').notNull(),
  cardNumber:         text('card_number'),
  cardHolder:         text('card_holder'),
  expiryDate:         text('expiry_date'),
  cvv:                text('cvv'),
  type:               text('type').default('debit'),
  status:             text('status').default('active'),
  isLocked:           boolean('is_locked').default(false),
  dailyLimit:         numeric('daily_limit', { precision: 15, scale: 2 }).default('1000.00'),
  contactlessEnabled: boolean('contactless_enabled').default(true),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// INVESTMENTS TABLE
// ============================================================

export const investments = pgTable('investments', {
  id:           uuid('id').primaryKey(),
  userId:       uuid('user_id').notNull(),
  type:         text('type').notNull(),
  symbol:       text('symbol').notNull(),
  assetType:    text('asset_type'),
  shares:       numeric('shares', { precision: 15, scale: 6 }),
  averagePrice: numeric('average_price', { precision: 15, scale: 2 }),
  currentPrice: numeric('current_price', { precision: 15, scale: 2 }),
  totalValue:   numeric('total_value', { precision: 15, scale: 2 }),
  gainLoss:     numeric('gain_loss', { precision: 15, scale: 2 }),
  status:       text('status').default('active'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// MESSAGES TABLE
// ============================================================

export const messages = pgTable('messages', {
  id:           uuid('id').primaryKey(),
  senderId:     uuid('sender_id').notNull(),
  recipientId:  uuid('recipient_id').notNull(),
  sessionId:    text('session_id'),
  senderRole:   text('sender_role').default('customer'),
  recipientRole: text('recipient_role').default('admin'),
  content:      text('content').notNull(),
  messageType:  text('message_type').default('text'),
  isRead:       boolean('is_read').default(false),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// ALERTS TABLE
// ============================================================

export const alerts = pgTable('alerts', {
  id:        uuid('id').primaryKey(),
  userId:    uuid('user_id').notNull(),
  type:      text('type').notNull(),
  title:     text('title').notNull(),
  message:   text('message').notNull(),
  category:  text('category'),
  isRead:    boolean('is_read').default(false),
  status:    text('status').default('unread'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// LOANS TABLE
// ============================================================

export const loans = pgTable('loans', {
  id:                uuid('id').primaryKey(),
  userId:            uuid('user_id').notNull(),
  accountId:         uuid('account_id'),
  loanNumber:        text('loan_number').notNull(),
  loanType:          text('loan_type').notNull().default('personal'),
  principalAmount:   numeric('principal_amount', { precision: 18, scale: 2 }).notNull(),
  interestRate:      numeric('interest_rate', { precision: 6, scale: 4 }).default('0.0500'),
  termMonths:        integer('term_months').default(12),
  monthlyPayment:    numeric('monthly_payment', { precision: 18, scale: 2 }),
  remainingBalance:  numeric('remaining_balance', { precision: 18, scale: 2 }),
  totalInterest:     numeric('total_interest', { precision: 18, scale: 2 }),
  totalPayable:      numeric('total_payable', { precision: 18, scale: 2 }),
  status:            text('status').notNull().default('pending'),
  approvedBy:        uuid('approved_by'),
  approvedAt:        timestamp('approved_at', { withTimezone: true }),
  disbursementDate:  timestamp('disbursement_date', { withTimezone: true }),
  maturityDate:      timestamp('maturity_date', { withTimezone: true }),
  metadata:          jsonb('metadata').default('{}'),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loans);
export type LoanRow = typeof loans.$inferSelect;

export interface Loan {
  id: string;
  userId: string;
  accountId?: string | null;
  loanNumber: string;
  loanType: string;
  principalAmount: string;
  interestRate?: string | null;
  termMonths?: number | null;
  monthlyPayment?: string | null;
  remainingBalance?: string | null;
  totalInterest?: string | null;
  totalPayable?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
  disbursementDate?: string | Date | null;
  maturityDate?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InsertLoan {
  userId: string;
  loanNumber: string;
  loanType: string;
  principalAmount: string;
  interestRate?: string;
  termMonths?: number;
  monthlyPayment?: string;
  remainingBalance?: string;
  totalInterest?: string;
  totalPayable?: string;
  status?: string;
}

// ============================================================
// SAVINGS TABLE
// ============================================================

export const savings = pgTable('savings', {
  id:              uuid('id').primaryKey(),
  userId:          uuid('user_id').notNull(),
  accountId:       uuid('account_id'),
  savingsType:     text('savings_type').notNull().default('goal'),
  goalName:        text('goal_name'),
  targetAmount:    numeric('target_amount', { precision: 18, scale: 2 }),
  currentAmount:   numeric('current_amount', { precision: 18, scale: 2 }).default('0.00'),
  interestRate:    numeric('interest_rate', { precision: 6, scale: 4 }).default('0.0200'),
  targetDate:      timestamp('target_date', { withTimezone: true }),
  status:          text('status').notNull().default('active'),
  metadata:        jsonb('metadata').default('{}'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// FOREX TABLE
// ============================================================

export const forex = pgTable('forex', {
  id:              uuid('id').primaryKey(),
  fromCurrency:    text('from_currency').notNull(),
  toCurrency:      text('to_currency').notNull(),
  rate:            numeric('rate', { precision: 18, scale: 8 }).notNull(),
  margin:          numeric('margin', { precision: 6, scale: 4 }).default('0.0000'),
  buyRate:         numeric('buy_rate', { precision: 18, scale: 8 }),
  sellRate:        numeric('sell_rate', { precision: 18, scale: 8 }),
  source:          text('source').default('internal'),
  effectiveDate:   timestamp('effective_date', { withTimezone: true }).defaultNow(),
  expiresAt:       timestamp('expires_at', { withTimezone: true }),
  isActive:        boolean('is_active').default(true),
  metadata:        jsonb('metadata').default('{}'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const insertForexSchema = createInsertSchema(forex);
export type ForexRow = typeof forex.$inferSelect;

// ============================================================
// KYC TABLE
// ============================================================

export const kyc = pgTable('kyc', {
  id:              uuid('id').primaryKey(),
  userId:          uuid('user_id').notNull(),
  kycType:         text('kyc_type').notNull().default('individual'),
  status:          text('status').notNull().default('pending'),
  documentType:    text('document_type'),
  documentNumber:  text('document_number'),
  documentFront:   text('document_front'),
  documentBack:    text('document_back'),
  selfieImage:     text('selfie_image'),
  verifiedBy:      uuid('verified_by'),
  verifiedAt:      timestamp('verified_at', { withTimezone: true }),
  expiresAt:       timestamp('expires_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  riskScore:       numeric('risk_score', { precision: 6, scale: 2 }).default('0.00'),
  metadata:        jsonb('metadata').default('{}'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
  submittedAt:     timestamp('submitted_at', { withTimezone: true }),
  fullName:         text('full_name'),
  dateOfBirth:     text('date_of_birth'),
  nationality:     text('nationality'),
  address:         text('address'),
});

export const insertKycSchema = createInsertSchema(kyc);
export type KycRow = typeof kyc.$inferSelect;

// ============================================================
// DRIZZLE-ZOD INSERT SCHEMAS
// ============================================================

export const insertUserProfileSchema   = createInsertSchema(users);
export const insertBankAccountSchema   = createInsertSchema(bankAccounts);
export const insertTransactionSchema   = createInsertSchema(transactions);
export const insertAdminActionSchema   = createInsertSchema(adminActions);
export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export const insertCardSchema          = createInsertSchema(cards);
export const insertInvestmentSchema    = createInsertSchema(investments);
export const insertMessageSchema       = createInsertSchema(messages);
export const insertAlertSchema         = createInsertSchema(alerts);

// ============================================================
// DRIZZLE SELECT ROW TYPES
// ============================================================

export type UserProfileRow      = typeof users.$inferSelect;
export type BankAccountRow      = typeof bankAccounts.$inferSelect;
export type TransactionRow      = typeof transactions.$inferSelect;
export type AdminActionRow      = typeof adminActions.$inferSelect;
export type SupportTicketRow    = typeof supportTickets.$inferSelect;
export type CardRow             = typeof cards.$inferSelect;
export type InvestmentRow       = typeof investments.$inferSelect;
export type MessageRow          = typeof messages.$inferSelect;
export type AlertRow            = typeof alerts.$inferSelect;

// ============================================================
// CANONICAL APPLICATION TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  kycStatus?: string;
  accountStatus?: string;
  transferPin?: string | null;
  accountNumber?: string | null;
  balance?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  profession?: string | null;
  occupation?: string | null;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  dateOfBirth?: string | null;
  address?: string | Record<string, unknown> | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  annualIncome?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  lastLogin?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InsertUser {
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  transferPin?: string;
  accountNumber?: string;
  balance?: string;
  occupation?: string;
  profession?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  annualIncome?: string;
  idType?: string;
  idNumber?: string;
  username?: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  availableBalance?: string;
  currency: string;
  status: string;
  isPrimary?: boolean;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
  accountNickname?: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InsertAccount {
  userId: string;
  accountNumber: string;
  accountType: string;
  balance?: string;
  currency?: string;
  status?: string;
  isPrimary?: boolean;
}

export interface Transaction {
  id: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  fromUserId?: string | null;
  transactionType: string;
  type?: string;
  amount: string;
  currency: string;
  status: string;
  description?: string | null;
  referenceNumber: string;
  recipientName?: string | null;
  recipientAccount?: string | null;
  recipientCountry?: string | null;
  bankName?: string | null;
  swiftCode?: string | null;
  transferPurpose?: string | null;
  adminNotes?: string | null;
  requiresApproval?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InsertTransaction {
  fromAccountId?: string;
  toAccountId?: string;
  fromUserId?: string;
  transactionType: string;
  amount: string;
  currency?: string;
  status?: string;
  description?: string;
  referenceNumber: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientCountry?: string;
  bankName?: string;
  swiftCode?: string;
  transferPurpose?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  adminNotes?: string | null;
  category?: string | null;
  assignedTo?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InsertSupportTicket {
  userId: string;
  subject: string;
  description: string;
  status?: string;
  priority?: string;
  category?: string;
}

export interface Card {
  id: string;
  userId: string;
  accountId: string;
  cardNumber?: string | null;
  cardHolder?: string | null;
  expiryDate?: string | null;
  type: string;
  status: string;
  isLocked?: boolean;
  dailyLimit?: string | null;
  contactlessEnabled?: boolean;
  createdAt?: string | Date | null;
}

export interface InsertCard {
  userId: string;
  accountId: string;
  type?: string;
  status?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  dailyLimit?: string;
}

export interface Investment {
  id: string;
  userId: string;
  type: string;
  symbol: string;
  assetType?: string | null;
  shares?: string | null;
  averagePrice?: string | null;
  currentPrice?: string | null;
  totalValue?: string | null;
  gainLoss?: string | null;
  status: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InsertInvestment {
  userId: string;
  type: string;
  symbol: string;
  assetType?: string;
  shares?: string;
  averagePrice?: string;
  currentPrice?: string;
  totalValue?: string;
  status?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  sessionId?: string | null;
  senderRole?: string;
  recipientRole?: string;
  content: string;
  messageType?: string;
  isRead?: boolean;
  createdAt?: string | Date | null;
}

export interface InsertMessage {
  senderId: string;
  recipientId: string;
  sessionId?: string;
  senderRole?: string;
  recipientRole?: string;
  content: string;
  isRead?: boolean;
}

export interface Alert {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  category?: string | null;
  isRead?: boolean;
  status?: string;
  createdAt?: string | Date | null;
}

export interface InsertAlert {
  userId: string;
  type: string;
  title: string;
  message: string;
  category?: string;
  isRead?: boolean;
}

export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt?: string | Date | null;
}

export interface InsertAdminAction {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

// ============================================================
// CONSTANTS
// ============================================================

export const USER_ROLES = ['customer', 'admin', 'support', 'compliance'] as const;
export type UserRole = typeof USER_ROLES[number];

export const ACCOUNT_STATUSES = ['pending', 'active', 'frozen', 'closed'] as const;
export const TRANSACTION_STATUSES = ['pending', 'processing', 'completed', 'failed', 'reversed'] as const;
export const TRANSACTION_TYPES = [
  'transfer', 'international_transfer', 'deposit', 'withdrawal',
  'credit', 'debit', 'reversal', 'payment_request', 'mobile_pay',
] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];
