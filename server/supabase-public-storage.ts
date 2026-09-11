/**
 * server/supabase-public-storage.ts
 *
 * IStorage implementation that talks to Supabase via the REST API.
 * Primary user table: user_profiles
 * Accounts table:     bank_accounts
 * Transactions table: transactions  (column: transaction_type, not type)
 * All IDs are UUID strings.
 */
import { createClient } from '@supabase/supabase-js';
import type {
  User, InsertUser,
  Account, InsertAccount,
  Transaction, InsertTransaction,
  AdminAction, InsertAdminAction,
  SupportTicket, InsertSupportTicket,
  Card, InsertCard,
  Investment, InsertInvestment,
  Message, InsertMessage,
  Alert, InsertAlert,
} from '@shared/schema';
import type { IStorage } from './storage';

const supabaseUrl  = process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL  || '';
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl)  throw new Error('Missing VITE_SUPABASE_URL');
if (!supabaseKey)  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ---- Mappers ---- //

function mapUser(r: Record<string, any>): User {
  const bal = parseFloat(String(r.balance ?? '0'));
  return {
    id:            String(r.id),
    email:         r.email          || '',
    role:          r.role           || 'customer',
    isActive:      r.is_active      ?? false,
    isVerified:    r.is_verified    ?? false,
    kycStatus:     r.kyc_status     || 'pending',
    accountStatus: r.account_status || undefined,
    transferPin:   r.transfer_pin   || null,
    accountNumber: r.account_number || null,
    balance:       isNaN(bal) ? '0.00' : bal.toFixed(2),
    fullName:      r.full_name      || `${r.first_name || ''} ${r.last_name || ''}`.trim() || null,
    firstName:     r.first_name     || null,
    lastName:      r.last_name      || null,
    phone:         r.phone_number   || r.phone || null,
    profession:    r.profession     || r.occupation || null,
    occupation:    r.occupation     || null,
    profilePhoto:  r.avatar_url     || null,
    username:      r.username       || null,
    dateOfBirth:   r.date_of_birth  || null,
    address:       r.address        || null,
    city:          r.city           || null,
    state:         r.state          || null,
    country:       r.country        || null,
    postalCode:    r.postal_code    || null,
    annualIncome:  r.annual_income  ? String(r.annual_income) : null,
    idType:        r.identification_type   || null,
    idNumber:      r.identification_number || null,
    lastLogin:     r.last_login_at  || r.last_login || null,
    createdAt:     r.created_at     || null,
    updatedAt:     r.updated_at     || null,
  };
}

function mapAccount(r: Record<string, any>): Account {
  return {
    id:               String(r.id),
    userId:           String(r.user_id),
    accountNumber:    r.account_number    || '',
    accountType:      r.account_type      || 'checking',
    balance:          String(r.balance    ?? '0.00'),
    availableBalance: String(r.available_balance ?? r.balance ?? '0.00'),
    currency:         r.currency          || 'USD',
    status:           r.status            || 'active',
    isPrimary:        r.is_primary        ?? false,
    routingNumber:    r.routing_number    || null,
    iban:             r.iban              || null,
    swiftCode:        r.swift_code        || null,
    accountNickname:  r.account_nickname  || null,
    createdAt:        r.created_at        || null,
    updatedAt:        r.updated_at        || null,
  };
}

