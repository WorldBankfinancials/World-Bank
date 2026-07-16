/**
 * server/storage-factory.ts
 * Singleton IStorage instance backed by Supabase REST.
 */
import type { IStorage } from './storage';
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
 */
class SupabasePublicStorage implements IStorage {
  async getUser(id: string) {
    return getRecord('user_profiles', id) as Promise<any>;
  }
  async getUserByEmail(email: string) {
    const rows = await listRecords('user_profiles', { email }) as any[];
    return rows[0];
  }
  async getUserByUsername(username: string) {
    const rows = await listRecords('user_profiles', { username }) as any[];
    return rows[0];
  }
  async getAllUsers() {
    return listRecords('user_profiles') as Promise<any[]>;
  }
  async createUser(user: any) {
    return insertRecord('user_profiles', user) as Promise<any>;
  }
  async updateUser(id: string, updates: any) {
    return updateRecord('user_profiles', id, updates) as Promise<any>;
  }
  async updateUserBalance(id: string, delta: number) {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newBalance = (Number(user.balance) || 0) + delta;
    return updateRecord('user_profiles', id, { balance: String(newBalance) }) as Promise<any>;
  }

  async getUserAccounts(userId: string) {
    return listRecords('accounts', { user_id: userId }) as Promise<any[]>;
  }
  async getAccount(id: string) {
    return getRecord('accounts', id) as Promise<any>;
  }
  async createAccount(account: any) {
    return insertRecord('accounts', account) as Promise<any>;
  }
  async updateAccount(id: string, updates: any) {
    return updateRecord('accounts', id, updates) as Promise<any>;
  }

  async getAccountTransactions(accountId: string, limit?: number) {
    const rows = await listRecords('transactions', { account_id: accountId }) as any[];
    return limit ? rows.slice(0, limit) : rows;
  }
  async getAllTransactions() {
    return listRecords('transactions') as Promise<any[]>;
  }
  async createTransaction(tx: any) {
    return insertRecord('transactions', tx) as Promise<any>;
  }
  async updateTransactionStatus(id: string, status: string, _adminId: string, _notes?: string) {
    return updateRecord('transactions', id, { status }) as Promise<any>;
  }
  async getPendingTransactions() {
    return listRecords('transactions', { status: 'pending' }) as Promise<any[]>;
  }

  async createAdminAction(action: any) {
    return insertRecord('admin_actions', action) as Promise<any>;
  }
  async getAdminActions(adminId?: string) {
    return adminId
      ? listRecords('admin_actions', { admin_id: adminId }) as Promise<any[]>
      : listRecords('admin_actions') as Promise<any[]>;
  }

  async createSupportTicket(ticket: any) {
    return insertRecord('support_tickets', ticket) as Promise<any>;
  }
  async getSupportTicket(id: string) {
    return getRecord('support_tickets', id) as Promise<any>;
  }
  async getSupportTickets(userId?: string) {
    return userId
      ? listRecords('support_tickets', { user_id: userId }) as Promise<any[]>
      : listRecords('support_tickets') as Promise<any[]>;
  }
  async updateSupportTicket(id: string, updates: any) {
    return updateRecord('support_tickets', id, updates) as Promise<any>;
  }

  async getUserCards(userId: string) {
    return listRecords('cards', { user_id: userId }) as Promise<any[]>;
  }
  async getCard(id: string) {
    return getRecord('cards', id) as Promise<any>;
  }
  async createCard(card: any) {
    return insertRecord('cards', card) as Promise<any>;
  }
  async updateCard(id: string, updates: any) {
    return updateRecord('cards', id, updates) as Promise<any>;
  }

  async getUserInvestments(userId: string) {
    return listRecords('investments', { user_id: userId }) as Promise<any[]>;
  }
  async getInvestment(id: string) {
    return getRecord('investments', id) as Promise<any>;
  }
  async createInvestment(investment: any) {
    return insertRecord('investments', investment) as Promise<any>;
  }
  async updateInvestment(id: string, updates: any) {
    return updateRecord('investments', id, updates) as Promise<any>;
  }

  async getMessages(conversationId?: string) {
    return conversationId
      ? listRecords('messages', { conversation_id: conversationId }) as Promise<any[]>
      : listRecords('messages') as Promise<any[]>;
  }
  async getUserMessages(userId: string) {
    return listRecords('messages', { user_id: userId }) as Promise<any[]>;
  }
  async createMessage(message: any) {
    return insertRecord('messages', message) as Promise<any>;
  }
  async markMessageAsRead(id: string) {
    return updateRecord('messages', id, { read: true }) as Promise<any>;
  }

  async getUserAlerts(userId: string) {
    return listRecords('alerts', { user_id: userId }) as Promise<any[]>;
  }
  async getUnreadAlerts(userId: string) {
    return listRecords('alerts', { user_id: userId }) as Promise<any[]>;
  }
  async createAlert(alert: any) {
    return insertRecord('alerts', alert) as Promise<any>;
  }
  async markAlertAsRead(id: string) {
    return updateRecord('alerts', id, { read: true }) as Promise<any>;
  }
  async deleteAlert(id: string) {
    await deleteRecord('alerts', id);
  }

  async getBranches() { return listRecords('branches') as Promise<any[]>; }
  async getAtms() { return listRecords('atms') as Promise<any[]>; }
  async getExchangeRates() { return listRecords('exchange_rates') as Promise<any[]>; }
  async getMarketRates() { return listRecords('market_rates') as Promise<any[]>; }
  async getStatementsByUserId(_userId: string) { return [] as any[]; }
}

let _instance: IStorage | null = null;

export function createStorage(): IStorage {
  if (!_instance) _instance = new SupabasePublicStorage();
  return _instance!;
}

export const storage: IStorage = createStorage();
