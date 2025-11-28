/**
 * COMPREHENSIVE TYPE DEFINITIONS
 * Replaces all `any` types with proper types
 */

export interface Card {
  id: string | number;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  balance?: number | string;
  dailyLimit?: number | string;
  isLocked?: boolean;
  type?: string;
  name?: string;
  number?: string;
  contactlessEnabled?: boolean;
}

export interface Investment {
  id: string | number;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  total_value?: number | string;
  totalValue?: number | string;
  gain_loss?: number | string;
  gainLoss?: number | string;
  purchaseDate?: string;
  trend?: 'up' | 'down';
}

export interface AccountData {
  id: number | string;
  accountType?: string;
  account_type?: string;
  accountName?: string;
  balance: number | string;
  currency?: string;
  isActive?: boolean;
}

export interface TransactionData {
  id: string | number;
  type: 'credit' | 'debit';
  amount: string | number;
  description: string;
  date?: string;
  created_at?: string;
  createdAt?: string;
  status?: string;
  recipientName?: string;
  bankName?: string;
  category?: string;
  reference?: string;
}

export interface CustomerData {
  id: number | string;
  fullName?: string;
  email?: string;
  accountNumber?: string;
  accountId?: string;
  balance?: number | string;
  status?: string;
  createdAt?: string;
  isActive?: boolean;
  role?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
