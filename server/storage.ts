import { 
  users, 
  accounts, 
  transactions,
  adminActions,
  supportTickets,
  cards,
  investments,
  messages,
  alerts,
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

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserBySupabaseId?(supabaseUserId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  getUserAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  getAccountTransactions(accountId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined>;
  getPendingTransactions(): Promise<Transaction[]>;
  updateAccount?(id: number, updates: Partial<Account>): Promise<Account | undefined>;
  createAdminAction(action: InsertAdminAction): Promise<AdminAction>;
  getAdminActions(adminId?: number): Promise<AdminAction[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getSupportTickets(userId?: number): Promise<SupportTicket[]>;
  updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Cards operations
  getUserCards(userId: number): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined>;
  
  // Investments operations
  getUserInvestments(userId: number): Promise<Investment[]>;
  getInvestment(id: number): Promise<Investment | undefined>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined>;
  
  // Messages operations
  getMessages(conversationId?: string): Promise<Message[]>;
  getUserMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Alerts operations
  getUserAlerts(userId: number): Promise<Alert[]>;
  getUnreadAlerts(userId: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<void>;
  
  // Branches and ATMs operations
  getBranches(): Promise<any[]>;
  getAtms(): Promise<any[]>;
  
  // Exchange rates operations
  getExchangeRates(): Promise<any[]>;
  
  // Statements operations
  getStatementsByUserId(userId: number): Promise<any[]>;
  
  // Market rates operations
  getMarketRates(): Promise<any[]>;
}

// MemStorage class removed - 100% Supabase only, zero mock data
// Use SupabasePublicStorage or PostgresStorage instead
