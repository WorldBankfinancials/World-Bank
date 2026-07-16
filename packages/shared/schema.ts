/**
 * shared/schema.ts
 *
 * Core schema types for the banking platform.
 * These types mirror the Supabase database tables.
 * All IDs are UUID strings matching the database.
 */

// ============================================================
// USER ROLES
// ============================================================

export type UserRole = 'customer' | 'support' | 'compliance' | 'admin';

// ============================================================
// USERS TABLE
// ============================================================

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  passwordHash?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  dateOfBirth?: string | null;
  address?: Record<string, unknown> | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  occupation?: string | null;
  employer?: string | null;
  annualIncome?: string | null;
  profession?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  kycStatus?: string | null;
  accountType?: string | null;
  preferredLanguage?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  accountNumber?: string | null;
  balance?: string | number;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  transferPin?: string | null;
  notificationPreferences?: Record<string, unknown> | null;
  privacyPreferences?: Record<string, unknown> | null;
  displayPreferences?: Record<string, unknown> | null;
  securityPreferences?: Record<string, unknown> | null;
  securityQuestion1?: string | null;
  securityAnswer1?: string | null;
  securityQuestion2?: string | null;
  securityAnswer2?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsertUser {
  id?: string;
  email: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  passwordHash?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  dateOfBirth?: string | null;
  address?: Record<string, unknown> | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  occupation?: string | null;
  employer?: string | null;
  annualIncome?: string | null;
  profession?: string | null;
  identificationType?: string | null;
  identificationNumber?: string | null;
  kycStatus?: string | null;
  accountType?: string | null;
  preferredLanguage?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  accountNumber?: string | null;
  balance?: string | number;
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  transferPin?: string | null;
  notificationPreferences?: Record<string, unknown> | null;
  privacyPreferences?: Record<string, unknown> | null;
  displayPreferences?: Record<string, unknown> | null;
  securityPreferences?: Record<string, unknown> | null;
  securityQuestion1?: string | null;
  securityAnswer1?: string | null;
  securityQuestion2?: string | null;
  securityAnswer2?: string | null;
}

// ============================================================
// ACCOUNTS TABLE
// ============================================================

export type AccountType = 'checking' | 'savings' | 'investment' | 'business' | 'foreign_exchange';
export type AccountStatus = 'active' | 'frozen' | 'closed' | 'pending';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'CHF';

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  routingNumber?: string | null;
  iban?: string | null;
  swiftCode?: string | null;
  accountType: AccountType;
  currency: Currency;
  balance: string;
  availableBalance: string;
  status: AccountStatus;
  interestRate: string;
  minimumBalance: string;
  accountNickname?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsertAccount {
  id?: string;
  userId: string;
  accountNumber: string;
  routingNumber?: string | null;
  iban?: string | null;
  swiftCode?: string | null;
  accountType: AccountType;
  currency?: Currency;
  balance?: string;
  availableBalance?: string;
  status?: AccountStatus;
  interestRate?: string;
  minimumBalance?: string;
  accountNickname?: string | null;
  isPrimary?: boolean;
}

// ============================================================
// TRANSACTIONS TABLE
// ============================================================

export type TransactionType =
  | 'transfer' | 'deposit' | 'withdrawal' | 'payment'
  | 'loan_disbursement' | 'loan_repayment' | 'currency_exchange'
  | 'savings_deposit' | 'savings_withdrawal'
  | 'investment_buy' | 'investment_sell'
  | 'payment_request' | 'fee' | 'refund' | 'reversal' | 'admin_adjustment';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed' | 'cancelled';
export type TransactionCategory = 'food' | 'transport' | 'shopping' | 'healthcare' | 'entertainment' | 'utilities' | 'salary' | 'other';

export interface Transaction {
  id: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  amount: string;
  currency: string;
  exchangeRate?: string | null;
  convertedAmount?: string | null;
  transactionType: TransactionType;
  category?: TransactionCategory | null;
  status: TransactionStatus;
  description?: string | null;
  merchantName?: string | null;
  merchantCategory?: string | null;
  referenceNumber?: string | null;
  recipientName?: string | null;
  recipientCountry?: string | null;
  feeAmount?: string | null;
  metadata?: Record<string, unknown> | null;
  reversedBy?: string | null;
  reversalReason?: string | null;
  reversedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsertTransaction {
  id?: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  amount: string | number;
  currency?: string;
  exchangeRate?: string | null;
  convertedAmount?: string | null;
  transactionType: TransactionType;
  category?: TransactionCategory | null;
  status?: TransactionStatus;
  description?: string | null;
  merchantName?: string | null;
  merchantCategory?: string | null;
  referenceNumber?: string | null;
  recipientName?: string | null;
  recipientCountry?: string | null;
  feeAmount?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ============================================================
// CARDS TABLE
// ============================================================

export type CardType = 'debit' | 'credit' | 'prepaid';
export type CardStatus = 'active' | 'frozen' | 'expired' | 'cancelled';

export interface Card {
  id: string;
  accountId: string;
  cardNumber: string;
  cardType: CardType;
  brand?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  cardholderName: string;
  status: CardStatus;
  dailyLimit: string;
  monthlyLimit: string;
  isContactless: boolean;
  pinSet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsertCard {
  id?: string;
  accountId: string;
  cardNumber: string;
  cardType: CardType;
  brand?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  cardholderName: string;
  status?: CardStatus;
  dailyLimit?: string;
  monthlyLimit?: string;
  isContactless?: boolean;
  pinSet?: boolean;
}

// ============================================================
// INVESTMENTS TABLE
// ============================================================

export type InvestmentType = 'stock' | 'bond' | 'etf' | 'mutual_fund';
export type InvestmentStatus = 'active' | 'sold';

export interface Investment {
  id: string;
  userId: string;
  accountId: string;
  investmentType: InvestmentType;
  symbol: string;
  shares: string;
  purchasePrice: string;
  currentPrice: string;
  status: InvestmentStatus;
  soldAt?: string | null;
  salePrice?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsertInvestment {
  id?: string;
  userId: string;
  accountId: string;
  investmentType: InvestmentType;
  symbol: string;
  shares: string | number;
  purchasePrice: string | number;
  currentPrice?: string | number;
  status?: InvestmentStatus;
  soldAt?: string | null;
  salePrice?: string | null;
}

// ============================================================
// ADMIN ACTIONS TABLE
// ============================================================

export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface InsertAdminAction {
  id?: string;
  adminId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown>;
}

// ============================================================
// SUPPORT TICKETS TABLE
// ============================================================

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  userId: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string | null;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsertSupportTicket {
  id?: string;
  userId: string;
  ticketNumber?: string;
  subject: string;
  description: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string | null;
  assignedTo?: string | null;
}

// ============================================================
// MESSAGES TABLE
// ============================================================

export interface Message {
  id: string;
  userId: string;
  ticketId?: string | null;
  senderType: 'user' | 'admin' | 'system';
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface InsertMessage {
  id?: string;
  userId: string;
  ticketId?: string | null;
  senderType: 'user' | 'admin' | 'system';
  content: string;
  isRead?: boolean;
}

// ============================================================
// ALERTS TABLE
// ============================================================

export interface Alert {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category?: string | null;
  priority: string;
  isRead: boolean;
  readAt?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface InsertAlert {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category?: string | null;
  priority?: string;
  isRead?: boolean;
  readAt?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
}
