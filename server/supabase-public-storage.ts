import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import {
  type User,
  type InsertUser,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction
} from '@shared/schema';
import { IStorage } from './storage';

// ---------------- Supabase setup ----------------
const supabaseUrl = process.env.SUPABASE_URL || 'https://icbsxmrmorkdgxtumamu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Missing SUPABASE key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

console.log('🔗 Connected to Supabase public schema');
console.log('📊 Using ' + (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key'));

// ---------------- SupabasePublicStorage ----------------
export class SupabasePublicStorage implements IStorage {

  // -------- User Methods --------
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('username', username)
      .single();
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async createUser(data: InsertUser): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    let transferPinHash = '';
    if (data.transferPin) {
      transferPinHash = await bcrypt.hash(data.transferPin, 10);
    }

    const { data: user, error } = await supabase
      .from('bank_users')
      .insert({
        username: data.username,
        password_hash: passwordHash,
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
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.transferPin) {
      updateData.transferPinHash = await bcrypt.hash(updates.transferPin, 10);
      delete updateData.transferPin;
    }
    if (updates.password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 10);
      delete updateData.password;
    }
    const { data, error } = await supabase
      .from('bank_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('bank_users').select('*');
    if (error || !data) return [];
    return data.map(this.mapUser);
  }

  // -------- Account Methods --------
  async getUserAccounts(userId: number): Promise<Account[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('id');
    if (error || !data) return [];
    return data.map(this.mapAccount);
  }

  async createAccount(data: InsertAccount): Promise<Account> {
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
    if (error || !account) throw error || new Error('Failed to create account');
    return this.mapAccount(account);
  }

  // -------- Transaction Methods --------
  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const { data: txn, error } = await supabase
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
    if (error || !txn) throw error || new Error('Failed to create transaction');
    return this.mapTransaction(txn);
  }

  async getTransactions(accountId?: number): Promise<Transaction[]> {
    let query = supabase.from('transactions').select('*').order('date', { ascending: false });
    if (accountId) query = query.eq('account_id', accountId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(this.mapTransaction);
  }

  // -------- PIN verification --------
  async verifyPin(email: string, pin: string): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('bank_users')
      .select('transferPinHash')
      .eq('email', email)
      .single();
    if (error || !user || !user.transferPinHash) return false;
    return bcrypt.compare(pin, user.transferPinHash);
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
      balance: parseFloat(user.balance || '0'),
      createdAt: user.created_at,
      supabaseUserId: user.supabase_user_id,
      adminNotes: user.admin_notes,
      updatedAt: user.updated_at,
      avatarUrl: user.avatar_url,
      lastLogin: user.last_login
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
      accountId: transaction.account_id,
      amount: parseFloat(transaction.amount),
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      status: transaction.status,
      adminNotes: transaction.admin_notes,
      createdAt: transaction.date,
      updatedAt: transaction.updated_at
    };
  }

}
