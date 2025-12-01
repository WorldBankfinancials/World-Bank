/**
 * UNIFIED SYNC STORAGE - Supabase REST API + Memory Cache
 * Uses Supabase REST API (works from Replit) + instant memory cache
 * Direct Postgres connection fails on Replit (network unreachable)
 */

import { createClient } from '@supabase/supabase-js';
import type { IStorage } from "./storage";
import type { User, Account, Transaction, AdminAction, SupportTicket, Card, Investment, Message, Alert, InsertUser, InsertAccount, InsertTransaction, InsertAdminAction, InsertSupportTicket } from "@shared/schema";

// Supabase client - WORKS from Replit (REST API)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials required');
const supabase = createClient(supabaseUrl, supabaseKey);

// Memory Cache (INSTANT - <0.1ms)
const memCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class UnifiedSyncStorage implements IStorage {
  private getCache(key: string): any {
    const item = memCache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > CACHE_TTL) {
      memCache.delete(key);
      return null;
    }
    return item.value;
  }

  private setCache(key: string, value: any): void {
    memCache.set(key, { value, timestamp: Date.now() });
  }

  // ==================== USER OPERATIONS ====================
  async getUser(id: number): Promise<User | undefined> {
    const cacheKey = `user:${id}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      const user = data as any as User;
      this.setCache(cacheKey, user);
      return user;
    } catch (error) {
      console.error('❌ getUser error:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const cacheKey = `user:email:${email}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !data) return undefined;
      const user = data as any as User;
      this.setCache(cacheKey, user);
      return user;
    } catch (error) {
      console.error('❌ getUserByEmail error:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error || !data) return undefined;
      return data as any as User;
    } catch (error) {
      console.error('❌ getUserByUsername error:', error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (error || !data) return undefined;
      return data as any as User;
    } catch (error) {
      return undefined;
    }
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('supabase_id', supabaseUserId)
        .single();
      
      if (error || !data) return undefined;
      return data as any as User;
    } catch (error) {
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error || !data) return [];
      return data as any as User[];
    } catch (error) {
      return [];
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .insert([{
          username: user.username || '',
          email: user.email || '',
          password: user.password || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          phone: user.phone || '',
          date_of_birth: user.dateOfBirth || null,
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          country: user.country || '',
          postal_code: user.postalCode || '',
          profession: user.profession || '',
          annual_income: user.annualIncome || '',
          id_type: user.idType || '',
          id_number: user.idNumber || '',
          account_number: user.accountNumber || '',
          account_id: user.accountId || Date.now(),
          balance: user.balance || '0',
          is_verified: user.isVerified || false,
          is_active: user.isActive || false,
          transfer_pin: user.transferPin || '',
          role: user.role || 'customer'
        }])
        .select()
        .single();

      if (error || !data) throw error;
      const newUser = data as any as User;
      this.setCache(`user:${newUser.id}`, newUser);
      return newUser;
    } catch (error: any) {
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .update(user as any)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      const updated = data as any as User;
      memCache.delete(`user:${id}`);
      return updated;
    } catch (error) {
      return undefined;
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .update({ balance: amount.toString() })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      const updated = data as any as User;
      memCache.delete(`user:${id}`);
      return updated;
    } catch (error) {
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    const cacheKey = `accounts:user:${userId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];
      const accounts = data as any as Account[];
      this.setCache(cacheKey, accounts);
      return accounts;
    } catch (error) {
      return [];
    }
  }

  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as any as Account;
    } catch (error) {
      return undefined;
    }
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
          user_id: account.userId || 0,
          account_number: account.accountNumber || '',
          account_type: account.accountType || 'checking',
          balance: account.balance || '0.00',
          currency: account.currency || 'USD',
          status: account.status || 'active'
        }])
        .select()
        .single();

      if (error || !data) throw error;
      memCache.delete(`accounts:user:${account.userId}`);
      return data as any as Account;
    } catch (error: any) {
      throw error;
    }
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      return data as any as Account;
    } catch (error) {
      return undefined;
    }
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as any as Transaction;
    } catch (error) {
      return undefined;
    }
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) return [];
      return data as any as Transaction[];
    } catch (error) {
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error || !data) return [];
      return data as any as Transaction[];
    } catch (error) {
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .insert([{
          from_account_id: transaction.fromAccountId || 0,
          to_account_id: transaction.toAccountId || 0,
          amount: transaction.amount || '0',
          type: transaction.type || 'transfer',
          status: transaction.status || 'pending',
          reference_number: transaction.referenceNumber || '',
          description: transaction.description || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error || !data) throw error;
      return data as any as Transaction;
    } catch (error: any) {
      throw error;
    }
  }

  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    try {
      const { data, error } = await supabase
        .from('bank_admin_actions')
        .insert([{
          admin_id: action.adminId || 0,
          action_type: (action as any).actionType || 'unknown',
          target_id: action.targetId || 0,
          details: (action as any).details || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error || !data) throw error;
      return data as any as AdminAction;
    } catch (error: any) {
      throw error;
    }
  }

  // ==================== STUB IMPLEMENTATIONS ====================
  async getAlert(id: number): Promise<Alert | undefined> { return undefined; }
  async getUserAlerts(userId: number): Promise<Alert[]> { return []; }
  async getUnreadAlerts(userId: number): Promise<Alert[]> { return []; }
  async createAlert(alert: any): Promise<Alert> { throw new Error('Not implemented'); }
  async markAlertAsRead(id: number): Promise<Alert | undefined> { return undefined; }
  async deleteAlert(id: number): Promise<void> {}
  async getCard(id: number): Promise<Card | undefined> { return undefined; }
  async getUserCards(userId: number): Promise<Card[]> { return []; }
  async createCard(card: any): Promise<Card> { throw new Error('Not implemented'); }
  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> { return undefined; }
  async getInvestment(id: number): Promise<Investment | undefined> { return undefined; }
  async getUserInvestments(userId: number): Promise<Investment[]> { return []; }
  async createInvestment(investment: any): Promise<Investment> { throw new Error('Not implemented'); }
  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> { return undefined; }
  async getMessage(id: string): Promise<Message | undefined> { return undefined; }
  async getMessages(conversationId?: string): Promise<Message[]> { return []; }
  async getUserMessages(userId: number): Promise<Message[]> { return []; }
  async createMessage(message: any): Promise<Message> { throw new Error('Not implemented'); }
  async markMessageAsRead(id: number): Promise<Message | undefined> { return undefined; }
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> { return undefined; }
  async getSupportTickets(userId?: number): Promise<SupportTicket[]> { return []; }
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> { throw new Error('Not implemented'); }
  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> { return undefined; }
  async getBranches(): Promise<any[]> { return []; }
  async getAtms(): Promise<any[]> { return []; }
  async getExchangeRates(): Promise<any[]> { return []; }
  async getStatementsByUserId(userId: number): Promise<any[]> { return []; }
  async getMarketRates(): Promise<any[]> { return []; }
  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> { return undefined; }
  async getPendingTransactions(): Promise<Transaction[]> { return []; }
  async getAdminActions(adminId?: number): Promise<AdminAction[]> { return []; }
}
