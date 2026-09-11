/**
 * server/storage.ts
 * IStorage interface — all IDs are string (UUID) matching the Supabase DB.
 * Implemented by SupabasePublicStorage in supabase-public-storage.ts.
 */
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

export interface IStorage {
  // ---- Users (user_profiles table) ----
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserBySupabaseId?(supabaseId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: string, delta: number): Promise<User | undefined>;

  // ---- Accounts (accounts table) ----
  getUserAccounts(userId: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount?(id: string, updates: Partial<Account>): Promise<Account | undefined>;

  // ---- Transactions ----
  getAccountTransactions(accountId: string, limit?: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string, adminId: string, notes?: string): Promise<Transaction | undefined>;
  getPendingTransactions(): Promise<Transaction[]>;

  // ---- Admin Actions ----
  createAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActions(adminId?: string): Promise<AdminAction[]>;

  // ---- Support Tickets ----
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  getSupportTickets(userId?: string): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;

  // ---- Cards ----
  getUserCards(userId: string): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined>;

  // ---- Investments ----
  getUserInvestments(userId: string): Promise<Investment[]>;
  getInvestment(id: string): Promise<Investment | undefined>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment | undefined>;

  // ---- Messages ----
  getMessages(conversationId?: string): Promise<Message[]>;
  getUserMessages(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;

  // ---- Alerts ----
  getUserAlerts(userId: string): Promise<Alert[]>;
  getUnreadAlerts(userId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<void>;

  // ---- Reference data ----
  getBranches(): Promise<any[]>;
  getAtms(): Promise<any[]>;
  getExchangeRates(): Promise<any[]>;
  getMarketRates(): Promise<any[]>;
  getStatementsByUserId(userId: string): Promise<any[]>;
}