
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
  type: row.type || 'transfer',
  amount: String(row.amount ?? '0'),
  currency: row.currency || 'USD',
  description: row.description ?? null,
  status: row.status || 'pending',
  referenceNumber: row.reference_number ?? null,
  recipientName: row.recipient_name ?? null,
  recipientAccount: row.recipient_account ?? null,
  recipientBank: row.recipient_bank ?? null,
  recipientCountry: row.recipient_country ?? null,
  adminNotes: row.admin_notes ?? null,
  transactionType: row.transaction_type ?? null,
  swiftCode: row.swift_code ?? null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
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
  userId: row.user_id ?? null,
  accountId: row.account_id ?? null,
  cardNumber: row.card_number || null,
  cardHolder: row.card_holder || null,
  expiryDate: row.expiry_date || null,
  cvv: row.cvv || null,
  type: row.type || row.card_type || 'debit',
  status: row.status || 'active',
  isLocked: row.is_locked ?? false,
  dailyLimit: row.daily_limit ?? null,
  contactlessEnabled: row.contactless_enabled ?? true,
  createdAt: row.created_at ?? null,
} as unknown as Card);

const mapInvestment = (row: Record<string, any>): Investment => ({
  id: row.id,
  userId: row.user_id ?? null,
  type: row.type || '',
  symbol: row.symbol || '',
  assetType: row.asset_type || null,
  shares: row.shares ?? null,
  averagePrice: row.average_price ?? null,
  currentPrice: row.current_price ?? null,
  totalValue: row.total_value ?? null,
  gainLoss: row.gain_loss ?? null,
  status: row.status || 'active',
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
} as unknown as Investment);

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
    }
  }
  throw lastError;
}

