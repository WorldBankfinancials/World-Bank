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
      
      if (error) {
        console.error(`❌ getUser(${id}) error:`, error.message);
        return undefined;
      }
      if (!data) return undefined;
      const user = this.mapDatabaseToUser(data);
      this.setCache(cacheKey, user);
      return user;
    } catch (error) {
      console.error(`❌ getUser(${id}) catch:`, error);
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
      
      if (error) {
        console.error(`❌ getUserByEmail(${email}) error:`, error.message);
        return undefined;
      }
      if (!data) {
        console.warn(`⚠️ getUserByEmail(${email}): No user found`);
        return undefined;
      }
      const user = this.mapDatabaseToUser(data);
      this.setCache(cacheKey, user);
      console.log(`✅ getUserByEmail(${email}): Success`);
      return user;
    } catch (error) {
      console.error(`❌ getUserByEmail(${email}) catch:`, error);
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
      
      if (error) {
        console.error(`❌ getUserByUsername(${username}) error:`, error.message);
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToUser(data);
    } catch (error) {
      console.error(`❌ getUserByUsername(${username}) catch:`, error);
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
      
      if (error) {
        console.error(`❌ getUserByPhone(${phone}) error:`, error.message);
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToUser(data);
    } catch (error) {
      console.error(`❌ getUserByPhone catch:`, error);
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
      
      if (error) {
        console.error(`❌ getUserBySupabaseId(${supabaseUserId}) error:`, error.message);
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToUser(data);
    } catch (error) {
      console.error(`❌ getUserBySupabaseId catch:`, error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ getAllUsers error:', error.message);
        return [];
      }
      if (!data) return [];
      return data.map(row => this.mapDatabaseToUser(row));
    } catch (error) {
      console.error('❌ getAllUsers catch:', error);
      return [];
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const dbRow = {
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
        balance: user.balance || '0.00',
        is_verified: user.isVerified || false,
        is_active: user.isActive || false,
        transfer_pin: user.transferPin || '',
        role: user.role || 'customer'
      };

      const { data, error } = await supabase
        .from('bank_users')
        .insert([dbRow])
        .select()
        .single();

      if (error) {
        console.error('❌ createUser Supabase error:', error);
        throw error;
      }
      if (!data) throw new Error('No data returned from insert');
      
      const newUser = this.mapDatabaseToUser(data);
      console.log('✅ createUser success:', newUser.email);
      return newUser;
    } catch (error: any) {
      console.error('❌ createUser error:', error.message);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    try {
      const dbUpdate: any = {};
      if (user.firstName) dbUpdate.first_name = user.firstName;
      if (user.lastName) dbUpdate.last_name = user.lastName;
      if (user.email) dbUpdate.email = user.email;
      if (user.phone) dbUpdate.phone = user.phone;
      if (user.transferPin !== undefined) dbUpdate.transfer_pin = user.transferPin;
      if (user.isActive !== undefined) dbUpdate.is_active = user.isActive;
      if (user.isVerified !== undefined) dbUpdate.is_verified = user.isVerified;

      const { data, error } = await supabase
        .from('bank_users')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`❌ updateUser(${id}) error:`, error);
        return undefined;
      }
      if (!data) return undefined;
      const updated = this.mapDatabaseToUser(data);
      memCache.delete(`user:${id}`);
      memCache.delete(`user:email:${updated.email}`);
      return updated;
    } catch (error) {
      console.error(`❌ updateUser catch:`, error);
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

      if (error) {
        console.error(`❌ updateUserBalance(${id}) error:`, error);
        return undefined;
      }
      if (!data) return undefined;
      const updated = this.mapDatabaseToUser(data);
      memCache.delete(`user:${id}`);
      return updated;
    } catch (error) {
      console.error(`❌ updateUserBalance catch:`, error);
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

      if (error) {
        console.error(`❌ getUserAccounts(${userId}) error:`, error.message);
        return [];
      }
      if (!data) return [];
      const accounts = data.map(row => this.mapDatabaseToAccount(row));
      this.setCache(cacheKey, accounts);
      console.log(`✅ getUserAccounts(${userId}): ${accounts.length} accounts`);
      return accounts;
    } catch (error) {
      console.error(`❌ getUserAccounts catch:`, error);
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

      if (error) {
        console.error(`❌ getAccount(${id}) error:`, error.message);
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToAccount(data);
    } catch (error) {
      console.error(`❌ getAccount catch:`, error);
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

      if (error) {
        console.error('❌ createAccount error:', error);
        throw error;
      }
      if (!data) throw new Error('No data returned');
      memCache.delete(`accounts:user:${account.userId}`);
      return this.mapDatabaseToAccount(data);
    } catch (error: any) {
      console.error('❌ createAccount catch:', error.message);
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

      if (error) {
        console.error(`❌ updateAccount(${id}) error:`, error);
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToAccount(data);
    } catch (error) {
      console.error(`❌ updateAccount catch:`, error);
      return undefined;
    }
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`❌ getTransaction(${id}) error:`, error.message);
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToTransaction(data);
    } catch (error) {
      console.error(`❌ getTransaction catch:`, error);
      return undefined;
    }
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error(`❌ getAccountTransactions(${accountId}) error:`, error.message);
        return [];
      }
      if (!data) return [];
      console.log(`✅ getAccountTransactions(${accountId}): ${data.length} transactions`);
      return data.map(row => this.mapDatabaseToTransaction(row));
    } catch (error) {
      console.error(`❌ getAccountTransactions catch:`, error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('❌ getAllTransactions error:', error.message);
        return [];
      }
      if (!data) return [];
      return data.map(row => this.mapDatabaseToTransaction(row));
    } catch (error) {
      console.error('❌ getAllTransactions catch:', error);
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
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

      if (error) {
        console.error('❌ createTransaction error:', error);
        throw error;
      }
      if (!data) throw new Error('No data returned');
      return this.mapDatabaseToTransaction(data);
    } catch (error: any) {
      console.error('❌ createTransaction catch:', error.message);
      throw error;
    }
  }

  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .insert([{
          admin_id: action.adminId || 0,
          action_type: (action as any).actionType || 'unknown',
          target_id: action.targetId || 0,
          details: (action as any).details || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ createAdminAction error:', error);
        throw error;
      }
      if (!data) throw new Error('No data returned');
      return data as any as AdminAction;
    } catch (error: any) {
      console.error('❌ createAdminAction catch:', error.message);
      throw error;
    }
  }

  // ==================== DATA MAPPERS ====================
  private mapDatabaseToUser(dbRow: any): User {
    return {
      id: dbRow.id,
      email: dbRow.email,
      password: dbRow.password,
      firstName: dbRow.first_name,
      lastName: dbRow.last_name,
      username: dbRow.username,
      phone: dbRow.phone,
      profession: dbRow.profession,
      accountId: dbRow.account_id,
      accountNumber: dbRow.account_number,
      balance: dbRow.balance,
      dateOfBirth: dbRow.date_of_birth,
      address: dbRow.address,
      city: dbRow.city,
      state: dbRow.state,
      country: dbRow.country,
      postalCode: dbRow.postal_code,
      annualIncome: dbRow.annual_income,
      idType: dbRow.id_type,
      idNumber: dbRow.id_number,
      transferPin: dbRow.transfer_pin,
      lastLogin: dbRow.last_login,
      isActive: dbRow.is_active,
      isVerified: dbRow.is_verified,
      role: dbRow.role,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  private mapDatabaseToAccount(dbRow: any): Account {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      accountNumber: dbRow.account_number,
      accountType: dbRow.account_type,
      balance: dbRow.balance,
      currency: dbRow.currency,
      status: dbRow.status,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  private mapDatabaseToTransaction(dbRow: any): Transaction {
    return {
      id: dbRow.id,
      fromAccountId: dbRow.from_account_id,
      toAccountId: dbRow.to_account_id,
      fromUserId: dbRow.from_user_id,
      toUserId: dbRow.to_user_id,
      transactionId: dbRow.transaction_id,
      transactionType: dbRow.transaction_type,
      amount: dbRow.amount,
      currency: dbRow.currency,
      type: dbRow.type,
      status: dbRow.status,
      description: dbRow.description,
      referenceNumber: dbRow.reference_number,
      fee: dbRow.fee,
      exchangeRate: dbRow.exchange_rate,
      countryCode: dbRow.country_code,
      recipientName: dbRow.recipient_name,
      recipientAccount: dbRow.recipient_account,
      recipientAddress: dbRow.recipient_address,
      recipientCountry: dbRow.recipient_country,
      bankName: dbRow.bank_name,
      swiftCode: dbRow.swift_code,
      transferPurpose: dbRow.transfer_purpose,
      category: dbRow.category,
      adminNotes: dbRow.admin_notes,
      approvedBy: dbRow.approved_by,
      approvedAt: dbRow.approved_at,
      rejectedBy: dbRow.rejected_by,
      rejectedAt: dbRow.rejected_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  async getUserCards(userId: number): Promise<Card[]> {
    try {
      console.log(`📇 getUserCards(${userId})`);
      const { data, error } = await supabase
        .from('bank_cards')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error(`❌ getUserCards(${userId}) error:`, error.message);
        return [];
      }
      if (!data) {
        console.log(`⚠️ getUserCards(${userId}): No cards found`);
        return [];
      }
      console.log(`✅ getUserCards(${userId}): ${data.length} cards`);
      return data as any as Card[];
    } catch (error) {
      console.error(`❌ getUserCards catch:`, error);
      return [];
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