function mapTransaction(r: Record<string, any>): Transaction {
  return {
    id:               String(r.id),
    fromAccountId:    r.from_account_id   || null,
    toAccountId:      r.to_account_id     || null,
    fromUserId:       r.from_user_id      || null,
    transactionType:  r.transaction_type  || r.type || 'transfer',
    type:             r.transaction_type  || r.type || 'transfer',
    amount:           String(r.amount     ?? '0'),
    currency:         r.currency          || 'USD',
    status:           r.status            || 'pending',
    description:      r.description       || null,
    referenceNumber:  r.reference_number  || '',
    recipientName:    r.recipient_name    || null,
    recipientAccount: r.recipient_account || null,
    recipientCountry: r.recipient_country || null,
    bankName:         r.bank_name         || r.recipient_bank || null,
    swiftCode:        r.swift_code        || null,
    transferPurpose:  r.transfer_purpose  || null,
    adminNotes:       r.admin_notes       || null,
    requiresApproval: r.requires_approval ?? false,
    approvedBy:       r.approved_by       || null,
    approvedAt:       r.approved_at       || null,
    createdAt:        r.created_at        || null,
    updatedAt:        r.updated_at        || r.processed_at || null,
  };
}

function mapCard(r: Record<string, any>): Card {
  return {
    id:                 String(r.id),
    userId:             String(r.user_id),
    accountId:          String(r.account_id),
    cardNumber:         r.card_number         || null,
    cardHolder:         r.card_holder         || null,
    expiryDate:         r.expiry_date         || null,
    type:               r.type                || 'debit',
    status:             r.status              || 'active',
    isLocked:           r.is_locked           ?? false,
    dailyLimit:         r.daily_limit         || null,
    contactlessEnabled: r.contactless_enabled ?? true,
    createdAt:          r.created_at          || null,
  };
}

function mapInvestment(r: Record<string, any>): Investment {
  return {
    id:           String(r.id),
    userId:       String(r.user_id),
    type:         r.type          || '',
    symbol:       r.symbol        || '',
    assetType:    r.asset_type    || null,
    shares:       r.shares        != null ? String(r.shares) : null,
    averagePrice: r.average_price != null ? String(r.average_price) : null,
    currentPrice: r.current_price != null ? String(r.current_price) : null,
    totalValue:   r.total_value   != null ? String(r.total_value)   : null,
    gainLoss:     r.gain_loss     != null ? String(r.gain_loss)     : null,
    status:       r.status        || 'active',
    createdAt:    r.created_at    || null,
    updatedAt:    r.updated_at    || null,
  };
}

function mapMessage(r: Record<string, any>): Message {
  return {
    id:           String(r.id),
    senderId:     String(r.sender_id),
    recipientId:  String(r.recipient_id),
    sessionId:    r.session_id    || null,
    senderRole:   r.sender_role   || 'customer',
    recipientRole: r.recipient_role || 'admin',
    content:      r.content       || '',
    messageType:  r.message_type  || 'text',
    isRead:       r.is_read       ?? false,
    createdAt:    r.created_at    || null,
  };
}

function mapAdminAction(r: Record<string, any>): AdminAction {
  return {
    id:         String(r.id),
    adminId:    String(r.admin_id),
    action:     r.action      || '',
    targetType: r.target_type || null,
    targetId:   r.target_id   || null,
    details:    r.details     || null,
    createdAt:  r.created_at  || null,
  };
}

async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let err: any;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) {
      err = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 2 ** i * 150));
    }
  }
  throw err;
}

// ============================================================
// SupabasePublicStorage
// ============================================================

export class SupabasePublicStorage implements IStorage {

  // ---- Users ----

