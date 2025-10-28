import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseUserId: text("supabase_user_id").unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  accountNumber: text("account_number").notNull().unique(),
  accountId: text("account_id").notNull().unique(),
  profession: text("profession"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  nationality: text("nationality"),
  annualIncome: text("annual_income"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  transferPin: text("transfer_pin"),
  role: text("role").default("customer"), // 'customer', 'admin', 'support'
  isVerified: boolean("is_verified").default(true),
  isOnline: boolean("is_online").default(true),
  isActive: boolean("is_active").default(true),
  avatarUrl: text("avatar_url"),
  balance: integer("balance").default(0),
  lastLogin: timestamp("last_login"),
  createdByAdmin: text("created_by_admin"),
  modifiedByAdmin: text("modified_by_admin"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name"),
  accountType: text("account_type").notNull(), // 'checking', 'savings', 'investment'
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: text("currency").default("USD"),
  isActive: boolean("is_active").default(true),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  minimumBalance: decimal("minimum_balance", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  type: text("type").notNull(), // 'credit', 'debit'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category"),
  date: timestamp("date").notNull(),
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected', 'completed'
  recipientName: text("recipient_name"),
  recipientAddress: text("recipient_address"),
  recipientCountry: text("recipient_country"),
  bankName: text("bank_name"),
  swiftCode: text("swift_code"),
  transferPurpose: text("transfer_purpose"),
  adminNotes: text("admin_notes"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin actions table for audit trail
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  actionType: text("action_type").notNull(), // 'approve_transfer', 'reject_transfer', 'modify_user', 'create_user'
  targetId: text("target_id").notNull(), // ID of the affected entity
  targetType: text("target_type").notNull(), // 'transaction', 'user', 'account'
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer support tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: text("status").default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  category: text("category"), // 'transfer', 'account', 'technical', 'billing'
  assignedTo: integer("assigned_to"), // Admin ID
  adminNotes: text("admin_notes"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentType: text("document_type").notNull(), // 'passport', 'id_card', 'driver_license', 'proof_of_address', 'bank_statement'
  documentName: text("document_name").notNull(),
  documentUrl: text("document_url").notNull(),
  isVerified: boolean("is_verified").default(false),
  verificationStatus: text("verification_status").default("pending"), // 'pending', 'approved', 'rejected', 'needs_review'
  verifiedBy: integer("verified_by"), // admin user id
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  expiryDate: timestamp("expiry_date"),
});

// Cards table for credit/debit card management
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  cardNumber: text("card_number").notNull(), // Store masked (last 4 digits)
  cardHolderName: text("card_holder_name").notNull(),
  cardType: text("card_type").notNull(), // 'credit', 'debit', 'platinum', 'business'
  cardName: text("card_name").notNull(), // 'World Bank Platinum', etc.
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv"), // Encrypted in production
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }),
  availableCredit: decimal("available_credit", { precision: 15, scale: 2 }),
  isLocked: boolean("is_locked").default(false),
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false),
  dailyLimit: decimal("daily_limit", { precision: 15, scale: 2 }).default("5000"),
  monthlySpending: decimal("monthly_spending", { precision: 15, scale: 2 }).default("0"),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investment portfolios
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  symbol: text("symbol").notNull(), // Stock ticker like 'AAPL', 'MSFT'
  name: text("name").notNull(), // Company name
  assetType: text("asset_type").notNull(), // 'stock', 'bond', 'etf', 'crypto', 'mutual_fund'
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  gainLoss: decimal("gain_loss", { precision: 15, scale: 2 }).default("0"),
  gainLossPercent: decimal("gain_loss_percent", { precision: 10, scale: 4 }).default("0"),
  purchaseDate: timestamp("purchase_date").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for real-time chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull(), // 'customer', 'admin', 'support'
  recipientId: integer("recipient_id"),
  message: text("message").notNull(),
  conversationId: text("conversation_id"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alerts/notifications table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'transaction', 'security', 'account', 'promotion'
  category: text("category"),
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  actionUrl: text("action_url"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

// Account statements
export const statements = pgTable("statements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountId: integer("account_id").notNull(),
  statementPeriod: text("statement_period").notNull(), // 'December 2024'
  statementType: text("statement_type").notNull(), // 'Monthly Statement', 'Quarterly Report'
  fileSize: text("file_size"), // '2.4 MB'
  documentUrl: text("document_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank branches
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  branchName: text("branch_name").notNull(),
  branchCode: text("branch_code").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  postalCode: text("postal_code"),
  phone: text("phone").notNull(),
  email: text("email"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  openingHours: text("opening_hours"), // JSON string with daily hours
  services: text("services").array(), // ['ATM', 'Teller', 'Safe Deposit', 'Financial Advisory']
  amenities: text("amenities").array(), // ['Parking', 'Wheelchair Accessible', 'WiFi']
  isActive: boolean("is_active").default(true),
  managerName: text("manager_name"),
  managerEmail: text("manager_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ATMs
export const atms = pgTable("atms", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id"), // Optional - can be standalone
  location: text("location").notNull(), // 'Starbucks - 5th Ave'
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull(),
  postalCode: text("postal_code"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  features: text("features").array(), // ['24/7', 'Deposit', 'Multiple ATMs']
  isOperational: boolean("is_operational").default(true),
  lastServiceDate: timestamp("last_service_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange rates
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  targetCurrency: text("target_currency").notNull(),
  rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
  buyRate: decimal("buy_rate", { precision: 18, scale: 8 }),
  sellRate: decimal("sell_rate", { precision: 18, scale: 8 }),
  provider: text("provider"), // 'ECB', 'OpenExchangeRates', etc.
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Market rates for investments
export const marketRates = pgTable("market_rates", {
  id: serial("id").primaryKey(),
  marketType: text("market_type").notNull(), // 'stocks', 'bonds', 'crypto', 'forex'
  symbol: text("symbol"), // Optional ticker symbol
  currentValue: decimal("current_value", { precision: 18, scale: 8 }).notNull(),
  changePercent: decimal("change_percent", { precision: 10, scale: 4 }).notNull(),
  changeValue: decimal("change_value", { precision: 18, scale: 8 }),
  trending: text("trending"), // 'up', 'down', 'neutral'
  volume: decimal("volume", { precision: 20, scale: 2 }),
  marketCap: decimal("market_cap", { precision: 20, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertStatementSchema = createInsertSchema(statements).omit({
  id: true,
  generatedAt: true,
  createdAt: true,
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAtmSchema = createInsertSchema(atms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertMarketRateSchema = createInsertSchema(marketRates).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertStatement = z.infer<typeof insertStatementSchema>;
export type Statement = typeof statements.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertAtm = z.infer<typeof insertAtmSchema>;
export type Atm = typeof atms.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertMarketRate = z.infer<typeof insertMarketRateSchema>;
export type MarketRate = typeof marketRates.$inferSelect;
