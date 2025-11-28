/* server/postgres-storage.ts */
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
} from '../shared/schema';
import { IStorage } from './storage';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}

const sql = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30
});

export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result: any = await sql`SELECT * FROM public.bank_users WHERE id = ${id}`;
      if (!result || result.length === 0) return undefined;
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result: any = await sql`SELECT * FROM public.bank_users WHERE username = ${username}`;
      if (!result || result.length === 0) return undefined;
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error fetching user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log('🔍 Searching for user with email:', email);
    try {
      const result: any = await sql`SELECT * FROM public.bank_users WHERE email = ${email}`;
      if (!result || result.length === 0) {
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
      const result: any = await sql`
        SELECT * FROM public.bank_users WHERE supabase_user_id = ${supabaseUserId}::uuid
      `;
      if (!result || result.length === 0) {
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
      const result: any = await sql`SELECT * FROM public.bank_users WHERE phone = ${phone}`;
      if (!result || result.length === 0) return undefined;
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error fetching user by phone:', error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result: any = await sql`SELECT * FROM public.bank_users ORDER BY created_at DESC`;
      if (!result) return [];
      return result.map((user: any) => this.mapDbUser(user));
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
      return [];
    }
  }

  async createUser(user: any): Promise<User> {
    try {
      const result: any = await sql`
        INSERT INTO public.bank_users (
          username, password_hash, full_name, email, phone,
          account_number, account_id, profession, date_of_birth,
          address, city, state, country, postal_code, nationality,
          annual_income, id_type, id_number, transfer_pin, role,
          is_verified, is_online, is_active, avatar_url, balance, supabase_user_id,
          last_login, created_by_admin, modified_by_admin, admin_notes
        ) VALUES (
          ${user.username}, ${user.passwordHash}, ${user.fullName}, ${user.email}, ${user.phone},
          ${user.accountNumber}, ${user.accountId}, ${user.profession}, ${user.dateOfBirth},
          ${user.address}, ${user.city}, ${user.state}, ${user.country}, ${user.postalCode}, ${user.nationality},
          ${user.annualIncome}, ${user.idType}, ${user.idNumber}, ${user.transferPin}, ${user.role},
          ${user.isVerified}, ${user.isOnline}, ${user.isActive}, ${user.avatarUrl}, ${user.balance}, ${user.supabaseUserId},
          ${user.lastLogin}, ${user.createdByAdmin}, ${user.modifiedByAdmin}, ${user.adminNotes}
        ) RETURNING *
      `;
      return this.mapDbUser(result[0]);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: any): Promise<User | undefined> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          setClauses.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (setClauses.length === 0) return this.getUser(id);
      
      const result: any = await sql`
        UPDATE public.bank_users 
        SET ${sql(setClauses.join(', '))}
        WHERE id = ${id}
        RETURNING *
      `;
      return result.length > 0 ? this.mapDbUser(result[0]) : undefined;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return undefined;
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.bank_users 
        SET balance = balance + ${amount}
        WHERE id = ${id}
        RETURNING *
      `;
      return result.length > 0 ? this.mapDbUser(result[0]) : undefined;
    } catch (error) {
      console.error('❌ Error updating user balance:', error);
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    try {
      const result: any = await sql`SELECT * FROM public.bank_accounts WHERE user_id = ${userId}`;
      return result ? result.map((acc: any) => this.mapDbAccount(acc)) : [];
    } catch (error) {
      console.error('❌ Error fetching user accounts:', error);
      return [];
    }
  }

  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const result: any = await sql`SELECT * FROM public.bank_accounts WHERE id = ${id}`;
      if (!result || result.length === 0) return undefined;
      return this.mapDbAccount(result[0]);
    } catch (error) {
      console.error('❌ Error fetching account:', error);
      return undefined;
    }
  }

  async createAccount(account: any): Promise<Account> {
    try {
      const result: any = await sql`
        INSERT INTO public.bank_accounts (user_id, account_number, account_type, balance, currency, is_active)
        VALUES (${account.userId}, ${account.accountNumber}, ${account.accountType}, ${account.balance}, ${account.currency || 'USD'}, ${account.isActive || true})
        RETURNING *
      `;
      return this.mapDbAccount(result[0]);
    } catch (error) {
      console.error('❌ Error creating account:', error);
      throw error;
    }
  }

  async getAccountTransactions(accountId: number, limit = 50): Promise<Transaction[]> {
    try {
      const result: any = await sql`
        SELECT * FROM public.transactions 
        WHERE from_account_id = ${accountId} OR to_account_id = ${accountId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return result ? result.map((tx: any) => this.mapDbTransaction(tx)) : [];
    } catch (error) {
      console.error('❌ Error fetching account transactions:', error);
      return [];
    }
  }

  async createTransaction(transaction: any): Promise<Transaction> {
    try {
      const result: any = await sql`
        INSERT INTO public.transactions (
          transaction_id, from_user_id, to_user_id, from_account_id, to_account_id,
          amount, currency, transaction_type, status, description
        ) VALUES (
          ${transaction.transactionId || `TX${Date.now()}`}, ${transaction.fromUserId}, ${transaction.toUserId},
          ${transaction.fromAccountId}, ${transaction.toAccountId}, ${transaction.amount},
          ${transaction.currency || 'USD'}, ${transaction.transactionType || 'transfer'}, 
          ${transaction.status || 'pending'}, ${transaction.description}
        ) RETURNING *
      `;
      return this.mapDbTransaction(result[0]);
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.transactions 
        SET status = ${status}, admin_notes = ${notes}
        WHERE id = ${id}
        RETURNING *
      `;
      return result.length > 0 ? this.mapDbTransaction(result[0]) : undefined;
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      return undefined;
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const result: any = await sql`SELECT * FROM public.transactions WHERE status = 'pending'`;
      return result ? result.map((tx: any) => this.mapDbTransaction(tx)) : [];
    } catch (error) {
      console.error('❌ Error fetching pending transactions:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const result: any = await sql`SELECT * FROM public.transactions ORDER BY created_at DESC`;
      return result ? result.map((tx: any) => this.mapDbTransaction(tx)) : [];
    } catch (error) {
      console.error('❌ Error fetching all transactions:', error);
      return [];
    }
  }

  async updateAccount(id: number, updates: any): Promise<Account | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.bank_accounts 
        SET balance = COALESCE(${updates.balance}, balance),
            is_active = COALESCE(${updates.isActive}, is_active)
        WHERE id = ${id}
        RETURNING *
      `;
      return result.length > 0 ? this.mapDbAccount(result[0]) : undefined;
    } catch (error) {
      console.error('❌ Error updating account:', error);
      return undefined;
    }
  }

  async createAdminAction(action: any): Promise<AdminAction> {
    try {
      const result: any = await sql`
        INSERT INTO public.admin_actions (admin_id, action_type, target_id, target_type, description)
        VALUES (${action.adminId}, ${action.actionType}, ${action.targetId}, ${action.targetType}, ${action.description})
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error('❌ Error creating admin action:', error);
      throw error;
    }
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    try {
      let result: any;
      if (adminId) {
        result = await sql`SELECT * FROM public.admin_actions WHERE admin_id = ${adminId} ORDER BY created_at DESC`;
      } else {
        result = await sql`SELECT * FROM public.admin_actions ORDER BY created_at DESC`;
      }
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching admin actions:', error);
      return [];
    }
  }

  async createSupportTicket(ticket: any): Promise<SupportTicket> {
    try {
      const result: any = await sql`
        INSERT INTO public.support_tickets (user_id, subject, description, priority, status)
        VALUES (${ticket.userId}, ${ticket.subject}, ${ticket.description}, ${ticket.priority || 'medium'}, ${ticket.status || 'open'})
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error('❌ Error creating support ticket:', error);
      throw error;
    }
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    try {
      const result: any = await sql`SELECT * FROM public.support_tickets WHERE id = ${id}`;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error fetching support ticket:', error);
      return undefined;
    }
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    try {
      let result: any;
      if (userId) {
        result = await sql`SELECT * FROM public.support_tickets WHERE user_id = ${userId}`;
      } else {
        result = await sql`SELECT * FROM public.support_tickets`;
      }
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching support tickets:', error);
      return [];
    }
  }

  async updateSupportTicket(id: number, updates: any): Promise<SupportTicket | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.support_tickets 
        SET status = COALESCE(${updates.status}, status),
            admin_notes = COALESCE(${updates.adminNotes}, admin_notes)
        WHERE id = ${id}
        RETURNING *
      `;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error updating support ticket:', error);
      return undefined;
    }
  }

  async getUserCards(userId: number): Promise<Card[]> {
    try {
      const result: any = await sql`SELECT * FROM public.cards WHERE account_id IN (SELECT id FROM public.bank_accounts WHERE user_id = ${userId})`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching user cards:', error);
      return [];
    }
  }

  async getCard(id: number): Promise<Card | undefined> {
    try {
      const result: any = await sql`SELECT * FROM public.cards WHERE id = ${id}`;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error fetching card:', error);
      return undefined;
    }
  }

  async createCard(card: any): Promise<Card> {
    try {
      const result: any = await sql`
        INSERT INTO public.cards (account_id, card_number, card_type, expiry_date, cvv, cardholder_name)
        VALUES (${card.accountId}, ${card.cardNumber}, ${card.cardType}, ${card.expiryDate}, ${card.cvv}, ${card.cardholderName})
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error('❌ Error creating card:', error);
      throw error;
    }
  }

  async updateCard(id: number, updates: any): Promise<Card | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.cards 
        SET is_locked = COALESCE(${updates.isLocked}, is_locked)
        WHERE id = ${id}
        RETURNING *
      `;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error updating card:', error);
      return undefined;
    }
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    try {
      const result: any = await sql`SELECT * FROM public.investments WHERE user_id = ${userId}`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching user investments:', error);
      return [];
    }
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    try {
      const result: any = await sql`SELECT * FROM public.investments WHERE id = ${id}`;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error fetching investment:', error);
      return undefined;
    }
  }

  async createInvestment(investment: any): Promise<Investment> {
    try {
      const result: any = await sql`
        INSERT INTO public.investments (user_id, investment_type, amount, current_value, return_rate, status)
        VALUES (${investment.userId}, ${investment.investmentType}, ${investment.amount}, ${investment.currentValue}, ${investment.returnRate}, ${investment.status || 'active'})
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error('❌ Error creating investment:', error);
      throw error;
    }
  }

  async updateInvestment(id: number, updates: any): Promise<Investment | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.investments 
        SET current_value = COALESCE(${updates.currentValue}, current_value),
            status = COALESCE(${updates.status}, status)
        WHERE id = ${id}
        RETURNING *
      `;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error updating investment:', error);
      return undefined;
    }
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    try {
      const result: any = await sql`SELECT * FROM public.messages ORDER BY created_at DESC`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return [];
    }
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    try {
      const result: any = await sql`SELECT * FROM public.messages WHERE from_user_id = ${userId} OR to_user_id = ${userId}`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching user messages:', error);
      return [];
    }
  }

  async createMessage(message: any): Promise<Message> {
    try {
      const result: any = await sql`
        INSERT INTO public.messages (from_user_id, to_user_id, content, is_read)
        VALUES (${message.fromUserId}, ${message.toUserId}, ${message.content}, ${message.isRead || false})
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error('❌ Error creating message:', error);
      throw error;
    }
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.messages SET is_read = true WHERE id = ${id} RETURNING *
      `;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
      return undefined;
    }
  }

  async getUserAlerts(userId: number): Promise<Alert[]> {
    try {
      const result: any = await sql`SELECT * FROM public.alerts WHERE user_id = ${userId} ORDER BY created_at DESC`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      return [];
    }
  }

  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    try {
      const result: any = await sql`SELECT * FROM public.alerts WHERE user_id = ${userId} AND is_read = false`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching unread alerts:', error);
      return [];
    }
  }

  async createAlert(alert: any): Promise<Alert> {
    try {
      const result: any = await sql`
        INSERT INTO public.alerts (user_id, title, message, type, is_read)
        VALUES (${alert.userId}, ${alert.title}, ${alert.message}, ${alert.type}, ${alert.isRead || false})
        RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error('❌ Error creating alert:', error);
      throw error;
    }
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    try {
      const result: any = await sql`
        UPDATE public.alerts SET is_read = true WHERE id = ${id} RETURNING *
      `;
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error('❌ Error marking alert as read:', error);
      return undefined;
    }
  }

  async deleteAlert(id: number): Promise<void> {
    try {
      await sql`DELETE FROM public.alerts WHERE id = ${id}`;
    } catch (error) {
      console.error('❌ Error deleting alert:', error);
    }
  }

  async getBranches(): Promise<any[]> {
    try {
      const result: any = await sql`SELECT * FROM public.branches`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      return [];
    }
  }

  async getAtms(): Promise<any[]> {
    try {
      const result: any = await sql`SELECT * FROM public.atms`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching ATMs:', error);
      return [];
    }
  }

  async getExchangeRates(): Promise<any[]> {
    try {
      const result: any = await sql`SELECT * FROM public.exchange_rates`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching exchange rates:', error);
      return [];
    }
  }

  async getStatementsByUserId(userId: number): Promise<any[]> {
    try {
      const result: any = await sql`SELECT * FROM public.statements WHERE user_id = ${userId}`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching statements:', error);
      return [];
    }
  }

  async getMarketRates(): Promise<any[]> {
    try {
      const result: any = await sql`SELECT * FROM public.market_rates`;
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching market rates:', error);
      return [];
    }
  }

  private mapDbUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      accountNumber: row.account_number,
      accountId: row.account_id,
      profession: row.profession,
      dateOfBirth: row.date_of_birth,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      postalCode: row.postal_code,
      nationality: row.nationality,
      annualIncome: row.annual_income,
      idType: row.id_type,
      idNumber: row.id_number,
      transferPin: row.transfer_pin,
      role: row.role,
      isVerified: row.is_verified,
      isOnline: row.is_online,
      isActive: row.is_active,
      avatarUrl: row.avatar_url,
      balance: row.balance,
      supabaseUserId: row.supabase_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
      createdByAdmin: row.created_by_admin,
      modifiedByAdmin: row.modified_by_admin,
      adminNotes: row.admin_notes
    };
  }

  private mapDbAccount(row: any): Account {
    return {
      id: row.id,
      userId: row.user_id,
      accountNumber: row.account_number,
      accountType: row.account_type,
      balance: row.balance,
      currency: row.currency,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      accountName: row.account_name,
      interestRate: row.interest_rate,
      minimumBalance: row.minimum_balance
    };
  }

  private mapDbTransaction(row: any): Transaction {
    return {
      id: row.id,
      transactionId: row.transaction_id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      fromAccountId: row.from_account_id,
      toAccountId: row.to_account_id,
      amount: row.amount,
      currency: row.currency,
      transactionType: row.transaction_type,
      status: row.status,
      description: row.description,
      recipientName: row.recipient_name,
      recipientAccount: row.recipient_account,
      recipientCountry: row.recipient_country,
      recipientAddress: row.recipient_address,
      referenceNumber: row.reference_number,
      fee: row.fee,
      exchangeRate: row.exchange_rate,
      countryCode: row.country_code,
      bankName: row.bank_name,
      swiftCode: row.swift_code,
      transferPurpose: row.transfer_purpose,
      category: row.category,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      adminNotes: row.admin_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
