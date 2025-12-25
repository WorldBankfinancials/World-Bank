
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

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});


const mapUser = (user: Record<string, any>): User => {
  // Ensure balance is always a valid number string
  let balance = '0';
  if (user.balance !== null && user.balance !== undefined) {
    const balNum = parseFloat(String(user.balance));
    balance = isNaN(balNum) ? '0' : balNum.toString();
  }
  
  return {
    id: user.id,
    username: user.username || '',
    password: user.password || '',
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    accountNumber: user.account_number || '',
    accountId: user.account_id || 0,
    profession: user.profession || '',
    dateOfBirth: user.date_of_birth || '',
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    country: user.country || '',
    postalCode: user.postal_code || '',
    annualIncome: user.annual_income || '',
    idType: user.id_type || '',
    idNumber: user.id_number || '',
    transferPin: user.transfer_pin || '',
    role: user.role || 'customer',
    isVerified: user.is_verified || false,
    isActive: user.is_active || false,
    balance: balance,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

// Add retry logic with exponential backoff for network failures
async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export class SupabasePublicStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await withRetry(async () => {
        const { data: user, error } = await supabase
          .from('bank_users')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw new Error(`Supabase error: ${error.message}`);
        return user;
      });
      if (!user) return undefined;
      return mapUser(user);
    } catch (error) {
      console.error('getUser error:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await withRetry(async () => {
        const { data: user, error } = await supabase
          .from('bank_users')
          .select('*')
          .eq('email', email);
        if (error) throw new Error(`Supabase error: ${error.message}`);
        if (!user || user.length === 0) return null;
        return user[0];
      });
      if (!user) return undefined;
      return mapUser(user);
    } catch (error) {
      console.error('getUserByEmail error:', error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    return this.getUser(parseInt(supabaseUserId));
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await supabase
        .from('bank_users')
        .select('*');
      if (error || !users) return [];
      return users.map(user => mapUser(user));
    } catch (error) {
      console.error('getAllUsers error:', error);
      return [];
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
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
        .select('*')
        .single();
      if (error) throw error;
      if (!user) throw new Error('Failed to create user');
      return mapUser(user);
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const updateData: any = {};
      if (updates.firstName || updates.lastName) {
        const first = updates.firstName || '';
        const last = updates.lastName || '';
        updateData.full_name = `${first} ${last}`.trim();
      }
      if (updates.email) updateData.email = updates.email;
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (Object.keys(updateData).length === 0) return this.getUser(id);
      const { data: user, error } = await supabase
        .from('bank_users')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error || !user) return undefined;
      return mapUser(user);
    } catch (error) {
      return undefined;
    }
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    try {
      const numAmount = parseFloat(String(amount));
      const user = await withRetry(async () => {
        const { data: user, error } = await supabase
          .from('bank_users')
          .update({ balance: numAmount.toString() })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw new Error(`Supabase error: ${error.message}`);
        if (!user) throw new Error('No user returned');
        return user;
      });
      
      // CRITICAL: Also update the primary account balance in bank_accounts table
      const accounts = await this.getUserAccounts(id);
      if (accounts && accounts.length > 0) {
        const primaryAccount = accounts[0];
        await supabase
          .from('bank_accounts')
          .update({ balance: numAmount.toString() })
          .eq('id', primaryAccount.id)
          .select();
      }
      
      console.log('Balance updated successfully for user', id, ':', numAmount);
      return mapUser(user);
    } catch (error) {
      console.error('updateUserBalance error:', error);
      return undefined;
    }
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    try {
      const accounts = await withRetry(async () => {
        const { data: accounts, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', userId)
          .order('id');
        if (error) throw new Error(`Supabase error: ${error.message}`);
        return accounts || [];
      });
      return accounts.map(acc => ({ id: acc.id, userId: acc.user_id, accountNumber: acc.account_number, accountType: acc.account_type, balance: acc.balance?.toString() || '0', currency: acc.currency, status: acc.status || 'active', createdAt: acc.created_at, updatedAt: acc.updated_at } as any));
    } catch (error) {
      console.error('getUserAccounts error:', error);
      return [];
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
      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at };
    } catch (error) {
      return undefined;
    }
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    try {
      const { data: account, error } = await supabase
        .from('bank_accounts')
        .insert({ user_id: data.userId, account_number: data.accountNumber, account_type: data.accountType, balance: data.balance, currency: data.currency || 'USD', status: data.status || 'active' })
        .select()
        .single();
      if (error || !account) throw error;
      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at };
    } catch (error) {
      throw error;
    }
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const updateData: any = {};
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (updates.status !== undefined) updateData.status = updates.status;
      const { data: account, error } = await supabase.from('bank_accounts').update(updateData).eq('id', id).select().single();
      if (error || !account) return undefined;
      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at };
    } catch (error) {
      return undefined;
    }
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from('transactions').select('*').or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    try {
      const transaction = await withRetry(async () => {
        // Map camelCase fields to snake_case for database
        const dbData: any = {
          from_user_id: data.fromUserId,
          from_account_id: data.fromAccountId,
          to_account_id: data.toAccountId,
          amount: String(data.amount),
          currency: data.currency || 'USD',
          type: data.type || 'transfer',
          transaction_type: data.transactionType || 'transfer',
          status: data.status || 'processing',
          description: data.description,
          recipient_name: data.recipientName,
          recipient_account: data.recipientAccount,
          recipient_country: data.recipientCountry,
          bank_name: data.bankName,
          swift_code: data.swiftCode,
          transfer_purpose: data.transferPurpose,
          reference_number: data.referenceNumber,
          iban: data.iban,
          routing_number: data.routingNumber
        };
        // Remove undefined fields
        Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);
        
        const { data: transaction, error } = await supabase.from('transactions').insert(dbData).select().single();
        if (error) throw new Error(`Supabase error: ${error.message}`);
        if (!transaction) throw new Error('Failed to create transaction');
        return transaction;
      });
      return transaction;
    } catch (error) {
      console.error('createTransaction error:', error);
      throw error;
    }
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    try {
      const updateData: any = { status };
      if (notes) updateData.admin_notes = notes;
      if (adminId) updateData.admin_id = adminId;
      updateData.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('transactions').update(updateData).eq('id', id).select('*').single();
      if (error) {
        console.error('updateTransactionStatus error:', error);
        return undefined;
      }
      return data;
    } catch (error) {
      console.error('updateTransactionStatus exception:', error);
      return undefined;
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from('transactions').select('*').eq('status', 'processing');
      if (error) {
        console.error('getPendingTransactions error:', error);
        return [];
      }
      return (data || []);
    } catch (error) {
      console.error('getPendingTransactions exception:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from('transactions').select('*');
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async createAdminAction(data: InsertAdminAction): Promise<AdminAction> {
    try {
      const { data: action, error } = await supabase.from('admin_actions').insert(data as any).select().single();
      if (error || !action) throw error;
      return action;
    } catch (error) {
      throw error;
    }
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    try {
      let query = supabase.from('admin_actions').select('*');
      if (adminId) query = query.eq('admin_id', adminId);
      const { data, error } = await query;
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const { data: ticket, error } = await supabase.from('support_tickets').insert(data as any).select().single();
      if (error || !ticket) throw error;
      return ticket;
    } catch (error) {
      throw error;
    }
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    try {
      let query = supabase.from('support_tickets').select('*');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    try {
      const { data, error } = await supabase.from('support_tickets').update(updates as any).eq('id', id).select().single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getCard(id: number): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async createCard(data: InsertCard): Promise<Card> {
    try {
      const { data: card, error } = await supabase.from('cards').insert(data as any).select().single();
      if (error || !card) throw error;
      return card;
    } catch (error) {
      throw error;
    }
  }

  async getUserCards(userId: number): Promise<Card[]> {
    try {
      const accounts = await this.getUserAccounts(userId);
      if (!accounts.length) return [];
      const { data, error } = await supabase.from('cards').select('*').in('account_id', accounts.map(a => a.id));
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase.from('cards').update(updates as any).eq('id', id).select().single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('id', id).single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async createInvestment(data: InsertInvestment): Promise<Investment> {
    try {
      const { data: investment, error } = await supabase.from('investments').insert(data as any).select().single();
      if (error || !investment) throw error;
      return investment;
    } catch (error) {
      throw error;
    }
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId);
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase.from('investments').update(updates as any).eq('id', id).select().single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase.from('messages').select('*');
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    try {
      const { data, error } = await supabase.from('messages').select('*').eq('sender_id', userId);
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    try {
      const { data: message, error } = await supabase.from('messages').insert(data as any).select().single();
      if (error || !message) throw error;
      return message;
    } catch (error) {
      throw error;
    }
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    try {
      const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('id', id).select().single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getUserAlerts(userId: number): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', userId);
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', userId).eq('is_read', false);
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async createAlert(data: InsertAlert): Promise<Alert> {
    try {
      const { data: alert, error } = await supabase.from('alerts').insert(data as any).select().single();
      if (error || !alert) throw error;
      return alert;
    } catch (error) {
      throw error;
    }
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    try {
      const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select().single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async deleteAlert(id: number): Promise<void> {
    try {
      await supabase.from('alerts').delete().eq('id', id);
    } catch (error) {
    }
  }

  async getBranches(): Promise<any[]> {
    return [];
  }

  async getAtms(): Promise<any[]> {
    return [];
  }

  async getExchangeRates(): Promise<any[]> {
    return [];
  }

  async getStatementsByUserId(userId: number): Promise<any[]> {
    return [];
  }

  async getMarketRates(): Promise<any[]> {
    return [];
  }
}