export class SupabasePublicStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase.from('wb_users').select('*').eq('id', id).single();
      if (error || !data) return undefined;
      return mapUser(data);
    } catch { return undefined; }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase.from('wb_users').select('*').eq('email', email).maybeSingle();
      if (error || !data) return undefined;
      return mapUser(data);
    } catch { return undefined; }
  }

  async getUserByPhone(_phone: string): Promise<User | undefined> { return undefined; }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(supabaseUserId);
      if (!authData?.user?.email) return undefined;
      return this.getUserByEmail(authData.user.email);
    } catch { return undefined; }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('wb_users').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(mapUser);
    } catch { return []; }
  }

  async getUserByUsername(_username: string): Promise<User | undefined> { return undefined; }

  async createUser(data: InsertUser): Promise<User> {
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const row: Record<string, any> = {
      email: data.email,
      full_name: fullName || data.email,
      balance: data.balance || '0.00',
      role: data.role || 'customer',
      is_active: data.isActive ?? false,
      is_verified: data.isVerified ?? false,
    };
    if (data.firstName)     row.first_name    = data.firstName;
    if (data.lastName)      row.last_name     = data.lastName;
    if (data.phone)         row.phone_number  = data.phone;
    if (data.profession)    row.occupation    = data.profession;
    if (data.transferPin)   row.transfer_pin  = data.transferPin;
    if (data.accountNumber) row.account_number = data.accountNumber;
    if (data.dateOfBirth)   row.date_of_birth = data.dateOfBirth;
    if (data.city)          row.city          = data.city;
    if (data.state)         row.state         = data.state;
    if (data.country)       row.country       = data.country;
    if (data.postalCode)    row.postal_code   = data.postalCode;
    const { data: user, error } = await supabase.from('wb_users').insert(row).select('*').single();
    if (error || !user) throw error || new Error('Failed to create user in wb_users');
    return mapUser(user);
  }

  async updateUser(id: string, updates: Partial<User> & Record<string, any>): Promise<User | undefined> {
    try {
      const d: any = { updated_at: new Date().toISOString() };
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const ex = await this.getUser(id);
        d.full_name = `${updates.firstName ?? ex?.firstName ?? ''} ${updates.lastName ?? ex?.lastName ?? ''}`.trim();
        if (updates.firstName !== undefined) d.first_name = updates.firstName;
        if (updates.lastName  !== undefined) d.last_name  = updates.lastName;
      }
      if (updates.email       !== undefined) d.email         = updates.email;
      if (updates.balance     !== undefined) d.balance       = updates.balance;
      if (updates.isActive    !== undefined) d.is_active     = updates.isActive;
      if (updates.isVerified  !== undefined) d.is_verified   = updates.isVerified;
      if (updates.phone       !== undefined) d.phone_number  = updates.phone;
      if (updates.city        !== undefined) d.city          = updates.city;
      if (updates.state       !== undefined) d.state         = updates.state;
      if (updates.country     !== undefined) d.country       = updates.country;
      if (updates.postalCode  !== undefined) d.postal_code   = updates.postalCode;
      if (updates.transferPin !== undefined) d.transfer_pin  = updates.transferPin;
      if (updates.role        !== undefined) d.role          = updates.role;
      if (updates.profession  !== undefined) d.occupation    = updates.profession;
      if (updates.dateOfBirth !== undefined) d.date_of_birth = updates.dateOfBirth;
      if (updates.profilePhoto !== undefined) d.avatar_url   = updates.profilePhoto;
      if (updates.avatarUrl   !== undefined) d.avatar_url    = updates.avatarUrl;
      if (updates.lastLogin   !== undefined) d.last_login    = updates.lastLogin;
      if (updates.accountNumber !== undefined) d.account_number = updates.accountNumber;
      if (updates.status      !== undefined) d.status        = updates.status;
      const { data: user, error } = await supabase.from('wb_users').update(d).eq('id', id).select('*').single();
      if (error || !user) return undefined;
      return mapUser(user);
    } catch { return undefined; }
  }

  async updateUserBalance(id: string, delta: number): Promise<User | undefined> {
    try {
      const { data: cur } = await supabase.from('wb_users').select('balance').eq('id', id).single();
      const current = parseFloat(String(cur?.balance || '0')) || 0;
      const newBal  = Math.max(0, current + delta).toFixed(2);
      const { data: user, error } = await supabase.from('wb_users')
        .update({ balance: newBal, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
      if (error || !user) return undefined;
      // Keep bank_accounts in sync
      const accounts = await this.getUserAccounts(id);
      if (accounts.length > 0) {
        const accBal = Math.max(0, parseFloat(String(accounts[0].balance || '0')) + delta).toFixed(2);
        await supabase.from('bank_accounts').update({ balance: accBal }).eq('id', accounts[0].id);
      }
      return mapUser(user);
    } catch { return undefined; }
  }

  async getUserAccounts(userId: string): Promise<Account[]> {
    try {
      const { data, error } = await supabase.from('bank_accounts').select('*').eq('user_id', userId).order('created_at');
      if (error || !data) return [];
      return data.map(a => ({ id: a.id, userId: a.user_id, accountNumber: a.account_number, accountType: a.account_type, balance: String(a.balance ?? '0'), currency: a.currency || 'USD', status: a.status || 'active', isActive: a.is_active ?? true, createdAt: a.created_at, updatedAt: a.updated_at } as unknown as Account));
    } catch { return []; }
  }

  async getAccount(id: string): Promise<Account | undefined> {
    try {
      const { data, error } = await supabase.from('bank_accounts').select('*').eq('id', id).single();
      if (error || !data) return undefined;
      return { id: data.id, userId: data.user_id, accountNumber: data.account_number, accountType: data.account_type, balance: String(data.balance ?? '0'), currency: data.currency || 'USD', status: data.status || 'active', createdAt: data.created_at, updatedAt: data.updated_at } as unknown as Account;
    } catch { return undefined; }
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    const row = { user_id: (data as any).userId, account_number: (data as any).accountNumber, account_type: (data as any).accountType || 'checking', balance: (data as any).balance || '0.00', currency: (data as any).currency || 'USD', status: (data as any).status || 'active' };
    const { data: acc, error } = await supabase.from('bank_accounts').insert(row).select().single();
    if (error || !acc) throw error || new Error('Failed to create account');
    return { id: acc.id, userId: acc.user_id, accountNumber: acc.account_number, accountType: acc.account_type, balance: String(acc.balance ?? '0'), currency: acc.currency || 'USD', status: acc.status || 'active', createdAt: acc.created_at, updatedAt: acc.updated_at } as unknown as Account;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    try {
      const d: any = {};
      if ((updates as any).balance  !== undefined) d.balance = (updates as any).balance;
      if ((updates as any).status   !== undefined) d.status  = (updates as any).status;
      if ((updates as any).isActive !== undefined) d.is_active = (updates as any).isActive;
      const { data, error } = await supabase.from('bank_accounts').update(d).eq('id', id).select().single();
      if (error || !data) return undefined;
      return { id: data.id, userId: data.user_id, accountNumber: data.account_number, accountType: data.account_type, balance: String(data.balance ?? '0'), currency: data.currency || 'USD', status: data.status || 'active', createdAt: data.created_at, updatedAt: data.updated_at } as unknown as Account;
    } catch { return undefined; }
  }

  async getAccountTransactions(accountId: string, limit?: number): Promise<Transaction[]> {
    try {
      let q = supabase.from('transactions').select('*')
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('created_at', { ascending: false });
      if (limit && limit > 0) q = q.limit(limit);
      const { data, error } = await q;
      if (error) return [];
      return (data || []).map(mapTransaction);
    } catch { return []; }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(mapTransaction);
    } catch { return []; }
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const row: any = {
      from_account_id: (data as any).fromAccountId,
      to_account_id:   (data as any).toAccountId,
      amount:          String(data.amount),
      type:            data.type || 'transfer',
      transaction_type: (data as any).transactionType || data.type || 'transfer',
      currency:        data.currency || 'USD',
      status:          data.status   || 'pending',
      description:     data.description,
      recipient_name:  (data as any).recipientName,
      recipient_account: (data as any).recipientAccount,
      recipient_bank:  (data as any).recipientBank,
      recipient_country: (data as any).recipientCountry,
      reference_number: (data as any).referenceNumber,
      admin_notes:     (data as any).adminNotes,
      swift_code:      (data as any).swiftCode,
    };
    Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
    const { data: tx, error } = await supabase.from('transactions').insert(row).select().single();
    if (error || !tx) throw error || new Error('Failed to create transaction');
    return mapTransaction(tx);
  }

  async updateTransactionStatus(id: string, status: string, adminId: string, notes?: string): Promise<Transaction | undefined> {
    try {
      const d: any = { status, updated_at: new Date().toISOString() };
      if (notes)   d.admin_notes = notes;
      if (adminId) d.admin_id    = adminId;
      const { data, error } = await supabase.from('transactions').update(d).eq('id', id).select('*').single();
      if (error) return undefined;
      return mapTransaction(data);
    } catch { return undefined; }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from('transactions').select('*').in('status', ['pending', 'processing']);
      if (error) return [];
      return (data || []).map(mapTransaction);
    } catch { return []; }
  }

  async createAdminAction(data: InsertAdminAction): Promise<AdminAction> {
    const row = {
      admin_id:    (data as any).adminId   ?? (data as any).admin_id,
      action:      data.action,
      target_id:   (data as any).targetId  ?? (data as any).target_id,
      target_type: (data as any).targetType ?? (data as any).target_type,
      details:     data.details,
    };
    const { data: action, error } = await supabase.from('admin_actions').insert(row).select().single();
    if (error || !action) throw error || new Error('Failed to create admin action');
    return mapAdminAction(action);
  }

  async getAdminActions(adminId?: string): Promise<AdminAction[]> {
    try {
      let q = supabase.from('admin_actions').select('*').order('created_at', { ascending: false });
      if (adminId) q = q.eq('admin_id', adminId);
      const { data, error } = await q;
      if (error) return [];
      return (data || []).map(mapAdminAction);
    } catch { return []; }
  }

  async createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket> {
    const row: any = {
      user_id:     (data as any).userId ?? (data as any).user_id,
      subject:     data.subject,
      description: data.description,
      status:      data.status   || 'open',
      priority:    data.priority || 'medium',
    };
    if ((data as any).category) row.category = (data as any).category;
    const { data: ticket, error } = await supabase.from('support_tickets').insert(row).select().single();
    if (error || !ticket) throw error || new Error('Failed to create ticket');
    return ticket;
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single();
      return error ? undefined : data;
    } catch { return undefined; }
  }

  async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    try {
      let q = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (userId) q = q.eq('user_id', userId);
      const { data, error } = await q;
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    try {
      const fieldMap: Record<string, string> = { adminNotes: 'admin_notes', userId: 'user_id', createdAt: 'created_at', updatedAt: 'updated_at', adminResponse: 'admin_notes' };
      const d: any = { updated_at: new Date().toISOString() };
      for (const [k, v] of Object.entries(updates)) d[fieldMap[k] || k] = v;
      const { data, error } = await supabase.from('support_tickets').update(d).eq('id', id).select().single();
      return error ? undefined : data;
    } catch { return undefined; }
  }

  async getUserCards(userId: string): Promise<Card[]> {
    try {
      const accounts = await this.getUserAccounts(userId);
      if (!accounts.length) return [];
      const { data, error } = await supabase.from('cards').select('*').in('account_id', accounts.map(a => a.id));
      return error ? [] : (data || []).map(mapCard);
    } catch { return []; }
  }

  async getCard(id: string): Promise<Card | undefined> {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', id).single();
      return error ? undefined : mapCard(data);
    } catch { return undefined; }
  }

  async createCard(data: InsertCard): Promise<Card> {
    const row: any = {
      account_id:  (data as any).accountId  ?? (data as any).account_id,
      user_id:     (data as any).userId     ?? (data as any).user_id,
      card_number: (data as any).cardNumber ?? (data as any).card_number,
      card_holder: (data as any).cardHolder ?? (data as any).card_holder,
      type:        (data as any).type       || 'debit',
      status:      data.status              || 'active',
      expiry_date: (data as any).expiryDate,
    };
    Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
    const { data: card, error } = await supabase.from('cards').insert(row).select().single();
    if (error || !card) throw error || new Error('Failed to create card');
    return mapCard(card);
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined> {
    try {
      const d: any = {};
      if ((updates as any).isLocked !== undefined) d.is_locked = (updates as any).isLocked;
      if ((updates as any).status   !== undefined) d.status    = (updates as any).status;
      if ((updates as any).dailyLimit !== undefined) d.daily_limit = (updates as any).dailyLimit;
      if ((updates as any).contactlessEnabled !== undefined) d.contactless_enabled = (updates as any).contactlessEnabled;
      const { data, error } = await supabase.from('cards').update(d).eq('id', id).select().single();
      return error ? undefined : mapCard(data);
    } catch { return undefined; }
  }

  async getUserInvestments(userId: string): Promise<Investment[]> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', userId);
      return error ? [] : (data || []).map(mapInvestment);
    } catch { return []; }
  }

  async getInvestment(id: string): Promise<Investment | undefined> {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('id', id).single();
      return error ? undefined : mapInvestment(data);
    } catch { return undefined; }
  }

  async createInvestment(data: InsertInvestment): Promise<Investment> {
    const row: any = {
      user_id: (data as any).userId ?? (data as any).user_id,
      type:    data.type,
      symbol:  (data as any).symbol  || '',
      status:  data.status || 'active',
    };
    if ((data as any).shares)       row.shares        = (data as any).shares;
    if ((data as any).averagePrice) row.average_price = (data as any).averagePrice;
    if ((data as any).currentPrice) row.current_price = (data as any).currentPrice;
    if ((data as any).assetType)    row.asset_type    = (data as any).assetType;
    const { data: inv, error } = await supabase.from('investments').insert(row).select().single();
    if (error || !inv) throw error || new Error('Failed to create investment');
    return mapInvestment(inv);
  }

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment | undefined> {
    try {
      const d: any = {};
      if ((updates as any).currentPrice !== undefined) d.current_price = (updates as any).currentPrice;
      if ((updates as any).totalValue   !== undefined) d.total_value   = (updates as any).totalValue;
      if ((updates as any).gainLoss     !== undefined) d.gain_loss     = (updates as any).gainLoss;
      if (updates.status !== undefined) d.status = updates.status;
      const { data, error } = await supabase.from('investments').update(d).eq('id', id).select().single();
      return error ? undefined : mapInvestment(data);
    } catch { return undefined; }
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    try {
      let q = supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (conversationId) q = q.eq('session_id', conversationId);
      const { data, error } = await q;
      return error ? [] : (data || []).map(mapMessage);
    } catch { return []; }
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase.from('messages').select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });
      return error ? [] : (data || []).map(mapMessage);
    } catch { return []; }
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const row = {
      sender_id:    (data as any).senderId,
      sender_role:  (data as any).senderRole  || 'customer',
      recipient_id: (data as any).recipientId,
      recipient_role: (data as any).recipientRole || 'admin',
      content:      data.content,
      is_read:      (data as any).isRead ?? false,
      session_id:   (data as any).sessionId,
    };
    const { data: msg, error } = await supabase.from('messages').insert(row).select().single();
    if (error || !msg) throw error || new Error('Failed to create message');
    return mapMessage(msg);
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    try {
      const { data, error } = await supabase.from('messages').update({ is_read: true }).eq('id', id).select().single();
      return error ? undefined : mapMessage(data);
    } catch { return undefined; }
  }

  async getUserAlerts(userId: string): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async getUnreadAlerts(userId: string): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', userId).eq('is_read', false);
      return error ? [] : (data || []);
    } catch { return []; }
  }

  async createAlert(data: InsertAlert): Promise<Alert> {
    const row = {
      user_id: (data as any).userId ?? (data as any).user_id,
      title:   data.title,
      message: data.message,
      type:    data.type,
      is_read: (data as any).isRead ?? false,
    };
    const { data: alert, error } = await supabase.from('alerts').insert(row).select().single();
    if (error || !alert) throw error || new Error('Failed to create alert');
    return alert;
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    try {
      const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select().single();
      return error ? undefined : data;
    } catch { return undefined; }
  }

  async deleteAlert(id: string): Promise<void> {
    try { await supabase.from('alerts').delete().eq('id', id); } catch {}
  }

  async getBranches(): Promise<any[]> {
    return [
      { id: 1, name: 'World Bank - Washington DC HQ', address: '1818 H Street NW', city: 'Washington', state: 'DC', country: 'USA', phone: '+1-202-473-1000', hours: 'Mon-Fri 9AM-5PM' },
      { id: 2, name: 'World Bank - London Office', address: '1 New Change, EC4M 9AF', city: 'London', country: 'UK', phone: '+44-20-7246-8585', hours: 'Mon-Fri 9AM-5PM' },
      { id: 3, name: 'World Bank - Singapore', address: '9 Raffles Place', city: 'Singapore', country: 'Singapore', phone: '+65-6324-4060', hours: 'Mon-Fri 9AM-5PM' },
      { id: 4, name: 'World Bank - Tokyo Office', address: 'Fukoku Seimei Building, 2-2-2 Uchisaiwaicho', city: 'Tokyo', country: 'Japan', phone: '+81-3-3597-6650', hours: 'Mon-Fri 9AM-5PM' },
    ];
  }

  async getAtms(): Promise<any[]> {
    return [
      { id: 1, name: 'World Bank ATM - Times Square', address: '1560 Broadway', city: 'New York', country: 'USA', available: true },
      { id: 2, name: 'World Bank ATM - Grand Central', address: '87 E 42nd St', city: 'New York', country: 'USA', available: true },
      { id: 3, name: 'World Bank ATM - LAX Airport', address: '1 World Way', city: 'Los Angeles', country: 'USA', available: true },
      { id: 4, name: 'World Bank ATM - Heathrow', address: 'Heathrow Airport TW6 1EW', city: 'London', country: 'UK', available: true },
    ];
  }

  async getExchangeRates(): Promise<any[]> {
    return [
      { id: 1, baseCurrency: 'USD', targetCurrency: 'EUR', rate: '0.9215' },
      { id: 2, baseCurrency: 'USD', targetCurrency: 'GBP', rate: '0.7891' },
      { id: 3, baseCurrency: 'USD', targetCurrency: 'JPY', rate: '149.25' },
      { id: 4, baseCurrency: 'USD', targetCurrency: 'CNY', rate: '7.2341' },
      { id: 5, baseCurrency: 'USD', targetCurrency: 'CAD', rate: '1.3652' },
      { id: 6, baseCurrency: 'USD', targetCurrency: 'AUD', rate: '1.5234' },
      { id: 7, baseCurrency: 'USD', targetCurrency: 'CHF', rate: '0.8912' },
      { id: 8, baseCurrency: 'USD', targetCurrency: 'SGD', rate: '1.3412' },
      { id: 9, baseCurrency: 'USD', targetCurrency: 'HKD', rate: '7.8234' },
    ];
  }

  async getStatementsByUserId(userId: string): Promise<any[]> {
    const months = ['January', 'February', 'March'];
    const year = new Date().getFullYear();
    return months.map((month, i) => ({
      id: i + 1,
      userId,
      month,
      year,
      title: `${month} ${year} Statement`,
      generatedAt: new Date(year, i + 1, 1).toISOString(),
      downloadUrl: `/api/statements/${userId}/${year}/${i + 1}`
    }));
  }

  async getMarketRates(): Promise<any[]> {
    return [
      { symbol: 'SPY', name: 'S&P 500 ETF', price: 524.35, change: 2.14, changePercent: 0.41, asset_type: 'stocks', change_direction: 'up', change_percent: 0.41 },
      { symbol: 'QQQ', name: 'NASDAQ ETF', price: 448.22, change: -1.83, changePercent: -0.41, asset_type: 'stocks', change_direction: 'down', change_percent: -0.41 },
      { symbol: 'TLT', name: '20+ Year Treasury', price: 92.31, change: -0.22, changePercent: -0.24, asset_type: 'bonds', change_direction: 'down', change_percent: -0.24 },
      { symbol: 'GLD', name: 'Gold ETF', price: 192.45, change: 0.54, changePercent: 0.28, asset_type: 'crypto', change_direction: 'up', change_percent: 0.28 },
      { symbol: 'UUP', name: 'USD Index ETF', price: 27.85, change: 0.12, changePercent: 0.43, asset_type: 'forex', change_direction: 'up', change_percent: 0.43 },
    ];
  }
}
