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
  password?: string | null;
  passwordHash?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  dateOfBirth?: string | null;
  address?: Record<string, unknown> | string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  occupation?: string | null;
  employer?: string | null;
  annualIncome?: string | null;
  profession?: string | null;
  identificationType?: string | null;
  idType?: string | null;
  identificationNumber?: string | null;
  idNumber?: string | null;
  kycStatus?: string | null;
  accountType?: string | null;
  preferredLanguage?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  accountNumber?: string | null;
  accountId?: string | null;
  balance?: string | number;
  role: UserRole;
  status?: string | null;
  isActive: boolean;
  isVerified: boolean;
  transferPin?: string | null;
  lastLogin?: string | null;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
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
  password?: string | null;
  passwordHash?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  dateOfBirth?: string | null;
  address?: Record<string, unknown> | string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  occupation?: string | null;
  employer?: string | null;
  annualIncome?: string | null;
  profession?: string | null;
  identificationType?: string | null;
  idType?: string | null;
  identificationNumber?: string | null;
  idNumber?: string | null;
  kycStatus?: string | null;
  accountType?: string | null;
  preferredLanguage?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  accountNumber?: string | null;
  accountId?: string | null;
  balance?: string | number;
  role?: UserRole;
  status?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  transferPin?: string | null;
  lastLogin?: string | null;
  profilePhoto?: string | null;
  avatarUrl?: string | null;
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
  availableBalance?: string;
  status: AccountStatus;
  interestRate?: string;
  minimumBalance?: string;
  accountNickname?: string | null;
  isPrimary?: boolean;
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
  | 'payment_request' | 'fee' | 'refund' | 'reversal' | 'admin_adjustment'
  | 'international' | 'debit' | 'credit' | 'mobile_pay' | 'exchange';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed' | 'cancelled' | 'success';
export type TransactionCategory = 'food' | 'transport' | 'shopping' | 'healthcare' | 'entertainment' | 'utilities' | 'salary' | 'other';

export interface Transaction {
  id: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  fromUserId?: string | null;
  toUserId?: string | null;
  amount: string;
  currency: string;
  exchangeRate?: string | null;
  convertedAmount?: string | null;
  transactionType: TransactionType;
  type?: string | null;
  category?: TransactionCategory | string | null;
  status: TransactionStatus;
  description?: string | null;
  merchantName?: string | null;
  merchantCategory?: string | null;
  referenceNumber?: string | null;
  recipientName?: string | null;
  recipientAccount?: string | null;
  recipientCountry?: string | null;
  bankName?: string | null;
  swiftCode?: string | null;
  transferPurpose?: string | null;
  feeAmount?: string | null;
  fee?: string | number | null;
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
  fromUserId?: string | null;
  toUserId?: string | null;
  amount: string | number;
  currency?: string;
  exchangeRate?: string | null;
  convertedAmount?: string | null;
  transactionType: TransactionType;
  type?: string | null;
  category?: TransactionCategory | string | null;
  status?: TransactionStatus;
  description?: string | null;
  merchantName?: string | null;
  merchantCategory?: string | null;
  referenceNumber?: string | null;
  recipientName?: string | null;
  recipientAccount?: string | null;
  recipientCountry?: string | null;
  bankName?: string | null;
  swiftCode?: string | null;
  transferPurpose?: string | null;
  feeAmount?: string | null;
  fee?: string | number | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | Date;
}

// ============================================================
// CARDS TABLE
// ============================================================

export type CardType = 'debit' | 'credit' | 'prepaid';
export type CardStatus = 'active' | 'frozen' | 'expired' | 'cancelled' | 'locked';

export interface Card {
  id: string;
  accountId: string;
  userId?: string;
  cardNumber: string;
  cardType: CardType;
  type?: string | null;
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
  userId?: string;
  cardNumber: string;
  cardType: CardType;
  type?: string | null;
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
export type InvestmentStatus = 'active' | 'sold' | 'pending';

export interface Investment {
  id: string;
  userId: string;
  accountId: string;
  investmentType: InvestmentType;
  assetType?: string | null;
  type?: string | null;
  symbol: string;
  shares: string;
  purchasePrice: string;
  averagePrice?: string | null;
  currentPrice: string;
  totalValue?: string | number | null;
  gainLoss?: string | number | null;
  amount?: string | number | null;
  rate?: string | number | null;
  status: InvestmentStatus;
  soldAt?: string | null;
  salePrice?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsertInvestment {
  id?: string;
  userId: string;
  accountId?: string;
  investmentType?: InvestmentType;
  assetType?: string | null;
  type?: string | null;
  symbol: string;
  shares: string | number;
  purchasePrice: string | number;
  averagePrice?: string | number | null;
  currentPrice?: string | number;
  totalValue?: string | number | null;
  gainLoss?: string | number | null;
  amount?: string | number | null;
  rate?: string | number | null;
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
  actionType?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  description?: string | null;
  details?: Record<string, unknown> | string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface InsertAdminAction {
  id?: string;
  adminId: string;
  action: string;
  actionType?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  description?: string | null;
  details?: Record<string, unknown> | string;
  metadata?: Record<string, unknown> | null;
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
  ticketId?: string | null;
  subject: string;
  description: string;
  status?: TicketStatus | string;
  priority?: TicketPriority | string;
  category?: string | null;
  assignedTo?: string | null;
}

// ============================================================
// MESSAGES TABLE
// ============================================================

export type MessageType = 'text' | 'image' | 'file' | 'system';
export type MessageSenderRole = 'admin' | 'customer' | 'agent';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: MessageSenderRole;
  message: string;
  messageType?: MessageType | null;
  isRead: boolean;
  readAt?: string | null;
  conversationId?: string | null;
  replyTo?: string | null;
  recipientId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface InsertMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole?: MessageSenderRole;
  message: string;
  messageType?: MessageType | null;
  isRead?: boolean;
  conversationId?: string | null;
  replyTo?: string | null;
  recipientId?: string | null;
  metadata?: Record<string, unknown> | null;
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
