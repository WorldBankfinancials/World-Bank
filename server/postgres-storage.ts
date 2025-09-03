import postgres from 'postgres';
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

const databaseUrl = process.env.DATABASE_URL!;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}

const sql = postgres(databaseUrl, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 30
});

export class PostgresStorage implements IStorage {
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM public.bank_users WHERE id = ${id}
      `;
      
      if (result.length === 0) return undefined;
      
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM public.bank_users WHERE username = ${username}
      `;
      
      if (result.length === 0) return undefined;
      
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error fetching user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log('🔍 Searching for user with email:', email);
    try {
      const result = await sql`
        SELECT * FROM public.bank_users WHERE email = ${email}
      `;
      
      if (result.length === 0) {
        console.log('❌ No user found with email:', email);
        return undefined;
      }
      
      console.log('✅ Found user in database:', result[0]);
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Database error fetching user by email:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await sql`
        SELECT * FROM public.bank_users ORDER BY created_at DESC
      `;
      
      return result.map(user => this.mapDbUser(user));
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      return [];
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await sql`
        INSERT INTO public.bank_users (
          username, password_hash, full_name, email, phone,
          account_number, account_id, profession, date_of_birth,
          address, city, state, country, postal_code, nationality,
          annual_income, id_type, id_number, transfer_pin, role,
          is_verified, is_online, is_active, avatar_url, balance, supabase_user_id
        ) VALUES (
          ${user.username}, ${user.password}, ${user.fullName}, ${user.email}, ${user.phone},
          ${user.accountNumber}, ${user.accountId}, ${user.profession}, ${user.dateOfBirth},
          ${user.address}, ${user.city}, ${user.state}, ${user.country}, ${user.postalCode}, ${user.nationality},
          ${user.annualIncome}, ${user.idType}, ${user.idNumber}, ${user.transferPin}, ${user.role || 'customer'},
          ${user.isVerified || false}, ${user.isOnline || false}, ${user.isActive || true}, ${user.avatarUrl}, ${user.balance || 0}, ${user.supabaseUserId}
        ) RETURNING *
      `;

      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const result = await sql`
        UPDATE public.bank_users 
        SET 
          username = COALESCE(${updates.username}, username),
          full_name = COALESCE(${updates.fullName}, full_name),
          email = COALESCE(${updates.email}, email),
          phone = COALESCE(${updates.phone}, phone),
          profession = COALESCE(${updates.profession}, profession),
          address = COALESCE(${updates.address}, address),
          city = COALESCE(${updates.city}, city),
          state = COALESCE(${updates.state}, state),
          country = COALESCE(${updates.country}, country),
          postal_code = COALESCE(${updates.postalCode}, postal_code),
          nationality = COALESCE(${updates.nationality}, nationality),
          annual_income = COALESCE(${updates.annualIncome}, annual_income),
          is_verified = COALESCE(${updates.isVerified}, is_verified),
          is_online = COALESCE(${updates.isOnline}, is_online),
          is_active = COALESCE(${updates.isActive}, is_active),
          avatar_url = COALESCE(${updates.avatarUrl}, avatar_url),
          balance = COALESCE(${updates.balance}, balance),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) return undefined;
      
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return undefined;
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    try {
      const result = await sql`
        UPDATE public.bank_users 
        SET balance = ${amount}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) return undefined;
      
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error updating user balance:', error);
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    console.log('🏦 Fetching accounts for user ID:', userId);
    try {
      const result = await sql`
        SELECT * FROM public.bank_accounts WHERE user_id = ${userId}
      `;
      
      if (result.length === 0) {
        console.log('❌ No accounts found for user ID:', userId);
        return [];
      }
      
      console.log('✅ Found accounts in database:', result);
      return result.map(account => this.mapDbAccount(account));
    } catch (error) {
      console.error('❌ Database error fetching accounts:', error);
      return [];
    }
  }

  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const result = await sql`
        SELECT * FROM public.bank_accounts WHERE id = ${id}
      `;
      
      if (result.length === 0) return undefined;
      
      return this.mapDbAccount(result[0]);
    } catch (error) {
      console.error('❌ Error fetching account:', error);
      return undefined;
    }
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    try {
      const result = await sql`
        INSERT INTO public.bank_accounts (
          user_id, account_number, account_type, balance, currency, is_active
        ) VALUES (
          ${account.userId}, ${account.accountNumber}, ${account.accountType}, 
          ${account.balance}, ${account.currency || 'USD'}, ${account.isActive || true}
        ) RETURNING *
      `;

      return this.mapDbAccount(result[0]);
    } catch (error) {
      console.error('❌ Error creating account:', error);
      throw new Error(`Failed to create account: ${error}`);
    }
  }

  async getAccountTransactions(accountId: number, limit = 50): Promise<Transaction[]> {
    try {
      const result = await sql`
        SELECT * FROM public.transactions 
        WHERE from_account_id = ${accountId} OR to_account_id = ${accountId}
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
      
      return result.map(tx => this.mapDbTransaction(tx));
    } catch (error) {
      console.error('❌ Error fetching account transactions:', error);
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const result = await sql`
        INSERT INTO public.transactions (
          transaction_id, from_user_id, to_user_id, from_account_id, to_account_id,
          amount, currency, transaction_type, status, description,
          recipient_name, recipient_account, reference_number, fee,
          exchange_rate, country_code, bank_name, swift_code, admin_notes
        ) VALUES (
          ${transaction.transactionId}, ${transaction.fromUserId}, ${transaction.toUserId}, 
          ${transaction.fromAccountId}, ${transaction.toAccountId}, ${transaction.amount},
          ${transaction.currency || 'USD'}, ${transaction.transactionType}, ${transaction.status},
          ${transaction.description}, ${transaction.recipientName}, ${transaction.recipientAccount},
          ${transaction.referenceNumber}, ${transaction.fee || 0}, ${transaction.exchangeRate},
          ${transaction.countryCode}, ${transaction.bankName}, ${transaction.swiftCode}, ${transaction.adminNotes}
        ) RETURNING *
      `;

      return this.mapDbTransaction(result[0]);
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error}`);
    }
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    try {
      const result = await sql`
        UPDATE public.transactions 
        SET status = ${status}, admin_notes = ${notes}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) return undefined;
      
      return this.mapDbTransaction(result[0]);
    } catch (error) {
      console.error('❌ Error updating transaction status:', error);
      return undefined;
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const result = await sql`
        SELECT * FROM public.transactions 
        WHERE status = 'pending'
        ORDER BY created_at DESC
      `;
      
      return result.map(tx => this.mapDbTransaction(tx));
    } catch (error) {
      console.error('❌ Error fetching pending transactions:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const result = await sql`
        SELECT * FROM public.transactions 
        ORDER BY created_at DESC
      `;
      
      return result.map(tx => this.mapDbTransaction(tx));
    } catch (error) {
      console.error('❌ Error fetching all transactions:', error);
      return [];
    }
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const result = await sql`
        UPDATE public.bank_accounts 
        SET 
          balance = COALESCE(${updates.balance}, balance),
          is_active = COALESCE(${updates.isActive}, is_active),
          account_type = COALESCE(${updates.accountType}, account_type),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) return undefined;
      
      return this.mapDbAccount(result[0]);
    } catch (error) {
      console.error('❌ Error updating account:', error);
      return undefined;
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

  private mapDbUser(data: any): User {
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

  private mapDbAccount(data: any): Account {
    return {
      id: data.id,
      userId: data.user_id,
      accountNumber: data.account_number,
      accountType: data.account_type,
      balance: parseFloat(data.balance || '0'),
      currency: data.currency,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapDbTransaction(data: any): Transaction {
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