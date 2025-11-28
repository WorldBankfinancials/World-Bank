/**
 * COMPLETE SUPABASE STORAGE IMPLEMENTATION
 * Implements ALL operations for 11+ Supabase tables
 */

import { createClient } from '@supabase/supabase-js';
import type { IStorage } from "./storage";
import type { User, Account, Transaction, AdminAction, SupportTicket, InsertUser, InsertAccount, InsertTransaction, InsertAdminAction, InsertSupportTicket } from "@shared/schema";
import { mapSupabaseUserToUser, mapUserToSupabaseInsert, mapSupabaseAccountToAccount, mapAccountToSupabaseInsert, mapSupabaseTransactionToTransaction } from './supabase-mapping';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export class CompleteSupabaseStorage implements IStorage {
  // ==================== USER OPERATIONS ====================
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('id', id)
      .single();
    return error ? undefined : (data ? mapSupabaseUserToUser(data) : undefined);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('username', username)
      .single();
    return error ? undefined : (data ? mapSupabaseUserToUser(data) : undefined);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      return undefined;
    }
    return data ? mapSupabaseUserToUser(data) : undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('phone', phone)
      .single();
    return error ? undefined : (data ? mapSupabaseUserToUser(data) : undefined);
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('supabase_id', supabaseUserId)
      .single();
    return error ? undefined : (data ? mapSupabaseUserToUser(data) : undefined);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .order('created_at', { ascending: false });
    return error ? [] : (data ? data.map(mapSupabaseUserToUser) : []);
  }

  async createUser(user: InsertUser): Promise<User> {
    const insertData = mapUserToSupabaseInsert(user as any);
    const { data, error } = await supabase
      .from('bank_users')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseUserToUser(data);
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const updateData = mapUserToSupabaseInsert(user);
    const { data, error } = await supabase
      .from('bank_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : (data ? mapSupabaseUserToUser(data) : undefined);
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .update({ balance: amount.toString() })
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : (data ? mapSupabaseUserToUser(data) : undefined);
  }

  // ==================== ACCOUNT OPERATIONS ====================
  async getUserAccounts(userId: number): Promise<Account[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId);
    return error ? [] : (data ? data.map(mapSupabaseAccountToAccount) : []);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();
    return error ? undefined : (data ? mapSupabaseAccountToAccount(data) : undefined);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const insertData = mapAccountToSupabaseInsert(account);
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseAccountToAccount(data);
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    const updateData = mapAccountToSupabaseInsert(updates);
    const { data, error } = await supabase
      .from('bank_accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : (data ? mapSupabaseAccountToAccount(data) : undefined);
  }

  // ==================== TRANSACTION OPERATIONS ====================
  async getAccountTransactions(accountId: number, limit?: number): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('created_at', { ascending: false });
    
    if (limit) query = query.limit(limit);
    
    const { data, error } = await query;
    return error ? [] : (data ? data.map(mapSupabaseTransactionToTransaction) : []);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        from_user_id: transaction.fromUserId,
        to_user_id: transaction.toUserId,
        from_account_id: transaction.fromAccountId,
        to_account_id: transaction.toAccountId,
        amount: transaction.amount,
        currency: transaction.currency || 'USD',
        type: transaction.type || 'transfer',
        status: transaction.status || 'pending',
        description: transaction.description,
        recipient_name: transaction.recipientName,
        recipient_account: transaction.recipientAccount,
        recipient_address: transaction.recipientAddress,
        recipient_country: transaction.recipientCountry,
        reference_number: transaction.referenceNumber,
        fee: transaction.fee || '0.00',
        exchange_rate: transaction.exchangeRate,
        country_code: transaction.countryCode,
        bank_name: transaction.bankName,
        swift_code: transaction.swiftCode,
        transfer_purpose: transaction.transferPurpose
      }])
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseTransactionToTransaction(data);
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        status,
        admin_notes: notes,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : (data ? mapSupabaseTransactionToTransaction(data) : undefined);
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    return error ? [] : (data ? data.map(mapSupabaseTransactionToTransaction) : []);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    return error ? [] : (data ? data.map(mapSupabaseTransactionToTransaction) : []);
  }

  // ==================== ADMIN ACTIONS ====================
  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    const { data, error } = await supabase
      .from('admin_actions')
      .insert([{
        admin_id: action.adminId,
        action: action.action,
        target_type: action.targetType,
        target_id: action.targetId,
        details: action.details,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    let query = supabase.from('admin_actions').select('*');
    if (adminId) query = query.eq('admin_id', adminId);
    const { data, error } = await query.order('created_at', { ascending: false });
    return error ? [] : (data || []);
  }

  // ==================== SUPPORT TICKETS ====================
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{
        user_id: ticket.userId,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();
    return error ? undefined : data;
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    let query = supabase.from('support_tickets').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });
    return error ? [] : (data || []);
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status: updates.status,
        priority: updates.priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : data;
  }

  // ==================== CARDS ====================
  async getUserCards(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);
    return error ? [] : (data || []);
  }

  async getCard(id: number): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();
    return error ? undefined : data;
  }

  async createCard(card: any): Promise<any> {
    const { data, error } = await supabase
      .from('cards')
      .insert([{...card, created_at: new Date().toISOString()}])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCard(id: number, updates: any): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('cards')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : data;
  }

  async deleteCard(id: number): Promise<void> {
    await supabase.from('cards').delete().eq('id', id);
  }

  // ==================== INVESTMENTS ====================
  async getUserInvestments(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);
    return error ? [] : (data || []);
  }

  async getInvestment(id: number): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('id', id)
      .single();
    return error ? undefined : data;
  }

  async createInvestment(investment: any): Promise<any> {
    const { data, error } = await supabase
      .from('investments')
      .insert([{...investment, created_at: new Date().toISOString()}])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateInvestment(id: number, updates: any): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('investments')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : data;
  }

  // ==================== MESSAGES ====================
  async getMessages(conversationId?: string): Promise<any[]> {
    let query = supabase.from('messages').select('*');
    if (conversationId) query = query.eq('conversation_id', conversationId);
    const { data, error } = await query.order('created_at', { ascending: true });
    return error ? [] : (data || []);
  }

  async getUserMessages(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    return error ? [] : (data || []);
  }

  async createMessage(message: any): Promise<any> {
    const { data, error } = await supabase
      .from('messages')
      .insert([{...message, created_at: new Date().toISOString()}])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markMessageAsRead(id: number): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : data;
  }

  // ==================== ALERTS ====================
  async getUserAlerts(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return error ? [] : (data || []);
  }

  async getUnreadAlerts(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    return error ? [] : (data || []);
  }

  async createAlert(alert: any): Promise<any> {
    const { data, error } = await supabase
      .from('alerts')
      .insert([{...alert, created_at: new Date().toISOString()}])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markAlertAsRead(id: number): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();
    return error ? undefined : data;
  }

  async deleteAlert(id: number): Promise<void> {
    await supabase.from('alerts').delete().eq('id', id);
  }

  // ==================== BRANCHES & ATMs ====================
  async getBranches(): Promise<any[]> {
    const { data, error } = await supabase.from('branches').select('*');
    return error ? [] : (data || []);
  }

  async getAtms(): Promise<any[]> {
    const { data, error } = await supabase.from('atms').select('*');
    return error ? [] : (data || []);
  }

  async getExchangeRates(): Promise<any[]> {
    const { data, error } = await supabase.from('exchange_rates').select('*');
    return error ? [] : (data || []);
  }

  async getStatementsByUserId(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('statements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return error ? [] : (data || []);
  }

  async getMarketRates(): Promise<any[]> {
    const { data, error } = await supabase.from('market_rates').select('*');
    return error ? [] : (data || []);
  }
}
