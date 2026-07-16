/**
 * server/storage-factory.ts
 * Singleton IStorage instance backed by Supabase REST.
 */
import type { IStorage } from './storage';
import type {
  User,
  Account,
  Transaction,
  AdminAction,
  SupportTicket,
  Card,
  Investment,
  Message,
  Alert,
  InsertUser,
  InsertAccount,
  InsertTransaction,
  InsertAdminAction,
  InsertSupportTicket,
  InsertCard,
  InsertInvestment,
  InsertMessage,
  InsertAlert,
} from '@shared/schema';
import {
  supabase,
  insertRecord,
  updateRecord,
  getRecord,
  listRecords,
  deleteRecord,
} from './supabase-public-storage';

/**
 * Minimal IStorage implementation using Supabase REST helpers.
 * Uses 'users' table (not 'user_profiles') to match the actual database schema.
 */
class SupabasePublicStorage implements IStorage {
  async getUser(id: string) {
    return getRecord('users', id) as Promise<User | undefined>;
  }
  async getUserByEmail(email: string) {
    const rows = await listRecords('users', { email }) as Array<Record<string, unknown>>;
    return rows[0] as unknown as User | undefined;
  }
  async getUserByUsername(username: string) {
    const rows = await listRecords('users', { username }) as Array<Record<string, unknown>>;
    return rows[0] as unknown as User | undefined;
  }
  async getAllUsers() {
    return listRecords('users') as Promise<User[]>;
  }
  async createUser(user: InsertUser) {
    return insertRecord('users', user as unknown as Record<string, unknown>) as Promise<User>;
  }
  async updateUser(id: string, updates: Partial<InsertUser>) {
    return updateRecord('users', id, updates as unknown as Record<string, unknown>) as Promise<User | undefined>;
  }
  async updateUserBalance(id: string, delta: number) {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newBalance = (Number(user.balance) || 0) + delta;
    return updateRecord('users', id, { balance: String(newBalance) }) as Promise<User | undefined>;
  }

  async getUserAccounts(userId: string) {
    return listRecords('accounts', { user_id: userId }) as Promise<Account[]>;
  }
  async getAccount(id: string) {
    return getRecord('accounts', id) as Promise<Account | undefined>;
  }
  async createAccount(account: InsertAccount) {
    return insertRecord('accounts', account as unknown as Record<string, unknown>) as Promise<Account>;
  }
  async updateAccount(id: string, updates: Partial<InsertAccount>) {
    return updateRecord('accounts', id, updates as unknown as Record<string, unknown>) as Promise<Account | undefined>;
  }

  async getAccountTransactions(accountId: string, limit?: number) {
    const { getAdminClient } = await import('./supabase-public-storage');
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('transactions')
      .select('*')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('created_at', { ascending: false })
      .limit(limit || 100);
    if (error) throw error;
    return (data || []) as unknown as Transaction[];
  }
  async getAllTransactions() {
    return listRecords('transactions') as Promise<Transaction[]>;
  }
  async createTransaction(tx: InsertTransaction) {
    return insertRecord('transactions', tx as unknown as Record<string, unknown>) as Promise<Transaction>;
  }
  async updateTransactionStatus(id: string, status: string, _adminId: string, _notes?: string) {
    return updateRecord('transactions', id, { status }) as Promise<Transaction | undefined>;
  }
  async getPendingTransactions() {
    return listRecords('transactions', { status: 'pending' }) as Promise<Transaction[]>;
  }

  async createAdminAction(action: InsertAdminAction) {
    return insertRecord('admin_actions', action as unknown as Record<string, unknown>) as Promise<AdminAction>;
  }
  async getAdminActions(adminId?: string) {
    return adminId
      ? listRecords('admin_actions', { admin_id: adminId }) as Promise<AdminAction[]>
      : listRecords('admin_actions') as Promise<AdminAction[]>;
  }

