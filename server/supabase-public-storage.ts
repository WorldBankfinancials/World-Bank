
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
      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: user.username, password: user.password, firstName: firstName || "", lastName: lastName || "", email: user.email, phone: user.phone, accountNumber: user.account_number, accountId: user.account_id, profession: user.profession, dateOfBirth: user.date_of_birth, address: user.address, city: user.city, state: user.state, country: user.country, postalCode: user.postal_code, annualIncome: user.annual_income, idType: user.id_type, idNumber: user.id_number, transferPin: user.transfer_pin, role: user.role, isVerified: user.is_verified, isActive: user.is_active, balance: user.balance || "0", createdAt: user.created_at, updatedAt: user.updated_at } as any;
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
      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: user.username, password: user.password, firstName: firstName || "", lastName: lastName || "", email: user.email, phone: user.phone, accountNumber: user.account_number, accountId: user.account_id, profession: user.profession, dateOfBirth: user.date_of_birth, address: user.address, city: user.city, state: user.state, country: user.country, postalCode: user.postal_code, annualIncome: user.annual_income, idType: user.id_type, idNumber: user.id_number, transferPin: user.transfer_pin, role: user.role, isVerified: user.is_verified, isActive: user.is_active, balance: user.balance || "0", createdAt: user.created_at, updatedAt: user.updated_at } as any;
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
      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: user.username, password: user.password, firstName: firstName || "", lastName: lastName || "", email: user.email, phone: user.phone, accountNumber: user.account_number, accountId: user.account_id, profession: user.profession, dateOfBirth: user.date_of_birth, address: user.address, city: user.city, state: user.state, country: user.country, postalCode: user.postal_code, annualIncome: user.annual_income, idType: user.id_type, idNumber: user.id_number, transferPin: user.transfer_pin, role: user.role, isVerified: user.is_verified, isActive: user.is_active, balance: user.balance || "0", createdAt: user.created_at, updatedAt: user.updated_at } as any;
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (error || !user) {
        return undefined;
      }
      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: user.username, password: user.password, firstName: firstName || "", lastName: lastName || "", email: user.email, phone: user.phone, accountNumber: user.account_number, accountId: user.account_id, profession: user.profession, dateOfBirth: user.date_of_birth, address: user.address, city: user.city, state: user.state, country: user.country, postalCode: user.postal_code, annualIncome: user.annual_income, idType: user.id_type, idNumber: user.id_number, transferPin: user.transfer_pin, role: user.role, isVerified: user.is_verified, isActive: user.is_active, balance: user.balance || "0", createdAt: user.created_at, updatedAt: user.updated_at } as any;
    } catch (error) {
      console.error('❌ Error getting user by phone:', error);
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
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
        return [];
      }
      
      return accounts.map(acc => ({ id: acc.id, userId: acc.user_id, accountNumber: acc.account_number, accountType: acc.account_type, balance: acc.balance?.toString() || '0', currency: acc.currency, status: acc.status || 'active', createdAt: acc.created_at, updatedAt: acc.updated_at } as any));
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
      
      return (accounts || []).map(acc => ({ id: acc.id, userId: acc.user_id, accountNumber: acc.account_number, accountType: acc.account_type, balance: acc.balance?.toString() || '0', currency: acc.currency, status: acc.status || 'active', createdAt: acc.created_at, updatedAt: acc.updated_at } as any));
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
        transactionType: transaction.transaction_type, type: transaction.type,
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
        transactionType: transaction.transaction_type, type: transaction.type,
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
      
      return users.map(user => {
        const [firstName, lastName] = (user.full_name || '').split(' ');
        return {
        id: user.id,
        username: user.username,
        password: user.password,
        firstName: firstName || "", lastName: lastName || "",
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
        annualIncome: user.annual_income,
        idType: user.id_type,
        idNumber: user.id_number,
        transferPin: user.transfer_pin,
        role: user.role,
        isVerified: user.is_verified,
        isActive: user.is_active,
        balance: user.balance || "0",
        createdAt: user.created_at,
        createdByAdmin: user.created_by_admin,
        modifiedByAdmin: user.modified_by_admin,
        
        updatedAt: user.updated_at
      }});
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
      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: user.username, password: user.password, firstName: firstName || "", lastName: lastName || "", email: user.email, phone: user.phone, accountNumber: user.account_number, accountId: user.account_id, profession: user.profession, dateOfBirth: user.date_of_birth, address: user.address, city: user.city, state: user.state, country: user.country, postalCode: user.postal_code, annualIncome: user.annual_income, idType: user.id_type, idNumber: user.id_number, transferPin: user.transfer_pin, role: user.role, isVerified: user.is_verified, isActive: user.is_active, balance: user.balance || "0", createdAt: user.created_at, updatedAt: user.updated_at } as any;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(data: InsertUser): Promise<User> {
    try {
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      const { data: user, error } = await supabase
        .from('bank_users')
        .insert({
          full_name: fullName,
          email: data.email,
          balance: data.balance || '0'
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

      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: data.username || '', password: data.password || '', firstName: firstName || "", lastName: lastName || "", email: user.email, phone: data.phone || '', accountNumber: data.accountNumber || '', accountId: data.accountId, profession: data.profession || '', dateOfBirth: data.dateOfBirth || '', address: data.address || '', city: data.city || '', state: data.state || '', country: data.country || '', postalCode: data.postalCode || '', annualIncome: data.annualIncome || '', idType: data.idType || '', idNumber: data.idNumber || '', transferPin: data.transferPin || '', role: data.role || 'customer', isVerified: data.isVerified || false, isActive: data.isActive || false, balance: (user.balance || '0').toString(), createdAt: user.created_at, updatedAt: user.updated_at } as any;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const first = updates.firstName || '';
        const last = updates.lastName || '';
        updateData.full_name = `${first} ${last}`.trim();
      }
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.profession !== undefined) updateData.profession = updates.profession;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.state !== undefined) updateData.state = updates.state;
      if (updates.country !== undefined) updateData.country = updates.country;
      if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode;
      if (updates.annualIncome !== undefined) updateData.annual_income = updates.annualIncome;
      if (updates.isVerified !== undefined) updateData.is_verified = updates.isVerified;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (updates.transferPin !== undefined) updateData.transfer_pin = updates.transferPin;
      const { data: user, error } = await supabase.from('bank_users').update(updateData).eq('id', id).select().single();

      if (error || !user) return undefined;
      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: user.username, password: user.password, firstName: firstName || "", lastName: lastName || "", email: user.email, phone: user.phone, accountNumber: user.account_number, accountId: user.account_id, profession: user.profession, dateOfBirth: user.date_of_birth, address: user.address, city: user.city, state: user.state, country: user.country, postalCode: user.postal_code, annualIncome: user.annual_income, idType: user.id_type, idNumber: user.id_number, transferPin: user.transfer_pin, role: user.role, isVerified: user.is_verified, isActive: user.is_active, balance: user.balance || "0", createdAt: user.created_at, updatedAt: user.updated_at } as any;
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
      const [firstName, lastName] = (user.full_name || '').split(' ');
      return { id: user.id, username: user.username, password: user.password, firstName: firstName || "", lastName: lastName || "", email: user.email, phone: user.phone, accountNumber: user.account_number, accountId: user.account_id, profession: user.profession, dateOfBirth: user.date_of_birth, address: user.address, city: user.city, state: user.state, country: user.country, postalCode: user.postal_code, annualIncome: user.annual_income, idType: user.id_type, idNumber: user.id_number, transferPin: user.transfer_pin, role: user.role, isVerified: user.is_verified, isActive: user.is_active, balance: user.balance || "0", createdAt: user.created_at, updatedAt: user.updated_at } as any;
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
      
      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at } as any;
    } catch (error) {
      console.error('Error getting account:', error);
      return undefined;
    }
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    try {
      const { data: account, error } = await supabase.from('bank_accounts').insert({ user_id: data.userId, account_number: data.accountNumber, account_type: data.accountType, balance: data.balance, currency: data.currency || 'USD', status: data.status || 'active' }).select().single();

      if (error || !account) {
        throw error || new Error('Failed to create account');
      }

      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at } as any;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.accountType !== undefined) updateData.account_type = updates.accountType;
      const { data: account, error } = await supabase.from('bank_accounts').update(updateData).eq('id', id).select().single();

      if (error || !account) return undefined;
      
      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at } as any;
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
        transactionType: tx.transaction_type, type: tx.type,
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
        transactionType: transaction.transaction_type, type: transaction.type,
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
        transactionType: tx.transaction_type, type: tx.type,
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
        transactionType: tx.transaction_type, type: tx.type,
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
      const { data, error } = await supabase.from('admin_actions').insert({ admin_id: action.adminId, action: action.action, target_id: action.targetId, target_type: action.targetType, details: action.details || null }).select().single();
      if (error) throw error;
      return { id: data.id, adminId: data.admin_id, action: data.action, targetId: data.target_id, targetType: data.target_type, details: data.details, createdAt: data.created_at } as any;
    } catch (error) { console.error('Failed to create admin action:', error); throw error; }
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    let query = supabase.from('admin_actions').select('*').order('created_at', { ascending: false });
    if (adminId !== undefined) query = query.eq('admin_id', adminId);
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch admin actions: ${error.message}`);
    return (data || []).map(a => ({ id: a.id, adminId: a.admin_id, action: a.action, targetId: a.target_id, targetType: a.target_type, details: a.details, createdAt: a.created_at } as any));
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase.from('support_tickets').insert({
        user_id: ticket.userId,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
      }).select().single();
      if (error) throw error;
      return { id: data.id, userId: data.user_id, subject: data.subject, description: data.description, priority: data.priority, status: data.status, createdAt: new Date(data.created_at), updatedAt: new Date(data.updated_at), resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null } as any;
    } catch (error) { console.error('Failed to create support ticket:', error); throw error; }
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return { id: data.id, userId: data.user_id, subject: data.subject, description: data.description, priority: data.priority, status: data.status, createdAt: new Date(data.created_at), updatedAt: new Date(data.updated_at), resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null } as any;
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (userId !== undefined) query = query.eq('user_id', userId);
    const { data, error} = await query;
    if (error) throw new Error(`Failed to fetch support tickets: ${error.message}`);
    return (data || []).map(t => ({ id: t.id, userId: t.user_id, subject: t.subject, description: t.description, priority: t.priority, status: t.status, createdAt: new Date(t.created_at), updatedAt: new Date(t.updated_at), resolvedAt: t.resolved_at ? new Date(t.resolved_at) : null } as any));
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status === 'resolved' && !updates.resolvedAt) updateData.resolved_at = new Date().toISOString();
      const { data, error } = await supabase.from('support_tickets').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      if (!data) return undefined;
      return { id: data.id, userId: data.user_id, subject: data.subject, description: data.description, priority: data.priority, status: data.status, createdAt: new Date(data.created_at), updatedAt: new Date(data.updated_at), resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null } as any;
    } catch (error) { console.error('Failed to update support ticket:', error); return undefined; }
  }

  // Cards methods
  async getUserCards(userId: number): Promise<Card[]> {
    try {
      const accounts = await this.getUserAccounts(userId);
      if (accounts.length === 0) return [];
      const accountIds = accounts.map(acc => acc.id);
      const { data, error } = await supabase.from('cards').select('*').in('account_id', accountIds);
      if (error) throw error;
      return (data || []).map((c: any) => ({ id: c.id, accountId: c.account_id, cardNumber: c.card_number, cardType: c.card_type, status: c.status, expiryMonth: c.expiry_month, expiryYear: c.expiry_year, createdAt: c.created_at, updatedAt: c.updated_at } as any));
    } catch (error) { console.error('Error fetching cards:', error); return []; }
  }

  async getCard(id: number): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
      if (error) throw error;
      return { id: data.id, accountId: data.account_id, cardNumber: data.card_number, cardType: data.card_type, status: data.status, expiryMonth: data.expiry_month, expiryYear: data.expiry_year, createdAt: data.created_at, updatedAt: data.updated_at } as any;
    } catch (error) { console.error('Error fetching card:', error); return undefined; }
  }

  async createCard(card: InsertCard): Promise<Card> {
    const { data, error} = await supabase.from('cards').insert({ account_id: card.accountId, card_number: card.cardNumber, card_type: card.cardType, status: 'active', expiry_month: card.expiryMonth, expiry_year: card.expiryYear }).select().single();
    if (error) throw error;
    return { id: data.id, accountId: data.account_id, cardNumber: data.card_number, cardType: data.card_type, status: data.status, expiryMonth: data.expiry_month, expiryYear: data.expiry_year, createdAt: data.created_at, updatedAt: data.updated_at } as any;
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    const { data, error } = await supabase.from("cards").update({ status: updates.status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) return undefined;
    return data as any;
  }

  // Investments methods
  async getUserInvestments(userId: number): Promise<Investment[]> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((i: any) => ({ id: i.id, userId: i.user_id, type: i.type || 'stock', amount: i.amount?.toString() || '0', rate: i.rate?.toString(), status: i.status, createdAt: i.created_at, updatedAt: i.updated_at } as any));
    } catch (error) { console.error('Error fetching investments:', error); return []; }
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('id', id).single();
      if (error) return undefined;
      return { id: data.id, userId: data.user_id, type: data.type || 'stock', amount: data.amount?.toString() || '0', rate: data.rate?.toString(), status: data.status, createdAt: data.created_at, updatedAt: data.updated_at } as any;
    } catch { return undefined; }
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const { data, error } = await supabase.from('investments').insert({ user_id: investment.userId, type: investment.type || 'stock', amount: investment.amount, rate: investment.rate, status: investment.status || 'active' }).select().single();
    if (error) throw error;
    return { id: data.id, userId: data.user_id, type: data.type || 'stock', amount: data.amount?.toString() || '0', rate: data.rate?.toString(), status: data.status, createdAt: data.created_at, updatedAt: data.updated_at } as any;
  }

  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> {
    const { data, error } = await supabase.from('investments').update({ status: updates.status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return undefined;
    return { id: data.id, userId: data.user_id, type: data.type || 'stock', amount: data.amount?.toString() || '0', rate: data.rate?.toString(), status: data.status, createdAt: data.created_at, updatedAt: data.updated_at } as any;
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
    const { data, error } = await supabase.from('messages').insert(message).select().single();
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
    const { data, error } = await supabase.from('alerts').insert(alert).select().single();
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
