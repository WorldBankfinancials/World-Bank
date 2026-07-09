/**
 * shared/schema.ts
 * Single source of truth for types, Drizzle schema, and Zod validators.
 * Imported by BOTH client (via @shared/*) and server (via @shared/*).
 *
 * Database: Supabase Postgres
 * Primary tables: wb_users, wb_accounts, wb_transactions, wb_profiles
 * Legacy tables: bank_accounts, transactions, messages, alerts, cards,
 *                investments, support_tickets, admin_actions
 * All primary-key IDs are UUID strings.
 */

import { pgTable, text, uuid, numeric, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================
// VALIDATION-ONLY SCHEMAS (no table backing)
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
export type TransferPinInput = z.infer<typeof transferPinSchema>;
export type TransferInput    = z.infer<typeof transferSchema>;
export type VerifyPinInput   = z.infer<typeof verifyPinSchema>;

// ============================================================
// PRIMARY TABLES  (wb_* — new high-grade schema)
// All IDs are UUID; user_id FK references auth.users(id)
// ============================================================

/** wb_users — one row per Supabase Auth user */
export const wbUsers = pgTable('wb_users', {
  id:            uuid('id').primaryKey(),          // = auth.uid()
  email:         text('email').notNull().unique(),
  role:          text('role').notNull().default('customer'),  // customer | admin | support | compliance
  status:        text('status').notNull().default('pending'), // pending | active | suspended | closed
  isActive:      boolean('is_active').notNull().default(false),
  isVerified:    boolean('is_verified').notNull().default(false),
  transferPin:   text('transfer_pin'),
  accountNumber: text('account_number'),
  balance:       numeric('balance', { precision: 18, scale: 2 }).default('0.00'),
  lastLogin:     timestamp('last_login', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
  // compat fields populated by trigger / registration
  firstName:     text('first_name'),
  lastName:      text('last_name'),
  phone:         text('phone_number'),
  profession:    text('occupation'),
  profilePhoto:  text('avatar_url'),
});

/** wb_profiles — extended KYC / personal data for a wb_users row */
export const wbProfiles = pgTable('wb_profiles', {
  id:                 uuid('id').primaryKey().default(undefined), // gen_random_uuid()
  userId:             uuid('user_id').notNull(),
  fullName:           text('full_name'),
  firstName:          text('first_name'),
  lastName:           text('last_name'),
  dateOfBirth:        text('date_of_birth'),
  phoneNumber:        text('phone_number'),
  address:            jsonb('address'),
  city:               text('city'),
  state:              text('state'),
  postalCode:         text('postal_code'),
  country:            text('country'),
  occupation:         text('occupation'),
  employer:           text('employer'),
  annualIncome:       numeric('annual_income', { precision: 15, scale: 2 }),
  identificationType: text('identification_type'),
  identificationNumber: text('identification_number'),
  avatarUrl:          text('avatar_url'),
  kycStatus:          text('kyc_status').default('pending'),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/** wb_accounts — bank accounts owned by a wb_user */
export const wbAccounts = pgTable('wb_accounts', {
  id:            uuid('id').primaryKey(),
  userId:        uuid('user_id').notNull(),
  accountNumber: text('account_number').notNull().unique(),
  accountType:   text('account_type').notNull().default('checking'),
  balance:       numeric('balance', { precision: 18, scale: 2 }).default('0.00'),
  currency:      text('currency').default('USD'),
  status:        text('status').default('active'),  // active | frozen | closed | pending
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/** wb_transactions — financial transactions */
export const wbTransactions = pgTable('wb_transactions', {
  id:               uuid('id').primaryKey(),
  userId:           uuid('user_id').notNull(),
  fromAccountId:    uuid('from_account_id'),
  toAccountId:      uuid('to_account_id'),
  type:             text('type').notNull(),  // transfer | deposit | withdrawal | credit | debit | reversal
  amount:           numeric('amount', { precision: 18, scale: 2 }).notNull(),
  currency:         text('currency').default('USD'),
  status:           text('status').default('pending'), // pending | processing | completed | failed | reversed
  description:      text('description'),
  recipientName:    text('recipient_name'),
  recipientAccount: text('recipient_account'),
  recipientBank:    text('recipient_bank'),
  recipientCountry: text('recipient_country'),
  referenceNumber:  text('reference_number'),
  metadata:         jsonb('metadata'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// LEGACY TABLES  (still active, some referenced by storage impl)
// ============================================================

export const bankAccounts = pgTable('bank_accounts', {
  id:          uuid('id').primaryKey(),
  userId:      uuid('user_id').notNull(),
  accountType: text('account_type').notNull().default('checking'),
  accountName: text('account_name'),
  accountNumber: text('account_number'),
  balance:     numeric('balance', { precision: 15, scale: 2 }).default('0.00'),
  currency:    text('currency').default('USD'),
  status:      text('status').default('active'),
  isActive:    boolean('is_active').default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const transactions = pgTable('transactions', {
  id:               uuid('id').primaryKey(),
  fromAccountId:    uuid('from_account_id'),
  toAccountId:      uuid('to_account_id'),
  amount:           numeric('amount', { precision: 15, scale: 2 }).notNull(),
  type:             text('type').notNull(),
  status:           text('status').default('pending'),
  description:      text('description'),
  recipientName:    text('recipient_name'),
  recipientAccount: text('recipient_account'),
  recipientBank:    text('recipient_bank'),
  recipientCountry: text('recipient_country'),
  currency:         text('currency').default('USD'),
  referenceNumber:  text('reference_number'),
  adminNotes:       text('admin_notes'),
  transactionType:  text('transaction_type'),
  swiftCode:        text('swift_code'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const adminActions = pgTable('admin_actions', {
  id:         uuid('id').primaryKey(),
  adminId:    uuid('admin_id').notNull(),
  action:     text('action').notNull(),
  targetId:   uuid('target_id'),
  targetType: text('target_type'),
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
  id:                uuid('id').primaryKey(),
  userId:            uuid('user_id').notNull(),
  accountId:         uuid('account_id').notNull(),
  cardNumber:        text('card_number'),
  cardHolder:        text('card_holder'),
  expiryDate:        text('expiry_date'),
  cvv:               text('cvv'),
  type:              text('type').default('debit'),
  status:            text('status').default('active'),
  isLocked:          boolean('is_locked').default(false),
  dailyLimit:        numeric('daily_limit', { precision: 15, scale: 2 }).default('1000.00'),
  contactlessEnabled: boolean('contactless_enabled').default(true),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
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
// INSERT SCHEMAS (drizzle-zod)
// ============================================================
export const insertWbUserSchema        = createInsertSchema(wbUsers);
export const insertWbAccountSchema     = createInsertSchema(wbAccounts);
export const insertWbTransactionSchema = createInsertSchema(wbTransactions);
export const insertWbProfileSchema     = createInsertSchema(wbProfiles);
export const insertBankAccountSchema   = createInsertSchema(bankAccounts);
export const insertTransactionSchema   = createInsertSchema(transactions);
export const insertAdminActionSchema   = createInsertSchema(adminActions);
export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export const insertCardSchema          = createInsertSchema(cards);
export const insertInvestmentSchema    = createInsertSchema(investments);
export const insertMessageSchema       = createInsertSchema(messages);
export const insertAlertSchema         = createInsertSchema(alerts);

// ============================================================
// EXPORTED TYPES
// ============================================================

// WB primary types
export type WbUser              = typeof wbUsers.$inferSelect;
export type InsertWbUser        = typeof wbUsers.$inferInsert;
export type WbProfile           = typeof wbProfiles.$inferSelect;
export type InsertWbProfile     = typeof wbProfiles.$inferInsert;
export type WbAccount           = typeof wbAccounts.$inferSelect;
export type InsertWbAccount     = typeof wbAccounts.$inferInsert;
export type WbTransaction       = typeof wbTransactions.$inferSelect;
export type InsertWbTransaction = typeof wbTransactions.$inferInsert;

// Legacy / compat types
export type Account           = typeof bankAccounts.$inferSelect;
export type InsertAccount     = typeof bankAccounts.$inferInsert;
export type Transaction       = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type AdminAction       = typeof adminActions.$inferSelect;
export type InsertAdminAction = typeof adminActions.$inferInsert;
export type SupportTicket     = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type Card              = typeof cards.$inferSelect;
export type InsertCard        = typeof cards.$inferInsert;
export type Investment        = typeof investments.$inferSelect;
export type InsertInvestment  = typeof investments.$inferInsert;
export type Message           = typeof messages.$inferSelect;
export type InsertMessage     = typeof messages.$inferInsert;
export type Alert             = typeof alerts.$inferSelect;
export type InsertAlert       = typeof alerts.$inferInsert;

/**
 * Canonical User type — used throughout server and client.
 * Maps to wb_users (primary) with compat fields.
 */
export interface User {
  id: string;                   // UUID = auth.uid()
  email: string;
  role: string;                 // customer | admin | support | compliance
  status?: string;              // pending | active | suspended | closed
  isActive: boolean;
  isVerified: boolean;
  transferPin?: string | null;
  accountNumber?: string | null;
  balance?: string | null;
  lastLogin?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  // Profile fields (joined from wb_profiles or inline)
  firstName?: string | null;
  lastName?:  string | null;
  fullName?:  string | null;
  phone?:     string | null;
  profession?: string | null;
  profilePhoto?: string | null;
  avatarUrl?:    string | null;
  // Compat fields
  username?:    string | null;
  dateOfBirth?: string | null;
  address?:     string | null;
  city?:        string | null;
  state?:       string | null;
  country?:     string | null;
  postalCode?:  string | null;
  annualIncome?: string | null;
  idType?:       string | null;
  idNumber?:     string | null;
  accountId?:    number | null;
}

export interface InsertUser extends Omit<Partial<User>, 'id'> {
  email: string;
  password?: string;   // not stored in wb_users; handled by Supabase Auth
  username?: string;
}

// ============================================================
// SHARED CONSTANTS
// ============================================================
export const USER_ROLES = ['customer', 'admin', 'support', 'compliance'] as const;
export type UserRole = typeof USER_ROLES[number];

export const ACCOUNT_STATUSES = ['pending', 'active', 'frozen', 'closed'] as const;
export const TRANSACTION_STATUSES = ['pending', 'processing', 'completed', 'failed', 'reversed'] as const;
export const TRANSACTION_TYPES = ['transfer', 'international_transfer', 'deposit', 'withdrawal', 'credit', 'debit', 'reversal', 'payment_request', 'mobile_pay'] as const;
