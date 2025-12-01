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
      return result[0] as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE username = ${username} LIMIT 1
      `;
      return result[0] as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE email = ${email} LIMIT 1
      `;
      return result[0] as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE phone = ${phone} LIMIT 1
      `;
      return result[0] as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_users WHERE supabase_id = ${supabaseUserId} LIMIT 1
      `;
      return result[0] as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await sql`
        SELECT * FROM bank_users ORDER BY created_at DESC
      `;
      return result as User[];
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
          ${user.username}, ${user.email}, ${user.password},
          ${user.firstName}, ${user.lastName}, ${user.phone || ''},
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
      return result[0] as User;
    } catch (error: any) {
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(user).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (updates.length === 0) return this.getUser(id);

      const result = await sql`
        UPDATE bank_users
        SET ${sql(updates.join(', '))}
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0] as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    try {
      const result = await sql`
        UPDATE bank_users
        SET balance = ${amount.toString()}
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0] as User | undefined;
    } catch (error) {
      return undefined;
    }
  }

  // ==================== ACCOUNT OPERATIONS ====================
  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const result = await sql`
        SELECT * FROM bank_accounts WHERE id = ${id} LIMIT 1
      `;
      return result[0] as Account | undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    try {
      const result = await sql`
        SELECT * FROM bank_accounts WHERE user_id = ${userId}
      `;
      return result as Account[];
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
          ${account.userId}, ${account.accountNumber}, ${account.accountType},
          ${account.balance || '0.00'}, ${account.currency || 'USD'},
          ${account.status || 'active'}
        )
        RETURNING *
      `;
      return result[0] as Account;
    } catch (error: any) {
      throw error;
    }
  }

  async updateAccount(id: number, account: Partial<Account>): Promise<Account | undefined> {
    try {
      const result = await sql`
        UPDATE bank_accounts
        SET ${sql(Object.entries(account).map(([k]) => `${k} = $1`).join(', '))}
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0] as Account | undefined;
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
      return result[0] as Transaction | undefined;
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
      return result as Transaction[];
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
      return result as Transaction[];
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
          ${transaction.fromAccountId}, ${transaction.toAccountId},
          ${transaction.amount}, ${transaction.type || 'transfer'},
          ${transaction.status || 'pending'}, ${transaction.referenceNumber || ''},
          ${transaction.description || ''}, NOW()
        )
        RETURNING *
      `;
      return result[0] as Transaction;
    } catch (error: any) {
      throw error;
    }
  }

  // ==================== ADMIN ACTION OPERATIONS ====================
  async createAdminAction(action: InsertAdminAction): Promise<AdminAction> {
    try {
      const result = await sql`
        INSERT INTO bank_admin_actions (admin_id, action_type, target_id, details, created_at)
        VALUES (${action.adminId}, ${action.actionType}, ${action.targetId}, ${action.details || ''}, NOW())
        RETURNING *
      `;
      return result[0] as AdminAction;
    } catch (error: any) {
      throw error;
    }
  }

  // ==================== PLACEHOLDER METHODS ====================
  async getAlert(id: string): Promise<Alert | undefined> { return undefined; }
  async getUserAlerts(userId: number): Promise<Alert[]> { return []; }
  async createAlert(alert: any): Promise<Alert> { throw new Error('Not implemented'); }
  async getCard(id: string): Promise<Card | undefined> { return undefined; }
  async getUserCards(userId: number): Promise<Card[]> { return []; }
  async createCard(card: any): Promise<Card> { throw new Error('Not implemented'); }
  async getInvestment(id: string): Promise<Investment | undefined> { return undefined; }
  async getUserInvestments(userId: number): Promise<Investment[]> { return []; }
  async createInvestment(investment: any): Promise<Investment> { throw new Error('Not implemented'); }
  async getMessage(id: string): Promise<Message | undefined> { return undefined; }
  async getConversationMessages(conversationId: string): Promise<Message[]> { return []; }
  async createMessage(message: any): Promise<Message> { throw new Error('Not implemented'); }
  async getSupportTicket(id: string): Promise<SupportTicket | undefined> { return undefined; }
  async getUserSupportTickets(userId: number): Promise<SupportTicket[]> { return []; }
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> { throw new Error('Not implemented'); }
}
