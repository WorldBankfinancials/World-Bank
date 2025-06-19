import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { IStorage } from './storage';
import {
  User, InsertUser, Account, InsertAccount, Transaction, InsertTransaction,
  AdminAction, InsertAdminAction, SupportTicket, InsertSupportTicket
} from '../shared/schema';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export class SupabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(this.mapUser);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    // Generate unique account details if not provided
    const accountNumber = insertUser.accountNumber || this.generateAccountNumber();
    const accountId = insertUser.accountId || this.generateAccountId();
    
    const userData = {
      ...insertUser,
      password: hashedPassword,
      account_number: accountNumber,
      account_id: accountId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    
    // Create default account
    await this.createAccount({
      userId: data.id,
      accountNumber: accountNumber,
      accountName: 'Primary Checking',
      accountType: 'checking',
      balance: insertUser.balance || 0,
      currency: 'USD'
    });

    return this.mapUser(data);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    // Get current balance
    const user = await this.getUser(id);
    if (!user) return undefined;

    const newBalance = user.balance + amount;

    const { data, error } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return undefined;

    // Update account balance as well
    await supabase
      .from('accounts')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', id);

    return this.mapUser(data);
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);
    
    if (error || !data) return [];
    return data.map(this.mapAccount);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapAccount(data);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const accountData = {
      user_id: insertAccount.userId,
      account_number: insertAccount.accountNumber,
      account_name: insertAccount.accountName,
      account_type: insertAccount.accountType,
      balance: insertAccount.balance || 0,
      currency: insertAccount.currency || 'USD',
      is_active: insertAccount.isActive !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert([accountData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create account: ${error.message}`);
    return this.mapAccount(data);
  }

  async getAccountTransactions(accountId: number, limit = 10): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    return data.map(this.mapTransaction);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const referenceNumber = insertTransaction.referenceNumber || this.generateReferenceNumber();
    
    const transactionData = {
      ...insertTransaction,
      user_id: insertTransaction.userId,
      account_id: insertTransaction.accountId,
      transaction_type: insertTransaction.transactionType,
      recipient_name: insertTransaction.recipientName,
      recipient_account: insertTransaction.recipientAccount,
      recipient_bank: insertTransaction.recipientBank,
      recipient_swift: insertTransaction.recipientSwift,
      recipient_iban: insertTransaction.recipientIban,
      recipient_address: insertTransaction.recipientAddress,
      transfer_purpose: insertTransaction.transferPurpose,
      reference_number: referenceNumber,
      exchange_rate: insertTransaction.exchangeRate,
      processed_by: insertTransaction.processedBy,
      admin_notes: insertTransaction.adminNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
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
        processed_by: adminId,
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
      .order('created_at', { ascending: true });
    
    if (error || !data) return [];
    return data.map(this.mapTransaction);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(this.mapTransaction);
  }

  async createAdminAction(insertAction: InsertAdminAction): Promise<AdminAction> {
    const actionData = {
      admin_id: insertAction.adminId,
      action_type: insertAction.actionType,
      target_user_id: insertAction.targetUserId,
      target_transaction_id: insertAction.targetTransactionId,
      description: insertAction.description,
      metadata: insertAction.metadata,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('admin_actions')
      .insert([actionData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create admin action: ${error.message}`);
    return this.mapAdminAction(data);
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    let query = supabase
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false });

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(this.mapAdminAction);
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const ticketData = {
      user_id: insertTicket.userId,
      title: insertTicket.title,
      description: insertTicket.description,
      category: insertTicket.category,
      priority: insertTicket.priority,
      status: insertTicket.status || 'open',
      assigned_to: insertTicket.assignedTo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create support ticket: ${error.message}`);
    return this.mapSupportTicket(data);
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(this.mapSupportTicket);
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return undefined;
    return this.mapSupportTicket(data);
  }

  // Helper methods for mapping database rows to app types
  private mapUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      password: data.password,
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
      annualIncome: data.annual_income,
      idType: data.id_type,
      idNumber: data.id_number,
      transferPin: data.transfer_pin,
      role: data.role,
      isVerified: data.is_verified,
      isOnline: data.is_online,
      isActive: data.is_active,
      avatarUrl: data.avatar_url,
      balance: parseFloat(data.balance || '0'),
      supabaseUserId: data.supabase_user_id,
      lastLogin: data.last_login,
      createdByAdmin: data.created_by_admin,
      modifiedByAdmin: data.modified_by_admin,
      adminNotes: data.admin_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapAccount(data: any): Account {
    return {
      id: data.id,
      userId: data.user_id,
      accountNumber: data.account_number,
      accountName: data.account_name,
      accountType: data.account_type,
      balance: parseFloat(data.balance || '0'),
      currency: data.currency,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapTransaction(data: any): Transaction {
    return {
      id: data.id,
      userId: data.user_id,
      accountId: data.account_id,
      transactionType: data.transaction_type,
      amount: parseFloat(data.amount),
      currency: data.currency,
      description: data.description,
      recipientName: data.recipient_name,
      recipientAccount: data.recipient_account,
      recipientBank: data.recipient_bank,
      recipientSwift: data.recipient_swift,
      recipientIban: data.recipient_iban,
      recipientAddress: data.recipient_address,
      transferPurpose: data.transfer_purpose,
      referenceNumber: data.reference_number,
      status: data.status,
      fee: parseFloat(data.fee || '0'),
      exchangeRate: parseFloat(data.exchange_rate || '1'),
      processedBy: data.processed_by,
      adminNotes: data.admin_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapAdminAction(data: any): AdminAction {
    return {
      id: data.id,
      adminId: data.admin_id,
      actionType: data.action_type,
      targetUserId: data.target_user_id,
      targetTransactionId: data.target_transaction_id,
      description: data.description,
      metadata: data.metadata,
      createdAt: data.created_at
    };
  }

  private mapSupportTicket(data: any): SupportTicket {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.status,
      assignedTo: data.assigned_to,
      resolvedAt: data.resolved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Utility methods
  private generateAccountNumber(): string {
    return `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private generateAccountId(): string {
    return `WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private generateReferenceNumber(): string {
    return `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}