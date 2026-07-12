/**
 * UNIFIED SYNC STORAGE - Supabase REST API + Memory Cache
 * Uses Supabase REST API (works from Replit) + instant memory cache
 * Direct Postgres connection fails on Replit (network unreachable)
 */

import { createClient } from '@supabase/supabase-js';
import type { IStorage } from "./storage";
import type { User, Account, Transaction, AdminAction, SupportTicket, Card, Investment, Message, Alert, InsertUser, InsertAccount, InsertTransaction, InsertAdminAction, InsertSupportTicket } from "@shared/schema";

// Supabase client - WORKS from Replit (REST API)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
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
        
        return undefined;
      }
      if (!data) return undefined;
      const user = this.mapDatabaseToUser(data);
      this.setCache(cacheKey, user);
      return user;
    } catch (error) {
      
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
        
        return undefined;
      }
      if (!data) {
        
        return undefined;
      }
      const user = this.mapDatabaseToUser(data);
      this.setCache(cacheKey, user);
      
      return user;
    } catch (error) {
      
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
        
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToUser(data);
    } catch (error) {
      
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
        
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToUser(data);
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
      
      if (error) {
        
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToUser(data);
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
      
      if (error) {
        
        return [];
      }
      if (!data) return [];
      return data.map(row => this.mapDatabaseToUser(row));
    } catch (error) {
      
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
        
        throw error;
      }
      if (!data) throw new Error('No data returned from insert');
      
      const newUser = this.mapDatabaseToUser(data);
      
      return newUser;
    } catch (error: any) {
      
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
        
        return undefined;
      }
      if (!data) return undefined;
      const updated = this.mapDatabaseToUser(data);
      memCache.delete(`user:${id}`);
      memCache.delete(`user:email:${updated.email}`);
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

      if (error) {
        return undefined;
      }
      if (!data) return undefined;
      const updated = this.mapDatabaseToUser(data);
      memCache.delete(`user:${id}`);
      memCache.delete(`user:email:${updated.email}`);
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

      if (error) {
        return [];
      }
      if (!data) return [];
      const accounts = data.map(row => this.mapDatabaseToAccount(row)).filter(acc => acc.id && acc.id > 0);
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

      if (error) {
        
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToAccount(data);
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

      if (error) {
        
        throw error;
      }
      if (!data) throw new Error('No data returned');
      memCache.delete(`accounts:user:${account.userId}`);
      return this.mapDatabaseToAccount(data);
    } catch (error: any) {
      
      throw error;
    }
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToAccount(data);
    } catch (error) {
      
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
        
        return undefined;
      }
      if (!data) return undefined;
      return this.mapDatabaseToTransaction(data);
    } catch (error) {
      
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
        
        return [];
      }
      if (!data) return [];
      
      return data.map(row => this.mapDatabaseToTransaction(row));
    } catch (error) {
      
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
        
        return [];
      }
      if (!data) return [];
      return data.map(row => this.mapDatabaseToTransaction(row));
    } catch (error) {
      
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      if (!transaction.fromAccountId || transaction.fromAccountId <= 0) {
        throw new Error('Invalid fromAccountId - must be a positive number');
      }
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          from_account_id: transaction.fromAccountId,
          to_account_id: transaction.toAccountId || null,
          amount: transaction.amount || '0',
          transaction_type: transaction.type || 'transfer',
          status: transaction.status || 'pending',
          reference_number: transaction.referenceNumber || '',
          description: transaction.description || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      if (!data) throw new Error('No data returned');
      return this.mapDatabaseToTransaction(data);
    } catch (error: any) {
      throw error;
    }
  }

  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .insert([{
          admin_id: action.adminId || 0,
          action: action.action || 'unknown',
          target_id: action.targetId || 0,
          details: action.details || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        
        throw error;
      }
      if (!data) throw new Error('No data returned');
      return data as AdminAction;
    } catch (error: any) {
      
      throw error;
    }
  }

  // ==================== DATA MAPPERS ====================
  private mapDatabaseToUser(dbRow: Record<string, any>): User {
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
      profilePhoto: dbRow.profile_photo || null,
      isActive: dbRow.is_active,
      isVerified: dbRow.is_verified,
      role: dbRow.role,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  private mapDatabaseToAccount(dbRow: Record<string, any>): Account {
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

  private mapDatabaseToTransaction(dbRow: Record<string, any>): Transaction {
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
      const { data, error } = await supabase
        .from('bank_cards')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];
      return data as Card[];
    } catch (error) {
      return [];
    }
  }

  async getCard(id: number): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as Card;
    } catch (error) {
      return undefined;
    }
  }

  async createCard(card: any): Promise<Card> {
    try {
      const { data, error } = await supabase
        .from('bank_cards')
        .insert([card])
        .select()
        .single();

      if (error || !data) throw error;
      return data as Card;
    } catch (error: any) {
      throw error;
    }
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase
        .from('bank_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      return data as Card;
    } catch (error) {
      return undefined;
    }
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as Alert;
    } catch (error) {
      return undefined;
    }
  }

  async getUserAlerts(userId: number): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];
      return data as Alert[];
    } catch (error) {
      return [];
    }
  }

  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error || !data) return [];
      return data as Alert[];
    } catch (error) {
      return [];
    }
  }

  async createAlert(alert: any): Promise<Alert> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([alert])
        .select()
        .single();

      if (error || !data) throw error;
      return data as Alert;
    } catch (error: any) {
      throw error;
    }
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      return data as Alert;
    } catch (error) {
      return undefined;
    }
  }

  async deleteAlert(id: number): Promise<void> {
    try {
      await supabase.from('alerts').delete().eq('id', id);
    } catch (error) {
      // Silently fail
    }
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as Investment;
    } catch (error) {
      return undefined;
    }
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];
      return data as Investment[];
    } catch (error) {
      return [];
    }
  }

  async createInvestment(investment: any): Promise<Investment> {
    try {
      const { data, error } = await supabase
        .from('investments')
        .insert([investment])
        .select()
        .single();

      if (error || !data) throw error;
      return data as Investment;
    } catch (error: any) {
      throw error;
    }
  }

  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      return data as Investment;
    } catch (error) {
      return undefined;
    }
  }

  async getMessage(id: string): Promise<Message | undefined> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as Message;
    } catch (error) {
      return undefined;
    }
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    try {
      let query = supabase.from('messages').select('*');
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }
      const { data, error } = await query;

      if (error || !data) return [];
      return data as Message[];
    } catch (error) {
      return [];
    }
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];
      return data as Message[];
    } catch (error) {
      return [];
    }
  }

  async createMessage(message: any): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();

      if (error || !data) throw error;
      return data as Message;
    } catch (error: any) {
      throw error;
    }
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      return data as Message;
    } catch (error) {
      return undefined;
    }
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;
      return data as SupportTicket;
    } catch (error) {
      return undefined;
    }
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    try {
      let query = supabase.from('support_tickets').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;

      if (error || !data) return [];
      return data as SupportTicket[];
    } catch (error) {
      return [];
    }
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticket])
        .select()
        .single();

      if (error || !data) throw error;
      return data as SupportTicket;
    } catch (error: any) {
      throw error;
    }
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      return data as SupportTicket;
    } catch (error) {
      return undefined;
    }
  }

  async getBranches(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*');

      if (error || !data) return [];
      return data;
    } catch (error) {
      return [];
    }
  }

  async getAtms(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('atms')
        .select('*');

      if (error || !data) return [];
      return data;
    } catch (error) {
      return [];
    }
  }

  async getExchangeRates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*');

      if (error || !data) return [];
      return data;
    } catch (error) {
      return [];
    }
  }

  async getMarketRates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('market_rates')
        .select('*');

      if (error || !data) return [];
      return data;
    } catch (error) {
      return [];
    }
  }

  async getStatementsByUserId(userId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('statements')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];
      return data;
    } catch (error) {
      return [];
    }
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;
      return this.mapDatabaseToTransaction(data);
    } catch (error) {
      return undefined;
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending');

      if (error || !data) return [];
      return data.map(row => this.mapDatabaseToTransaction(row));
    } catch (error) {
      return [];
    }
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    try {
      let query = supabase.from('admin_actions').select('*');
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }
      const { data, error } = await query;

      if (error || !data) return [];
      return data as AdminAction[];
    } catch (error) {
      return [];
    }
  }
}
