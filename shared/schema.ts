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