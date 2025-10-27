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

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, balance: amount, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      await this.savePersistedData();
      return updatedUser;
    }
    return undefined;
  }

  // Account management methods
  async getUserAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.userId === userId);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(accountData: Partial<Account>): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = {
      id,
      userId: accountData.userId || 0,
      accountNumber: accountData.accountNumber || this.generateAccountNumber(),
      accountType: accountData.accountType || 'checking',
      accountName: accountData.accountName || null,
      balance: accountData.balance || '0',
      currency: accountData.currency || null,
      isActive: accountData.isActive ?? null,
      interestRate: accountData.interestRate ?? null,
      minimumBalance: accountData.minimumBalance ?? null,
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

  async getAccountTransactions(accountId: number, limit?: number): Promise<Transaction[]> {
    let txns = Array.from(this.transactions.values())
      .filter(t => t.accountId === accountId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    if (limit) {
      txns = txns.slice(0, limit);
    }
    
    return txns;
  }

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      id,
      accountId: transactionData.accountId || 0,
      type: transactionData.type || 'debit',
      amount: transactionData.amount || '0',
      description: transactionData.description || '',
      category: transactionData.category || null,
      date: transactionData.date || new Date(),
      status: transactionData.status || 'pending',
      recipientName: transactionData.recipientName || null,
      recipientAddress: transactionData.recipientAddress || null,
      recipientCountry: transactionData.recipientCountry || null,
      bankName: transactionData.bankName || null,
      swiftCode: transactionData.swiftCode || null,
      transferPurpose: transactionData.transferPurpose || null,
      adminNotes: transactionData.adminNotes || null,
      approvedBy: transactionData.approvedBy || null,
      approvedAt: transactionData.approvedAt || null,
      rejectedBy: transactionData.rejectedBy || null,
      rejectedAt: transactionData.rejectedAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.transactions.set(id, transaction);
    await this.savePersistedData();
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string, adminId: number, notes?: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const now = new Date();
    const updatedTransaction = {
      ...transaction,
      status,
      adminNotes: notes || transaction.adminNotes,
      approvedBy: status === 'approved' ? adminId.toString() : transaction.approvedBy,
      approvedAt: status === 'approved' ? now : transaction.approvedAt,
      rejectedBy: status === 'rejected' ? adminId.toString() : transaction.rejectedBy,
      rejectedAt: status === 'rejected' ? now : transaction.rejectedAt,
      updatedAt: now
    };

    this.transactions.set(id, updatedTransaction);
    await this.savePersistedData();
    return updatedTransaction;
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Admin action methods
  async createAdminAction(actionData: Partial<AdminAction>): Promise<AdminAction> {
    const id = this.currentAdminActionId++;
    const action: AdminAction = {
      id,
      adminId: actionData.adminId || 0,
      actionType: actionData.actionType || '',
      targetId: actionData.targetId || '',
      targetType: actionData.targetType || '',
      description: actionData.description || '',
      metadata: actionData.metadata || null,
      createdAt: new Date()
    };
    
    this.adminActions.set(id, action);
    await this.savePersistedData();
    return action;
  }

  async getAdminActions(adminId?: number): Promise<AdminAction[]> {
    let actions = Array.from(this.adminActions.values());
    if (adminId) {
      actions = actions.filter(action => action.adminId === adminId);
    }
    return actions.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Support ticket methods
  async createSupportTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const id = this.currentSupportTicketId++;
    const ticket: SupportTicket = {
      id,
      userId: ticketData.userId || 0,
      subject: ticketData.subject || '',
      description: ticketData.description || '',
      priority: ticketData.priority || null,
      status: ticketData.status || null,
      category: ticketData.category || null,
      adminNotes: ticketData.adminNotes || null,
      assignedTo: ticketData.assignedTo || null,
      resolution: ticketData.resolution || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: ticketData.resolvedAt || null
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

  // Cards stubs
  async getUserCards(userId: number): Promise<Card[]> { return []; }
  async getCard(id: number): Promise<Card | undefined> { return undefined; }
  async createCard(card: InsertCard): Promise<Card> { 
    const id = this.currentTransactionId++;
    const newCard = { id, ...card, createdAt: new Date(), updatedAt: new Date() } as Card;
    return newCard;
  }
  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> { return undefined; }
  
  // Investments stubs
  async getUserInvestments(userId: number): Promise<Investment[]> { return []; }
  async getInvestment(id: number): Promise<Investment | undefined> { return undefined; }
  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const id = this.currentTransactionId++;
    return { id, ...investment, createdAt: new Date(), lastUpdated: new Date() } as Investment;
  }
  async updateInvestment(id: number, updates: Partial<Investment>): Promise<Investment | undefined> { return undefined; }
  
  // Messages stubs
  async getMessages(conversationId?: string): Promise<Message[]> { return []; }
  async getUserMessages(userId: number): Promise<Message[]> { return []; }
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentTransactionId++;
    return { id, ...message, createdAt: new Date() } as Message;
  }
  async markMessageAsRead(id: number): Promise<Message | undefined> { return undefined; }
  
  // Alerts stubs
  async getUserAlerts(userId: number): Promise<Alert[]> { return []; }
  async getUnreadAlerts(userId: number): Promise<Alert[]> { return []; }
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = this.currentTransactionId++;
    return { id, ...alert, createdAt: new Date() } as Alert;
  }
  async markAlertAsRead(id: number): Promise<Alert | undefined> { return undefined; }
}
