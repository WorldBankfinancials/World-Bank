
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://icbsxmrmorkdgxtumamu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYnN4bXJtb3JrZGd4dHVtYW11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc1OTEwOSwiZXhwIjoyMDcwMzM1MTA5fQ.flfRMxdMFOQXqfdjGxSUWKSHsimTM0FSy-b2ZZda5HU';

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
        updatedAt: account.updated_at,
        interestRate: account.interest_rate?.toString() || null,
        minimumBalance: account.minimum_balance?.toString() || null
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
        updatedAt: account.updated_at,
        interestRate: account.interest_rate?.toString() || null,
        minimumBalance: account.minimum_balance?.toString() || null
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

      if (error || !transaction) {
        throw error || new Error('Failed to create transaction');
      }

      return {
        id: transaction.id,
        accountId: transaction.account_id,
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: new Date(transaction.date),
        status: transaction.status,
        recipientName: transaction.recipient_name,
        recipientAddress: transaction.recipient_address,
        recipientCountry: transaction.recipient_country,
        bankName: transaction.bank_name,
        swiftCode: transaction.swift_code,
        transferPurpose: transaction.transfer_purpose,
        adminNotes: transaction.admin_notes,
        approvedBy: transaction.approved_by,
        approvedAt: transaction.approved_at,
        rejectedBy: transaction.rejected_by,
        rejectedAt: transaction.rejected_at,
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
        accountId: transaction.account_id,
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: new Date(transaction.date),
        status: transaction.status,
        recipientName: transaction.recipient_name,
        recipientAddress: transaction.recipient_address,
        recipientCountry: transaction.recipient_country,
        bankName: transaction.bank_name,
        swiftCode: transaction.swift_code,
        transferPurpose: transaction.transfer_purpose,
        adminNotes: transaction.admin_notes,
        approvedBy: transaction.approved_by,
        approvedAt: transaction.approved_at,
        rejectedBy: transaction.rejected_by,
        rejectedAt: transaction.rejected_at,
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

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
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
          balance: updates.balance,
          modified_by_admin: updates.modifiedByAdmin,
          admin_notes: updates.adminNotes,
          transfer_pin: updates.transferPin,
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

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .update({ balance: amount, updated_at: new Date().toISOString() })
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
      console.error('Error updating user balance:', error);
      return undefined;
    }
  }

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
        updatedAt: account.updated_at,
        interestRate: account.interest_rate?.toString() || null,
        minimumBalance: account.minimum_balance?.toString() || null
      };
    } catch (error) {
      console.error('Error getting account:', error);
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
          is_active: data.isActive !== undefined ? data.isActive : true,
          interest_rate: data.interestRate,
          minimum_balance: data.minimumBalance
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
        updatedAt: account.updated_at,
        interestRate: account.interest_rate?.toString() || null,
        minimumBalance: account.minimum_balance?.toString() || null
      };
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const { data: account, error } = await supabase
        .from('bank_accounts')
        .update({
          balance: updates.balance,
          is_active: updates.isActive,
          account_type: updates.accountType,
          account_name: updates.accountName,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
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
        updatedAt: account.updated_at,
        interestRate: account.interest_rate?.toString() || null,
        minimumBalance: account.minimum_balance?.toString() || null
      };
    } catch (error) {
      console.error('Error updating account:', error);
      return undefined;
    }
  }

  async getAccountTransactions(accountId: number, limit = 50): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error getting account transactions:', error);
        return [];
      }
      
      return (transactions || []).map(tx => ({
        id: tx.id,
        accountId: tx.account_id,
        type: tx.type,
        amount: tx.amount.toString(),
        description: tx.description,
        category: tx.category,
        date: new Date(tx.date),
        status: tx.status,
        recipientName: tx.recipient_name,
        recipientAddress: tx.recipient_address,
        recipientCountry: tx.recipient_country,
        bankName: tx.bank_name,
        swiftCode: tx.swift_code,
        transferPurpose: tx.transfer_purpose,
        adminNotes: tx.admin_notes,
        approvedBy: tx.approved_by,
        approvedAt: tx.approved_at,
        rejectedBy: tx.rejected_by,
        rejectedAt: tx.rejected_at,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at
      }));
    } catch (error) {
      console.error('Error getting account transactions:', error);
      return [];
    }
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .update({
          status,
          admin_notes: notes,
          approved_by: adminId.toString(),
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !transaction) return undefined;
      
      return {
        id: transaction.id,
        accountId: transaction.account_id,
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: new Date(transaction.date),
        status: transaction.status,
        recipientName: transaction.recipient_name,
        recipientAddress: transaction.recipient_address,
        recipientCountry: transaction.recipient_country,
        bankName: transaction.bank_name,
        swiftCode: transaction.swift_code,
        transferPurpose: transaction.transfer_purpose,
        adminNotes: transaction.admin_notes,
        approvedBy: transaction.approved_by,
        approvedAt: transaction.approved_at,
        rejectedBy: transaction.rejected_by,
        rejectedAt: transaction.rejected_at,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      };
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return undefined;
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting pending transactions:', error);
        return [];
      }
      
      return (transactions || []).map(tx => ({
        id: tx.id,
        accountId: tx.account_id,
        type: tx.type,
        amount: tx.amount.toString(),
        description: tx.description,
        category: tx.category,
        date: new Date(tx.date),
        status: tx.status,
        recipientName: tx.recipient_name,
        recipientAddress: tx.recipient_address,
        recipientCountry: tx.recipient_country,
        bankName: tx.bank_name,
        swiftCode: tx.swift_code,
        transferPurpose: tx.transfer_purpose,
        adminNotes: tx.admin_notes,
        approvedBy: tx.approved_by,
        approvedAt: tx.approved_at,
        rejectedBy: tx.rejected_by,
        rejectedAt: tx.rejected_at,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at
      }));
    } catch (error) {
      console.error('Error getting pending transactions:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting all transactions:', error);
        return [];
      }
      
      return (transactions || []).map(tx => ({
        id: tx.id,
        accountId: tx.account_id,
        type: tx.type,
        amount: tx.amount.toString(),
        description: tx.description,
        category: tx.category,
        date: new Date(tx.date),
        status: tx.status,
        recipientName: tx.recipient_name,
        recipientAddress: tx.recipient_address,
        recipientCountry: tx.recipient_country,
        bankName: tx.bank_name,
        swiftCode: tx.swift_code,
        transferPurpose: tx.transfer_purpose,
        adminNotes: tx.admin_notes,
        approvedBy: tx.approved_by,
        approvedAt: tx.approved_at,
        rejectedBy: tx.rejected_by,
        rejectedAt: tx.rejected_at,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at
      }));
    } catch (error) {
      console.error('Error getting all transactions:', error);
      return [];
    }
  }

  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    throw new Error('Admin actions not implemented yet');
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    return [];
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    throw new Error('Support tickets not implemented yet');
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    return [];
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    return undefined;
  }
}

export { supabase };