  async createSupportTicket(ticket: InsertSupportTicket) {
    return insertRecord('support_tickets', ticket as unknown as Record<string, unknown>) as Promise<SupportTicket>;
  }
  async getSupportTicket(id: string) {
    return getRecord('support_tickets', id) as Promise<SupportTicket | undefined>;
  }
  async getSupportTickets(userId?: string) {
    return userId
      ? listRecords('support_tickets', { user_id: userId }) as Promise<SupportTicket[]>
      : listRecords('support_tickets') as Promise<SupportTicket[]>;
  }
  async updateSupportTicket(id: string, updates: Partial<InsertSupportTicket>) {
    return updateRecord('support_tickets', id, updates as unknown as Record<string, unknown>) as Promise<SupportTicket | undefined>;
  }

  async getUserCards(userId: string) {
    // Cards are linked to accounts, not directly to users.
    // First get the user's accounts, then get cards for those accounts.
    const accounts = await this.getUserAccounts(userId);
    if (!accounts || accounts.length === 0) return [];
    const accountIds = accounts.map(a => a.id);
    const { getAdminClient } = await import('./supabase-public-storage');
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('cards')
      .select('*')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as Card[];
  }
  async getCard(id: string) {
    return getRecord('cards', id) as Promise<Card | undefined>;
  }
  async createCard(card: InsertCard) {
    return insertRecord('cards', card as unknown as Record<string, unknown>) as Promise<Card>;
  }
  async updateCard(id: string, updates: Partial<InsertCard>) {
    return updateRecord('cards', id, updates as unknown as Record<string, unknown>) as Promise<Card | undefined>;
  }

  async getUserInvestments(userId: string) {
    return listRecords('investments', { user_id: userId }) as Promise<Investment[]>;
  }
  async getInvestment(id: string) {
    return getRecord('investments', id) as Promise<Investment | undefined>;
  }
  async createInvestment(investment: InsertInvestment) {
    return insertRecord('investments', investment as unknown as Record<string, unknown>) as Promise<Investment>;
  }
  async updateInvestment(id: string, updates: Partial<InsertInvestment>) {
    return updateRecord('investments', id, updates as unknown as Record<string, unknown>) as Promise<Investment | undefined>;
  }

  async getMessages(conversationId?: string) {
    return conversationId
      ? listRecords('messages', { ticket_id: conversationId }) as Promise<Message[]>
      : listRecords('messages') as Promise<Message[]>;
  }
  async getUserMessages(userId: string) {
    return listRecords('messages', { user_id: userId }) as Promise<Message[]>;
  }
  async createMessage(message: InsertMessage) {
    return insertRecord('messages', message as unknown as Record<string, unknown>) as Promise<Message>;
  }
  async markMessageAsRead(id: string) {
    return updateRecord('messages', id, { is_read: true }) as Promise<Message | undefined>;
  }

  async getUserAlerts(userId: string) {
    return listRecords('alerts', { user_id: userId }) as Promise<Alert[]>;
  }
  async getUnreadAlerts(userId: string) {
    const all = await this.getUserAlerts(userId);
    return (all as unknown as Array<Record<string, unknown>>).filter(a => !a.is_read) as unknown as Alert[];
  }
  async createAlert(alert: InsertAlert) {
    return insertRecord('alerts', alert as unknown as Record<string, unknown>) as Promise<Alert>;
  }
  async markAlertAsRead(id: string) {
    return updateRecord('alerts', id, { is_read: true, read_at: new Date().toISOString() }) as Promise<Alert | undefined>;
  }
  async deleteAlert(id: string) {
    await deleteRecord('alerts', id);
  }

  async getBranches() { return [] as Array<Record<string, unknown>>; }
  async getAtms() { return [] as Array<Record<string, unknown>>; }
  async getExchangeRates() {
    return listRecords('forex') as Promise<Array<Record<string, unknown>>>;
  }
  async getMarketRates() { return [] as Array<Record<string, unknown>>; }
  async getStatementsByUserId(_userId: string) { return [] as Array<Record<string, unknown>>; }
}

let _instance: IStorage | null = null;

export function createStorage(): IStorage {
  if (!_instance) _instance = new SupabasePublicStorage();
  return _instance!;
}

export const storage: IStorage = createStorage();
