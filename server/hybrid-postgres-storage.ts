/**
 * HYBRID STORAGE - Direct Postgres + Supabase Auth
 * Bypasses REST API bottleneck by querying Postgres directly
 */

import postgres from 'postgres';
import type { IStorage } from "./storage";
import type { User, Account, Transaction, AdminAction, SupportTicket, Card, Investment, Message, Alert, InsertUser, InsertAccount, InsertTransaction, InsertAdminAction, InsertSupportTicket } from "@shared/schema";

// Direct Postgres connection - FAST, no REST API
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL required');

const sql = postgres(dbUrl, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export class HybridPostgresStorage implements IStorage {
  // ==================== USER OPERATIONS ====================
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE id = ${id} LIMIT 1
      `;
      return (result[0] as any) as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE username = ${username} LIMIT 1
      `;
      return (result[0] as any) as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE email = ${email} LIMIT 1
      `;
      return (result[0] as any) as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE phone = ${phone} LIMIT 1
      `;
      return (result[0] as any) as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE supabase_id = ${supabaseUserId} LIMIT 1
      `;
      return (result[0] as any) as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await sql`
        SELECT * FROM bank_users ORDER BY created_at DESC
      `;
      return (result as any) as User[];
    } catch (error) {
      return [];
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await sql`
        INSERT INTO bank_users (
          username, email, password, first_name, last_name, phone,
          date_of_birth, address, city, state, country, postal_code,
          profession, annual_income, id_type, id_number, account_number,
          account_id, balance, is_verified, is_active, transfer_pin, role
        ) VALUES (
          ${user.username || ''}, ${user.email || ''}, ${user.password || ''},
          ${user.firstName || ''}, ${user.lastName || ''}, ${user.phone || ''},
          ${user.dateOfBirth || null}, ${user.address || ''},
          ${user.city || ''}, ${user.state || ''}, ${user.country || ''},
          ${user.postalCode || ''}, ${user.profession || ''},
          ${user.annualIncome || ''}, ${user.idType || ''},
          ${user.idNumber || ''}, ${user.accountNumber || ''},
          ${user.accountId || Date.now()}, ${user.balance || '0'},
          ${user.isVerified || false}, ${user.isActive || false},
          ${user.transferPin || ''}, ${user.role || 'customer'}
        )
        RETURNING *
      `;
      return (result[0] as any) as User;
    } catch (error: any) {
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    try {
      const updates: any[] = [];
      const values: any[] = [];

      Object.entries(user).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          updates.push(key);
          values.push(value);
        }
      });

      if (updates.length === 0) return this.getUser(id);

      const setClause = updates.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const result = await sql`
        UPDATE bank_users
        SET ${sql(setClause)}
        WHERE id = ${id}
        RETURNING *
      `;
      return (result[0] as any) as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    try {
      const numAmount = parseFloat(String(amount));
      const result = await sql`
        UPDATE bank_users
        SET balance = ${numAmount.toString()}
        WHERE id = ${id}
        RETURNING *
      `;
      if (!result || result.length === 0) {
        console.error('No user found to update balance:', id, numAmount);
        return undefined;
      }
      console.log('Balance updated successfully:', id, numAmount);
      return (result[0] as any) as User | undefined;
    } catch (error) {
      console.error('Hybrid updateUserBalance error:', error);
      return undefined;
    }
  }

  // ==================== ACCOUNT OPERATIONS ====================
  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_accounts WHERE id = ${id} LIMIT 1
      `;
      return (result[0] as any) as Account | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    try {
      const result = await sql`
        SELECT * FROM bank_accounts WHERE user_id = ${userId}
      `;
      return (result as any) as Account[];
    } catch (error) {
      return [];
    }
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    try {
      const result = await sql`
        INSERT INTO bank_accounts (
          user_id, account_number, account_type, balance, currency, status
        ) VALUES (
          ${account.userId || 0}, ${account.accountNumber || ''}, ${account.accountType || 'checking'},
          ${account.balance || '0.00'}, ${account.currency || 'USD'},
          ${account.status || 'active'}
        )
        RETURNING *
      `;
      return (result[0] as any) as Account;
    } catch (error: any) {
      throw error;
    }
  }

  async updateAccount(id: number, account: Partial<Account>): Promise<Account | undefined> {
    try {
      const updates: any[] = [];
      Object.entries(account).forEach(([key]) => {
        if (key !== 'id') updates.push(key);
      });

      if (updates.length === 0) return this.getAccount(id);

      const setClause = updates.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const result = await sql`
        UPDATE bank_accounts
        SET ${sql(setClause)}
        WHERE id = ${id}
        RETURNING *
      `;
      return (result[0] as any) as Account | undefined;
    } catch (error) {
      return undefined;
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================
  async getTransaction(id: string): Promise<Transaction | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_transactions WHERE id = ${id} LIMIT 1
      `;
      return (result[0] as any) as Transaction | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    try {
      const result = await sql`
        SELECT * FROM bank_transactions
        WHERE from_account_id = ${accountId} OR to_account_id = ${accountId}
        ORDER BY created_at DESC LIMIT 100
      `;
      return (result as any) as Transaction[];
    } catch (error) {
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const result = await sql`
        SELECT * FROM bank_transactions
        ORDER BY created_at DESC LIMIT 500
      `;
      return (result as any) as Transaction[];
    } catch (error) {
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const result = await sql`
        INSERT INTO bank_transactions (
          from_account_id, to_account_id, amount, type, status, 
          reference_number, description, created_at
        ) VALUES (
          ${transaction.fromAccountId || 0}, ${transaction.toAccountId || 0},
          ${transaction.amount || '0'}, ${transaction.type || 'transfer'},
          ${transaction.status || 'pending'}, ${transaction.referenceNumber || ''},
          ${transaction.description || ''}, NOW()
        )
        RETURNING *
      `;
      return (result[0] as any) as Transaction;
    } catch (error: any) {
      throw error;
    }
  }

  // ==================== ADMIN ACTION OPERATIONS ====================
  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    try {
      const result = await sql`
        INSERT INTO bank_admin_actions (admin_id, action_type, target_id, details, created_at)
        VALUES (${action.adminId || 0}, ${(action as any).actionType || 'unknown'}, ${action.targetId || 0}, ${(action as any).details || ''}, NOW())
        RETURNING *
      `;
      return (result[0] as any) as AdminAction;
    } catch (error: any) {
      throw error;
    }
  }

  // ==================== ALERT OPERATIONS ====================
  async getAlert(id: number): Promise<Alert | undefined> { return undefined; }
  async getUserAlerts(userId: number): Promise<Alert[]> { return []; }
  async getUnreadAlerts(userId: number): Promise<Alert[]> { return []; }
  async createAlert(alert: any): Promise<Alert> { throw new Error('Not implemented'); }
  async markAlertAsRead(id: number): Promise<Alert | undefined> { return undefined; }
  async deleteAlert(id: number): Promise<void> {}

  // ==================== CARD OPERATIONS ====================
  async getCard(id: number): Promise<Card | undefined> { return undefined; }
  async getUserCards(userId: number): Promise<Card[]> { return []; }
  async createCard(card: any): Promise<Card> { throw new Error('Not implemented'); }
  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> { return undefined; }

  // ==================== INVESTMENT OPERATIONS ====================
  async getInvestment(id: number): Promise<Investment | undefined> { return undefined; }
  async getUserInvestments(userId: number): Promise<Investment[]> { return []; }
  async createInvestment(investment: any): Promise<Investment> { throw new Error('Not implemented'); }
  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> { return undefined; }

  // ==================== MESSAGE OPERATIONS ====================
  async getMessage(id: string): Promise<Message | undefined> { return undefined; }
  async getMessages(conversationId?: string): Promise<Message[]> { return []; }
  async getUserMessages(userId: number): Promise<Message[]> { return []; }
  async createMessage(message: any): Promise<Message> { throw new Error('Not implemented'); }
  async markMessageAsRead(id: number): Promise<Message | undefined> { return undefined; }

  // ==================== SUPPORT TICKET OPERATIONS ====================
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> { return undefined; }
  async getSupportTickets(userId?: number): Promise<SupportTicket[]> { return []; }
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> { throw new Error('Not implemented'); }
  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> { return undefined; }

  // ==================== BRANCH & ATM OPERATIONS ====================
  async getBranches(): Promise<any[]> { return []; }
  async getAtms(): Promise<any[]> { return []; }

  // ==================== EXCHANGE RATE OPERATIONS ====================
  async getExchangeRates(): Promise<any[]> { return []; }

  // ==================== STATEMENT OPERATIONS ====================
  async getStatementsByUserId(userId: number): Promise<any[]> { return []; }

  // ==================== MARKET RATE OPERATIONS ====================
  async getMarketRates(): Promise<any[]> { return []; }

  // ==================== TRANSACTION OPERATIONS (EXTENDED) ====================
  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> { return undefined; }
  async getPendingTransactions(): Promise<Transaction[]> { return []; }
  async getAdminActions(adminId?: number): Promise<AdminAction[]> { return []; }
}
