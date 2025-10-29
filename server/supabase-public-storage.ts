
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
  type InsertSupportTicket,
  type Card,
  type InsertCard,
  type Investment,
  type InsertInvestment,
  type Message,
  type InsertMessage,
  type Alert,
  type InsertAlert
} from "@shared/schema";
import { IStorage } from "./storage";

if (!process.env.VITE_SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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

  async getUserByPhone(phone: string): Promise<User | undefined> {
    console.log('📱 Searching for user with phone:', phone);
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (error || !user) {
        console.log('❌ No user found with phone:', phone);
        return undefined;
      }
      
      console.log('✅ Found user by phone in Supabase');
      return {
        id: user.id,
        username: user.username,
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
        createdAt: user.created_at,
        supabaseUserId: user.supabase_user_id,
        lastLogin: user.last_login,
        createdByAdmin: user.created_by_admin,
        modifiedByAdmin: user.modified_by_admin,
        adminNotes: user.admin_notes,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('❌ Error getting user by phone:', error);
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
          transaction_id: data.transactionId,
          from_user_id: data.fromUserId,
          to_user_id: data.toUserId,
          from_account_id: data.fromAccountId,
          to_account_id: data.toAccountId,
          amount: data.amount,
          currency: data.currency,
          transaction_type: data.transactionType,
          status: data.status || 'pending',
          description: data.description,
          recipient_name: data.recipientName,
          recipient_account: data.recipientAccount,
          reference_number: data.referenceNumber,
          fee: data.fee,
          exchange_rate: data.exchangeRate,
          country_code: data.countryCode,
          bank_name: data.bankName,
          swift_code: data.swiftCode,
          admin_notes: data.adminNotes
        })
        .select()
        .single();

      if (error || !transaction) {
        throw error || new Error('Failed to create transaction');
      }

      return {
        id: transaction.id,
        transactionId: transaction.transaction_id,
        fromUserId: transaction.from_user_id,
        toUserId: transaction.to_user_id,
        fromAccountId: transaction.from_account_id,
        toAccountId: transaction.to_account_id,
        amount: transaction.amount,
        currency: transaction.currency,
        transactionType: transaction.transaction_type,
        status: transaction.status,
        description: transaction.description,
        recipientName: transaction.recipient_name,
        recipientAccount: transaction.recipient_account,
        recipientAddress: transaction.recipient_address,
        recipientCountry: transaction.recipient_country,
        referenceNumber: transaction.reference_number,
        fee: transaction.fee,
        exchangeRate: transaction.exchange_rate,
        countryCode: transaction.country_code,
        bankName: transaction.bank_name,
        swiftCode: transaction.swift_code,
        transferPurpose: transaction.transfer_purpose,
        category: transaction.category,
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
        transactionId: transaction.transaction_id,
        fromUserId: transaction.from_user_id,
        toUserId: transaction.to_user_id,
        fromAccountId: transaction.from_account_id,
        toAccountId: transaction.to_account_id,
        amount: transaction.amount,
        currency: transaction.currency,
        transactionType: transaction.transaction_type,
        status: transaction.status,
        description: transaction.description,
        recipientName: transaction.recipient_name,
        recipientAccount: transaction.recipient_account,
        recipientAddress: transaction.recipient_address,
        recipientCountry: transaction.recipient_country,
        referenceNumber: transaction.reference_number,
        fee: transaction.fee,
        exchangeRate: transaction.exchange_rate,
        countryCode: transaction.country_code,
        bankName: transaction.bank_name,
        swiftCode: transaction.swift_code,
        transferPurpose: transaction.transfer_purpose,
        category: transaction.category,
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
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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
    console.log('🔧 SupabasePublicStorage.createUser called with:', {
      username: data.username,
      email: data.email,
      hasPasswordHash: !!data.passwordHash,
      supabaseUserId: data.supabaseUserId
    });
    
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .insert({
          username: data.username,
          password_hash: data.passwordHash,
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

      if (error) {
        console.error('❌ Supabase insert ERROR:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      if (!user) {
        console.error('❌ Supabase insert returned no user and no error');
        throw new Error('Failed to create user - no data returned');
      }
      
      console.log('✅ Supabase user created successfully:', user.id);

      return {
        id: user.id,
        username: user.username,
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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
        passwordHash: user.password_hash,
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
        balance: user.balance || "0",
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
        transactionId: tx.transaction_id,
        fromUserId: tx.from_user_id,
        toUserId: tx.to_user_id,
        fromAccountId: tx.from_account_id,
        toAccountId: tx.to_account_id,
        amount: tx.amount,
        currency: tx.currency,
        transactionType: tx.transaction_type,
        status: tx.status,
        description: tx.description,
        recipientName: tx.recipient_name,
        recipientAccount: tx.recipient_account,
        recipientAddress: tx.recipient_address,
        recipientCountry: tx.recipient_country,
        referenceNumber: tx.reference_number,
        fee: tx.fee,
        exchangeRate: tx.exchange_rate,
        countryCode: tx.country_code,
        bankName: tx.bank_name,
        swiftCode: tx.swift_code,
        transferPurpose: tx.transfer_purpose,
        category: tx.category,
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
        transactionId: transaction.transaction_id,
        fromUserId: transaction.from_user_id,
        toUserId: transaction.to_user_id,
        fromAccountId: transaction.from_account_id,
        toAccountId: transaction.to_account_id,
        amount: transaction.amount,
        currency: transaction.currency,
        transactionType: transaction.transaction_type,
        status: transaction.status,
        description: transaction.description,
        recipientName: transaction.recipient_name,
        recipientAccount: transaction.recipient_account,
        recipientAddress: transaction.recipient_address,
        recipientCountry: transaction.recipient_country,
        referenceNumber: transaction.reference_number,
        fee: transaction.fee,
        exchangeRate: transaction.exchange_rate,
        countryCode: transaction.country_code,
        bankName: transaction.bank_name,
        swiftCode: transaction.swift_code,
        transferPurpose: transaction.transfer_purpose,
        category: transaction.category,
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
        transactionId: tx.transaction_id,
        fromUserId: tx.from_user_id,
        toUserId: tx.to_user_id,
        fromAccountId: tx.from_account_id,
        toAccountId: tx.to_account_id,
        amount: tx.amount,
        currency: tx.currency,
        transactionType: tx.transaction_type,
        status: tx.status,
        description: tx.description,
        recipientName: tx.recipient_name,
        recipientAccount: tx.recipient_account,
        recipientAddress: tx.recipient_address,
        recipientCountry: tx.recipient_country,
        referenceNumber: tx.reference_number,
        fee: tx.fee,
        exchangeRate: tx.exchange_rate,
        countryCode: tx.country_code,
        bankName: tx.bank_name,
        swiftCode: tx.swift_code,
        transferPurpose: tx.transfer_purpose,
        category: tx.category,
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
        transactionId: tx.transaction_id,
        fromUserId: tx.from_user_id,
        toUserId: tx.to_user_id,
        fromAccountId: tx.from_account_id,
        toAccountId: tx.to_account_id,
        amount: tx.amount,
        currency: tx.currency,
        transactionType: tx.transaction_type,
        status: tx.status,
        description: tx.description,
        recipientName: tx.recipient_name,
        recipientAccount: tx.recipient_account,
        recipientAddress: tx.recipient_address,
        recipientCountry: tx.recipient_country,
        referenceNumber: tx.reference_number,
        fee: tx.fee,
        exchangeRate: tx.exchange_rate,
        countryCode: tx.country_code,
        bankName: tx.bank_name,
        swiftCode: tx.swift_code,
        transferPurpose: tx.transfer_purpose,
        category: tx.category,
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
    try {
      const { data, error } = await supabase.from('admin_actions').insert({
        admin_id: action.adminId,
        action_type: action.actionType,
        target_id: action.targetId,
        target_type: action.targetType,
        description: action.description,
        metadata: action.metadata || null,
      }).select().single();
      
      if (error) {
        console.error('Error creating admin action:', error);
        throw error;
      }
      
      return {
        id: data.id,
        adminId: data.admin_id,
        actionType: data.action_type,
        targetId: data.target_id,
        targetType: data.target_type,
        description: data.description,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
      } as AdminAction;
    } catch (error) {
      console.error('Failed to create admin action:', error);
      throw error;
    }
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    let query = supabase.from('admin_actions').select('*').order('created_at', { ascending: false });
    
    if (adminId !== undefined) {
      query = query.eq('admin_id', adminId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin actions:', error);
      throw new Error(`Failed to fetch admin actions: ${error.message}`);
    }
    
    return (data || []).map(action => ({
      id: action.id,
      adminId: action.admin_id,
      actionType: action.action_type,
      targetId: action.target_id,
      targetType: action.target_type,
      description: action.description,
      metadata: action.metadata,
      createdAt: new Date(action.created_at),
    } as AdminAction));
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase.from('support_tickets').insert({
        user_id: ticket.userId,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        category: ticket.category || null,
        assigned_to: ticket.assignedTo || null,
        admin_notes: ticket.adminNotes || null,
        resolution: ticket.resolution || null,
      }).select().single();
      
      if (error) {
        console.error('Error creating support ticket:', error);
        throw error;
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
        category: data.category,
        assignedTo: data.assigned_to,
        adminNotes: data.admin_notes,
        resolution: data.resolution,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null,
      } as SupportTicket;
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      throw error;
    }
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    
    return {
      id: data.id,
      userId: data.user_id,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: data.status,
      category: data.category,
      assignedTo: data.assigned_to,
      adminNotes: data.admin_notes,
      resolution: data.resolution,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null,
    } as SupportTicket;
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    
    if (userId !== undefined) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error} = await query;
    if (error) {
      console.error('Error fetching support tickets:', error);
      throw new Error(`Failed to fetch support tickets: ${error.message}`);
    }
    
    return (data || []).map(ticket => ({
      id: ticket.id,
      userId: ticket.user_id,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      assignedTo: ticket.assigned_to,
      adminNotes: ticket.admin_notes,
      resolution: ticket.resolution,
      createdAt: new Date(ticket.created_at),
      updatedAt: new Date(ticket.updated_at),
      resolvedAt: ticket.resolved_at ? new Date(ticket.resolved_at) : null,
    } as SupportTicket));
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes;
      if (updates.resolution !== undefined) updateData.resolution = updates.resolution;
      if (updates.category !== undefined) updateData.category = updates.category;
      
      // If status is being set to resolved, update resolvedAt
      if (updates.status === 'resolved' && !updates.resolvedAt) {
        updateData.resolved_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase.from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating support ticket:', error);
        throw error;
      }
      
      if (!data) return undefined;
      
      return {
        id: data.id,
        userId: data.user_id,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
        category: data.category,
        assignedTo: data.assigned_to,
        adminNotes: data.admin_notes,
        resolution: data.resolution,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null,
      } as SupportTicket;
    } catch (error) {
      console.error('Failed to update support ticket:', error);
      return undefined;
    }
  }

  // Cards methods
  async getUserCards(userId: number): Promise<Card[]> {
    try {
      // First get user's accounts, then get cards for those accounts
      const accounts = await this.getUserAccounts(userId);
      if (accounts.length === 0) return [];
      
      const accountIds = accounts.map(acc => acc.id);
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .in('account_id', accountIds);
      
      if (error) throw error;
      
      return (data || []).map((card: any) => ({
        id: card.id,
        accountId: card.account_id,
        cardNumber: card.card_number,
        cardType: card.card_type,
        expiryDate: card.expiry_date,
        cvv: card.cvv,
        cardholderName: card.cardholder_name,
        isActive: card.is_active,
        dailyLimit: card.daily_limit?.toString() || null,
        monthlyLimit: card.monthly_limit?.toString() || null,
        currentDailySpend: card.current_daily_spend?.toString() || '0',
        currentMonthlySpend: card.current_monthly_spend?.toString() || '0',
        isLocked: card.is_locked,
        createdAt: card.created_at,
        updatedAt: card.updated_at
      }));
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  }

  async getCard(id: number): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
      if (error) throw error;
      
      return {
        id: data.id,
        accountId: data.account_id,
        cardNumber: data.card_number,
        cardType: data.card_type,
        expiryDate: data.expiry_date,
        cvv: data.cvv,
        cardholderName: data.cardholder_name,
        isActive: data.is_active,
        dailyLimit: data.daily_limit?.toString() || null,
        monthlyLimit: data.monthly_limit?.toString() || null,
        currentDailySpend: data.current_daily_spend?.toString() || '0',
        currentMonthlySpend: data.current_monthly_spend?.toString() || '0',
        isLocked: data.is_locked,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching card:', error);
      return undefined;
    }
  }

  async createCard(card: InsertCard): Promise<Card> {
    const { data, error} = await supabase.from('cards').insert({
      account_id: card.accountId,
      card_number: card.cardNumber,
      card_type: card.cardType,
      expiry_date: card.expiryDate,
      cvv: card.cvv,
      cardholder_name: card.cardholderName,
      is_active: card.isActive ?? true,
      daily_limit: card.dailyLimit,
      monthly_limit: card.monthlyLimit,
      current_daily_spend: card.currentDailySpend || '0',
      current_monthly_spend: card.currentMonthlySpend || '0',
      is_locked: card.isLocked ?? false
    }).select().single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      accountId: data.account_id,
      cardNumber: data.card_number,
      cardType: data.card_type,
      expiryDate: data.expiry_date,
      cvv: data.cvv,
      cardholderName: data.cardholder_name,
      isActive: data.is_active,
      dailyLimit: data.daily_limit?.toString() || null,
      monthlyLimit: data.monthly_limit?.toString() || null,
      currentDailySpend: data.current_daily_spend?.toString() || '0',
      currentMonthlySpend: data.current_monthly_spend?.toString() || '0',
      isLocked: data.is_locked,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    const updateData: any = {};
    if (updates.cardNumber !== undefined) updateData.card_number = updates.cardNumber;
    if (updates.cardType !== undefined) updateData.card_type = updates.cardType;
    if (updates.expiryDate !== undefined) updateData.expiry_date = updates.expiryDate;
    if (updates.cvv !== undefined) updateData.cvv = updates.cvv;
    if (updates.cardholderName !== undefined) updateData.cardholder_name = updates.cardholderName;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.dailyLimit !== undefined) updateData.daily_limit = updates.dailyLimit;
    if (updates.monthlyLimit !== undefined) updateData.monthly_limit = updates.monthlyLimit;
    if (updates.currentDailySpend !== undefined) updateData.current_daily_spend = updates.currentDailySpend;
    if (updates.currentMonthlySpend !== undefined) updateData.current_monthly_spend = updates.currentMonthlySpend;
    if (updates.isLocked !== undefined) updateData.is_locked = updates.isLocked;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase.from('cards').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    
    return {
      id: data.id,
      accountId: data.account_id,
      cardNumber: data.card_number,
      cardType: data.card_type,
      expiryDate: data.expiry_date,
      cvv: data.cvv,
      cardholderName: data.cardholder_name,
      isActive: data.is_active,
      dailyLimit: data.daily_limit?.toString() || null,
      monthlyLimit: data.monthly_limit?.toString() || null,
      currentDailySpend: data.current_daily_spend?.toString() || '0',
      currentMonthlySpend: data.current_monthly_spend?.toString() || '0',
      isLocked: data.is_locked,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Investments methods
  async getUserInvestments(userId: number): Promise<Investment[]> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId);
      if (error) throw error;
      
      return (data || []).map((inv: any) => ({
        id: inv.id,
        userId: inv.user_id,
        investmentType: inv.investment_type,
        amount: inv.amount?.toString() || '0',
        currentValue: inv.current_value?.toString() || null,
        returnRate: inv.return_rate?.toString() || null,
        maturityDate: inv.maturity_date,
        status: inv.status,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at
      }));
    } catch (error) {
      console.error('Error fetching investments:', error);
      return [];
    }
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('id', id).single();
      if (error) throw error;
      
      return {
        id: data.id,
        userId: data.user_id,
        investmentType: data.investment_type,
        amount: data.amount?.toString() || '0',
        currentValue: data.current_value?.toString() || null,
        returnRate: data.return_rate?.toString() || null,
        maturityDate: data.maturity_date,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      return undefined;
    }
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const { data, error } = await supabase.from('investments').insert({
      user_id: investment.userId,
      investment_type: investment.investmentType,
      amount: investment.amount,
      current_value: investment.currentValue,
      return_rate: investment.returnRate,
      maturity_date: investment.maturityDate,
      status: investment.status || 'active'
    }).select().single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      investmentType: data.investment_type,
      amount: data.amount?.toString() || '0',
      currentValue: data.current_value?.toString() || null,
      returnRate: data.return_rate?.toString() || null,
      maturityDate: data.maturity_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> {
    const updateData: any = {};
    if (updates.investmentType !== undefined) updateData.investment_type = updates.investmentType;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue;
    if (updates.returnRate !== undefined) updateData.return_rate = updates.returnRate;
    if (updates.maturityDate !== undefined) updateData.maturity_date = updates.maturityDate;
    if (updates.status !== undefined) updateData.status = updates.status;
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase.from('investments').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      investmentType: data.investment_type,
      amount: data.amount?.toString() || '0',
      currentValue: data.current_value?.toString() || null,
      returnRate: data.return_rate?.toString() || null,
      maturityDate: data.maturity_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Messages methods
  async getMessages(conversationId?: string): Promise<Message[]> {
    try {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else {
        query = query.limit(100);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Message[];
    } catch (error) {
      return [];
    }
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    try {
      const { data, error } = await supabase.from('messages').select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Message[];
    } catch (error) {
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const { data, error } = await supabase.from('messages').insert(message as any).select().single();
    if (error) throw error;
    return data as unknown as Message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const { data, error } = await supabase.from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data as unknown as Message;
  }

  // Alerts methods
  async getUserAlerts(userId: number): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*')
        .eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Alert[];
    } catch (error) {
      return [];
    }
  }

  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*')
        .eq('user_id', userId).eq('is_read', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Alert[];
    } catch (error) {
      return [];
    }
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const { data, error } = await supabase.from('alerts').insert(alert as any).select().single();
    if (error) throw error;
    return data as unknown as Alert;
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const { data, error } = await supabase.from('alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data as unknown as Alert;
  }

  async deleteAlert(id: number): Promise<void> {
    const { error } = await supabase.from('alerts')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting alert:', error);
      throw new Error(`Failed to delete alert: ${error.message}`);
    }
  }

  // Branches and ATMs
  async getBranches(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('city', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting branches:', error);
      return [];
    }
  }

  async getAtms(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('atms')
        .select('*')
        .eq('is_operational', true)
        .order('city', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting ATMs:', error);
      return [];
    }
  }

  // Exchange rates
  async getExchangeRates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('last_updated', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting exchange rates:', error);
      return [];
    }
  }

  // Statements
  async getStatementsByUserId(userId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('statements')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting statements:', error);
      return [];
    }
  }

  // Market Rates
  async getMarketRates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('market_rates')
        .select('*')
        .order('last_updated', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting market rates:', error);
      return [];
    }
  }
}

export { supabase };
