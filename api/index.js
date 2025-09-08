import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL!;
if (!databaseUrl) throw new Error('Missing DATABASE_URL environment variable');

const connection = postgres(databaseUrl);
const db = drizzle(connection);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class SupabaseStorage implements IStorage {
  // --- Secure User Lookup ---
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return undefined;
    return this.mapSafeUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('username', username)
      .single();
    if (error || !data) return undefined;
    return this.mapSafeUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !data) return undefined;
    return this.mapSafeUser(data);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(user => this.mapSafeUser(user));
  }

  // --- Secure User Creation ---
  async createUser(user: InsertUser): Promise<User> {
    let transferPinHash = '';
    if (user.transferPin) {
      transferPinHash = await bcrypt.hash(user.transferPin, 10);
    }
    const { data, error } = await supabase
      .from('bank_users')
      .insert({
        username: user.username,
        password_hash: user.password,
        full_name: user.fullName,
        email: user.email,
        phone: user.phone,
        account_number: user.accountNumber,
        account_id: user.accountId,
        profession: user.profession,
        date_of_birth: user.dateOfBirth,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        postal_code: user.postalCode,
        nationality: user.nationality,
        annual_income: user.annualIncome,
        id_type: user.idType,
        id_number: user.idNumber,
        transferPinHash, // Store hash only!
        role: user.role || 'customer',
        is_verified: user.isVerified || false,
        is_online: user.isOnline || false,
        is_active: user.isActive ?? true,
        avatar_url: user.avatarUrl,
        balance: user.balance?.toString() || '0.00',
        supabase_user_id: user.supabaseUserId
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.mapSafeUser(data);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const updateData: any = { ...updates };
    if (updates.transferPin) {
      updateData.transferPinHash = await bcrypt.hash(updates.transferPin, 10);
      delete updateData.transferPin;
    }
    const { data, error } = await supabase
      .from('bank_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return this.mapSafeUser(data);
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .update({ balance: amount.toString() })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return this.mapSafeUser(data);
  }

  // --- Secure PIN Verification ---
  async verifyPin(email: string, pin: string): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('bank_users')
      .select('transferPinHash')
      .eq('email', email)
      .single();
    if (error || !user || !user.transferPinHash) return false;
    return await bcrypt.compare(pin, user.transferPinHash);
  }

  // --- Secure Account & Transaction Methods ---
  async getUserAccounts(userId: number): Promise<Account[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data.map(account => this.mapAccount(account));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return undefined;
    return this.mapAccount(data);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: account.userId,
        account_number: account.accountNumber,
        account_type: account.accountType,
        balance: account.balance.toString(),
        currency: account.currency || 'USD',
        is_active: account.isActive ?? true
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create account: ${error.message}`);
    return this.mapAccount(data);
  }

  async getAccountTransactions(accountId: number, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(tx => this.mapTransaction(tx));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        transaction_id: transaction.transactionId,
        from_user_id: transaction.fromUserId,
        to_user_id: transaction.toUserId,
        from_account_id: transaction.fromAccountId,
        to_account_id: transaction.toAccountId,
        amount: transaction.amount.toString(),
        currency: transaction.currency || 'USD',
        transaction_type: transaction.transactionType,
        status: transaction.status,
        description: transaction.description,
        recipient_name: transaction.recipientName,
        recipient_account: transaction.recipientAccount,
        reference_number: transaction.referenceNumber,
        fee: transaction.fee?.toString() || '0.00',
        exchange_rate: transaction.exchangeRate?.toString(),
        country_code: transaction.countryCode,
        bank_name: transaction.bankName,
        swift_code: transaction.swiftCode,
        admin_notes: transaction.adminNotes
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create transaction: ${error.message}`);
    return this.mapTransaction(data);
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return this.mapTransaction(data);
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(tx => this.mapTransaction(tx));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(tx => this.mapTransaction(tx));
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update({
        balance: updates.balance?.toString(),
        is_active: updates.isActive,
        account_type: updates.accountType
      })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return this.mapAccount(data);
  }

  // --- Safe Mappers ---
  private mapSafeUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      accountNumber: data.account_number,
      accountId: data.account_id,
      profession: data.profession,
      dateOfBirth: data.date_of_birth,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postal_code,
      nationality: data.nationality,
      annualIncome: data.annual_income,
      idType: data.id_type,
      idNumber: data.id_number,
      role: data.role,
      isVerified: data.is_verified,
      isOnline: data.is_online,
      isActive: data.is_active,
      avatarUrl: data.avatar_url,
      balance: parseFloat(data.balance || '0'),
      createdAt: data.created_at,
      supabaseUserId: data.supabase_user_id
      // EXCLUDES: password_hash, transfer_pin, transferPinHash
    };
  }

  private mapAccount(data: any): Account {
    return {
      id: data.id,
      userId: data.user_id,
      accountNumber: data.account_number,
      accountType: data.account_type,
      balance: parseFloat(data.balance),
      currency: data.currency,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapTransaction(data: any): Transaction {
    return {
      id: data.id,
      transactionId: data.transaction_id,
      fromUserId: data.from_user_id,
      toUserId: data.to_user_id,
      fromAccountId: data.from_account_id,
      toAccountId: data.to_account_id,
      amount: parseFloat(data.amount),
      currency: data.currency,
      transactionType: data.transaction_type,
      status: data.status,
      description: data.description,
      recipientName: data.recipient_name,
      recipientAccount: data.recipient_account,
      referenceNumber: data.reference_number,
      fee: data.fee ? parseFloat(data.fee) : 0,
      exchangeRate: data.exchange_rate ? parseFloat(data.exchange_rate) : undefined,
      countryCode: data.country_code,
      bankName: data.bank_name,
      swiftCode: data.swift_code,
      adminNotes: data.admin_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
