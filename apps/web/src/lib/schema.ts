// Re-export shared schema types so all code uses a single source of truth.
// This file exists for backward compatibility with imports from "@/lib/schema".
export type {
  User,
  Account,
  Transaction,
  Card,
  Investment,
  Message,
  Alert,
  AdminAction,
  SupportTicket,
  InsertUser,
  InsertAccount,
  InsertTransaction,
  InsertCard,
} from "@packages/shared/schema";