  async getUser(id: string): Promise<User | undefined> {
    const { data } = await supabase.from('user_profiles').select('*').eq('id', id).maybeSingle();
    return data ? mapUser(data) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data } = await supabase.from('user_profiles').select('*').eq('email', email).maybeSingle();
    return data ? mapUser(data) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase.from('user_profiles').select('*').eq('username', username).maybeSingle();
    return data ? mapUser(data) : undefined;
  }

  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    // wb_users.id = auth.uid(); use it to find the user_profiles row by same UUID
    const { data } = await supabase.from('user_profiles').select('*').eq('id', supabaseId).maybeSingle();
    return data ? mapUser(data) : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    return (data || []).map(mapUser);
  }

  async createUser(d: InsertUser): Promise<User> {
    const fullName = d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email;
    const row: Record<string, any> = {
      full_name:    fullName,
      email:        d.email,
      role:         d.role         || 'customer',
      is_active:    d.isActive     ?? false,
      is_verified:  d.isVerified   ?? false,
      balance:      d.balance      || '0.00',
    };
    if (d.firstName)     row.first_name         = d.firstName;
    if (d.lastName)      row.last_name          = d.lastName;
    if (d.phone)         row.phone_number       = d.phone;
    if (d.occupation || d.profession) row.occupation = d.occupation || d.profession;
    if (d.profession)    row.profession         = d.profession;
    if (d.transferPin)   row.transfer_pin       = d.transferPin;
    if (d.accountNumber) row.account_number     = d.accountNumber;
    if (d.dateOfBirth)   row.date_of_birth      = d.dateOfBirth;
    if (d.city)          row.city               = d.city;
    if (d.state)         row.state              = d.state;
    if (d.country)       row.country            = d.country;
    if (d.postalCode)    row.postal_code        = d.postalCode;
    if (d.annualIncome)  row.annual_income      = d.annualIncome;
    if (d.idType)        row.identification_type   = d.idType;
    if (d.idNumber)      row.identification_number = d.idNumber;
    if (d.username)      row.username           = d.username;
    const { data, error } = await supabase.from('user_profiles').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create user');
    return mapUser(data);
  }

  async updateUser(id: string, u: Partial<User>): Promise<User | undefined> {
    const d: any = { updated_at: new Date().toISOString() };
    if (u.firstName !== undefined || u.lastName !== undefined) {
      const ex = await this.getUser(id);
      const fn = u.firstName ?? ex?.firstName ?? '';
      const ln = u.lastName  ?? ex?.lastName  ?? '';
      d.full_name  = `${fn} ${ln}`.trim();
      if (u.firstName !== undefined) d.first_name = u.firstName;
      if (u.lastName  !== undefined) d.last_name  = u.lastName;
    }
    if (u.fullName      !== undefined) d.full_name          = u.fullName;
    if (u.email         !== undefined) d.email              = u.email;
    if (u.balance       !== undefined) d.balance            = u.balance;
    if (u.isActive      !== undefined) d.is_active          = u.isActive;
    if (u.isVerified    !== undefined) d.is_verified        = u.isVerified;
    if (u.phone         !== undefined) d.phone_number       = u.phone;
    if (u.city          !== undefined) d.city               = u.city;
    if (u.state         !== undefined) d.state              = u.state;
    if (u.country       !== undefined) d.country            = u.country;
    if (u.postalCode    !== undefined) d.postal_code        = u.postalCode;
    if (u.transferPin   !== undefined) d.transfer_pin       = u.transferPin;
    if (u.role          !== undefined) d.role               = u.role;
    if (u.profession    !== undefined) d.profession         = u.profession;
    if (u.occupation    !== undefined) d.occupation         = u.occupation;
    if (u.dateOfBirth   !== undefined) d.date_of_birth      = u.dateOfBirth;
    if (u.profilePhoto  !== undefined) d.avatar_url         = u.profilePhoto;
    if (u.lastLogin     !== undefined) d.last_login_at      = u.lastLogin;
    if (u.accountNumber !== undefined) d.account_number     = u.accountNumber;
    if (u.kycStatus     !== undefined) d.kyc_status         = u.kycStatus;
    if (u.accountStatus !== undefined) d.account_status     = u.accountStatus;
    if (u.idType        !== undefined) d.identification_type   = u.idType;
    if (u.idNumber      !== undefined) d.identification_number = u.idNumber;
    const { data, error } = await supabase.from('user_profiles').update(d).eq('id', id).select('*').single();
    if (error || !data) return undefined;
    return mapUser(data);
  }

  async updateUserBalance(id: string, delta: number): Promise<User | undefined> {
    const { data: cur } = await supabase.from('user_profiles').select('balance').eq('id', id).single();
    const current  = parseFloat(String(cur?.balance ?? '0')) || 0;
    const newBal   = Math.max(0, current + delta).toFixed(2);
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ balance: newBal, updated_at: new Date().toISOString() })
      .eq('id', id).select('*').single();
    if (error || !data) return undefined;
    // Sync bank_accounts primary balance
    const accounts = await this.getUserAccounts(id);
    if (accounts.length > 0) {
      const accBal = Math.max(0, parseFloat(String(accounts[0].balance ?? '0')) + delta).toFixed(2);
      await supabase.from('bank_accounts')
        .update({ balance: accBal, available_balance: accBal })
        .eq('id', accounts[0].id);
    }
    return mapUser(data);
  }

  // ---- Accounts ----

  async getUserAccounts(userId: string): Promise<Account[]> {
    const { data } = await supabase.from('bank_accounts').select('*').eq('user_id', userId).order('is_primary', { ascending: false });
    return (data || []).map(mapAccount);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const { data } = await supabase.from('bank_accounts').select('*').eq('id', id).maybeSingle();
    return data ? mapAccount(data) : undefined;
  }

  async createAccount(d: InsertAccount): Promise<Account> {
    const row = {
      user_id:        d.userId,
      account_number: d.accountNumber,
      account_type:   d.accountType   || 'checking',
      balance:        d.balance        || '0.00',
      currency:       d.currency       || 'USD',
      status:         d.status         || 'active',
      is_primary:     d.isPrimary      ?? false,
    };
    const { data, error } = await supabase.from('bank_accounts').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create account');
    return mapAccount(data);
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    const d: any = { updated_at: new Date().toISOString() };
    if (updates.balance          !== undefined) d.balance           = updates.balance;
    if (updates.availableBalance !== undefined) d.available_balance = updates.availableBalance;
    if (updates.status           !== undefined) d.status            = updates.status;
    if ((updates as any).isActive !== undefined) d.is_active        = (updates as any).isActive;
    const { data, error } = await supabase.from('bank_accounts').update(d).eq('id', id).select('*').single();
    return error ? undefined : mapAccount(data);
  }

  // ---- Transactions ----

  async getAccountTransactions(accountId: string, limit?: number): Promise<Transaction[]> {
    let q = supabase.from('transactions').select('*')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('created_at', { ascending: false });
    if (limit && limit > 0) q = q.limit(limit);
    const { data } = await q;
    return (data || []).map(mapTransaction);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    return (data || []).map(mapTransaction);
  }

  async createTransaction(d: InsertTransaction): Promise<Transaction> {
    const row: any = {
      transaction_type:  d.transactionType,
      amount:            String(d.amount),
      currency:          d.currency         || 'USD',
      status:            d.status           || 'pending',
      reference_number:  d.referenceNumber,
    };
    if (d.fromAccountId)    row.from_account_id    = d.fromAccountId;
    if (d.toAccountId)      row.to_account_id      = d.toAccountId;
    if (d.fromUserId)       row.from_user_id       = d.fromUserId;
    if (d.description)      row.description        = d.description;
    if (d.recipientName)    row.recipient_name     = d.recipientName;
    if (d.recipientAccount) row.recipient_account  = d.recipientAccount;
    if (d.recipientCountry) row.recipient_country  = d.recipientCountry;
    if (d.bankName)         row.bank_name          = d.bankName;
    if (d.swiftCode)        row.swift_code         = d.swiftCode;
    if (d.transferPurpose)  row.transfer_purpose   = d.transferPurpose;
    const { data, error } = await supabase.from('transactions').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create transaction');
    return mapTransaction(data);
  }

  async updateTransactionStatus(id: string, status: string, adminId: string, notes?: string): Promise<Transaction | undefined> {
    const d: any = { status, updated_at: new Date().toISOString() };
    if (notes)   d.admin_notes  = notes;
    if (adminId) d.approved_by  = adminId;
    const { data } = await supabase.from('transactions').update(d).eq('id', id).select('*').single();
    return data ? mapTransaction(data) : undefined;
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const { data } = await supabase.from('transactions').select('*').in('status', ['pending', 'processing']);
    return (data || []).map(mapTransaction);
  }

  // ---- Admin Actions ----

  async createAdminAction(d: InsertAdminAction): Promise<AdminAction> {
    const row = { admin_id: d.adminId, action: d.action, target_type: d.targetType, target_id: d.targetId, details: d.details };
    const { data, error } = await supabase.from('admin_actions').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create admin action');
    return mapAdminAction(data);
  }

  async getAdminActions(adminId?: string): Promise<AdminAction[]> {
    let q = supabase.from('admin_actions').select('*').order('created_at', { ascending: false });
    if (adminId) q = q.eq('admin_id', adminId);
    const { data } = await q;
    return (data || []).map(mapAdminAction);
  }

  // ---- Support Tickets ----

  async createSupportTicket(d: InsertSupportTicket): Promise<SupportTicket> {
    const row: any = { user_id: (d as any).userId || (d as any).user_id, subject: d.subject, description: d.description, status: d.status || 'open', priority: d.priority || 'medium' };
    if ((d as any).category) row.category = (d as any).category;
    const { data, error } = await supabase.from('support_tickets').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create ticket');
    return data as SupportTicket;
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const { data } = await supabase.from('support_tickets').select('*').eq('id', id).maybeSingle();
    return data as SupportTicket || undefined;
  }

  async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    let q = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return (data || []) as SupportTicket[];
  }

  async updateSupportTicket(id: string, u: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const map: Record<string, string> = { adminNotes: 'admin_notes', userId: 'user_id', createdAt: 'created_at', updatedAt: 'updated_at', assignedTo: 'assigned_to' };
    const d: any = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(u)) d[map[k] || k] = v;
    const { data } = await supabase.from('support_tickets').update(d).eq('id', id).select('*').single();
    return data as SupportTicket || undefined;
  }

  // ---- Cards ----

  async getUserCards(userId: string): Promise<Card[]> {
    const accounts = await this.getUserAccounts(userId);
    if (!accounts.length) return [];
    const { data } = await supabase.from('cards').select('*').in('account_id', accounts.map(a => a.id));
    return (data || []).map(mapCard);
  }

  async getCard(id: string): Promise<Card | undefined> {
    const { data } = await supabase.from('cards').select('*').eq('id', id).maybeSingle();
    return data ? mapCard(data) : undefined;
  }

  async createCard(d: InsertCard): Promise<Card> {
    const row: any = { user_id: (d as any).userId, account_id: (d as any).accountId, type: (d as any).type || 'debit', status: d.status || 'active' };
    if ((d as any).cardNumber) row.card_number = (d as any).cardNumber;
    if ((d as any).cardHolder) row.card_holder = (d as any).cardHolder;
    if ((d as any).expiryDate) row.expiry_date = (d as any).expiryDate;
    const { data, error } = await supabase.from('cards').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create card');
    return mapCard(data);
  }

  async updateCard(id: string, u: Partial<Card>): Promise<Card | undefined> {
    const d: any = {};
    if (u.isLocked           !== undefined) d.is_locked           = u.isLocked;
    if (u.status             !== undefined) d.status              = u.status;
    if (u.dailyLimit         !== undefined) d.daily_limit         = u.dailyLimit;
    if (u.contactlessEnabled !== undefined) d.contactless_enabled = u.contactlessEnabled;
    const { data } = await supabase.from('cards').update(d).eq('id', id).select('*').single();
    return data ? mapCard(data) : undefined;
  }

  // ---- Investments ----

  async getUserInvestments(userId: string): Promise<Investment[]> {
    const { data } = await supabase.from('investments').select('*').eq('user_id', userId);
    return (data || []).map(mapInvestment);
  }

  async getInvestment(id: string): Promise<Investment | undefined> {
    const { data } = await supabase.from('investments').select('*').eq('id', id).maybeSingle();
    return data ? mapInvestment(data) : undefined;
  }

  async createInvestment(d: InsertInvestment): Promise<Investment> {
    const row: any = { user_id: (d as any).userId, type: d.type, symbol: (d as any).symbol || '', status: d.status || 'active' };
    if ((d as any).shares)       row.shares        = (d as any).shares;
    if ((d as any).averagePrice) row.average_price = (d as any).averagePrice;
    if ((d as any).currentPrice) row.current_price = (d as any).currentPrice;
    if ((d as any).assetType)    row.asset_type    = (d as any).assetType;
    const { data, error } = await supabase.from('investments').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create investment');
    return mapInvestment(data);
  }

  async updateInvestment(id: string, u: Partial<Investment>): Promise<Investment | undefined> {
    const d: any = {};
    if (u.currentPrice !== undefined) d.current_price = u.currentPrice;
    if (u.totalValue   !== undefined) d.total_value   = u.totalValue;
    if (u.gainLoss     !== undefined) d.gain_loss     = u.gainLoss;
    if (u.status       !== undefined) d.status        = u.status;
    const { data } = await supabase.from('investments').update(d).eq('id', id).select('*').single();
    return data ? mapInvestment(data) : undefined;
  }

  // ---- Messages ----

  async getMessages(conversationId?: string): Promise<Message[]> {
    let q = supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (conversationId) q = q.eq('session_id', conversationId);
    const { data } = await q;
    return (data || []).map(mapMessage);
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const { data } = await supabase.from('messages').select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    return (data || []).map(mapMessage);
  }

  async createMessage(d: InsertMessage): Promise<Message> {
    const row = { sender_id: d.senderId, recipient_id: d.recipientId, sender_role: d.senderRole || 'customer', recipient_role: d.recipientRole || 'admin', content: d.content, is_read: d.isRead ?? false, session_id: d.sessionId };
    const { data, error } = await supabase.from('messages').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create message');
    return mapMessage(data);
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const { data } = await supabase.from('messages').update({ is_read: true }).eq('id', id).select('*').single();
    return data ? mapMessage(data) : undefined;
  }

  // ---- Alerts ----

  async getUserAlerts(userId: string): Promise<Alert[]> {
    const { data } = await supabase.from('alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as Alert[];
  }

  async getUnreadAlerts(userId: string): Promise<Alert[]> {
    const { data } = await supabase.from('alerts').select('*').eq('user_id', userId).eq('is_read', false);
    return (data || []) as Alert[];
  }

  async createAlert(d: InsertAlert): Promise<Alert> {
    const row = { user_id: d.userId, type: d.type, title: d.title, message: d.message, category: d.category, is_read: d.isRead ?? false };
    const { data, error } = await supabase.from('alerts').insert(row).select('*').single();
    if (error || !data) throw error || new Error('Failed to create alert');
    return data as Alert;
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    const { data } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select('*').single();
    return data as Alert || undefined;
  }

  async deleteAlert(id: string): Promise<void> {
    await supabase.from('alerts').delete().eq('id', id);
  }

  // ---- Reference data ----

  async getBranches(): Promise<any[]> {
    return [
      { id: '1', name: 'World Bank - Washington DC HQ', address: '1818 H Street NW', city: 'Washington', state: 'DC', country: 'USA', phone: '+1-202-473-1000', hours: 'Mon-Fri 9AM-5PM', lat: 38.8986, lng: -77.0430 },
      { id: '2', name: 'World Bank - London Office', address: '1 New Change, EC4M 9AF', city: 'London', country: 'UK', phone: '+44-20-7246-8585', hours: 'Mon-Fri 9AM-5PM', lat: 51.5131, lng: -0.0971 },
      { id: '3', name: 'World Bank - Singapore', address: '9 Raffles Place', city: 'Singapore', country: 'Singapore', phone: '+65-6324-4060', hours: 'Mon-Fri 9AM-5PM', lat: 1.2847, lng: 103.8514 },
      { id: '4', name: 'World Bank - Tokyo Office', address: 'Fukoku Seimei Building, 2-2-2 Uchisaiwaicho', city: 'Tokyo', country: 'Japan', phone: '+81-3-3597-6650', hours: 'Mon-Fri 9AM-5PM', lat: 35.6762, lng: 139.6503 },
    ];
  }

  async getAtms(): Promise<any[]> {
    return [
      { id: '1', name: 'World Bank ATM - Times Square', address: '1560 Broadway', city: 'New York', country: 'USA', available: true, lat: 40.7580, lng: -73.9855 },
      { id: '2', name: 'World Bank ATM - Grand Central', address: '87 E 42nd St', city: 'New York', country: 'USA', available: true, lat: 40.7527, lng: -73.9772 },
      { id: '3', name: 'World Bank ATM - LAX Airport', address: '1 World Way', city: 'Los Angeles', country: 'USA', available: true, lat: 33.9425, lng: -118.4081 },
      { id: '4', name: 'World Bank ATM - Heathrow', address: 'Heathrow Airport TW6 1EW', city: 'London', country: 'UK', available: true, lat: 51.4700, lng: -0.4543 },
    ];
  }

  async getExchangeRates(): Promise<any[]> {
    return [
      { baseCurrency: 'USD', targetCurrency: 'EUR', rate: '0.9215' },
      { baseCurrency: 'USD', targetCurrency: 'GBP', rate: '0.7891' },
      { baseCurrency: 'USD', targetCurrency: 'JPY', rate: '149.25' },
      { baseCurrency: 'USD', targetCurrency: 'CNY', rate: '7.2341' },
      { baseCurrency: 'USD', targetCurrency: 'CAD', rate: '1.3652' },
      { baseCurrency: 'USD', targetCurrency: 'AUD', rate: '1.5234' },
      { baseCurrency: 'USD', targetCurrency: 'CHF', rate: '0.8912' },
      { baseCurrency: 'USD', targetCurrency: 'SGD', rate: '1.3412' },
      { baseCurrency: 'USD', targetCurrency: 'HKD', rate: '7.8234' },
    ];
  }

  async getStatementsByUserId(userId: string): Promise<any[]> {
    const year = new Date().getFullYear();
    return ['January', 'February', 'March'].map((month, i) => ({
      id: String(i + 1), userId, month, year,
      title: `${month} ${year} Statement`,
      generatedAt: new Date(year, i + 1, 1).toISOString(),
      downloadUrl: `/api/statements/${userId}/${year}/${i + 1}`,
    }));
  }

  async getMarketRates(): Promise<any[]> {
    return [
      { symbol: 'SPY', name: 'S&P 500 ETF',        price: 524.35, change: 2.14,  changePercent: 0.41,  asset_type: 'stocks', change_direction: 'up',   change_percent: 0.41 },
      { symbol: 'QQQ', name: 'NASDAQ ETF',          price: 448.22, change: -1.83, changePercent: -0.41, asset_type: 'stocks', change_direction: 'down', change_percent: -0.41 },
      { symbol: 'TLT', name: '20+ Year Treasury',   price: 92.31,  change: -0.22, changePercent: -0.24, asset_type: 'bonds',  change_direction: 'down', change_percent: -0.24 },
      { symbol: 'GLD', name: 'Gold ETF',             price: 192.45, change: 0.54,  changePercent: 0.28,  asset_type: 'crypto', change_direction: 'up',   change_percent: 0.28 },
      { symbol: 'UUP', name: 'USD Index ETF',        price: 27.85,  change: 0.12,  changePercent: 0.43,  asset_type: 'forex',  change_direction: 'up',   change_percent: 0.43 },
    ];
  }
}
