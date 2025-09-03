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
      
      return {
        id: user.id,
        username: user.username,
        password: user.password_hash,
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
        transferPin: user.transfer_pin,
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
      
      return {
        id: user.id,
        username: user.username,
        password: user.password_hash,
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
        transferPin: user.transfer_pin,
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
      
      return {
        id: user.id,
        username: user.username,
        password: user.password_hash,
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
        transferPin: user.transfer_pin,
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
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    console.log('🏦 Fetching accounts for user ID:', userId);
    try {
      const { data: accounts, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('id');
      
      if (error) {
        console.error('❌ Supabase error fetching accounts:', error);
        return [];
      }
      
      if (!accounts || accounts.length === 0) {
        console.log('❌ No accounts found for user ID:', userId);
        return [];
      }
      
      console.log('✅ Found accounts in Supabase:', accounts);
      return accounts.map(account => ({
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
      }));
    } catch (error) {
      console.error('❌ Error fetching accounts:', error);
      return [];
    }
  }

  async getAccounts(userId?: number): Promise<Account[]> {
    try {
      let query = supabase.from('bank_accounts').select('*').eq('is_active', true);
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data: accounts, error } = await query.order('id');
      
      if (error) {
        console.error('Error getting accounts:', error);
        return [];
      }
      
      return (accounts || []).map(account => ({
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
      }));
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
          from_account_id: data.fromAccountId,
          to_account_id: data.toAccountId,
          from_account_number: data.fromAccountNumber,
          to_account_number: data.toAccountNumber,
          amount: data.amount,
          currency: data.currency || 'USD',
          description: data.description,
          transaction_type: data.transactionType || 'transfer',
          status: data.status || 'pending'
        })
        .select()
        .single();

      if (error || !transaction) {
        throw error || new Error('Failed to create transaction');
      }

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
      
      if (error) {
        console.error('Error getting transactions:', error);
        return [];
      }
      
      return (transactions || []).map(transaction => ({
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
      }));
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async verifyPin(email: string, pin: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('transfer_pin')
        .eq('email', email)
        .eq('transfer_pin', pin)
        .single();
      
      return !error && !!user;
    } catch (error) {
      console.error('Error verifying PIN:', error);
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
      
      return users.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password_hash,
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
        transferPin: user.transfer_pin,
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
      }));
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
      
      return {
        id: user.id,
        username: user.username,
        password: user.password_hash,
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
        transferPin: user.transfer_pin,
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
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(data: InsertUser): Promise<User> {
    try {
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
          transfer_pin: data.transferPin,
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

      return {
        id: user.id,
        username: user.username,
        password: user.password_hash,
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
        transferPin: user.transfer_pin,
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
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !user) return undefined;

      return {
        id: user.id,
        username: user.username,
        password: user.password_hash,
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
        transferPin: user.transfer_pin,
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
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Stub implementations for remaining interface methods
  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const { data: account, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !account) return undefined;

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
    } catch (error) {
      console.error('Error getting account:', error);
      return undefined;
    }
  }

  // Transaction-related methods (extended for IStorage)
  async getAccountTransactions(accountId: number, limit?: number): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error getting account transactions:', error);
        return [];
      }

      return (transactions || []).map(transaction => ({
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
      }));
    } catch (error) {
      console.error('Error getting account transactions:', error);
      return [];
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.getTransactionsByStatus('pending');
  }

  async getTransactionsByStatus(status: string): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting transactions by status:', error);
        return [];
      }

      return (transactions || []).map(transaction => ({
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
      }));
    } catch (error) {
      console.error('Error getting transactions by status:', error);
      return [];
    }
  }

  async updateTransactionStatus(id: number, status: string, adminId?: number, notes?: string): Promise<Transaction | undefined> {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (adminId) updates.approved_by = adminId;
      if (notes) updates.admin_notes = notes;

      const { data: transaction, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error || !transaction) return undefined;

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
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return undefined;
    }
  }

  // Admin actions (stub implementations)
  async createAdminAction(data: InsertAdminAction): Promise<AdminAction> {
    // Stub implementation - could be implemented if admin actions table exists
    return {
      id: Date.now(),
      adminId: data.adminId,
      actionType: data.actionType,
      targetType: data.targetType,
      targetId: data.targetId,
      description: data.description,
      metadata: data.metadata,
      createdAt: new Date()
    };
  }

  async getAdminActions(): Promise<AdminAction[]> {
    return [];
  }

  // Support tickets (stub implementations)
  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    // Stub implementation
    return {
      id: Date.now(),
      userId: data.userId,
      subject: data.subject,
      message: data.message,
      status: 'open',
      priority: data.priority || 'medium',
      category: data.category || 'general',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return [];
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    return undefined;
  }

  // Realtime synchronization methods for admin changes
  async subscribeToAdminChanges(callback: (change: any) => void) {
    const channel = supabase
      .channel('admin-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'bank_users' 
        },
        callback
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions' 
        },
        callback
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'bank_accounts' 
        },
        callback
      )
      .subscribe();

    return channel;
  }

  // Test Supabase connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      
      console.log('✅ Supabase public schema connection successful');
      return true;
    } catch (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
  }

  // Load persisted data (for compatibility)
  async loadPersistedData(): Promise<void> {
    const connected = await this.testConnection();
    if (connected) {
      console.log('✅ Loaded Supabase public schema data successfully');
    } else {
      console.log('⚠️ Supabase connection failed, will attempt to create tables');
      await this.createTables();
    }
  }

  // Create banking tables in Supabase
  async createTables(): Promise<void> {
    try {
      // Try to create a simple user record to test table creation
      const { error } = await supabase
        .from('bank_users')
        .insert({
          supabase_user_id: '0633f82f-5306-41e9-9ed4-11ee555e5087',
          username: 'vaa33053',
          full_name: 'Wei Liu',
          email: 'vaa33053@gmail.com',
          phone: '+1 234 567 8900',
          account_number: '4789-5532-1098-7654',
          account_id: 'WB-2025-8912',
          profession: 'Software Engineer',
          date_of_birth: '1990-05-15',
          address: '123 Tech Street',
          city: 'San Francisco',
          state: 'California',
          country: 'United States',
          postal_code: '94102',
          nationality: 'American',
          annual_income: '$75,000-$100,000',
          id_type: 'Passport',
          id_number: 'P123456789',
          transfer_pin: '0192',
          balance: 15750.50
        })
        .select();

      if (error && !error.message.includes('duplicate')) {
        console.error('Error creating user in Supabase:', error);
      } else {
        console.log('✅ Supabase banking data created successfully');
      }
    } catch (error) {
      console.error('Error setting up Supabase tables:', error);
    }
  }
}