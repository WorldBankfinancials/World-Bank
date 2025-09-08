import { createClient } from '@supabase/supabase-js';
import bcrypt from "bcryptjs";
import {
  type User,
  type InsertUser,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction,
  type AdminAction,
  type InsertAdminAction,
  type SupportTicket,
  type InsertSupportTicket
} from "@shared/schema";
import { IStorage } from "./storage";

// Supabase configuration for public schema with realtime
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://icbsxmrmorkdgxtumamu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Supabase client for direct database access to public schema
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

console.log('🔗 Connected to Supabase public schema with realtime synchronization');
console.log('📊 Database URL:', supabaseUrl);
console.log('🔐 Using service role for admin operations');

export class SupabasePublicStorage implements IStorage {

  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !user) return undefined;

      return this.mapUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) return undefined;

      return this.mapUser(user);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('supabase_user_id', supabaseUserId)
        .single();

      if (error || !user) return undefined;

      return this.mapUser(user);
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    try {
      const { data: accounts, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('id');

      if (error || !accounts) return [];
      return accounts.map(this.mapAccount);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  async getAccounts(userId?: number): Promise<Account[]> {
    try {
      let query = supabase.from('bank_accounts').select('*').eq('is_active', true);
      if (userId) query = query.eq('user_id', userId);
      const { data: accounts, error } = await query.order('id');
      if (error || !accounts) return [];
      return accounts.map(this.mapAccount);
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          account_id: data.accountId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          category: data.category,
          status: data.status || 'pending',
          date: data.date || new Date().toISOString(),
          admin_notes: data.adminNotes
        })
        .select()
        .single();

      if (error || !transaction) {
        throw error || new Error('Failed to create transaction');
      }

      return this.mapTransaction(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async getTransactions(accountId?: number): Promise<Transaction[]> {
    try {
      let query = supabase.from('transactions').select('*');
      if (accountId) {
        query = query.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);
      }
      const { data: transactions, error } = await query.order('created_at', { ascending: false });
      if (error || !transactions) return [];
      return transactions.map(this.mapTransaction);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Secure PIN verification using bcrypt. NEVER checks plaintext PIN.
   */
  async verifyPin(email: string, pin: string): Promise<boolean> {
    try {
      // Only query for transferPinHash (never transfer_pin)
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('transferPinHash')
        .eq('email', email)
        .single();

      if (error || !user || !user.transferPinHash) return false;

      const valid = await bcrypt.compare(pin, user.transferPinHash);
      return valid;
    } catch (error) {
      console.error('Error verifying PIN:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  // Additional IStorage interface methods (stub implementations)
  async getAllUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await supabase
        .from('bank_users')
        .select('*');

      if (error || !users) return [];
      return users.map(this.mapUser);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) return undefined;
      return this.mapUser(user);
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(data: InsertUser): Promise<User> {
    try {
      // Always hash PIN before storing!
      let transferPinHash = "";
      if (data.transferPin) {
        transferPinHash = await bcrypt.hash(data.transferPin, 10);
      }
      const { data: user, error } = await supabase
        .from('bank_users')
        .insert({
          username: data.username,
          password_hash: data.password,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          account_number: data.accountNumber,
          account_id: data.accountId,
          profession: data.profession,
          date_of_birth: data.dateOfBirth,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postal_code: data.postalCode,
          nationality: data.nationality,
          annual_income: data.annualIncome,
          id_type: data.idType,
          id_number: data.idNumber,
          transferPinHash, // Store hash only!
          role: data.role || 'customer',
          is_verified: data.isVerified || false,
          is_online: data.isOnline || false,
          is_active: data.isActive || false,
          balance: data.balance || 0,
          supabase_user_id: data.supabaseUserId,
          admin_notes: data.adminNotes
        })
        .select()
        .single();

      if (error || !user) {
        throw error || new Error('Failed to create user');
      }

      return this.mapUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Hash PIN if update includes new transferPin
      let updateData = { ...updates, updated_at: new Date().toISOString() };
      if (updates.transferPin) {
        updateData.transferPinHash = await bcrypt.hash(updates.transferPin, 10);
        delete updateData.transferPin;
      }
      const { data: user, error } = await supabase
        .from('bank_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !user) return undefined;
      return this.mapUser(user);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    try {
      const { data: account, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: data.userId,
          account_number: data.accountNumber,
          account_type: data.accountType,
          account_name: data.accountName,
          balance: data.balance,
          currency: data.currency || 'USD',
          is_active: data.isActive !== false
        })
        .select()
        .single();

      if (error || !account) {
        throw error || new Error('Failed to create account');
      }

      return this.mapAccount(account);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // ... other methods unchanged ...

  // ------------ Mappers (only expose safe fields) ------------
  private mapUser(user: any): User {
    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      accountNumber: user.account_number,
      accountId: user.account_id,
      profession: user.profession,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postal_code,
      nationality: user.nationality,
      annualIncome: user.annual_income,
      idType: user.id_type,
      idNumber: user.id_number,
      role: user.role,
      isVerified: user.is_verified,
      isOnline: user.is_online,
      isActive: user.is_active,
      avatarUrl: user.avatar_url,
      balance: parseFloat(user.balance || '0'),
      createdAt: user.created_at,
      supabaseUserId: user.supabase_user_id,
      lastLogin: user.last_login,
      createdByAdmin: user.created_by_admin,
      modifiedByAdmin: user.modified_by_admin,
      adminNotes: user.admin_notes,
      updatedAt: user.updated_at
      // EXCLUDES: password_hash, transferPin, transferPinHash
    };
  }

  private mapAccount(account: any): Account {
    return {
      id: account.id,
      userId: account.user_id,
      accountNumber: account.account_number,
      accountType: account.account_type,
      accountName: account.account_name,
      balance: account.balance.toString(),
      currency: account.currency,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    };
  }

  private mapTransaction(transaction: any): Transaction {
    return {
      id: transaction.id,
      fromAccountId: transaction.from_account_id,
      toAccountId: transaction.to_account_id,
      fromAccountNumber: transaction.from_account_number,
      toAccountNumber: transaction.to_account_number,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      description: transaction.description,
      transactionType: transaction.transaction_type,
      status: transaction.status,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    };
  }

  // ... other unchanged methods ...
}
