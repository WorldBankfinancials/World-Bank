import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - matches bank_users in database
export const users = pgTable("bank_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  accountNumber: text("account_number"),
  accountId: text("account_id"),
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
  role: text("role"),
  isVerified: boolean("is_verified"),
  isOnline: boolean("is_online"),
  isActive: boolean("is_active"),
  avatarUrl: text("avatar_url"),
  balance: decimal("balance"),
  supabaseUserId: text("supabase_user_id"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  lastLogin: timestamp("last_login"),
  createdByAdmin: text("created_by_admin"),
  modifiedByAdmin: text("modified_by_admin"),
  adminNotes: text("admin_notes"),
});

// Accounts table - matches bank_accounts in database
export const accounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountNumber: text("account_number").notNull(),
  accountType: text("account_type").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  accountName: text("account_name"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  minimumBalance: decimal("minimum_balance", { precision: 15, scale: 2 }),
});

// Transactions table - matches transactions in database  
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id"),
  fromUserId: integer("from_user_id"),
  toUserId: integer("to_user_id"),
  fromAccountId: integer("from_account_id"),
  toAccountId: integer("to_account_id"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency"),
  transactionType: text("transaction_type"),
  status: text("status"),
  description: text("description"),
  recipientName: text("recipient_name"),
  recipientAccount: text("recipient_account"),
  referenceNumber: text("reference_number"),
  fee: decimal("fee", { precision: 15, scale: 2 }),
  exchangeRate: decimal("exchange_rate", { precision: 15, scale: 6 }),
  countryCode: text("country_code"),
  bankName: text("bank_name"),
  swiftCode: text("swift_code"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Admin actions table for audit trail
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  actionType: text("action_type").notNull(),
  targetId: text("target_id").notNull(),
  targetType: text("target_type").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer support tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"),
  status: text("status").default("open"),
  category: text("category"),
  assignedTo: integer("assigned_to"),
  adminNotes: text("admin_notes"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  status: text("status").default("pending"),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  cardNumber: text("card_number").notNull().unique(),
  cardType: text("card_type").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  cardholderName: text("cardholder_name").notNull(),
  isActive: boolean("is_active").default(true),
  dailyLimit: decimal("daily_limit", { precision: 15, scale: 2 }),
  monthlyLimit: decimal("monthly_limit", { precision: 15, scale: 2 }),
  currentDailySpend: decimal("current_daily_spend", { precision: 15, scale: 2 }).default("0"),
  currentMonthlySpend: decimal("current_monthly_spend", { precision: 15, scale: 2 }).default("0"),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  investmentType: text("investment_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }),
  returnRate: decimal("return_rate", { precision: 5, scale: 2 }),
  maturityDate: timestamp("maturity_date"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = typeof adminActions.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  resolvedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  verifiedAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});
