/**
 * Supabase Public Schema Mapping Helpers
 * Maps between Drizzle schema and Supabase public schema tables
 */

import { User, Account, Transaction } from '@shared/schema';

export interface SupabaseUser {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
  phone?: string;
  profession?: string;
  account_id?: number;
  account_number?: string;
  balance?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  annual_income?: string;
  id_type?: string;
  id_number?: string;
  transfer_pin?: string;
  is_active: boolean;
  is_verified: boolean;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface SupabaseAccount {
  id: number;
  user_id: number;
  account_number: string;
  account_type: string;
  currency?: string;
  balance?: string;
  status?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SupabaseTransaction {
  id: number;
  from_account_id?: number;
  to_account_id?: number;
  amount: string;
  currency?: string;
  type: string;
  status?: string;
  description?: string;
  reference_number?: string;
  fee?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Map Supabase user row to application User type
 */
export function mapSupabaseUserToUser(row: SupabaseUser): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    phone: row.phone || null,
    profession: row.profession || null,
    accountId: row.account_id || 0,
    accountNumber: row.account_number || null,
    balance: row.balance || '0.00',
    dateOfBirth: row.date_of_birth || null,
    address: row.address || null,
    city: row.city || null,
    state: row.state || null,
    country: row.country || null,
    postalCode: row.postal_code || null,
    annualIncome: row.annual_income || null,
    idType: row.id_type || null,
    idNumber: row.id_number || null,
    transferPin: row.transfer_pin || null,
    isActive: row.is_active,
    isVerified: row.is_verified,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map application User to Supabase insert object
 */
export function mapUserToSupabaseInsert(user: Partial<User>): Partial<SupabaseUser> {
  return {
    email: user.email,
    password: user.password,
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    phone: user.phone,
    profession: user.profession,
    account_id: user.accountId,
    account_number: user.accountNumber,
    balance: user.balance,
    date_of_birth: user.dateOfBirth,
    address: user.address,
    city: user.city,
    state: user.state,
    country: user.country,
    postal_code: user.postalCode,
    annual_income: user.annualIncome,
    id_type: user.idType,
    id_number: user.idNumber,
    transfer_pin: user.transferPin,
    is_active: user.isActive || false,
    is_verified: user.isVerified || false,
    role: user.role || 'customer',
  };
}

/**
 * Map Supabase account row to application Account type
 */
export function mapSupabaseAccountToAccount(row: SupabaseAccount): Account {
  return {
    id: row.id,
    userId: row.user_id,
    accountNumber: row.account_number,
    accountType: row.account_type,
    currency: row.currency || 'USD',
    balance: row.balance || '0.00',
    status: row.status || 'active',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map application Account to Supabase insert object
 */
export function mapAccountToSupabaseInsert(account: Partial<Account>): Partial<SupabaseAccount> {
  return {
    user_id: account.userId,
    account_number: account.accountNumber,
    account_type: account.accountType,
    currency: account.currency || 'USD',
    balance: account.balance,
    status: account.status || 'active',
  };
}

/**
 * Map Supabase transaction row to application Transaction type
 */
export function mapSupabaseTransactionToTransaction(row: SupabaseTransaction): Transaction {
  return {
    id: row.id,
    fromAccountId: row.from_account_id,
    toAccountId: row.to_account_id,
    amount: row.amount,
    currency: row.currency || 'USD',
    type: row.type,
    status: row.status || 'pending',
    description: row.description || null,
    referenceNumber: row.reference_number || null,
    fee: row.fee || '0.00',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map application Transaction to Supabase insert object
 */
export function mapTransactionToSupabaseInsert(transaction: Partial<Transaction>): Partial<SupabaseTransaction> {
  return {
    from_account_id: transaction.fromAccountId,
    to_account_id: transaction.toAccountId,
    amount: transaction.amount,
    currency: transaction.currency || 'USD',
    type: transaction.type,
    status: transaction.status || 'pending',
    description: transaction.description,
    reference_number: transaction.referenceNumber,
    fee: transaction.fee,
  };
}
