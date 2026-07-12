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
  pin: z.string().min(4).max(6),
});

export const transferSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  recipientAccount: z.string().min(1),
  transferPin: z.string().min(4),
  purpose: z.string().optional(),
  description: z.string().optional(),
});

export const verifyPinSchema = z.object({
  email: z.string().email(),
  pin: z.string().min(4),
});

export const transferFormSchema = z.object({
  amount:           z.number().min(0, 'Amount is required').max(1_000_000),
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

export const userProfiles = pgTable('users', {
  id:                   uuid('id').primaryKey(),
  email:                text('email'),
  username:             text('username'),
  role:                 text('role').default('customer'),
  isActive:             boolean('is_active').default(false),
  isVerified:           boolean('is_verified').default(false),
  transferPin:          text('transfer_pin'),
  kycStatus:            text('kyc_status').default('pending'),
  accountType:          text('account_type').default('personal'),
  accountNumber:        text('account_number'),
  balance:              numeric('balance', { precision: 18, scale: 2 }).default('0'),
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
  profession:           text('profession').default(''),
  employer:             text('employer'),
  annualIncome:         numeric('annual_income', { precision: 15, scale: 2 }),
  identificationType:   text('identification_type'),
  identificationNumber: text('identification_number'),
  emailVerified:        boolean('email_verified').default(false),
  phoneVerified:        boolean('phone_verified').default(false),
  identityVerified:     boolean('identity_verified').default(false),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
  preferredLanguage:    text('preferred_language').default('en'),
  passwordHash:         text('password_hash'),
});

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
  approvedAt:       timestamp('approved_at', { withTimezone: true }),
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

export const adminActions = pgTable('admin_actions', {
  id:         uuid('id').primaryKey(),
  adminId:    uuid('admin_id').notNull(),
  action:     text('action').notNull(),
  targetType: text('target_type'),
  targetId:   uuid('target_id'),
  details:    jsonb('details'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow(),
});

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
// DRIZZLE-ZOD INSERT SCHEMAS
// ============================================================

export const insertUserProfileSchema   = createInsertSchema(userProfiles);
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

export type UserProfileRow      = typeof userProfiles.$inferSelect;
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
  phoneNumber?: string | null;
  profession?: string | null;
  occupation?: string | null;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  dateOfBirth?: string | null;
  address?: string | Record<string, any> | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  annualIncome?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  accountType?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  preferredLanguage?: string | null;
  passwordHash?: string | null;
  lastLogin?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  status?: string;
  employer?: string | null;
}

export interface InsertUser {
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
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
  countryCode?: string;
  postalCode?: string;
  annualIncome?: string;
  idType?: string;
  identificationType?: string;
  idNumber?: string;
  identificationNumber?: string;
  username?: string;
  address?: string | Record<string, any> | null;
  accountType?: string;
  kycStatus?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  preferredLanguage?: string;
  passwordHash?: string;
  password?: string;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
  employer?: string;
  status?: string;
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
  userId: string | number;
  accountNumber: string;
  accountType: string;
  balance?: string | number;
  currency?: string;
  status?: string;
  isPrimary?: boolean;
}

export interface Transaction {
  id: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  fromUserId?: string | null;
  toUserId?: string | null;
  transactionType: string;
  type?: string;
  amount: string;
  currency: string;
  exchangeRate?: string | null;
  convertedAmount?: string | null;
  status: string;
  description?: string | null;
  referenceNumber: string;
  recipientName?: string | null;
  recipientAccount?: string | null;
  recipientCountry?: string | null;
  recipientAddress?: string | null;
  bankName?: string | null;
  swiftCode?: string | null;
  accountNumber?: string | null;
  transferPurpose?: string | null;
  adminNotes?: string | null;
  category?: string | null;
  merchantName?: string | null;
  merchantCategory?: string | null;
  processingFee?: string | null;
  memo?: string | null;
  requiresApproval?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
  rejectedBy?: string | null;
  rejectedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  processedAt?: string | Date | null;
  completedAt?: string | Date | null;
  fee?: string | null;
}

export interface InsertTransaction {
  fromAccountId?: string | number;
  toAccountId?: string | number;
  fromUserId?: string | number;
  toUserId?: string | number;
  transactionType?: string;
  type?: string;
  amount: string | number;
  currency?: string;
  exchangeRate?: string;
  convertedAmount?: string;
  status?: string;
  description?: string;
  referenceNumber?: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientCountry?: string;
  recipientAddress?: string;
  bankName?: string;
  swiftCode?: string;
  accountNumber?: string;
  transferPurpose?: string;
  category?: string;
  merchantName?: string;
  merchantCategory?: string;
  processingFee?: string;
  memo?: string;
  requiresApproval?: boolean;
  approvedBy?: string;
  adminNotes?: string;
  transactionId?: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  processedAt?: string | Date | null;
  completedAt?: string | Date | null;
  fee?: string | null;
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
  fee?: string | null;
}

export interface InsertSupportTicket {
  userId: string | number;
  subject: string;
  description: string;
  status?: string;
  priority?: string;
  category?: string | null;
  adminNotes?: string;
  assignedTo?: string;
}

export interface Card {
  id: string;
  userId: string;
  accountId: string;
  cardNumber?: string | null;
  cardHolder?: string | null;
  expiryDate?: string | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  cvv?: string | null;
  type: string;
  cardType?: string | null;
  status: string;
  isLocked?: boolean;
  dailyLimit?: string | null;
  contactlessEnabled?: boolean;
  cardholderName?: string | null;
  brand?: string | null;
  pinSet?: boolean;
  monthlyLimit?: string | null;
  isContactless?: boolean;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
}

export interface InsertCard {
  userId: string | number;
  accountId: string | number;
  type?: string;
  cardType?: string;
  status?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  dailyLimit?: string;
  isLocked?: boolean;
  contactlessEnabled?: boolean;
  cardholderName?: string;
  brand?: string;
  pinSet?: boolean;
  monthlyLimit?: string;
  isContactless?: boolean;
}

export interface Investment {
  id: string;
  userId: string;
  type: string;
  symbol?: string;
  assetType?: string | null;
  shares?: string | null;
  averagePrice?: string | null;
  currentPrice?: string | null;
  totalValue?: string | null;
  gainLoss?: string | null;
  status: string;
  amount?: string | null;
  rate?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface InsertInvestment {
  userId: string | number;
  type: string;
  symbol?: string;
  assetType?: string;
  shares?: string;
  averagePrice?: string;
  currentPrice?: string;
  totalValue?: string;
  gainLoss?: string;
  status?: string;
  amount?: string;
  rate?: string;
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
  is_read?: boolean;
  created_at?: string | Date | null;
  sender_id?: string;
  recipient_id?: string;
  session_id?: string;
  sender_role?: string;
  recipient_role?: string;
  message_type?: string;
}

export interface InsertMessage {
  senderId: string | number;
  recipientId: string | number;
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
  is_read?: boolean;
  created_at?: string | Date | null;
}

export interface InsertAlert {
  userId: string | number;
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
  details?: Record<string, any> | null;
  createdAt?: string | Date | null;
}

export interface InsertAdminAction {
  adminId: string | number;
  action: string;
  targetType?: string;
  targetId?: string | number;
  details?: Record<string, any>;
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
