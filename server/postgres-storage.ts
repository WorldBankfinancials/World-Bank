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

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    console.log('🔍 Searching for user with Supabase UUID:', supabaseUserId);
    try {
      const result = await sql`
        SELECT * FROM public.bank_users WHERE supabase_user_id = ${supabaseUserId}::uuid
      `;
      
      if (result.length === 0) {
        console.log('❌ No user found with Supabase UUID:', supabaseUserId);
        return undefined;
      }
      
      console.log('✅ Found user by Supabase UUID:', result[0]);
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Database error fetching user by Supabase UUID:', error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM public.bank_users WHERE phone = ${phone}
      `;
      
      if (result.length === 0) return undefined;
      
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error fetching user by phone:', error);
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
      const emailVal = user.email || null;
      const phoneVal = user.phone || null;
      const professionVal = user.profession || null;
      const dobVal = user.dateOfBirth || null;
      const addressVal = user.address || null;
      const cityVal = user.city || null;
      const stateVal = user.state || null;
      const countryVal = user.country || null;
      const postalCodeVal = user.postalCode || null;
      const nationalityVal = user.nationality || null;
      const annualIncomeVal = user.annualIncome || null;
      const idTypeVal = user.idType || null;
      const idNumberVal = user.idNumber || null;
      const transferPinVal = user.transferPin || null;
      const roleVal = user.role || 'customer';
      const isVerifiedVal = user.isVerified ?? false;
      const isOnlineVal = user.isOnline ?? false;
      const isActiveVal = user.isActive ?? true;
      const avatarUrlVal = user.avatarUrl || null;
      const balanceVal = user.balance || 0;
      const supabaseUserIdVal = user.supabaseUserId || null;
      const lastLoginVal = user.lastLogin || null;
      const createdByAdminVal = user.createdByAdmin || null;
      const modifiedByAdminVal = user.modifiedByAdmin || null;
      const adminNotesVal = user.adminNotes || null;
      
      const result = await sql`
        INSERT INTO public.bank_users (
          username, password_hash, full_name, email, phone,
          account_number, account_id, profession, date_of_birth,
          address, city, state, country, postal_code, nationality,
          annual_income, id_type, id_number, transfer_pin, role,
          is_verified, is_online, is_active, avatar_url, balance, supabase_user_id,
          last_login, created_by_admin, modified_by_admin, admin_notes
        ) VALUES (
          ${user.username}, ${user.passwordHash}, ${user.fullName}, ${emailVal}, ${phoneVal},
          ${user.accountNumber}, ${user.accountId}, ${professionVal}, ${dobVal},
          ${addressVal}, ${cityVal}, ${stateVal}, ${countryVal}, ${postalCodeVal}, ${nationalityVal},
          ${annualIncomeVal}, ${idTypeVal}, ${idNumberVal}, ${transferPinVal}, ${roleVal},
          ${isVerifiedVal}, ${isOnlineVal}, ${isActiveVal}, ${avatarUrlVal}, ${balanceVal}, ${supabaseUserIdVal},
          ${lastLoginVal}, ${createdByAdminVal}, ${modifiedByAdminVal}, ${adminNotesVal}
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
      const usernameVal = updates.username || null;
      const fullNameVal = updates.fullName || null;
      const emailVal = updates.email || null;
      const phoneVal = updates.phone || null;
      const professionVal = updates.profession || null;
      const addressVal = updates.address || null;
      const cityVal = updates.city || null;
      const stateVal = updates.state || null;
      const countryVal = updates.country || null;
      const postalCodeVal = updates.postalCode || null;
      const nationalityVal = updates.nationality || null;
      const annualIncomeVal = updates.annualIncome || null;
      const isVerifiedVal = updates.isVerified ?? null;
      const isOnlineVal = updates.isOnline ?? null;
      const isActiveVal = updates.isActive ?? null;
      const avatarUrlVal = updates.avatarUrl || null;
      const balanceVal = updates.balance ?? null;
      
      const result = await sql`
        UPDATE public.bank_users 
        SET 
          username = COALESCE(${usernameVal}, username),
          full_name = COALESCE(${fullNameVal}, full_name),
          email = COALESCE(${emailVal}, email),
          phone = COALESCE(${phoneVal}, phone),
          profession = COALESCE(${professionVal}, profession),
          address = COALESCE(${addressVal}, address),
          city = COALESCE(${cityVal}, city),
          state = COALESCE(${stateVal}, state),
          country = COALESCE(${countryVal}, country),
          postal_code = COALESCE(${postalCodeVal}, postal_code),
          nationality = COALESCE(${nationalityVal}, nationality),
          annual_income = COALESCE(${annualIncomeVal}, annual_income),
          is_verified = COALESCE(${isVerifiedVal}, is_verified),
          is_online = COALESCE(${isOnlineVal}, is_online),
          is_active = COALESCE(${isActiveVal}, is_active),
          avatar_url = COALESCE(${avatarUrlVal}, avatar_url),
          balance = COALESCE(${balanceVal}, balance),
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
      const accountNameVal = account.accountName || null;
      const balanceVal = account.balance || '0';
      const currencyVal = account.currency || 'USD';
      const isActiveVal = account.isActive ?? true;
      const interestRateVal = account.interestRate || null;
      const minimumBalanceVal = account.minimumBalance || null;
      
      const result = await sql`
        INSERT INTO public.bank_accounts (
          user_id, account_number, account_name, account_type, balance, currency, is_active, interest_rate, minimum_balance
        ) VALUES (
          ${account.userId}, ${account.accountNumber}, ${accountNameVal}, ${account.accountType}, 
          ${balanceVal}, ${currencyVal}, ${isActiveVal}, ${interestRateVal}, ${minimumBalanceVal}
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
        WHERE account_id = ${accountId}
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
      const statusVal = transaction.status || 'pending';
      const recipientNameVal = transaction.recipientName || null;
      const recipientAddressVal = transaction.recipientAddress || null;
      const recipientCountryVal = transaction.recipientCountry || null;
      const bankNameVal = transaction.bankName || null;
      const swiftCodeVal = transaction.swiftCode || null;
      const transferPurposeVal = transaction.transferPurpose || null;
      const adminNotesVal = transaction.adminNotes || null;
      const categoryVal = transaction.category || null;
      const approvedByVal = transaction.approvedBy || null;
      const approvedAtVal = transaction.approvedAt || null;
      const rejectedByVal = transaction.rejectedBy || null;
      const rejectedAtVal = transaction.rejectedAt || null;
      
      const result = await sql`
        INSERT INTO public.transactions (
          from_account_id, transaction_type, amount, description, created_at, status,
          recipient_name, recipient_address, recipient_country, 
          bank_name, swift_code, transfer_purpose, admin_notes, category,
          approved_by, approved_at, rejected_by, rejected_at
        ) VALUES (
          ${transaction.fromAccountId}, ${transaction.transactionType}, ${transaction.amount}, ${transaction.description}, ${transaction.createdAt || new Date()}, ${statusVal},
          ${recipientNameVal}, ${recipientAddressVal}, ${recipientCountryVal},
          ${bankNameVal}, ${swiftCodeVal}, ${transferPurposeVal}, ${adminNotesVal}, ${categoryVal},
          ${approvedByVal}, ${approvedAtVal}, ${rejectedByVal}, ${rejectedAtVal}
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
      const notesVal = notes || null;
      
      const result = await sql`
        UPDATE public.transactions 
        SET status = ${status}, admin_notes = ${notesVal}, updated_at = CURRENT_TIMESTAMP
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
      const balanceVal = updates.balance || null;
      const isActiveVal = updates.isActive ?? null;
      const accountTypeVal = updates.accountType || null;
      
      const result = await sql`
        UPDATE public.bank_accounts 
        SET 
          balance = COALESCE(${balanceVal}, balance),
          is_active = COALESCE(${isActiveVal}, is_active),
          account_type = COALESCE(${accountTypeVal}, account_type),
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
      lastLogin: data.last_login || null,
      createdByAdmin: data.created_by_admin || null,
      modifiedByAdmin: data.modified_by_admin || null,
      adminNotes: data.admin_notes || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at || null,
      supabaseUserId: data.supabase_user_id
    };
  }

  private mapDbAccount(data: any): Account {
    return {
      id: data.id,
      userId: data.user_id,
      accountNumber: data.account_number,
      accountName: data.account_name || null,
      accountType: data.account_type,
      balance: data.balance || '0',
      currency: data.currency,
      isActive: data.is_active,
      interestRate: data.interest_rate || null,
      minimumBalance: data.minimum_balance || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapDbTransaction(data: any): Transaction {
    return {
      id: data.id,
      accountId: data.account_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: data.date,
      status: data.status,
      recipientName: data.recipient_name,
      recipientAddress: data.recipient_address,
      recipientCountry: data.recipient_country,
      bankName: data.bank_name,
      swiftCode: data.swift_code,
      transferPurpose: data.transfer_purpose,
      adminNotes: data.admin_notes,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      rejectedBy: data.rejected_by,
      rejectedAt: data.rejected_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
  // Cards methods
  async getUserCards(userId: number): Promise<Card[]> {
    try {
      const result = await sql`SELECT * FROM public.cards WHERE user_id = ${userId}`;
      return result as unknown as Card[];
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  }

  async getCard(id: number): Promise<Card | undefined> {
    try {
      const result = await sql`SELECT * FROM public.cards WHERE id = ${id}`;
      return result[0] as Card | undefined;
    } catch (error) {
      console.error('Error fetching card:', error);
      return undefined;
    }
  }

  async createCard(card: InsertCard): Promise<Card> {
    const result = await sql`
      INSERT INTO public.cards ${sql(card as any)}
      RETURNING *
    `;
    return result[0] as Card;
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    const result = await sql`
      UPDATE public.cards 
      SET ${sql(updates as any)}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Card | undefined;
  }

  // Investments methods
  async getUserInvestments(userId: number): Promise<Investment[]> {
    try {
      const result = await sql`SELECT * FROM public.investments WHERE user_id = ${userId}`;
      return result as unknown as Investment[];
    } catch (error) {
      console.error('Error fetching investments:', error);
      return [];
    }
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    try {
      const result = await sql`SELECT * FROM public.investments WHERE id = ${id}`;
      return result[0] as Investment | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const result = await sql`
      INSERT INTO public.investments ${sql(investment as any)}
      RETURNING *
    `;
    return result[0] as Investment;
  }

  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> {
    const result = await sql`
      UPDATE public.investments 
      SET ${sql(updates as any)}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Investment | undefined;
  }

  // Messages methods
  async getMessages(conversationId?: string): Promise<Message[]> {
    try {
      if (conversationId) {
        const result = await sql`SELECT * FROM public.messages WHERE conversation_id = ${conversationId} ORDER BY created_at DESC`;
        return result as unknown as Message[];
      }
      const result = await sql`SELECT * FROM public.messages ORDER BY created_at DESC LIMIT 100`;
      return result as unknown as Message[];
    } catch (error) {
      return [];
    }
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    try {
      const result = await sql`
        SELECT * FROM public.messages 
        WHERE sender_id = ${userId} OR recipient_id = ${userId}
        ORDER BY created_at DESC
      `;
      return result as unknown as Message[];
    } catch (error) {
      return [];
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await sql`
      INSERT INTO public.messages ${sql(message as any)}
      RETURNING *
    `;
    return result[0] as Message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await sql`
      UPDATE public.messages 
      SET is_read = true, read_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Message | undefined;
  }

  // Alerts methods
  async getUserAlerts(userId: number): Promise<Alert[]> {
    try {
      const result = await sql`SELECT * FROM public.alerts WHERE user_id = ${userId} ORDER BY created_at DESC`;
      return result as unknown as Alert[];
    } catch (error) {
      return [];
    }
  }

  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    try {
      const result = await sql`
        SELECT * FROM public.alerts 
        WHERE user_id = ${userId} AND is_read = false
        ORDER BY created_at DESC
      `;
      return result as unknown as Alert[];
    } catch (error) {
      return [];
    }
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await sql`
      INSERT INTO public.alerts ${sql(alert as any)}
      RETURNING *
    `;
    return result[0] as Alert;
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const result = await sql`
      UPDATE public.alerts 
      SET is_read = true, read_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Alert | undefined;
  }
}
