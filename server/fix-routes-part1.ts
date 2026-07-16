import type { User, InsertUser, InsertTransaction } from '@shared/schema';
import { generateAccountNumber, generateTransferPin, generateTransactionId, generateReferenceNumber } from './crypto-utils';
import { validateId, validateAmount } from './validators';
import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage-factory';
import { setupTransferRoutes } from './routes-transfer';
import { log } from './vite';
import { config, logConfiguration } from './config';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase-public-storage';
import { requireAuth, requireAdmin, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { authRateLimiter, registrationRateLimiter, transactionRateLimiter, generalRateLimiter } from './rate-limiter';
import { validateRequest, registrationSchema, approvalSchema, balanceUpdateSchema, pinChangeSchema } from './validation-schemas';
import { BankingTransaction, atomicBalanceUpdate, atomicTransfer } from './transaction-wrapper';
import { errorHandler, notFoundHandler, asyncHandler, createApiError } from './error-handler';
import { runStartupChecks } from './startup-checks';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

type AsyncRequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<unknown> | unknown;
function wrapAsync(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
}

// SECURITY: Strip sensitive fields from user objects before returning to client
function sanitizeUser(user: Record<string, unknown> | object | null | undefined): Record<string, unknown> {
  if (!user) return {};
  const u = user as Record<string, unknown>;
  const { password, transferPin, transfer_pin, password_hash, idNumber, identification_number, ...safe } = u;
  return safe;
}

function sanitizeUsers(users: Record<string, unknown>[] | object[] | null | undefined): Record<string, unknown>[] {
  return (users || []).map(u => sanitizeUser(u));
}

// SECURITY: Validate password complexity (min 8 chars, upper, lower, number, special)
function validatePasswordComplexity(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

// SECURITY: Sanitize user input to prevent XSS in stored fields
function sanitizeInput(str: string): string {
  return str.replace(/[<>]/g, '').trim().slice(0, 500);
}

// SECURITY: Sanitize CSV cells to prevent formula injection
function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
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

export async function registerRoutes(app: Express) {
  // Typed wrapper that accepts async route handlers returning Promise<void>
  const api = {
    get:    (p: string, ...h: unknown[]) => app.get(p, ...(h as Parameters<typeof app.get>[1][])),
    post:   (p: string, ...h: unknown[]) => app.post(p, ...(h as Parameters<typeof app.post>[1][])),
    put:    (p: string, ...h: unknown[]) => app.put(p, ...(h as Parameters<typeof app.put>[1][])),
    patch:  (p: string, ...h: unknown[]) => app.patch(p, ...(h as Parameters<typeof app.patch>[1][])),
    delete: (p: string, ...h: unknown[]) => app.delete(p, ...(h as Parameters<typeof app.delete>[1][])),
  } as const;
  // Register transfer routes first (they take priority for /api/transfers endpoints)
  setupTransferRoutes(app as Express);

  // ==================== HEALTH CHECK ====================
  api.get('/api/health', (req: Request, res: Response) => {
    try {
      return res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Health check failed' });
    }
  });

  // ==================== USER PROFILE ENDPOINTS ====================
  api.get('/api/user', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '' as string);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const userData = sanitizeUser(user as unknown as Record<string, unknown>) as Record<string, unknown>;
      const { data: account } = await supabase.from('accounts').select('balance').eq('user_id', userData.id).eq('status', 'active').limit(1).single();
      if (account) userData.balance = (account as Record<string, unknown>).balance;
      return res.json(userData);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch user profile' }); }
  }));

  api.patch('/api/user', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '' as string);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { role, isVerified, isActive, id, ...allowedUpdates } = req.body;
      const updatedUser = await storage.updateUser(user.id, allowedUpdates);
      return res.json(sanitizeUser(updatedUser as unknown as Record<string, unknown>));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to update user profile' }); }
  }));

  api.get('/api/user/accounts', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch accounts' }); }
  }));

  api.get('/api/accounts', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch accounts' }); }
  }));

  api.get('/api/transactions', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch transactions' }); }
  }));

  api.get('/api/transactions/:id', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const allTransactions = await storage.getAllTransactions();
      const transaction = (allTransactions as unknown as Transaction[]).find((t: Transaction) => String(t.id) === String(id));
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      // SECURITY: IDOR protection - verify the transaction belongs to the authenticated user
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const txUserId = (transaction as unknown as Record<string, unknown>).fromUserId ?? (transaction as unknown as Record<string, unknown>).userId;
      let isOwner = false;
      if (txUserId && String(txUserId) === String(user.id)) {
        isOwner = true;
      } else {
        // Verify via account ownership
        const accounts = await storage.getUserAccounts(user.id);
        const accountIds = new Set((accounts as unknown as Record<string, unknown>[]).map((a: Record<string, unknown>) => String(a.id)));
        const fromAcc = (transaction as unknown as Record<string, unknown>).fromAccountId;
        const toAcc = (transaction as unknown as Record<string, unknown>).toAccountId;
        if ((fromAcc && accountIds.has(String(fromAcc))) || (toAcc && accountIds.has(String(toAcc)))) {
          isOwner = true;
        }
      }
      if (!isOwner && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      return res.json(transaction);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch transaction' }); }
  }));

  // ==================== PIN MANAGEMENT ====================
  api.post('/api/set-pin', wrapAsync(requireAuth), wrapAsync(authRateLimiter), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin || String(pin).length !== 4) return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const pinHash = await bcrypt.hash(String(pin), 12);
      await storage.updateUser(user.id, { transferPin: pinHash });
      return res.json({ success: true, message: 'PIN set successfully' });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to set PIN' }); }
  }));

  api.post('/api/verify-pin', wrapAsync(requireAuth), wrapAsync(authRateLimiter), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pin } = req.body;
      const email = req.user?.email;
      if (!email || !pin) return res.status(400).json({ error: 'Email and PIN required' });
      const user = await storage.getUserByEmail(email);
      if (!user || !user.transferPin) return res.status(401).json({ success: false, message: 'PIN not set on account' });
      const pinMatch = await bcrypt.compare(String(pin).trim(), String(user.transferPin).trim());
      if (!pinMatch) return res.status(401).json({ success: false, message: 'Invalid PIN' });
      return res.json({ success: true, message: 'PIN verified' });
    } catch (error: unknown) { return res.status(500).json({ success: false, message: 'PIN verification failed' }); }
  }));

  api.post('/api/change-pin', wrapAsync(requireAuth), wrapAsync(authRateLimiter), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to change PIN' }); }
  }));

  // ==================== ADMIN ENDPOINTS ====================
  api.get('/api/exchange-rates', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rates = await storage.getExchangeRates();
      const ratesObject: Record<string, number> = {};
      rates.forEach((rate: Record<string, string>) => { ratesObject[rate.targetCurrency || rate.target_currency] = parseFloat(rate.rate); });
      return res.json(ratesObject);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch exchange rates' }); }
  });

  api.get('/api/admin/customers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      const customerList = customers.filter((user: User) => user.role !== 'admin' || req.query.includeAdmins === 'true').map((user: User) => ({ ...sanitizeUser(user), fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown', balance: parseFloat(String(user.balance || '0')) || 0 }));
      return res.json(customerList);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch customers' }); }
  });

  api.put('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      // SECURITY: Whitelist allowed fields to prevent mass-assignment of sensitive props (role, password, etc.)
      const allowedFields = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'profession', 'address', 'city', 'country', 'postalCode', 'dateOfBirth', 'nationality', 'avatarUrl', 'annualIncome'];
      const updates: Record<string, unknown> = {};
      for (const key of Object.keys(req.body || {})) {
        if (allowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) return res.status(404).json({ error: 'Customer not found' });
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) { await storage.createAdminAction({ adminId: admin.id, action: 'update_customer', targetType: 'user', targetId: id, details: updates }); }
      return res.json(sanitizeUser(updatedUser));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to update customer' }); }
  });

  api.post('/api/admin/customers/:id/verify', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { verified = true, active } = req.body;
      const updates: Record<string, unknown> = { isVerified: verified };
      if (typeof active !== 'undefined') updates.isActive = active;
      else if (verified) updates.isActive = true;
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) return res.status(404).json({ error: 'Customer not found' });
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) { await storage.createAdminAction({ adminId: admin.id, action: verified ? 'verify_customer' : 'unverify_customer', targetType: 'user', targetId: id, details: { verified, active: updates.isActive } }); }
      return res.json({ success: true, user: updatedUser, message: verified ? 'Customer verified' : 'Customer unverified' });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to update customer verification' }); }
  });

  api.get('/api/admin/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const customers = allUsers.filter((u: User) => u.role === 'customer');
      const allTransactions = await storage.getAllTransactions();
      const pendingTransactions = allTransactions.filter((t: { status?: string }) => t.status === 'pending');
      const tickets = await storage.getSupportTickets();
      const openTickets = tickets.filter((t: { status?: string }) => t.status !== 'resolved' && t.status !== 'closed');
      return res.json({ totalCustomers: customers.length, activeCustomers: customers.filter((u: User) => u.isActive).length, pendingApprovals: customers.filter((u: User) => !u.isActive).length, totalTransactions: allTransactions.length, pendingTransactions: pendingTransactions.length, openSupportTickets: openTickets.length });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch stats' }); }
  });

  api.patch('/api/admin/support-tickets/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      // SECURITY: Whitelist allowed fields to prevent mass-assignment
      const allowedFields = ['status', 'priority', 'assignedTo', 'notes', 'response'];
      const updates: Record<string, unknown> = {};
      for (const key of Object.keys(req.body || {})) {
        if (allowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      const updatedTicket = await storage.updateSupportTicket(id, updates);
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin && updatedTicket) { await storage.createAdminAction({ adminId: admin.id, action: 'update_support_ticket', targetType: 'support_ticket', targetId: id, details: { ticketId: id, updates } }); }
      return res.json(updatedTicket);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to update support ticket' }); }
  });

  api.post('/api/admin/tickets/:id/respond', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { response: adminResponse, notes, status } = req.body;
      const responseText = adminResponse || notes || '';
      const supabase = getAdminClient();
      const { data: ticket } = await supabase.from('support_tickets').select('admin_notes').eq('id', id).single();
      const existingNotes = (ticket as Record<string, unknown>)?.admin_notes || '';
      const newNotes = existingNotes ? `${existingNotes}\n---\n[${new Date().toISOString()}] ${responseText}` : `[${new Date().toISOString()}] ${responseText}`;
      await supabase.from('support_tickets').update({ admin_notes: newNotes, status: status || 'responded', updated_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('admin_actions').insert({ admin_id: req.user?.id || '' as string, action_type: 'ticket_respond', target_id: id, description: `Responded to support ticket ${id}`, metadata: { response: responseText } });
      return res.json({ success: true, message: 'Reply sent successfully' });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to respond to ticket' }); }
  });

  // ==================== AUTH ENDPOINTS ====================
  api.post('/api/auth/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {