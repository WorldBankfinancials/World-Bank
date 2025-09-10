import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import type {
  User,
  InsertUser,
  Account,
  InsertAccount,
  Transaction,
  InsertTransaction,
  AdminAction,
  InsertAdminAction,
  SupportTicket,
  InsertSupportTicket
} from '@shared/schema';
import { IStorage } from './storage';

// ---------------- Supabase Setup ----------------
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key missing in environment');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

console.log('🔗 Connected to Supabase public schema with realtime synchronization');

// ---------------- Storage Class ----------------
export class SupabasePublicStorage implements IStorage {

  // ---------------- Users ----------------
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase.from('bank_users').select('*').eq('id', id).single();
      if (error || !user) return undefined;
      return this.mapUser(user);
    } catch (err) {
      console.error('Error getting user:', err);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase.from('bank_users').select('*').eq('email', email).single();
      if (error || !user) return undefined;
      return this.mapUser(user);
    } catch (err) {
      console.error('Error getting user by email:', err);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase.from('bank_users').select('*').eq('username', username).single();
      if (error || !user) return undefined;
      return this.mapUser(user);
    } catch (err) {
      console.error('Error getting user by username:', err);
      return undefined;
    }
  }

  async createUser(data: InsertUser): Promise<User> {
    try {
      const transferPinHash = data.transferPin ? await bcrypt.hash(data.transferPin, 10) : '';
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
          transferPinHash,
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
      if (error || !user) throw error || new Error('Failed to create user');
      return this.mapUser(user);
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const updateData: any = { ...updates, updated_at: new Date().toISOString() };
      if (updates.transferPin) {
        updateData.transferPinHash = await bcrypt.hash(updates.transferPin, 10);
        delete updateData.transferPin;
      }
      const { data: user, error } = await supabase.from('bank_users').update(updateData).eq('id', id).select().single();
      if (error || !user) return undefined;
      return this.mapUser(user);
    } catch (err) {
      console.error('Error updating user:', err);
      return undefined;
    }
  }

  async verifyPin(email: string, pin: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase.from('bank_users').select('transferPinHash').eq('email', email).single();
      if (error || !user || !user.transferPinHash) return false;
      return await bcrypt.compare(pin, user.transferPinHash);
    } catch (err) {
      console.error('Error verifying PIN:', err);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await supabase.from('bank_users').select('*');
      if (error || !users) return [];
      return users.map(this.mapUser);
    } catch (err) {
      console.error('Error getting all users:', err);
      return [];
    }
  }

  // ---------------- Accounts ----------------
  async getUserAccounts(userId: number): Promise<Account[]> {
    try {
      const { data: accounts, error } = await supabase.from('bank_accounts').select('*').eq('user_id', userId).eq('is_active', true);
      if (error || !accounts) return [];
      return accounts.map(this.mapAccount);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      return [];
    }
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    try {
      const { data: account, error } = await supabase.from('bank_accounts').insert({
        user_id: data.userId,
        account_number: data.accountNumber,
        account_type: data.accountType,
        account_name: data.accountName,
        balance: data.balance,
        currency: data.currency || 'USD',
        is_active: data.isActive !== false
      }).select().single();
      if (error || !account) throw error || new Error('Failed to create account');
      return this.mapAccount(account);
    } catch (err) {
      console.error('Error creating account:', err);
      throw err;
    }
  }

  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const { data: account, error } = await supabase.from('bank_accounts').select('*').eq('id', id).single();
      if (error || !account) return undefined;
      return this.mapAccount(account);
    } catch (err) {
      console.error('Error fetching account:', err);
      return undefined;
    }
  }

  // ---------------- Transactions ----------------
  async createTransaction(data: {
    accountId: number;
    type: string;
    amount: string;
    currency?: string;
    description?: string;
    recipientName?: string;
    recipientCountry?: string;
    bankName?: string;
    swiftCode?: string;
    status?: 'pending' | 'approved' | 'rejected';
    date?: Date;
  }): Promise<Transaction> {
    try {
      const { data: transaction, error } = await supabase.from('transactions').insert({
        account_id: data.accountId,
        type: data.type,
        amount: data.amount,
        currency: data.currency || 'USD',
        description: data.description || '',
        recipient_name: data.recipientName || null,
        recipient_country: data.recipientCountry || null,
        bank_name: data.bankName || null,
        swift_code: data.swiftCode || null,
        status: data.status || 'pending',
        created_at: data.date ? data.date.toISOString() : new Date().toISOString()
      }).select().single();
      if (error || !transaction) throw error || new Error('Failed to create transaction');
      return this.mapTransaction(transaction);
    } catch (err) {
      console.error('Error creating transaction:', err);
      throw err;
    }
  }

  async updateTransactionStatus(
    transactionId: number,
    status: 'pending' | 'approved' | 'rejected',
    adminId: number,
    notes?: string
  ): Promise<Transaction | undefined> {
    try {
      const { data: transaction, error } = await supabase.from('transactions')
        .update({ status, updated_by_admin: adminId, admin_notes: notes })
        .eq('id', transactionId).select().single();
      if (error || !transaction) return undefined;
      return this.mapTransaction(transaction);
    } catch (err) {
      console.error('Error updating transaction status:', err);
      return undefined;
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase.from('transactions')
        .select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error || !transactions) return [];
      return transactions.map(this.mapTransaction);
    } catch (err) {
      console.error('Error fetching pending transactions:', err);
      return [];
    }
  }

  // ---------------- Admin Actions ----------------
  async createAdminAction(data: InsertAdminAction): Promise<AdminAction> {
    try {
      const { data: action, error } = await supabase.from('admin_actions')
        .insert(data).select().single();
      if (error || !action) throw error || new Error('Failed to create admin action');
      return action;
    } catch (err) {
      console.error('Error creating admin action:', err);
      throw err;
    }
  }

  // ---------------- Support Tickets ----------------
  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const { data: ticket, error } = await supabase.from('support_tickets')
        .insert(data).select().single();
      if (error || !ticket) throw error || new Error('Failed to create support ticket');
      return ticket;
    } catch (err) {
      console.error('Error creating support ticket:', err);
      throw err;
    }
  }

  // ---------------- Mappers ----------------
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
      fromAccountId: transaction.account_id,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      description: transaction.description,
      transactionType: transaction.type,
      status: transaction.status,
      recipientName: transaction.recipient_name,
      recipientCountry: transaction.recipient_country,
      bankName: transaction.bank_name,
      swiftCode: transaction.swift_code,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    };
  }
}
