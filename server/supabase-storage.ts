import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class SupabaseStorage implements IStorage {
  
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      id: data.id,
      username: data.username,
      password: data.password_hash,
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
      transferPin: data.transfer_pin,
      role: data.role,
      isVerified: data.is_verified,
      isOnline: data.is_online,
      isActive: data.is_active,
      avatarUrl: data.avatar_url,
      balance: parseFloat(data.balance || '0'),
      createdAt: data.created_at,
      supabaseUserId: data.supabase_user_id
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    
    return this.mapSupabaseUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log('🔍 Searching for user with email:', email);
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('❌ Supabase error fetching user:', error);
      return undefined;
    }
    
    if (!data) {
      console.log('❌ No user found with email:', email);
      return undefined;
    }
    
    console.log('✅ Found user in Supabase:', data);
    return this.mapSupabaseUser(data);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('bank_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(user => this.mapSupabaseUser(user));
  }

  async createUser(user: InsertUser): Promise<User> {
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
        transfer_pin: user.transferPin,
        role: user.role || 'customer',
        is_verified: user.isVerified || false,
        is_online: user.isOnline || false,
        is_active: user.isActive || true,
        avatar_url: user.avatarUrl,
        balance: user.balance?.toString() || '0.00',
        supabase_user_id: user.supabaseUserId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.mapSupabaseUser(data);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .update({
        username: updates.username,
        full_name: updates.fullName,
        email: updates.email,
        phone: updates.phone,
        profession: updates.profession,
        address: updates.address,
        city: updates.city,
        state: updates.state,
        country: updates.country,
        postal_code: updates.postalCode,
        nationality: updates.nationality,
        annual_income: updates.annualIncome,
        is_verified: updates.isVerified,
        is_online: updates.isOnline,
        is_active: updates.isActive,
        avatar_url: updates.avatarUrl,
        balance: updates.balance?.toString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return undefined;
    
    return this.mapSupabaseUser(data);
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('bank_users')
      .update({ balance: amount.toString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return undefined;
    
    return this.mapSupabaseUser(data);
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    console.log('🏦 Fetching accounts for user ID:', userId);
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Supabase error fetching accounts:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No accounts found for user ID:', userId);
      return [];
    }
    
    console.log('✅ Found accounts in Supabase:', data);
    return data.map(account => ({
      id: account.id,
      userId: account.user_id,
      accountNumber: account.account_number,
      accountType: account.account_type,
      balance: parseFloat(account.balance),
      currency: account.currency,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    }));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
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

  async createAccount(account: InsertAccount): Promise<Account> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: account.userId,
        account_number: account.accountNumber,
        account_type: account.accountType,
        balance: account.balance.toString(),
        currency: account.currency || 'USD',
        is_active: account.isActive || true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }

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

  async getAccountTransactions(accountId: number, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map(tx => this.mapSupabaseTransaction(tx));
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

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return this.mapSupabaseTransaction(data);
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
    
    return this.mapSupabaseTransaction(data);
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(tx => this.mapSupabaseTransaction(tx));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(tx => this.mapSupabaseTransaction(tx));
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

  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    // Implementation for admin actions would go here
    throw new Error('Admin actions not implemented yet');
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    // Implementation for admin actions would go here
    return [];
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    // Implementation for support tickets would go here
    throw new Error('Support tickets not implemented yet');
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    // Implementation for support tickets would go here  
    return [];
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    // Implementation for support tickets would go here
    return undefined;
  }

  private mapSupabaseUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      password: data.password_hash,
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
      transferPin: data.transfer_pin,
      role: data.role,
      isVerified: data.is_verified,
      isOnline: data.is_online,
      isActive: data.is_active,
      avatarUrl: data.avatar_url,
      balance: parseFloat(data.balance || '0'),
      createdAt: data.created_at,
      supabaseUserId: data.supabase_user_id
    };
  }

  private mapSupabaseTransaction(data: any): Transaction {
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