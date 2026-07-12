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

type ID = string | number;

export interface IStorage {
  getUser(id: ID): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserBySupabaseId?(supabaseUserId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: ID, user: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: ID, amount: number): Promise<User | undefined>;
  getUserAccounts(userId: ID): Promise<Account[]>;
  getAccount(id: ID): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  getAccountTransactions(accountId: ID, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: ID, status: string, adminId?: ID, notes?: string): Promise<Transaction | undefined>;
  getPendingTransactions(): Promise<Transaction[]>;
  updateAccount?(id: ID, updates: Partial<Account>): Promise<Account | undefined>;
  createAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActions(adminId?: ID): Promise<AdminAction[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: ID): Promise<SupportTicket | undefined>;
  getSupportTickets(userId?: ID): Promise<SupportTicket[]>;
  updateSupportTicket(id: ID, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Cards operations
  getUserCards(userId: ID): Promise<Card[]>;
  getCard(id: ID): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: ID, updates: Partial<Card>): Promise<Card | undefined>;
  
  // Investments operations
  getUserInvestments(userId: ID): Promise<Investment[]>;
  getInvestment(id: ID): Promise<Investment | undefined>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: ID, updates: Partial<Investment>): Promise<Investment | undefined>;
  
  // Messages operations
  getMessages(conversationId?: ID): Promise<Message[]>;
  getUserMessages(userId: ID): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: ID): Promise<Message | undefined>;
  
  // Alerts operations
  getUserAlerts(userId: ID): Promise<Alert[]>;
  getUnreadAlerts(userId: ID): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: ID): Promise<Alert | undefined>;
  deleteAlert(id: ID): Promise<void>;
  
  // Branches and ATMs operations
  getBranches(): Promise<any[]>;
  getAtms(): Promise<any[]>;
  
  // Exchange rates operations
  getExchangeRates(): Promise<any[]>;
  
  // Statements operations
  getStatementsByUserId(userId: ID): Promise<any[]>;
  
  // Market rates operations
  getMarketRates(): Promise<any[]>;
}
