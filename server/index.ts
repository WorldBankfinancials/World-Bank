import express, { type Request, Response, NextFunction, type Express } from "express";
import crypto from "crypto";
import { type Server, createServer } from "http";
import { storage } from "./storage-factory";
import { setupTransferRoutes } from "./routes-transfer";
import { log } from "./vite";
import { config, logConfiguration } from "./config";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase-public-storage";
import { requireAuth, requireAdmin, AuthenticatedRequest, getAdminClient } from "./auth-middleware";
import { authRateLimiter, registrationRateLimiter, transactionRateLimiter, generalRateLimiter } from "./rate-limiter";
import { validateRequest, registrationSchema, approvalSchema, balanceUpdateSchema, pinChangeSchema } from "./validation-schemas";
import { BankingTransaction, atomicBalanceUpdate, atomicTransfer } from "./transaction-wrapper";
import { errorHandler, notFoundHandler, asyncHandler, createApiError } from "./error-handler";
import { runStartupChecks } from "./startup-checks";
import * as bcrypt from "bcryptjs";

// SECURITY: Strip sensitive fields from user objects before returning to client
function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  if (!user) return user;
  const { password, transferPin, transfer_pin, password_hash, idNumber, identification_number, ...safe } = user;
  return safe;
}

function sanitizeUsers(users: Record<string, unknown>[]): Record<string, unknown>[] {
  return (users || []).map(sanitizeUser);
}

// Type definitions for transactions
interface Transaction {
  id: string | number;
  createdAt: string | Date | null;
  status: string | null;
  amount: string | number;
  type: string;
  description?: string | null;
  recipientName?: string | null;
  recipientAccount?: string | null;
  referenceNumber?: string | null;
  fromAccountId?: string | number | null;
  toAccountId?: string | number | null;
  fromUserId?: string | number | null;
  currency?: string | null;
  recipientCountry?: string | null;
  updatedAt?: string | Date | null;
}

import { randomUUID } from 'crypto';

// Typed wrapper that accepts async route handlers returning Promise<void> | Promise<Response> | void
const wrap = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<unknown> | unknown) =>
  (req: Request, res: Response, next: NextFunction): void => { Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next); };

export async function registerRoutes(app: Express) {
  // Register transfer routes first (they take priority for /api/transfers endpoints)
  setupTransferRoutes(app as Express);

  // ==================== HEALTH CHECK ====================
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      return res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Health check failed' });
    }
  });

  // ==================== USER PROFILE ENDPOINTS ====================

  // GET /api/user - Get current user profile
  app.get('/api/user', wrap(requireAuth), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const userData = sanitizeUser(user as unknown as Record<string, unknown>) as Record<string, unknown>;
      const { data: account } = await supabase.from('accounts').select('balance').eq('user_id', userData.id).eq('status', 'active').limit(1).single();
      if (account) userData.balance = (account as Record<string, unknown>).balance;
      return res.json(userData);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }));

  // PATCH /api/user - Update user profile
  app.patch('/api/user', wrap(requireAuth), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { role, isVerified, isActive, id, ...allowedUpdates } = req.body;
      const updatedUser = await storage.updateUser(user.id, allowedUpdates);
      return res.json(sanitizeUser(updatedUser as unknown as Record<string, unknown>));
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update user profile' });
    }
  }));

  // GET /api/user/accounts - Get user accounts
  app.get('/api/user/accounts', wrap(requireAuth), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }));

  // GET /api/accounts - Get user accounts (alias)
  app.get('/api/accounts', wrap(requireAuth), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }));

  // GET /api/transactions - Get user transactions
  app.get('/api/transactions', wrap(requireAuth), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        allTxns.push(...(txns as unknown as Transaction[]));
      }
      allTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }));

  // GET /api/transactions/:id - Get single transaction
  app.get('/api/transactions/:id', wrap(requireAuth), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const allTransactions = await storage.getAllTransactions();
      const transaction = (allTransactions as unknown as Transaction[]).find((t: Transaction) => String(t.id) === String(id));
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      return res.json(transaction);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  }));

  // ==================== PIN MANAGEMENT ====================

  app.post('/api/set-pin', wrap(requireAuth), wrap(authRateLimiter), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin || String(pin).length !== 4) return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const pinHash = await bcrypt.hash(String(pin), 12);
      await storage.updateUser(user.id, { transferPin: pinHash });
      return res.json({ success: true, message: 'PIN set successfully' });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to set PIN' });
    }
  }));

  app.post('/api/verify-pin', wrap(requireAuth), wrap(authRateLimiter), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pin } = req.body;
      const email = req.user?.email;
      if (!email || !pin) return res.status(400).json({ error: 'Email and PIN required' });
      const user = await storage.getUserByEmail(email);
      if (!user || !user.transferPin) return res.status(401).json({ success: false, message: 'PIN not set on account' });
      const pinMatch = await bcrypt.compare(String(pin).trim(), String(user.transferPin).trim());
      if (!pinMatch) return res.status(401).json({ success: false, message: 'Invalid PIN' });
      return res.json({ success: true, message: 'PIN verified' });
    } catch (error: unknown) {
      return res.status(500).json({ success: false, message: 'PIN verification failed' });
    }
  }));

  app.post('/api/change-pin', wrap(requireAuth), wrap(authRateLimiter), wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPin, newPin } = req.body;
      if (!currentPin || !newPin || String(newPin).length !== 4) return res.status(400).json({ error: 'Current PIN and new PIN (4 digits) required' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user || !user.transferPin) return res.status(401).json({ error: 'PIN not set on account' });
      const pinMatch = await bcrypt.compare(String(currentPin).trim(), String(user.transferPin).trim());
      if (!pinMatch) return res.status(401).json({ error: 'Current PIN is incorrect' });
      const pinHash = await bcrypt.hash(String(newPin), 12);
      await storage.updateUser(user.id, { transferPin: pinHash });
      return res.json({ success: true, message: 'PIN changed successfully' });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to change PIN' });
    }
  }));

  // Return server
  const httpServer = createServer(app);
  return httpServer;
}
