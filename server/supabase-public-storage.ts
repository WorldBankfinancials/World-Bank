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

export class SupabasePublicStorage {
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data: users, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single();
      
      if (error || !users) return undefined;
      
      const user = users;
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
        supabaseUserId: user.supabase_user_id
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data: users, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('email', email)
        .limit(1)
        .single();
      
      if (error || !users) return undefined;
      
      const user = users[0];
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
        supabaseUserId: user.supabase_user_id
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    try {
      const { data: users, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('supabase_user_id', supabaseUserId)
        .limit(1)
        .single();
      
      if (error || !users) return undefined;
      
      const user = users[0];
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
        supabaseUserId: user.supabase_user_id
      };
    } catch (error) {
      console.error('Error getting user by Supabase ID:', error);
      return undefined;
    }
  }

  async getAccounts(userId?: number): Promise<Account[]> {
    try {
      let query;
      if (userId) {
        query = sql`
          SELECT * FROM bank_accounts WHERE user_id = ${userId} AND is_active = true ORDER BY id
        `;
      } else {
        query = sql`
          SELECT * FROM bank_accounts WHERE is_active = true ORDER BY id
        `;
      }
      
      const accounts = await query;
      
      return accounts.map(account => ({
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
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    try {
      const transactions = await sql`
        INSERT INTO transactions (
          from_account_id, to_account_id, from_account_number, to_account_number,
          amount, currency, description, transaction_type, status,
          created_at, updated_at
        ) VALUES (
          ${data.fromAccountId}, ${data.toAccountId}, ${data.fromAccountNumber}, ${data.toAccountNumber},
          ${data.amount}, ${data.currency}, ${data.description}, ${data.transactionType}, ${data.status || 'pending'},
          NOW(), NOW()
        ) RETURNING *
      `;

      const transaction = transactions[0];
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
      let query;
      if (accountId) {
        query = sql`
          SELECT * FROM transactions 
          WHERE from_account_id = ${accountId} OR to_account_id = ${accountId}
          ORDER BY created_at DESC
        `;
      } else {
        query = sql`
          SELECT * FROM transactions ORDER BY created_at DESC
        `;
      }
      
      const transactions = await query;
      
      return transactions.map(transaction => ({
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
      const users = await sql`
        SELECT transfer_pin FROM bank_users 
        WHERE email = ${email} AND transfer_pin = ${pin} 
        LIMIT 1
      `;
      
      return users.length > 0;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  // Realtime synchronization methods for admin changes
  async subscribeToAdminChanges(callback: (change: any) => void) {
    // Subscribe to realtime changes in admin-relevant tables
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