
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
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
} from "@packages/shared/schema";
import { IStorage } from "./storage";

if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
  throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});


const mapUser = (user: Record<string, any>): User => {
  let balance = '0.00';
  if (user.balance !== null && user.balance !== undefined) {
    const n = parseFloat(String(user.balance));
    balance = isNaN(n) ? '0.00' : n.toFixed(2);
  }
  return {
    id: String(user.id),
    email: user.email || '',
    role: user.role || 'customer',
    status: user.status || 'pending',
    isActive: user.is_active ?? false,
    isVerified: user.is_verified ?? false,
    transferPin: user.transfer_pin || null,
    accountNumber: user.account_number || null,
    balance,
    lastLogin: user.last_login || null,
    createdAt: user.created_at || null,
    updatedAt: user.updated_at || null,
    firstName: user.first_name || null,
    lastName:  user.last_name  || null,
    fullName:  user.full_name  || `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
    phone:     user.phone_number || user.phone || null,
    profession: user.occupation || user.profession || null,
    profilePhoto: user.avatar_url || user.profile_photo || null,
    avatarUrl:    user.avatar_url || null,
    username:    user.username    || null,
    dateOfBirth: user.date_of_birth || null,
    address:     user.address     || null,
    city:        user.city        || null,
    state:       user.state       || null,
    country:     user.country     || null,
    postalCode:  user.postal_code || null,
    annualIncome: user.annual_income ? String(user.annual_income) : null,
    idType:   user.identification_type   || user.id_type   || null,
    idNumber: user.identification_number || user.id_number || null,
  };
};

const mapTransaction = (row: Record<string, any>): Transaction => ({
  id: row.id,
  fromAccountId: row.from_account_id ?? null,
  toAccountId: row.to_account_id ?? null,
  fromUserId: row.from_user_id ?? null,
  toUserId: row.to_user_id ?? null,
  type: row.type || 'transfer',
  transactionType: row.transaction_type ?? null,
  amount: String(row.amount ?? '0'),
  currency: row.currency || 'USD',
  description: row.description ?? null,
  status: row.status || 'pending',
  referenceNumber: row.reference_number ?? null,
  recipientName: row.recipient_name ?? null,
  recipientAccount: row.recipient_account ?? null,
  recipientBank: row.recipient_bank ?? null,
  adminNotes: row.admin_notes ?? null,
  approvedBy: row.approved_by ?? null,
  approvedAt: row.approved_at ?? null,
  createdAt: row.created_at ?? null,
} as unknown as Transaction);

const mapMessage = (row: Record<string, any>): Message => ({
  id: row.id,
  senderId: row.sender_id ?? null,
  senderRole: row.sender_role || 'customer',
  recipientId: row.recipient_id ?? null,
  recipientRole: row.recipient_role ?? null,
  content: row.content || '',
  isRead: row.is_read ?? false,
  sessionId: row.session_id ?? null,
  createdAt: row.created_at ?? null,
} as Message);

const mapAdminAction = (row: Record<string, any>): AdminAction => ({
  id: row.id,
  adminId: row.admin_id ?? null,
  action: row.action || '',
  targetId: row.target_id ?? null,
  targetType: row.target_type ?? null,
  details: row.details ?? null,
  createdAt: row.created_at ?? null,
} as AdminAction);

const mapCard = (row: Record<string, any>): Card => ({
  id: row.id,
  userId: row.user_id ?? row.account_id ?? 0,
  accountId: row.account_id ?? 0,
  cardNumber: row.card_number || '',
  type: row.type || row.card_type || 'debit',
  cardType: row.card_type || 'debit',
  brand: row.brand ?? null,
  cardholderName: row.cardholder_name ?? '',
  status: row.status || 'active',
  expiryMonth: row.expiry_month ?? null,
  expiryYear: row.expiry_year ?? null,
  dailyLimit: row.daily_limit ?? null,
  monthlyLimit: row.monthly_limit ?? null,
  isContactless: row.is_contactless ?? true,
  pinSet: row.pin_set ?? false,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

const mapInvestment = (row: Record<string, any>): Investment => ({
  id: row.id,
  userId: row.user_id ?? 0,
  type: row.type || '',
  amount: String(row.amount ?? '0'),
  rate: row.rate !== null && row.rate !== undefined ? String(row.rate) : null,
  status: row.status || 'active',
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

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
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await withRetry(async () => {
        const { data: user, error } = await supabase
          .from('user_profiles')
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
          .from('user_profiles')
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
    try {
      // Supabase auth IDs are UUIDs — look up the auth user to get their email,
      // then find the matching user_profiles record by email
      const { data: authData, error } = await supabase.auth.admin.getUserById(supabaseUserId);
      if (error || !authData?.user?.email) return undefined;
      return this.getUserByEmail(authData.user.email);
    } catch (error) {
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
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
      const row: Record<string, any> = {
        email: data.email,
        full_name: fullName || data.email,
        balance: data.balance || '0.00',
        role: data.role || 'customer',
        is_active: data.isActive ?? false,
        is_verified: data.isVerified ?? false,
      };
      if (data.firstName)    row.first_name = data.firstName;
      if (data.lastName)     row.last_name  = data.lastName;
      if (data.phone)        row.phone_number = data.phone;
      if (data.profession)   row.occupation = data.profession;
      if (data.transferPin)  row.transfer_pin = data.transferPin;
      if (data.accountNumber) row.account_number = data.accountNumber;
      if (data.dateOfBirth)  row.date_of_birth = data.dateOfBirth;
      if (data.city)         row.city = data.city;
      if (data.state)        row.state = data.state;
      if (data.country)      row.country = data.country;
      if (data.postalCode)   row.postal_code = data.postalCode;
      const { data: user, error } = await supabase
        .from('user_profiles')
        .insert(row)
        .select('*')
        .single();
      if (error) throw error;
      if (!user) throw new Error('Failed to create user in user_profiles');
      return mapUser(user);
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User> & { [key: string]: any }): Promise<User | undefined> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const existing = await this.getUser(id);
        const first = updates.firstName ?? existing?.firstName ?? '';
        const last  = updates.lastName  ?? existing?.lastName  ?? '';
        updateData.full_name  = `${first} ${last}`.trim();
        if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
        if (updates.lastName  !== undefined) updateData.last_name  = updates.lastName;
      }
      if (updates.email       !== undefined) updateData.email        = updates.email;
      if (updates.balance     !== undefined) updateData.balance      = updates.balance;
      if (updates.isActive    !== undefined) updateData.is_active    = updates.isActive;
      if (updates.isVerified  !== undefined) updateData.is_verified  = updates.isVerified;
      if (updates.profilePhoto !== undefined) updateData.avatar_url  = updates.profilePhoto;
      if (updates.avatarUrl   !== undefined) updateData.avatar_url   = updates.avatarUrl;
      if (updates.phone       !== undefined) updateData.phone_number = updates.phone;
      if (updates.city        !== undefined) updateData.city         = updates.city;
      if (updates.state       !== undefined) updateData.state        = updates.state;
      if (updates.country     !== undefined) updateData.country      = updates.country;
      if (updates.postalCode  !== undefined) updateData.postal_code  = updates.postalCode;
      if (updates.transferPin !== undefined) updateData.transfer_pin = updates.transferPin;
      if (updates.role        !== undefined) updateData.role         = updates.role;
      if (updates.profession  !== undefined) updateData.occupation   = updates.profession;
      if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
      if ((updates as any).lastLogin !== undefined) updateData.last_login = (updates as any).lastLogin;
      if (Object.keys(updateData).length <= 1) return this.getUser(id);
      const { data: user, error } = await supabase
        .from('user_profiles')
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

  async updateUserBalance(id: string, amountDelta: number): Promise<User | undefined> {
    try {
      const delta = parseFloat(String(amountDelta));
      // Get current balance from accounts table (source of truth)
      const accounts = await this.getUserAccounts(id);
      if (!accounts || accounts.length === 0) {
        throw new Error('No account found for user');
      }
      const primaryAccount = accounts[0];
      const accCurrentBalance = parseFloat(String(primaryAccount.balance || '0')) || 0;
      const newBalance = accCurrentBalance + delta;
      if (newBalance < 0) {
        throw new Error('Insufficient funds');
      }
      // Update the accounts table balance (source of truth)
      await withRetry(async () => {
        const { error } = await supabase
          .from('accounts')
          .update({ balance: newBalance.toFixed(2) })
          .eq('id', primaryAccount.id);
        if (error) throw new Error(`Supabase error: ${error.message}`);
      });
      // Also update user_profiles balance to keep in sync
      await withRetry(async () => {
        const { error } = await supabase
          .from('user_profiles')
          .update({ balance: newBalance.toFixed(2), updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw new Error(`Supabase error: ${error.message}`);
      });
      return this.getUser(id);
    } catch (error) {
      console.error('updateUserBalance error:', error);
      throw error;
    }
  }

  async getUserAccounts(userId: string): Promise<Account[]> {
    try {
      const accounts = await withRetry(async () => {
        const { data: accounts, error } = await supabase
          .from('accounts')
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

  async getAccount(id: string): Promise<Account | undefined> {
    try {
      const { data: account, error } = await supabase
        .from('accounts')
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
        .from('accounts')
        .insert({ user_id: data.userId, account_number: data.accountNumber, account_type: data.accountType, balance: data.balance, currency: data.currency || 'USD', status: data.status || 'active' })
        .select()
        .single();
      if (error || !account) throw error;
      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at };
    } catch (error) {
      throw error;
    }
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const updateData: any = {};
      if (updates.balance !== undefined) updateData.balance = updates.balance;
      if (updates.status !== undefined) updateData.status = updates.status;
      const { data: account, error } = await supabase.from('accounts').update(updateData).eq('id', id).select().single();
      if (error || !account) return undefined;
      return { id: account.id, userId: account.user_id, accountNumber: account.account_number, accountType: account.account_type, balance: account.balance?.toString() || '0', currency: account.currency, status: account.status || 'active', createdAt: account.created_at, updatedAt: account.updated_at };
    } catch (error) {
      return undefined;
    }
  }

  async getAccountTransactions(accountId: string, limit?: number): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false });
      if (limit && limit > 0) {
        query = query.limit(limit);
      }
      const { data, error } = await query;
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
          reference_number: data.referenceNumber || `TXN-${Date.now()}-${randomUUID().substring(0, 8).toUpperCase()}`
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

  async updateTransactionStatus(id: string, status: string, adminId: string, notes?: string): Promise<Transaction | undefined> {
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
      return (data || []).map(mapTransaction);
    } catch (error) {
      console.error('getPendingTransactions exception:', error);
      return [];
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();
      if (error) return null;
      return data ? mapTransaction(data) : null;
    } catch (error) {
      console.error('getTransactionById error:', error);
      return null;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from('transactions').select('*');
      if (error) return [];
      return (data || []).map(mapTransaction);
    } catch (error) {
      return [];
    }
  }

  async createAdminAction(data: InsertAdminAction): Promise<AdminAction> {
    try {
      const row = {
        admin_id: (data as any).adminId ?? (data as any).admin_id,
        action: data.action,
        target_id: (data as any).targetId ?? (data as any).target_id,
        target_type: (data as any).targetType ?? (data as any).target_type,
        details: data.details,
      };
      const { data: action, error } = await supabase.from('admin_actions').insert(row).select().single();
      if (error || !action) throw error;
      return action;
    } catch (error) {
      throw error;
    }
  }

  async getAdminActions(adminId?: string): Promise<AdminAction[]> {
    try {
      let query = supabase.from('admin_actions').select('*');
      if (adminId) query = query.eq('admin_id', adminId);
      const { data, error } = await query;
      if (error) return [];
      return (data || []).map(mapAdminAction);
    } catch (error) {
      return [];
    }
  }

  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    try {
      const row: Record<string, any> = {
        user_id: (data as any).userId ?? (data as any).user_id,
        subject: data.subject,
        description: data.description,
        status: data.status || 'open',
        priority: data.priority || 'medium',
      };
      if ((data as any).resolvedAt !== undefined) row.resolved_at = (data as any).resolvedAt;
      const { data: ticket, error } = await supabase.from('support_tickets').insert(row).select().single();
      if (error || !ticket) throw error;
      return ticket;
    } catch (error) {
      throw error;
    }
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
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

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    try {
      // Map camelCase TypeScript fields to snake_case DB columns
      const dbUpdates: Record<string, any> = {};
      const fieldMap: Record<string, string> = {
        adminNotes: 'admin_notes',
        userId: 'user_id',
        adminResponse: 'admin_notes',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      };
      for (const [key, value] of Object.entries(updates)) {
        const dbKey = fieldMap[key] || key;
        dbUpdates[dbKey] = value;
      }
      const { data, error } = await supabase.from('support_tickets').update(dbUpdates).eq('id', id).select().single();
      if (error) { console.error('updateSupportTicket error:', error.message); return undefined; }
      return data;
    } catch (error) {
      console.error('updateSupportTicket catch error:', error);
      return undefined;
    }
  }

  async getCard(id: string): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
      if (error) return undefined;
      return data ? mapCard(data) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createCard(data: InsertCard): Promise<Card> {
    try {
      const row: Record<string, any> = {
        account_id: (data as any).accountId ?? (data as any).account_id,
        card_number: (data as any).cardNumber ?? (data as any).card_number,
        card_type: (data as any).cardType ?? (data as any).card_type,
        cardholder_name: (data as any).cardholderName ?? (data as any).cardholder_name ?? 'Account Holder',
        status: data.status || 'active',
      };
      if ((data as any).brand !== undefined) row.brand = (data as any).brand;
      if ((data as any).expiryMonth !== undefined) row.expiry_month = (data as any).expiryMonth;
      if ((data as any).expiryYear !== undefined) row.expiry_year = (data as any).expiryYear;
      if ((data as any).dailyLimit !== undefined) row.daily_limit = (data as any).dailyLimit;
      if ((data as any).monthlyLimit !== undefined) row.monthly_limit = (data as any).monthlyLimit;
      if ((data as any).isContactless !== undefined) row.is_contactless = (data as any).isContactless;
      if ((data as any).pinSet !== undefined) row.pin_set = (data as any).pinSet;
      const { data: card, error } = await supabase.from('cards').insert(row).select().single();
      if (error || !card) throw error;
      return card;
    } catch (error) {
      throw error;
    }
  }

  async getUserCards(userId: string): Promise<Card[]> {
    try {
      const accounts = await this.getUserAccounts(userId);
      if (!accounts.length) return [];
      const { data, error } = await supabase.from('cards').select('*').in('account_id', accounts.map(a => a.id));
      if (error) return [];
      return (data || []).map(mapCard);
    } catch (error) {
      return [];
    }
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined> {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId;
      if (updates.cardNumber !== undefined) dbUpdates.card_number = updates.cardNumber;
      if (updates.cardType !== undefined) dbUpdates.card_type = updates.cardType;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.cardholderName !== undefined) dbUpdates.cardholder_name = updates.cardholderName;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.expiryMonth !== undefined) dbUpdates.expiry_month = updates.expiryMonth;
      if (updates.expiryYear !== undefined) dbUpdates.expiry_year = updates.expiryYear;
      if (updates.dailyLimit !== undefined) dbUpdates.daily_limit = updates.dailyLimit;
      if (updates.monthlyLimit !== undefined) dbUpdates.monthly_limit = updates.monthlyLimit;
      if (updates.isContactless !== undefined) dbUpdates.is_contactless = updates.isContactless;
      if (updates.pinSet !== undefined) dbUpdates.pin_set = updates.pinSet;
      const { data, error } = await supabase.from('cards').update(dbUpdates).eq('id', id).select().single();
      if (error) return undefined;
      return data ? mapCard(data) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getInvestment(id: string): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('id', id).single();
      if (error) return undefined;
      return data ? mapInvestment(data) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createInvestment(data: InsertInvestment): Promise<Investment> {
    try {
      const row = {
        user_id: (data as any).userId ?? (data as any).user_id,
        type: data.type,
        amount: String(data.amount),
        rate: data.rate !== undefined ? String(data.rate) : undefined,
        status: data.status || 'active',
      };
      const { data: investment, error } = await supabase.from('investments').insert(row).select().single();
      if (error || !investment) throw error;
      return investment;
    } catch (error) {
      throw error;
    }
  }

  async getUserInvestments(userId: string): Promise<Investment[]> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId);
      if (error) return [];
      return (data || []).map(mapInvestment);
    } catch (error) {
      return [];
    }
  }

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment | undefined> {
    try {
      const dbUpdates: Record<string, any> = {};
      if ((updates as any).userId !== undefined) dbUpdates.user_id = (updates as any).userId;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.amount !== undefined) dbUpdates.amount = String(updates.amount);
      if (updates.rate !== undefined) dbUpdates.rate = String(updates.rate);
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if ((updates as any).symbol !== undefined) dbUpdates.symbol = (updates as any).symbol;
      if ((updates as any).shares !== undefined) dbUpdates.shares = (updates as any).shares;
      if ((updates as any).assetType !== undefined) dbUpdates.asset_type = (updates as any).assetType;
      const { data, error } = await supabase.from('investments').update(dbUpdates).eq('id', id).select().single();
      if (error) return undefined;
      return data ? mapInvestment(data) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (conversationId) {
        query = query.eq('session_id', conversationId);
      }
      const { data, error } = await query;
      if (error) return [];
      return (data || []).map(mapMessage);
    } catch (error) {
      return [];
    }
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });
      if (error) return [];
      return (data || []).map(mapMessage);
    } catch (error) {
      return [];
    }
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    try {
      // Explicitly map camelCase Drizzle fields to snake_case Supabase REST column names
      const row = {
        sender_id: data.senderId,
        sender_role: data.senderRole || 'customer',
        recipient_id: data.recipientId,
        recipient_role: (data as any).recipientRole || 'admin',
        content: data.content,
        is_read: data.isRead ?? false,
        session_id: data.sessionId,
      };
      const { data: message, error } = await supabase.from('messages').insert(row).select().single();
      if (error || !message) throw error;
      return message;
    } catch (error) {
      throw error;
    }
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    try {
      const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('id', id).select().single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async getUserAlerts(userId: string): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', userId);
      if (error) return [];
      return (data || []);
    } catch (error) {
      return [];
    }
  }

  async getUnreadAlerts(userId: string): Promise<Alert[]> {
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
      const row = {
        user_id: (data as any).userId ?? (data as any).user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        is_read: (data as any).isRead ?? (data as any).is_read ?? false,
      };
      const { data: alert, error } = await supabase.from('alerts').insert(row).select().single();
      if (error || !alert) throw error;
      return alert;
    } catch (error) {
      throw error;
    }
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    try {
      const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select().single();
      if (error) return undefined;
      return data;
    } catch (error) {
      return undefined;
    }
  }

  async deleteAlert(id: string): Promise<void> {
    try {
      await supabase.from('alerts').delete().eq('id', id);
    } catch (error) {
    }
  }

  async getBranches(): Promise<any[]> {
    return [
      { id: 1, name: 'World Bank - New York HQ', address: '1818 H Street NW, Washington, DC 20433', city: 'Washington', state: 'DC', country: 'USA', phone: '+1-202-473-1000', hours: 'Mon-Fri 9AM-5PM', lat: 38.8986, lng: -77.0430 },
      { id: 2, name: 'World Bank - London Office', address: '1 New Change, London EC4M 9AF', city: 'London', state: '', country: 'UK', phone: '+44-20-7246-8585', hours: 'Mon-Fri 9AM-5PM', lat: 51.5131, lng: -0.0971 },
      { id: 3, name: 'World Bank - Singapore', address: '9 Raffles Place, Republic Plaza', city: 'Singapore', state: '', country: 'Singapore', phone: '+65-6324-4060', hours: 'Mon-Fri 9AM-5PM', lat: 1.2847, lng: 103.8514 },
      { id: 4, name: 'World Bank - Tokyo Office', address: 'Fukoku Seimei Building, 2-2-2 Uchisaiwaicho', city: 'Tokyo', state: '', country: 'Japan', phone: '+81-3-3597-6650', hours: 'Mon-Fri 9AM-5PM', lat: 35.6762, lng: 139.6503 },
    ];
  }

  async getAtms(): Promise<any[]> {
    return [
      { id: 1, name: 'World Bank ATM - Times Square', address: '1560 Broadway, New York, NY 10036', city: 'New York', country: 'USA', available: true, lat: 40.7580, lng: -73.9855 },
      { id: 2, name: 'World Bank ATM - Grand Central', address: '87 E 42nd St, New York, NY 10017', city: 'New York', country: 'USA', available: true, lat: 40.7527, lng: -73.9772 },
      { id: 3, name: 'World Bank ATM - LAX Airport', address: '1 World Way, Los Angeles, CA 90045', city: 'Los Angeles', country: 'USA', available: true, lat: 33.9425, lng: -118.4081 },
      { id: 4, name: 'World Bank ATM - Heathrow', address: 'Heathrow Airport, London TW6 1EW', city: 'London', country: 'UK', available: true, lat: 51.4700, lng: -0.4543 },
    ];
  }

  async getExchangeRates(): Promise<any[]> {
    return [
      { id: 1, baseCurrency: 'USD', targetCurrency: 'EUR', rate: '0.9215', updatedAt: new Date() },
      { id: 2, baseCurrency: 'USD', targetCurrency: 'GBP', rate: '0.7891', updatedAt: new Date() },
      { id: 3, baseCurrency: 'USD', targetCurrency: 'JPY', rate: '149.25', updatedAt: new Date() },
      { id: 4, baseCurrency: 'USD', targetCurrency: 'CNY', rate: '7.2341', updatedAt: new Date() },
      { id: 5, baseCurrency: 'USD', targetCurrency: 'CAD', rate: '1.3652', updatedAt: new Date() },
      { id: 6, baseCurrency: 'USD', targetCurrency: 'AUD', rate: '1.5234', updatedAt: new Date() },
      { id: 7, baseCurrency: 'USD', targetCurrency: 'CHF', rate: '0.8912', updatedAt: new Date() },
      { id: 8, baseCurrency: 'USD', targetCurrency: 'SGD', rate: '1.3412', updatedAt: new Date() },
      { id: 9, baseCurrency: 'USD', targetCurrency: 'HKD', rate: '7.8234', updatedAt: new Date() },
      { id: 10, baseCurrency: 'USD', targetCurrency: 'INR', rate: '83.42', updatedAt: new Date() },
    ];
  }

  async getStatementsByUserId(userId: string): Promise<any[]> {
    try {
      const accounts = await this.getUserAccounts(userId);
      if (!accounts || accounts.length === 0) return [];
      const statements: any[] = [];
      const months = ['January', 'February', 'March'];
      const year = new Date().getFullYear();
      months.forEach((month, i) => {
        statements.push({
          id: i + 1,
          userId,
          month,
          year,
          title: `${month} ${year} Statement`,
          generatedAt: new Date(year, i + 1, 1).toISOString(),
          downloadUrl: `/api/statements/${userId}/${year}/${i + 1}`
        });
      });
      return statements;
    } catch (error) {
      return [];
    }
  }

  async getMarketRates(): Promise<any[]> {
    return [
      { symbol: 'SPY', name: 'S&P 500 ETF', price: 524.35, change: 2.14, changePercent: 0.41, type: 'index' },
      { symbol: 'QQQ', name: 'NASDAQ ETF', price: 448.22, change: -1.83, changePercent: -0.41, type: 'index' },
      { symbol: 'DIA', name: 'Dow Jones ETF', price: 389.14, change: 1.67, changePercent: 0.43, type: 'index' },
      { symbol: 'GLD', name: 'Gold ETF', price: 192.45, change: 0.54, changePercent: 0.28, type: 'commodity' },
      { symbol: 'TLT', name: '20+ Year Treasury', price: 92.31, change: -0.22, changePercent: -0.24, type: 'bond' },
      { symbol: 'AAPL', name: 'Apple Inc.', price: 189.30, change: 1.45, changePercent: 0.77, type: 'stock' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.62, change: 3.21, changePercent: 0.78, type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 174.14, change: -0.89, changePercent: -0.51, type: 'stock' },
    ];
  }
}
