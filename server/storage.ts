import { 
  users, 
  accounts, 
  transactions,
  adminActions,
  supportTickets,
  type User, 
  type InsertUser,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction,
  type AdminAction,
  type InsertAdminAction,
  type SupportTicket,
  type InsertSupportTicket
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail?(email: string): Promise<User | undefined>;
  getUserByPhone?(phone: string): Promise<User | undefined>;
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
  getSupportTickets(userId?: number): Promise<SupportTicket[]>;
  updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private adminActions: Map<number, AdminAction>;
  private supportTickets: Map<number, SupportTicket>;
  private currentUserId: number;
  private currentAccountId: number;
  private currentTransactionId: number;
  private currentAdminActionId: number;
  private currentSupportTicketId: number;
  private persistenceFile: string;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.adminActions = new Map();
    this.supportTickets = new Map();
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentTransactionId = 1;
    this.currentAdminActionId = 1;
    this.currentSupportTicketId = 1;
    this.persistenceFile = './data-persistence.json';
    this.loadPersistedData();
  }

  private generateAccountNumber(): string {
    return `4789-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private generateAccountId(): string {
    return `WB-2024-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private async loadPersistedData() {
    try {
      const fs = await import('fs');
      if (fs.existsSync(this.persistenceFile)) {
        const data = JSON.parse(fs.readFileSync(this.persistenceFile, 'utf8'));
        
        // Restore maps from persisted data
        this.users = new Map(data.users || []);
        this.accounts = new Map(data.accounts || []);
        this.transactions = new Map(data.transactions || []);
        this.adminActions = new Map(data.adminActions || []);
        this.supportTickets = new Map(data.supportTickets || []);
        
        // Restore counters
        this.currentUserId = data.currentUserId || 1;
        this.currentAccountId = data.currentAccountId || 1;
        this.currentTransactionId = data.currentTransactionId || 1;
        this.currentAdminActionId = data.currentAdminActionId || 1;
        this.currentSupportTicketId = data.currentSupportTicketId || 1;
        
        console.log('✅ Loaded persisted data successfully');
        return;
      }
    } catch (error) {
      console.log('⚠️ No persisted data found, initializing fresh data');
    }
    
    // Initialize fresh data if no persistence found
    this.initializeData();
  }

  private async savePersistedData() {
    try {
      const fs = await import('fs');
      const data = {
        users: Array.from(this.users.entries()),
        accounts: Array.from(this.accounts.entries()),
        transactions: Array.from(this.transactions.entries()),
        adminActions: Array.from(this.adminActions.entries()),
        supportTickets: Array.from(this.supportTickets.entries()),
        currentUserId: this.currentUserId,
        currentAccountId: this.currentAccountId,
        currentTransactionId: this.currentTransactionId,
        currentAdminActionId: this.currentAdminActionId,
        currentSupportTicketId: this.currentSupportTicketId,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.persistenceFile, JSON.stringify(data, null, 2));
      console.log('💾 Data persisted successfully to', this.persistenceFile);
      console.log('📊 Persisted accounts:', data.accounts.length, 'transactions:', data.transactions.length);
    } catch (error) {
      console.error('❌ Failed to persist data:', error);
    }
  }

  private async initializeData() {
    // Skip initialization - all data comes from Supabase now
    console.log('🏦 Storage initialization skipped - using 100% Supabase data');
    return;
  }

  generateAccountNumber(): string {
    return `4789-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  generateAccountId(): string {
    return `WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: userData.username || '',
      password: userData.password || '',
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      accountNumber: userData.accountNumber || this.generateAccountNumber(),
      accountId: userData.accountId || this.generateAccountId(),
      profession: userData.profession || '',
      dateOfBirth: userData.dateOfBirth || '',
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      country: userData.country || '',
      postalCode: userData.postalCode || '',
      nationality: userData.nationality || '',
      annualIncome: userData.annualIncome || '',
      idType: userData.idType || '',
      idNumber: userData.idNumber || '',
      transferPin: userData.transferPin || '',
      role: userData.role || 'customer',
      isVerified: userData.isVerified || false,
      isOnline: userData.isOnline || false,
      isActive: userData.isActive || false,
      avatarUrl: userData.avatarUrl || null,
      balance: userData.balance || 0,
      supabaseUserId: userData.supabaseUserId || null,
      lastLogin: userData.lastLogin || null,
      createdByAdmin: userData.createdByAdmin || null,
      modifiedByAdmin: userData.modifiedByAdmin || null,
      adminNotes: userData.adminNotes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, user);
    await this.savePersistedData();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.supabaseUserId === supabaseUserId);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      await this.savePersistedData();
      return updatedUser;
    }
    return undefined;
  }

  // Account management methods
  async createAccount(accountData: Partial<Account>): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = {
      id,
      userId: accountData.userId || 0,
      accountNumber: accountData.accountNumber || this.generateAccountNumber(),
      accountType: accountData.accountType || 'checking',
      accountName: accountData.accountName || '',
      balance: accountData.balance || '0',
      currency: accountData.currency || 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.accounts.set(id, account);
    await this.savePersistedData();
    return account;
  }

  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.userId === userId);
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (account) {
      const updatedAccount = { ...account, ...updates, updatedAt: new Date() };
      this.accounts.set(id, updatedAccount);
      await this.savePersistedData();
      return updatedAccount;
    }
    return undefined;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      id,
      accountId: transactionData.accountId || 0,
      type: transactionData.type || 'debit',
      amount: transactionData.amount || '0',
      description: transactionData.description || '',
      category: transactionData.category || 'other',
      date: transactionData.date || new Date(),
      status: transactionData.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.transactions.set(id, transaction);
    await this.savePersistedData();
    return transaction;
  }

  // Support ticket methods
  async createSupportTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const id = this.currentSupportTicketId++;
    const ticket: SupportTicket = {
      id,
      userId: ticketData.userId || 0,
      subject: ticketData.subject || '',
      description: ticketData.description || '',
      priority: ticketData.priority || 'medium',
      status: ticketData.status || 'open',
      category: ticketData.category || 'general',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.supportTickets.set(id, ticket);
    await this.savePersistedData();
    return ticket;
  }

  async getSupportTickets(userId?: number): Promise<SupportTicket[]> {
    let tickets = Array.from(this.supportTickets.values());
    if (userId) {
      tickets = tickets.filter(ticket => ticket.userId === userId);
    }
    return tickets.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async updateSupportTicket(id: number, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const ticket = this.supportTickets.get(id);
    if (!ticket) return undefined;

    const now = new Date();
    const updatedTicket = {
      ...ticket,
      ...updates,
      updatedAt: now,
      ...(updates.status === 'resolved' && !ticket.resolvedAt && { resolvedAt: now })
    };

    this.supportTickets.set(id, updatedTicket);
    return updatedTicket;
  }
}

import { SupabaseStorage } from './supabase-storage';

// Use hybrid approach - Supabase Auth with in-memory storage for stability
export const storage = new MemStorage();
