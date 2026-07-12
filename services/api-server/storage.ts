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

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserBySupabaseId?(supabaseUserId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: string, amount: number): Promise<User | undefined>;
  getUserAccounts(userId: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  getAccountTransactions(accountId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string, adminId?: string, notes?: string): Promise<Transaction | undefined>;
  getPendingTransactions(): Promise<Transaction[]>;
  updateAccount?(id: string, updates: Partial<Account>): Promise<Account | undefined>;
  createAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActions(adminId?: string): Promise<AdminAction[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  getSupportTickets(userId?: string): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Cards operations
  getUserCards(userId: string): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined>;
  
  // Investments operations
  getUserInvestments(userId: string): Promise<Investment[]>;
  getInvestment(id: string): Promise<Investment | undefined>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment | undefined>;
  
  // Messages operations
  getMessages(conversationId?: string): Promise<Message[]>;
  getUserMessages(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  
  // Alerts operations
  getUserAlerts(userId: string): Promise<Alert[]>;
  getUnreadAlerts(userId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<void>;
  
  // Branches and ATMs operations
  getBranches(): Promise<any[]>;
  getAtms(): Promise<any[]>;
  
  // Exchange rates operations
  getExchangeRates(): Promise<any[]>;
  
  // Statements operations
  getStatementsByUserId(userId: string): Promise<any[]>;
  
  // Market rates operations
  getMarketRates(): Promise<any[]>;
}
