import type { User, InsertUser, InsertTransaction, InsertAccount } from '@shared/schema';
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

function sanitizeUser(user: Record<string, unknown> | object | null | undefined): Record<string, unknown> {
  if (!user) return {};
  const u = user as Record<string, unknown>;
  const { password, transferPin, transfer_pin, password_hash, idNumber, identification_number, ...safe } = u;
  return safe;
}

function sanitizeUsers(users: Record<string, unknown>[] | object[] | null | undefined): Record<string, unknown>[] {
  return (users || []).map(u => sanitizeUser(u));
}

function validatePasswordComplexity(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function sanitizeInput(str: string): string {
  return str.replace(/[<>]/g, '').trim().slice(0, 500);
}

function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
}

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
  const api = {
    get:    (p: string, ...h: unknown[]) => app.get(p, ...(h as Parameters<typeof app.get>[1][])),
    post:   (p: string, ...h: unknown[]) => app.post(p, ...(h as Parameters<typeof app.post>[1][])),
    put:    (p: string, ...h: unknown[]) => app.put(p, ...(h as Parameters<typeof app.put>[1][])),
    patch:  (p: string, ...h: unknown[]) => app.patch(p, ...(h as Parameters<typeof app.patch>[1][])),
    delete: (p: string, ...h: unknown[]) => app.delete(p, ...(h as Parameters<typeof app.delete>[1][])),
  } as const;
  setupTransferRoutes(app as Express);

  api.get('/api/health', (req: Request, res: Response) => {
    try {
      return res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Health check failed' });
    }
  });

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

  api.post('/api/user/profile', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to get user profile' }); }
  }));

  api.post('/api/accounts/user', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ message: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to get user accounts' }); }
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
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const txUserId = (transaction as unknown as Record<string, unknown>).fromUserId ?? (transaction as unknown as Record<string, unknown>).userId;
      let isOwner = false;
      if (txUserId && String(txUserId) === String(user.id)) {
        isOwner = true;
      } else {
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

  api.get('/api/exchange-rates', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rates = await storage.getExchangeRates();
      const ratesObject: Record<string, number> = {};
      rates.forEach((rate: Record<string, string>) => { ratesObject[rate.toCurrency || rate.to_currency] = parseFloat(rate.rate); });
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
      await supabase.from('admin_actions').insert({ admin_id: req.user?.id || '' as string, action: 'ticket_respond', target_id: id, details: { description: `Responded to support ticket ${id}`, response: responseText } });
      return res.json({ success: true, message: 'Reply sent successfully' });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to respond to ticket' }); }
  });

  api.post('/api/auth/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: 'Invalid credentials' });
      if (!data.session || !data.user) return res.status(401).json({ error: 'Invalid credentials' });
      const supabaseUser = data.user;
      let dbUser = await storage.getUserByEmail(email);
      if (!dbUser) {
        dbUser = await storage.createUser({ username: email.split('@')[0], email, password: randomUUID(), firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0], lastName: supabaseUser.user_metadata?.last_name || 'User', phone: supabaseUser.user_metadata?.phone || '', profession: 'Not provided', accountNumber: `${generateAccountNumber()}`, accountId: randomUUID(), balance: '0', isActive: false, isVerified: false, transferPin: supabaseUser.user_metadata?.transfer_pin || '', role: supabaseUser.app_metadata?.role || 'customer' } as unknown as InsertUser);
        await storage.createAccount({ userId: dbUser.id, accountNumber: `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'active' });
      } else {
        const userAccounts = await storage.getUserAccounts(dbUser.id);
        if (userAccounts.length === 0) { await storage.createAccount({ userId: dbUser.id, accountNumber: `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'active' }); }
        const supabaseRole = supabaseUser.app_metadata?.role || 'customer';
        const updates: Record<string, unknown> = { lastLogin: new Date() };
        if (dbUser.role !== supabaseRole) updates.role = supabaseRole;
        await storage.updateUser(dbUser.id, updates);
        const refreshed = await storage.getUserByEmail(email);
        if (refreshed) dbUser = refreshed;
      }
      const accessToken = data.session?.access_token;
      if (!accessToken) return res.status(500).json({ error: 'Failed to generate authentication token' });
      return res.json({ token: accessToken, refreshToken: data.session?.refresh_token, user: sanitizeUser(dbUser as unknown as Record<string, unknown>) });
    } catch (error: unknown) { return res.status(500).json({ error: 'Login failed', details: 'An internal error occurred' }); }
  });

  api.post('/api/auth/logout', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.replace('Bearer ', '');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { refreshToken } = req.body || {};
      if (refreshToken) { await supabaseAdmin.auth.admin.signOut(refreshToken).catch((e: unknown) => console.error('Token cleanup error:', e)); }
      if (accessToken) { await supabaseAdmin.auth.admin.signOut(accessToken).catch((e: unknown) => console.error('Token cleanup error:', e)); }
      return res.json({ message: 'Logged out successfully', status: 'ok' });
    } catch (error: unknown) { return res.json({ message: 'Logged out successfully', status: 'ok' }); }
  });

  api.post('/api/auth/refresh', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session) return res.status(401).json({ error: 'Invalid refresh token' });
      return res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: { id: data.user?.id, email: data.user?.email } });
    } catch (error) { return res.status(500).json({ error: 'Token refresh failed' }); }
  });

  api.post('/api/auth/change-password', requireAuth, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a number' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email: req.user?.email || '' as string, password: currentPassword });
      if (signInError) return res.status(401).json({ error: 'Current password is incorrect' });
      const { error: updateError } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: 'Invalid admin credentials' });
      const role = data.user.app_metadata?.role || 'customer';
      if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
      const accessToken = data.session?.access_token;
      if (!accessToken) return res.status(500).json({ error: 'Failed to generate authentication token' });
      return res.json({ token: accessToken, refreshToken: data.session?.refresh_token, user: { id: data.user.id, email: data.user.email, role } });
    } catch (error: unknown) { return res.status(500).json({ error: 'Login failed' }); }
  });

  api.get('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id); allTxns.push(...(txns as unknown as Transaction[])); }
      const paymentRequests = allTxns.filter((t: Transaction) => t.type === 'payment_request' || (t.description?.toLowerCase()?.includes('payment request')));
      return res.json(paymentRequests);
    } catch (error: unknown) { return res.json([]); }
  });

  api.post('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency = 'USD', description, recipientName } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
      const reference = `PR-${Date.now()}-${randomUUID().substring(0, 8).toUpperCase()}`;
      const transaction = await storage.createTransaction({ fromUserId: req.user?.id || '' as string, amount: String(amount), currency, transactionType: 'payment_request', status: 'pending', referenceNumber: reference, description: description || `Payment request to ${recipientName || 'recipient'}`, recipientName: recipientName || '' } as unknown as InsertTransaction);
      return res.json({ success: true, reference, transaction });
    } catch (error) { return res.status(500).json({ error: 'Failed to create payment request' }); }
  });

  api.post('/api/payment-requests/:id/pay', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supabase = getAdminClient();
      const { data: request } = await supabase.from('transactions').select('*').eq('id', req.params.id).eq('transaction_type', 'payment_request').single();
      if (!request) return res.status(404).json({ error: 'Payment request not found' });
      if ((request as Record<string, unknown>).status !== 'pending') return res.status(400).json({ error: 'Payment request is no longer pending' });
      const amount = parseFloat(String((request as Record<string, unknown>).amount));
      const { data: userAccount } = await supabase.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -amount, `Payment for request ${req.params.id}`);
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' });
      }
      const newBalance = balanceResult.newBalance || '0';
      await supabase.from('transactions').update({ status: 'completed', completed_at: new Date().toISOString(), from_user_id: req.user?.id || '' as string }).eq('id', req.params.id);
      await supabase.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: (request as Record<string, unknown>).to_user_id, amount: amount.toFixed(2), currency: 'USD', transaction_type: 'payment', category: 'payment', status: 'completed', description: `Payment for request ${req.params.id}`, reference_number: `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      await supabase.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'Payment Sent', message: `Payment of ${amount.toFixed(2)} has been sent.`, type: 'success', priority: 'normal', is_read: false });
      return res.json({ success: true, newBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/add-funds', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { method, amount } = req.body;
      if (!method || !amount || isNaN(parseFloat(String(amount))) || parseFloat(String(amount)) <= 0) return res.status(400).json({ error: 'Method and valid amount are required' });
      const sanitizedMethod = sanitizeInput(String(method));
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const parsedAmount = parseFloat(String(amount));
      try {
        const { data: account } = await supabase.from('accounts').select('id, balance').eq('user_id', user.id).eq('status', 'active').limit(1).single();
        if (!account) return res.status(404).json({ error: 'No active account found' });
        const accountId = (account as Record<string, unknown>).id as string;
        const balanceResult = await atomicBalanceUpdate(accountId, parsedAmount, `Funds added via ${sanitizedMethod}`);
        if (!balanceResult.success) {
          return res.status(500).json({ error: balanceResult.error || 'Failed to update account balance' });
        }
        const newBalance = balanceResult.newBalance || '0';
        const transaction = await storage.createTransaction({ fromAccountId: accounts[0].id, type: 'deposit', amount: parsedAmount.toString(), description: `Funds added via ${sanitizedMethod}`, status: 'completed', currency: 'USD', referenceNumber: `DEP-${Date.now()}`, createdAt: new Date() } as unknown as InsertTransaction);
        await supabase.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'Funds Added', message: `${parsedAmount.toFixed(2)} has been added to your account via ${sanitizedMethod}.`, type: 'success', priority: 'normal', is_read: false });
        return res.json({ success: true, transaction, amount: parsedAmount, newBalance });
      } catch (error) { return res.status(500).json({ error: 'Failed to complete deposit' }); }
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to add funds' }); }
  });

  api.get('/api/transactions/recent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id); allTxns.push(...(txns as unknown as Transaction[])); }
      allTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns.slice(0, 10));
    } catch (error: unknown) { return res.json([]); }
  });

  api.get('/api/currencies', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ code: 'USD', name: 'US Dollar', symbol: '$', flag: 'US' }, { code: 'EUR', name: 'Euro', symbol: 'EUR', flag: 'EU' }, { code: 'GBP', name: 'British Pound', symbol: 'GBP', flag: 'UK' }, { code: 'JPY', name: 'Japanese Yen', symbol: 'JPY', flag: 'JP' }, { code: 'CNY', name: 'Chinese Yuan', symbol: 'CNY', flag: 'CN' }, { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: 'CA' }, { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: 'AU' }, { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: 'CH' }, { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: 'SG' }, { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: 'HK' }]);
  });

  api.get('/api/admin/customers-list', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      const customerList = customers.filter((user: User) => user.role === 'customer');
      return res.json(customerList);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch customers list' }); }
  });

  api.get('/api/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(sanitizeUsers(users));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch users' }); }
  });

  api.get('/api/card-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id, 20); allTxns.push(...(txns as unknown as Transaction[])); }
      return res.json(allTxns.slice(0, 30));
    } catch (error: unknown) { return res.json([]); }
  });

  api.get('/api/wallet-balance', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json({ balance: 0, currency: 'USD', available: 0, pending: 0 });
      const accountBalance = parseFloat(String(accounts[0].balance || '0'));
      return res.json({ balance: accountBalance, currency: 'USD', available: accountBalance, pending: 0 });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch wallet balance' }); }
  });

  api.get('/api/wallet-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      return res.json(txns);
    } catch (error: unknown) { return res.json([]); }
  });

  api.get('/api/mobile-payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      const mobilePayments = (txns as unknown as Transaction[]).filter((t: Transaction) => t.type === 'mobile_pay' || (typeof t.description === 'string' && t.description.toLowerCase().includes('mobile')));
      return res.json(mobilePayments);
    } catch (error: unknown) { return res.json([]); }
  });

  api.get('/api/mobile-pay/merchants', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ id: 1, name: 'Apple Pay', logo: 'A', category: 'Digital Wallet' }, { id: 2, name: 'Google Pay', logo: 'G', category: 'Digital Wallet' }, { id: 3, name: 'Samsung Pay', logo: 'S', category: 'Digital Wallet' }, { id: 4, name: 'PayPal', logo: 'P', category: 'Online Payment' }, { id: 5, name: 'Venmo', logo: 'V', category: 'P2P Transfer' }, { id: 6, name: 'Cash App', logo: 'C', category: 'P2P Transfer' }, { id: 7, name: 'Zelle', logo: 'Z', category: 'Bank Transfer' }]);
  });

  api.get('/api/user/activity-log', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      const recentActivity: Record<string, unknown>[] = [];
      if (accounts && accounts.length > 0) {
        const txns = await storage.getAccountTransactions(accounts[0].id, 10);
        (txns as unknown as Transaction[]).forEach((t: Transaction) => { recentActivity.push({ id: t.id, action: `${t.type || 'Transaction'} of ${t.amount}`, timestamp: t.createdAt, ipAddress: '***.***.*.***', device: 'Web Browser', status: t.status || 'completed' }); });
      }
      recentActivity.unshift({ id: 'login-recent', action: 'Account login', timestamp: user.lastLogin || new Date().toISOString(), ipAddress: req.ip || '***', device: req.get('user-agent')?.substring(0, 30) || 'Unknown', status: 'success' });
      return res.json(recentActivity);
    } catch (error: unknown) { return res.json([]); }
  });

  api.get('/api/user/trusted-devices', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ id: 1, name: 'Current Browser', type: 'web', lastUsed: new Date().toISOString(), trusted: true, current: true }]);
  });

  api.get('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      return res.json((allTransactions as unknown as Transaction[]).map((t: Transaction) => ({ id: t.id, amount: t.amount, currency: t.currency || 'USD', status: t.status, type: t.type, description: t.description, recipientName: t.recipientName, createdAt: t.createdAt })));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch transaction routes' }); }
  });

  api.patch('/api/admin/transaction-routes/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { status, notes } = req.body;
      const admin = await storage.getUserByEmail(req.user?.email || '');
      const adminId = admin?.id || '0' as string;
      const transaction = await storage.updateTransactionStatus(id, status, adminId, notes);
      return res.json({ success: true, transaction });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to update transaction route' }); }
  });

  api.post('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, amount, description, type, status } = req.body;
      const transaction = await storage.createTransaction({ fromAccountId: accountId, type: type || 'transfer', amount: String(amount), description, status: status || 'pending', createdAt: new Date() } as unknown as InsertTransaction);
      return res.json({ success: true, transaction });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to create transaction route' }); }
  });

  api.get('/api/recent-contacts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('recent_contacts').select('*').eq('user_id', req.user?.id || '' as string).order('updated_at', { ascending: false }).limit(10);
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/loans', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('loans').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/apply', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { loanType, principalAmount, interestRate, termMonths, transferPin } = req.body;
      if (!loanType || !principalAmount || !interestRate || !termMonths) return res.status(400).json({ error: 'Missing required fields' });
      const principal = Number(principalAmount);
      const rate = Number(interestRate);
      const term = Number(termMonths);
      if (isNaN(principal) || principal <= 0) return res.status(400).json({ error: 'Invalid principal amount' });
      if (isNaN(rate) || rate < 0 || rate > 100) return res.status(400).json({ error: 'Invalid interest rate' });
      if (isNaN(term) || term < 1 || term > 360) return res.status(400).json({ error: 'Invalid term (must be 1-360 months)' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.transferPin) return res.status(400).json({ error: 'PIN not set' });
      const pinMatch = await bcrypt.compare(String(transferPin), user.transferPin);
      if (!pinMatch) return res.status(400).json({ error: 'Invalid PIN' });
      const monthlyPayment = (Number(principalAmount) * (Number(interestRate) / 100 / 12)) / (1 - Math.pow(1 + Number(interestRate) / 100 / 12, -Number(termMonths)));
      const totalInterest = monthlyPayment * Number(termMonths) - Number(principalAmount);
      const totalPayable = Number(principalAmount) + totalInterest;
      const loanNumber = `LN${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('loans').insert({ user_id: req.user?.id || '' as string, loan_number: loanNumber, loan_type: loanType, principal_amount: String(principalAmount), interest_rate: String(interestRate), term_months: termMonths, monthly_payment: monthlyPayment.toFixed(2), remaining_balance: String(principalAmount), total_interest: totalInterest.toFixed(2), total_payable: totalPayable.toFixed(2), status: 'pending' }).select().single();
      if (error) throw error;
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').eq('is_active', true);
      if (admins && admins.length > 0) { const adminAlerts = admins.map((admin: Record<string, unknown>) => ({ user_id: admin.id, title: 'New Loan Application', message: `Loan application for ${principalAmount} from ${req.user?.email} requires review.`, type: 'warning', priority: 'high', is_read: false })); await supabase.from('alerts').insert(adminAlerts); }
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/:id/approve', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: loan, error: loanError } = await supabase.from('loans').select('*').eq('id', req.params.id).single();
      if (loanError || !loan) return res.status(404).json({ error: 'Loan not found' });
      if (loan.status !== 'pending') return res.status(400).json({ error: 'Loan is not in pending status' });
      const { data, error } = await supabase.from('loans').update({ status: 'approved', approved_by: req.user?.id || '' as string, approved_at: new Date().toISOString(), disbursement_date: new Date().toISOString(), maturity_date: new Date(Date.now() + (loan.term_months * 30 * 24 * 60 * 60 * 1000)).toISOString() }).eq('id', req.params.id).select().single();
      if (error) throw error;
      const { data: account } = await supabase.from('accounts').select('id, balance').eq('user_id', loan.user_id).eq('status', 'active').limit(1).single();
      if (account) {
        const accountId = (account as Record<string, unknown>).id as string;
        const principalAmount = parseFloat(String(loan.principal_amount));
        await atomicBalanceUpdate(accountId, principalAmount, `Loan disbursement - ${loan.loan_type} - ${loan.loan_number}`);
        await supabase.from('transactions').insert({ from_account_id: null, to_account_id: (account as Record<string, unknown>).id, from_user_id: null, to_user_id: loan.user_id, amount: principalAmount.toFixed(2), currency: 'USD', transaction_type: 'loan_disbursement', category: 'loan', status: 'completed', description: `Loan disbursement - ${loan.loan_type} - ${loan.loan_number}`, reference_number: `LOAN${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
        await supabase.from('alerts').insert({ user_id: loan.user_id, title: 'Loan Approved', message: `Your ${loan.loan_type} loan of ${principalAmount.toFixed(2)} has been approved and disbursed to your account.`, type: 'success', priority: 'high', is_read: false });
      }
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/:id/reject', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: loan, error: loanError } = await supabase.from('loans').select('status').eq('id', req.params.id).single();
      if (loanError || !loan) return res.status(404).json({ error: 'Loan not found' });
      if (loan.status !== 'pending') return res.status(400).json({ error: 'Loan is not in pending status' });
      const { data, error } = await supabase.from('loans').update({ status: 'rejected' }).eq('id', req.params.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/admin/pending-loans', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('loans').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/create-admin-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) return res.status(400).json({ error: 'Email, password, and fullName are required' });
      if (!validatePasswordComplexity(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' });
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'admin' }, user_metadata: {} });
      if (authError || !authData.user) return res.status(500).json({ error: 'Failed to create admin auth account' });
      const adminPin = generateTransferPin();
      const adminPinHash = await bcrypt.hash(adminPin, 12);
      try {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || 'Admin';
        const adminUser = await storage.createUser({ username: email.split('@')[0] + '_admin', firstName, lastName, email, phone: '+1-000-000-0000', accountNumber: `ADMIN-${generateAccountNumber()}`, accountId: randomUUID(), password: randomUUID(), transferPin: adminPinHash, role: 'admin', isVerified: true, isActive: true, balance: '0', dateOfBirth: '1990-01-01', address: 'World Bank HQ', city: 'Washington', state: 'DC', country: 'United States', postalCode: '20001', profession: 'Administrator', annualIncome: 'N/A', idType: 'Staff ID', idNumber: 'ADMIN-001' } as unknown as InsertUser);
        return res.status(201).json({ success: true, message: 'Admin user created successfully', user: { id: adminUser.id, email: adminUser.email, fullName: `${adminUser.firstName} ${adminUser.lastName}`, role: adminUser.role }, credentials: { email, note: 'Password was provided during creation' } });
      } catch (dbError: unknown) { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); throw dbError; }
    } catch (error: unknown) { return res.status(500).json({ error: 'Admin user creation failed', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/set-user-role', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, email, role } = req.body;
      if (!role || !['admin', 'customer'].includes(role)) return res.status(400).json({ error: 'Role must be "admin" or "customer"' });
      if (!userId && !email) return res.status(400).json({ error: 'userId or email required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      let supabaseUserId = userId;
      if (!supabaseUserId && email) { const { data: users } = await supabaseAdmin.auth.admin.listUsers(); const found = users?.users?.find((u: { id?: string; email?: string }) => u.email === email); if (!found) return res.status(404).json({ error: 'User not found in Supabase Auth' }); supabaseUserId = found.id; }
      const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, { app_metadata: { role } });
      if (supabaseError) return res.status(500).json({ error: 'Failed to update Supabase role', details: 'An internal error occurred' });
      const targetUser = email ? await storage.getUserByEmail(email) : await storage.getUser(supabaseUserId);
      if (targetUser) { await storage.updateUser(targetUser.id, { role }); }
      return res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to set user role', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/reset-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required' });
      if (!validatePasswordComplexity(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' });
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) return res.status(500).json({ error: 'Failed to list users' });
      const userToUpdate = users.users.find((u: { id?: string; email?: string }) => u.email === email);
      if (!userToUpdate) return res.status(404).json({ error: 'User not found in Supabase Auth' });
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userToUpdate.id, { password: newPassword });
      if (updateError) return res.status(500).json({ error: 'Failed to reset password', details: 'An internal error occurred' });
      return res.json({ success: true, message: `Password reset successfully for ${email}.`, email });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to reset password', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/delete-user/:email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.params;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) return res.status(500).json({ error: 'Failed to list users' });
      const userToDelete = users.users.find((u: { id?: string; email?: string }) => u.email === email);
      if (!userToDelete) return res.status(404).json({ error: 'User not found in Supabase Auth' });
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      if (deleteAuthError) return res.status(500).json({ error: 'Failed to delete from authentication system' });
      return res.json({ success: true, message: `User ${email} deleted successfully`, deleted_email: email });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to delete user', details: 'An internal error occurred' }); }
  });

  api.post('/api/transactions/:id/reverse', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const sanitizedReason = reason ? sanitizeInput(String(reason)) : 'No reason provided';
      const txnId = id;
      if (!txnId) return res.status(400).json({ error: 'Invalid transaction ID' });
      const allTransactions = await storage.getAllTransactions();
      const transaction = (allTransactions as unknown as Transaction[]).find((t: Transaction) => String(t.id) === String(txnId));
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      if (transaction.status === 'reversed') return res.status(400).json({ error: 'Transaction already reversed' });
      if (transaction.fromAccountId) { const fromAccount = await storage.getAccount(String(transaction.fromAccountId)); if (fromAccount) { const refundAmount = parseFloat(String(transaction.amount)) || 0; const currentBalance = parseFloat(String(fromAccount.balance)) || 0; const newBalance = currentBalance + refundAmount; if (storage.updateAccount) { await storage.updateAccount(String(transaction.fromAccountId), { balance: newBalance.toString() }); } } }
      const reversalTxn = await storage.createTransaction({ fromAccountId: String(transaction.toAccountId || transaction.fromAccountId), toAccountId: String(transaction.fromAccountId), type: 'reversal', amount: String(transaction.amount), status: 'reversed', description: `Reversal of transaction #${txnId}. Reason: ${sanitizedReason}`, currency: transaction.currency || 'USD' } as unknown as InsertTransaction);
      await storage.updateTransactionStatus(txnId, 'reversed', String(req.user?.id || '' as string || '1'), sanitizedReason);
      return res.json({ success: true, message: 'Transaction reversed successfully', reversalTransactionId: reversalTxn.id, amountRefunded: transaction.amount });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to reverse transaction', details: 'An internal error occurred' }); }
  });

  api.get('/api/statements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = typeof (req.user?.id || '' as string) === 'number' ? req.user!.id : (String(req.user?.id || '' as string) || '0');
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });
      const statements = await storage.getStatementsByUserId(userId);
      return res.json(statements);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch statements' }); }
  });

  api.post('/api/objects/upload', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { file, fileName, fileType } = req.body;
      if (!file || !fileName) return res.status(400).json({ error: 'Missing file or fileName' });
      const sanitizedFileName = String(fileName).replace(/[^a-zA-Z0-9.\-]/g, '_');
      const fileId = `upload_${Date.now()}_${randomUUID().substring(0, 8)}`;
      return res.json({ success: true, fileId, fileName: sanitizedFileName, fileType: fileType || 'image/jpeg', uploadedAt: new Date().toISOString(), url: `/uploads/${fileId}`, message: 'File uploaded successfully' });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to upload file' }); }
  });

  api.get('/api/admin/list-users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) return res.status(500).json({ error: 'Failed to list users', details: 'An internal error occurred' });
      return res.json({ total: data.users.length, users: (data.users as unknown as Record<string, unknown>[]).map((u: Record<string, unknown>) => ({ id: u.id, email: u.email, role: (u.app_metadata as Record<string, unknown>)?.role || 'customer', verified: u.email_confirmed_at ? 'yes' : 'no' })) });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to list users', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/users/:id/profile-photo', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { photoUrl } = req.body;
      if (!id || !photoUrl) return res.status(400).json({ error: 'User ID and photo URL required' });
      if (photoUrl && !/^https?:\/\/.+/.test(String(photoUrl))) {
        return res.status(400).json({ error: 'Invalid photo URL format' });
      }
      const updatedUser = await storage.updateUser(id, { profilePhoto: photoUrl });
      if (!updatedUser) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true, message: 'Profile photo updated successfully', user: updatedUser });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to upload profile photo', details: 'An internal error occurred' }); }
  });

  api.get('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/cards/lock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, locked } = req.body;
      if (!cardId) return res.status(400).json({ error: 'Card ID required' });
      const { data, error } = await supabase.from('cards').update({ status: locked ? 'locked' : 'active', updated_at: new Date().toISOString() }).eq('id', cardId).eq('user_id', req.user?.id || '' as string).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/cards/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, dailyLimit, monthlyLimit, isContactless } = req.body;
      if (!cardId) return res.status(400).json({ error: 'Card ID required' });
      if (dailyLimit !== undefined && parseFloat(String(dailyLimit)) < 0) return res.status(400).json({ error: 'Daily limit cannot be negative' });
      if (monthlyLimit !== undefined && parseFloat(String(monthlyLimit)) < 0) return res.status(400).json({ error: 'Monthly limit cannot be negative' });
      const { data, error } = await supabase.from('cards').update({ daily_limit: dailyLimit, monthly_limit: monthlyLimit, is_contactless: isContactless, updated_at: new Date().toISOString() }).eq('id', cardId).eq('user_id', req.user?.id || '' as string).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardType, cardholderName } = req.body;
      if (!cardType || !cardholderName) return res.status(400).json({ error: 'Card type and cardholder name required' });
      const supabase = getAdminClient();
      const { data: account } = await supabase.from('accounts').select('id').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!account) return res.status(404).json({ error: 'No active account found' });
      const cardNumber = '4' + Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
      const expiryMonth = Math.floor(Math.random() * 12) + 1;
      const expiryYear = new Date().getFullYear() + 4;
      const { data, error } = await supabase.from('cards').insert({ user_id: req.user?.id || '' as string, account_id: (account as Record<string, unknown>).id, card_number: cardNumber, card_type: cardType, cardholder_name: cardholderName, expiry_month: expiryMonth, expiry_year: expiryYear, status: 'active', is_contactless: true, daily_limit: '5000.00', monthly_limit: '50000.00', pin_set: false }).select().single();
      if (error) throw error;
      await supabase.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'New Card Created', message: `A new ${cardType} card has been created for your account.`, type: 'success', priority: 'normal', is_read: false });
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.patch('/api/alerts/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('alerts').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user?.id || '' as string).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', req.params.id).eq('user_id', req.user?.id || '' as string);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/investments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/market-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('forex').select('*').order('to_currency', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/currency-exchange', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      if (!fromCurrency || !toCurrency || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const sanitizedFromCurrency = sanitizeInput(String(fromCurrency));
      const sanitizedToCurrency = sanitizeInput(String(toCurrency));
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
      const { data: rate, error: rateError } = await supabase.from('forex').select('rate').eq('to_currency', sanitizedToCurrency).maybeSingle();
      if (rateError || !rate) return res.status(400).json({ error: 'Exchange rate not found' });
      const exchangeRate = parseFloat(String((rate as Record<string, unknown>).rate));
      const convertedAmount = numAmount * exchangeRate;
      const { data: userAccount } = await supabase.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -numAmount, `Currency exchange: ${numAmount} ${sanitizedFromCurrency} to ${sanitizedToCurrency}`);
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' });
      }
      const reference = `EXC${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data: txn, error: txnError } = await supabase.from('transactions').insert({ from_account_id: null, to_account_id: null, from_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: sanitizedFromCurrency, exchange_rate: exchangeRate.toFixed(4), converted_amount: convertedAmount.toFixed(2), transaction_type: 'currency_exchange', category: 'exchange', status: 'completed', description: `Currency exchange: ${numAmount} ${sanitizedFromCurrency} to ${convertedAmount.toFixed(2)} ${sanitizedToCurrency}`, reference_number: reference, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() }).select().single();
      if (txnError) throw txnError;
      return res.json({ transaction: txn, convertedAmount: convertedAmount.toFixed(2), rate: exchangeRate });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { subject, description, priority } = req.body;
      if (!subject || !description) return res.status(400).json({ error: 'Subject and description required' });
      const ticketId = `TKT${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('support_tickets').insert({ user_id: req.user?.id || '' as string, subject, description, priority: priority || 'normal', status: 'open' }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/admin/support-tickets', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/admin/transactions', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/transactions', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, userId, amount, type, description } = req.body;
      if (!accountId || !amount || !type) return res.status(400).json({ error: 'Missing required fields' });
      const reference = `ADM${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('transactions').insert({ from_account_id: accountId, to_account_id: null, from_user_id: userId || req.user?.id || '' as string, amount: Number(amount).toFixed(2), transaction_type: type, category: 'admin', status: 'completed', description: description || 'Admin transaction', reference_number: reference, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/savings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('savings').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/savings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountType, initialDeposit, goalName, targetAmount } = req.body;
      const supabaseClient = getAdminClient();
      const deposit = parseFloat(String(initialDeposit || '0'));
      if (isNaN(deposit) || deposit < 0) return res.status(400).json({ error: 'Invalid deposit amount' });
      if (deposit > 0) { const { data: userAccount } = await supabaseClient.from('accounts').select('balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single(); if (!userAccount) return res.status(404).json({ error: 'Account not found' }); const currentBalance = parseFloat(String((userAccount as Record<string, unknown>).balance || '0')); if (currentBalance < deposit) return res.status(400).json({ error: 'Insufficient funds for initial deposit' }); const newBalance = (currentBalance - deposit).toFixed(2); await supabaseClient.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', req.user?.id || '' as string).eq('status', 'active'); }
      const savingsNumber = `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabaseClient.from('savings').insert({ user_id: req.user?.id || '' as string, savings_type: accountType || 'savings', current_amount: deposit.toFixed(2), goal_name: goalName || null, target_amount: targetAmount || null, interest_rate: '2.50', status: 'active' }).select().single();
      if (error) throw error;
      if (deposit > 0) { await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: req.user?.id || '' as string, amount: deposit.toFixed(2), currency: 'USD', transaction_type: 'savings_deposit', category: 'savings', status: 'completed', description: `Initial deposit to savings account ${savingsNumber}`, reference_number: `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() }); }
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/savings/deposit', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { savingsId, amount } = req.body;
      if (!savingsId || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
      const supabaseClient = getAdminClient();
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -numAmount, 'Deposit to savings account');
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' });
      }
      const { data: savings } = await supabaseClient.from('savings').select('current_amount').eq('id', savingsId).eq('user_id', req.user?.id || '' as string).single();
      if (!savings) return res.status(404).json({ error: 'Savings account not found' });
      const newSavingsBalance = (parseFloat(String((savings as Record<string, unknown>).current_amount || '0')) + numAmount).toFixed(2);
      await supabaseClient.from('savings').update({ current_amount: newSavingsBalance, updated_at: new Date().toISOString() }).eq('id', savingsId);
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: 'USD', transaction_type: 'savings_deposit', category: 'savings', status: 'completed', description: `Deposit to savings account`, reference_number: `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, newSavingsBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/savings/withdraw', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { savingsId, amount } = req.body;
      if (!savingsId || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
      const supabaseClient = getAdminClient();
      const { data: savings } = await supabaseClient.from('savings').select('current_amount').eq('id', savingsId).eq('user_id', req.user?.id || '' as string).single();
      if (!savings) return res.status(404).json({ error: 'Savings account not found' });
      const savingsBalance = parseFloat(String((savings as Record<string, unknown>).current_amount || '0'));
      if (savingsBalance < numAmount) return res.status(400).json({ error: 'Insufficient savings balance' });
      const newSavingsBalance = (savingsBalance - numAmount).toFixed(2);
      const { data: updatedSavings, error: savingsUpdateError } = await supabaseClient.from('savings').update({ current_amount: newSavingsBalance, updated_at: new Date().toISOString() }).eq('id', savingsId).eq('current_amount', savingsBalance).select().single();
      if (savingsUpdateError || !updatedSavings) {
        return res.status(409).json({ error: 'Savings balance was modified by another transaction. Please try again.' });
      }
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (userAccount) {
        const accountId = (userAccount as Record<string, unknown>).id as string;
        await atomicBalanceUpdate(accountId, numAmount, 'Withdrawal from savings account');
      }
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: 'USD', transaction_type: 'savings_withdrawal', category: 'savings', status: 'completed', description: `Withdrawal from savings account`, reference_number: `SAW${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, newSavingsBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/investments/buy', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { symbol, assetType, shares, price } = req.body;
      if (!symbol || !shares || !price) return res.status(400).json({ error: 'Missing required fields' });
      const sanitizedSymbol = sanitizeInput(String(symbol));
      const numShares = parseFloat(String(shares));
      const numPrice = parseFloat(String(price));
      if (isNaN(numShares) || numShares <= 0) return res.status(400).json({ error: 'Invalid shares amount' });
      if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ error: 'Invalid price' });
      const totalCost = numShares * numPrice;
      const supabaseClient = getAdminClient();
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -totalCost, `Bought ${numShares} shares of ${sanitizedSymbol} at ${numPrice.toFixed(2)}`);
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' });
      }
      const newBalance = balanceResult.newBalance || '0';
      const { data: existing } = await supabaseClient.from('investments').select('id, shares, average_price').eq('user_id', req.user?.id || '' as string).eq('symbol', sanitizedSymbol).limit(1);
      if (existing && existing.length > 0) { const existingShares = parseFloat(String((existing[0] as Record<string, unknown>).shares || '0')); const existingAvg = parseFloat(String((existing[0] as Record<string, unknown>).average_price || '0')); const newTotalShares = existingShares + numShares; const newAvgPrice = ((existingAvg * existingShares) + (numPrice * numShares)) / newTotalShares; await supabaseClient.from('investments').update({ shares: newTotalShares.toString(), average_price: newAvgPrice.toFixed(2), current_price: numPrice.toFixed(2), updated_at: new Date().toISOString() }).eq('id', String((existing[0] as Record<string, unknown>).id)); } else { await supabaseClient.from('investments').insert({ user_id: req.user?.id || '' as string, symbol: sanitizedSymbol, asset_type: assetType || 'stock', shares: numShares.toString(), average_price: numPrice.toFixed(2), current_price: numPrice.toFixed(2), status: 'active' }); }
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, amount: totalCost.toFixed(2), currency: 'USD', transaction_type: 'investment_buy', category: 'investment', status: 'completed', description: `Bought ${numShares} shares of ${sanitizedSymbol} at ${numPrice.toFixed(2)}`, reference_number: `INV${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, totalCost: totalCost.toFixed(2), newBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/investments/sell', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { investmentId, shares, price } = req.body;
      if (!investmentId || !shares || !price) return res.status(400).json({ error: 'Missing required fields' });
      const numShares = parseFloat(String(shares));
      const numPrice = parseFloat(String(price));
      if (isNaN(numShares) || numShares <= 0) return res.status(400).json({ error: 'Invalid shares amount' });
      if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ error: 'Invalid price' });
      const totalProceeds = numShares * numPrice;
      const supabaseClient = getAdminClient();
      const { data: investment } = await supabaseClient.from('investments').select('id, shares, average_price, symbol').eq('id', investmentId).eq('user_id', req.user?.id || '' as string).single();
      if (!investment) return res.status(404).json({ error: 'Investment not found' });
      const heldShares = parseFloat(String((investment as Record<string, unknown>).shares || '0'));
      if (heldShares < numShares) return res.status(400).json({ error: 'Insufficient shares' });
      const remainingShares = heldShares - numShares;
      const newSharesValue = remainingShares > 0 ? remainingShares.toString() : '0';
      const newStatus = remainingShares > 0 ? undefined : 'sold';
      const updatePayload: Record<string, unknown> = { shares: newSharesValue, current_price: numPrice.toFixed(2), updated_at: new Date().toISOString() };
      if (newStatus) updatePayload.status = newStatus;
      const { data: updatedInvestment, error: investmentUpdateError } = await supabaseClient.from('investments').update(updatePayload).eq('id', investmentId).eq('shares', heldShares).select().single();
      if (investmentUpdateError || !updatedInvestment) {
        return res.status(409).json({ error: 'Investment shares were modified by another transaction. Please try again.' });
      }
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (userAccount) {
        const accountId = (userAccount as Record<string, unknown>).id as string;
        await atomicBalanceUpdate(accountId, totalProceeds, `Sold ${numShares} shares of ${(investment as Record<string, unknown>).symbol} at ${numPrice.toFixed(2)}`);
      }
      const symbol = (investment as Record<string, unknown>).symbol as string;
      await supabaseClient.from('transactions').insert({ from_user_id: null, to_user_id: req.user?.id || '' as string, amount: totalProceeds.toFixed(2), currency: 'USD', transaction_type: 'investment_sell', category: 'investment', status: 'completed', description: `Sold ${numShares} shares of ${symbol} at ${numPrice.toFixed(2)}`, reference_number: `SEL${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, totalProceeds: totalProceeds.toFixed(2) });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('payments').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/kyc/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('kyc').select('*').eq('user_id', req.user?.id || '' as string).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      const { data: user } = await supabase.from('users').select('is_verified, kyc_status, email, phone_number, full_name, address, city, country, profession, annual_income').eq('id', req.user?.id || '' as string).single();
      const verificationItems = [{ id: 'identity', name: 'Identity Verification', status: user?.is_verified ? 'verified' : 'pending', completedAt: user?.is_verified ? new Date().toISOString() : null }, { id: 'email', name: 'Email Verification', status: user?.email ? 'verified' : 'pending', completedAt: user?.email ? new Date().toISOString() : null }, { id: 'phone', name: 'Phone Verification', status: user?.phone_number ? 'verified' : 'pending', completedAt: null }, { id: 'address', name: 'Address Verification', status: user?.address ? 'verified' : 'required', completedAt: null }, { id: 'income', name: 'Income Verification', status: user?.annual_income ? 'verified' : 'required', completedAt: null }, { id: 'kyc', name: 'KYC Compliance', status: user?.kyc_status || 'pending', completedAt: user?.kyc_status === 'approved' ? new Date().toISOString() : null }];
      return res.json({ kycRecord: data, verificationItems, user: { isVerified: user?.is_verified, kycStatus: user?.kyc_status } });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/kyc/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { documentType, documentNumber, fullName, dateOfBirth, nationality, address } = req.body;
      if (!documentType || !fullName) return res.status(400).json({ error: 'Document type and full name required' });
      const supabaseClient = getAdminClient();
      const { data, error } = await supabaseClient.from('kyc').upsert({ user_id: req.user?.id || '' as string, document_type: documentType, document_number: documentNumber || null, full_name: fullName, date_of_birth: dateOfBirth || null, nationality: nationality || null, address: address || null, status: 'pending', submitted_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      await supabaseClient.from('users').update({ kyc_status: 'in_review' }).eq('id', req.user?.id || '' as string);
      await supabaseClient.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'KYC Submitted', message: 'Your KYC documents have been submitted for review.', type: 'info', priority: 'normal', is_read: false });
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/user/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('users').select('notification_preferences, privacy_preferences, display_preferences, security_preferences').eq('id', req.user?.id || '' as string).single();
      if (error) throw error;
      return res.json({ notificationPreferences: data?.notification_preferences || {}, privacyPreferences: data?.privacy_preferences || {}, displayPreferences: data?.display_preferences || {}, securityPreferences: data?.security_preferences || {} });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.put('/api/user/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { notificationPreferences, privacyPreferences, displayPreferences, securityPreferences } = req.body;
      const updateData: Record<string, unknown> = {};
      if (notificationPreferences) updateData.notification_preferences = notificationPreferences;
      if (privacyPreferences) updateData.privacy_preferences = privacyPreferences;
      if (displayPreferences) updateData.display_preferences = displayPreferences;
      if (securityPreferences) updateData.security_preferences = securityPreferences;
      const { error } = await supabase.from('users').update(updateData).eq('id', req.user?.id || '' as string);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.put('/api/user/security-questions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2 } = req.body;
      if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) return res.status(400).json({ error: 'Both security questions and answers are required' });
      const hashedAnswer1 = crypto.createHash('sha256').update(String(securityAnswer1).toLowerCase().trim()).digest('hex');
      const hashedAnswer2 = crypto.createHash('sha256').update(String(securityAnswer2).toLowerCase().trim()).digest('hex');
      const { error } = await supabase.from('users').update({ security_question_1: securityQuestion1, security_answer_1: hashedAnswer1, security_question_2: securityQuestion2, security_answer_2: hashedAnswer2 }).eq('id', req.user?.id || '' as string);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/transactions/export', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', req.user?.id || '' as string);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No accounts found' });
      const accountIds = accounts.map((a: Record<string, unknown>) => a.id);
      const { data: transactions } = await supabase.from('transactions').select('*').in('from_account_id', accountIds).or(`to_account_id.in.(${accountIds.join(',')})`).order('created_at', { ascending: false }).limit(1000);
      const csvHeader = 'Date,Reference,Type,Amount,Currency,Status,Description\n';
      const csvRows = (transactions || []).map((t: Record<string, unknown>) => {
        const date = sanitizeCsvCell(String(t.created_at || ''));
        const ref = sanitizeCsvCell(String(t.reference_number || ''));
        const type = sanitizeCsvCell(String(t.transaction_type || ''));
        const amount = sanitizeCsvCell(String(t.amount || '0'));
        const currency = sanitizeCsvCell(String(t.currency || 'USD'));
        const status = sanitizeCsvCell(String(t.status || ''));
        const desc = sanitizeCsvCell(String(t.description || '').replace(/"/g, '""'));
        return `${date},${ref},${type},${amount},${currency},${status},"${desc}"`;
      }).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csvHeader + csvRows);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/:id/repay', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount } = req.body;
      if (!amount) return res.status(400).json({ error: 'Amount required' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      const supabaseClient = getAdminClient();
      const { data: loan } = await supabaseClient.from('loans').select('*').eq('id', req.params.id).eq('user_id', req.user?.id || '' as string).single();
      if (!loan) return res.status(404).json({ error: 'Loan not found' });
      if ((loan as Record<string, unknown>).status !== 'approved' && (loan as Record<string, unknown>).status !== 'active') return res.status(400).json({ error: 'Loan is not active' });
      const { data: account } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!account) return res.status(404).json({ error: 'Account not found' });
      const accountId = (account as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -numAmount, `Loan repayment for loan ${req.params.id}`);
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' });
      }
      const newBalance = balanceResult.newBalance || '0';
      const remainingBalance = parseFloat(String((loan as Record<string, unknown>).remaining_balance || (loan as Record<string, unknown>).principal_amount || '0')) - numAmount;
      await supabaseClient.from('loans').update({ remaining_balance: remainingBalance.toFixed(2), status: remainingBalance <= 0 ? 'completed' : 'active', updated_at: new Date().toISOString() }).eq('id', req.params.id);
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: 'USD', transaction_type: 'loan_repayment', category: 'loan', status: 'completed', description: `Loan repayment for loan ${req.params.id}`, reference_number: `LRP${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      await supabaseClient.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'Loan Payment Made', message: `Payment of ${numAmount.toFixed(2)} applied to your loan. Remaining balance: ${remainingBalance.toFixed(2)}.`, type: 'success', priority: 'normal', is_read: false });
      return res.json({ success: true, newBalance, remainingBalance: remainingBalance.toFixed(2) });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/loans/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('loans').select('*').eq('id', req.params.id).eq('user_id', req.user?.id || '' as string).single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/cards/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: account } = await supabase.from('accounts').select('id').eq('user_id', req.user?.id || '' as string);
      if (!account) return res.status(404).json({ error: 'Account not found' });
      const { data, error } = await supabase.from('cards').select('*').eq('id', req.params.id).in('account_id', account.map((a: Record<string, unknown>) => a.id)).single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/branches', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('branches').select('*').eq('is_active', true).order('name', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/atms', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('atms').select('*').eq('is_active', true).order('name', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/exchange-rates/changes', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('forex').select('to_currency, rate, updated_at');
      if (error) throw error;
      const changes: Record<string, number> = {};
      (data || []).forEach((row: Record<string, unknown>) => {
        const currency = row.to_currency as string;
        if (currency) changes[currency] = 0;
      });
      return res.json(changes);
    } catch (error: unknown) { return res.json({}); }
  });

  api.get('/api/users/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.id !== req.params.id && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(sanitizeUser(user as unknown as Record<string, unknown>));
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/auth/check-email', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const existing = await storage.getUserByEmail(email);
      return res.json({ available: !existing });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/auth/register-complete', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone, dateOfBirth, address, city, state, country, postalCode, nationality, profession, employer, annualIncome, sourceOfFunds, purposeOfAccount, idType, idNumber, transferPin, idCardUrl } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

      const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingAuth?.users?.find((u: { email?: string }) => u.email === email);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName, phone },
      });
      if (authError || !authData.user) {
        return res.status(500).json({ error: authError?.message || 'Failed to create auth account' });
      }

      try {
        const pinHash = transferPin ? await bcrypt.hash(String(transferPin), 12) : '';
        const newUser = await storage.createUser({
          username: email.split('@')[0],
          email,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'User',
          phone: phone || '',
          dateOfBirth: dateOfBirth || null,
          address: address || null,
          city: city || null,
          state: state || null,
          country: country || null,
          postalCode: postalCode || null,
          profession: profession || null,
          employer: employer || null,
          annualIncome: annualIncome || null,
          accountNumber: generateAccountNumber(),
          accountId: randomUUID(),
          balance: '0',
          isActive: false,
          isVerified: false,
          transferPin: pinHash || null,
          role: 'customer',
        } as unknown as InsertUser);

        await storage.createAccount({
          userId: newUser.id,
          accountNumber: generateAccountNumber(),
          accountType: 'checking',
          balance: '0.00',
          currency: 'USD',
          status: 'pending',
        } as unknown as InsertAccount);

        return res.status(201).json({
          success: true,
          message: 'Registration submitted. Your account is pending approval.',
          user: sanitizeUser(newUser as unknown as Record<string, unknown>),
        });
      } catch (dbError: unknown) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  api.get('/api/admin/pending-transfers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminClient = getAdminClient();
      const { data, error } = await adminClient
        .from('transactions')
        .select('*, users!from_user_id(email, first_name, last_name)')
        .in('status', ['pending', 'processing'])
        .in('transaction_type', ['transfer', 'international', 'domestic'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/transfers/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminClient = getAdminClient();
      const { data: txn, error: txnError } = await adminClient.from('transactions').select('*').eq('id', id).single();
      if (txnError || !txn) return res.status(404).json({ error: 'Transaction not found' });
      if ((txn as Record<string, unknown>).status !== 'pending') return res.status(400).json({ error: 'Transaction is not pending' });

      const { data, error } = await adminClient.from('transactions').update({
        status: 'completed',
        approved_by: req.user?.id || '' as string,
        approved_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) throw error;

      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) { await storage.createAdminAction({ adminId: admin.id, action: 'approve_transfer', targetType: 'transaction', targetId: id, details: { notes } }); }
      return res.json({ success: true, transaction: data });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/transfers/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      if (!notes) return res.status(400).json({ error: 'Rejection reason required' });
      const adminClient = getAdminClient();
      const { data: txn, error: txnError } = await adminClient.from('transactions').select('*').eq('id', id).single();
      if (txnError || !txn) return res.status(404).json({ error: 'Transaction not found' });
      if ((txn as Record<string, unknown>).status !== 'pending') return res.status(400).json({ error: 'Transaction is not pending' });

      const { data, error } = await adminClient.from('transactions').update({
        status: 'cancelled',
        admin_notes: notes,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) throw error;

      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) { await storage.createAdminAction({ adminId: admin.id, action: 'reject_transfer', targetType: 'transaction', targetId: id, details: { notes } }); }
      return res.json({ success: true, transaction: data });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/international-transfers', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, recipientName, recipientCountry, bankName, swiftCode, accountNumber, transferPurpose, transferPin } = req.body;
      if (!amount || !recipientName) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      if (numAmount > 500000) return res.status(400).json({ error: 'Maximum international transfer is $500,000' });

      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.transferPin) return res.status(400).json({ error: 'PIN not set' });
      const pinMatch = await bcrypt.compare(String(transferPin), user.transferPin);
      if (!pinMatch) return res.status(401).json({ error: 'Invalid PIN' });

      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const account = accounts[0];

      const reference = `INT${Date.now()}${Math.floor(Math.random() * 10000)}`;
      try {
        const result = await atomicTransfer({
          fromAccountId: String(account.id),
          recipientAccountNumber: String(accountNumber || ''),
          amount: numAmount,
          transactionType: 'international',
          description: `International transfer to ${recipientName} - ${bankName || ''} ${swiftCode || ''}`,
          recipientName,
          recipientCountry,
        });
        if (!result.success) {
          return res.status(400).json({ error: result.error || 'Transfer failed' });
        }
        const adminClient = getAdminClient();
        await adminClient.from('transactions').update({
          recipient_name: recipientName,
          recipient_country: recipientCountry,
          bank_name: bankName,
          swift_code: swiftCode,
          account_number: accountNumber,
          transfer_purpose: transferPurpose,
          reference_number: reference,
        }).eq('id', String((result.transaction as Record<string, unknown>)?.id || ''));

        return res.json({ success: true, reference, transactionId: (result.transaction as Record<string, unknown>)?.id });
      } catch (transferError) {
        return res.status(500).json({ error: transferError instanceof Error ? transferError.message : 'Transfer failed' });
      }
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/international-transfers/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('transactions').select('status').eq('id', req.params.id).single();
      if (error) throw error;
      return res.json({ status: (data as Record<string, unknown>)?.status || 'pending' });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  // GET /api/admin/pending-registrations - List users pending approval
  api.get('/api/admin/pending-registrations', requireAdmin, wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, created_at, is_active, is_verified')
        .eq('is_active', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const registrations = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id,
        email: row.email,
        fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        phone: row.phone || '',
        createdAt: row.created_at,
        status: 'pending'
      }));
      return res.json(registrations);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch pending registrations' }); }
  }));

  // POST /api/admin/create-transaction - Admin creates a transaction for a customer
  api.post('/api/admin/create-transaction', requireAdmin, wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { customerId, amount, type, description, currency, category, reference } = req.body;
      if (!customerId || !amount || !type) return res.status(400).json({ error: 'Missing required fields: customerId, amount, type' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (!admin) return res.status(403).json({ error: 'Admin not found' });
      const targetUser = await storage.getUser(String(customerId));
      if (!targetUser) return res.status(404).json({ error: 'Customer not found' });
      const accounts = await storage.getUserAccounts(targetUser.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'Customer has no account' });
      const account = accounts[0];
      const ref = reference || `ADM${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const isCredit = type === 'credit' || type === 'deposit' || type === 'add';
      const balanceChange = isCredit ? numAmount : -numAmount;
      const balanceResult = await atomicBalanceUpdate(String(account.id), balanceChange, description || `Admin ${type} transaction`);
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Failed to update balance' });
      }
      const { data: txn, error: txnError } = await getAdminClient().from('transactions').insert({
        from_account_id: isCredit ? null : String(account.id),
        to_account_id: isCredit ? String(account.id) : null,
        from_user_id: isCredit ? null : targetUser.id,
        to_user_id: isCredit ? targetUser.id : null,
        amount: numAmount.toFixed(2),
        currency: currency || 'USD',
        transaction_type: type,
        category: category || 'admin',
        status: 'completed',
        description: description || `Admin ${type} transaction`,
        reference_number: ref,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }).select().single();
      if (txnError) throw txnError;
      await getAdminClient().from('admin_actions').insert({
        admin_id: admin.id,
        action: 'create_transaction',
        target_type: 'transaction',
        target_id: String(txn.id),
        details: { customerId, amount: numAmount, type, description }
      });
      await getAdminClient().from('alerts').insert({
        user_id: targetUser.id,
        title: 'Account Update',
        message: `${isCredit ? 'Credit' : 'Debit'} of ${numAmount.toFixed(2)} ${currency || 'USD'} applied by admin.`,
        type: isCredit ? 'success' : 'info',
        priority: 'normal',
        is_read: false
      });
      return res.json({ success: true, transaction: txn, newBalance: balanceResult.newBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to create transaction' }); }
  }));

  // POST /api/admin/customers/:id/balance - Admin adjusts customer balance
  api.post('/api/admin/customers/:id/balance', requireAdmin, wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, description } = req.body;
      if (!amount || isNaN(parseFloat(String(amount)))) return res.status(400).json({ error: 'Valid amount required' });
      const numAmount = parseFloat(String(amount));
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ error: 'Customer not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'Customer has no account' });
      const accountId = String(accounts[0].id);
      const balanceResult = await atomicBalanceUpdate(accountId, numAmount, description || 'Admin balance adjustment');
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Failed to update balance' });
      }
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) {
        await getAdminClient().from('admin_actions').insert({
          admin_id: admin.id,
          action: 'balance_adjustment',
          target_type: 'account',
          target_id: accountId,
          details: { customerId: id, amount: numAmount, description }
        });
      }
      const ref = `BAL${Date.now()}${Math.floor(Math.random() * 10000)}`;
      await getAdminClient().from('transactions').insert({
        from_account_id: numAmount >= 0 ? null : accountId,
        to_account_id: numAmount >= 0 ? accountId : null,
        from_user_id: null,
        to_user_id: numAmount >= 0 ? user.id : null,
        amount: Math.abs(numAmount).toFixed(2),
        currency: 'USD',
        transaction_type: numAmount >= 0 ? 'admin_credit' : 'admin_debit',
        category: 'admin',
        status: 'completed',
        description: description || 'Admin balance adjustment',
        reference_number: ref,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });
      return res.json({ success: true, newBalance: balanceResult.newBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to adjust balance' }); }
  }));

  // POST /api/admin/accounts/:id/balance - Admin adjusts account balance directly
  api.post('/api/admin/accounts/:id/balance', requireAdmin, wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, description, type } = req.body;
      if (!amount || isNaN(parseFloat(String(amount)))) return res.status(400).json({ error: 'Valid amount required' });
      const numAmount = parseFloat(String(amount));
      const { data: account, error: accError } = await getAdminClient().from('accounts').select('id, user_id').eq('id', id).single();
      if (accError || !account) return res.status(404).json({ error: 'Account not found' });
      const accountId = String((account as Record<string, unknown>).id);
      const balanceResult = await atomicBalanceUpdate(accountId, numAmount, description || 'Admin account balance adjustment');
      if (!balanceResult.success) {
        return res.status(400).json({ error: balanceResult.error || 'Failed to update balance' });
      }
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) {
        await getAdminClient().from('admin_actions').insert({
          admin_id: admin.id,
          action: 'account_balance_adjustment',
          target_type: 'account',
          target_id: accountId,
          details: { accountId: id, amount: numAmount, type, description }
        });
      }
      const ref = `ACC${Date.now()}${Math.floor(Math.random() * 10000)}`;
      await getAdminClient().from('transactions').insert({
        from_account_id: numAmount >= 0 ? null : accountId,
        to_account_id: numAmount >= 0 ? accountId : null,
        from_user_id: null,
        to_user_id: numAmount >= 0 ? (account as Record<string, unknown>).user_id : null,
        amount: Math.abs(numAmount).toFixed(2),
        currency: 'USD',
        transaction_type: type || (numAmount >= 0 ? 'admin_credit' : 'admin_debit'),
        category: 'admin',
        status: 'completed',
        description: description || 'Admin account balance adjustment',
        reference_number: ref,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });
      return res.json({ success: true, newBalance: balanceResult.newBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to adjust account balance' }); }
  }));

  // POST /api/messages - Admin sends chat message to customer
  api.post('/api/messages', requireAuth, wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { content, recipientId, sessionId } = req.body;
      if (!content || !content.trim()) return res.status(400).json({ error: 'Message content required' });
      if (!recipientId) return res.status(400).json({ error: 'Recipient ID required' });
      const senderId = req.user?.id || '' as string;
      const senderRole = req.user?.role === 'admin' ? 'admin' : 'customer';
      const sender = await storage.getUserByEmail(req.user?.email || '');
      const senderName = sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : req.user?.email || 'User';
      const session = sessionId || `session_${senderId}_${recipientId}`;
      const { data, error } = await getAdminClient().from('messages').insert({
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        recipient_id: recipientId,
        message: content.trim(),
        conversation_id: session,
        is_read: false,
        created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to send message' }); }
  }));

  // GET /api/messages/session/:sessionId - Get chat history for a session
  api.get('/api/messages/session/:sessionId', requireAuth, wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || '' as string;
      const { data, error } = await getAdminClient().from('messages')
        .select('*')
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      const messages = (data || []).filter((msg: Record<string, unknown>) => {
        return msg.sender_id === userId || msg.recipient_id === userId || req.user?.role === 'admin';
      });
      return res.json(messages);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch messages' }); }
  }));

  const httpServer = createServer(app);
  return httpServer;
}

export async function registerLiveChatRoutes(app: Express) {
  const { getChatHistory, getActiveSessions, createTicketFromChat } = await import('./supabase-live-chat');
  const { supabase } = await import('./supabase-public-storage');
  app.get('/api/chat/history', wrapAsync(requireAuth), wrapAsync(getChatHistory));
  app.get('/api/chat/sessions', wrapAsync(requireAdmin), wrapAsync(getActiveSessions));
  app.post('/api/chat/create-ticket', wrapAsync(requireAuth), wrapAsync(createTicketFromChat));
  app.post('/api/chat/send', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      let adminUserId: string | null = null;
      try { const { data: adminUsers } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).single(); if (adminUsers?.id) adminUserId = adminUsers.id as string; } catch (error: unknown) { console.warn('Failed to query admin users:', error instanceof Error ? error.message : 'Unknown error'); }
      const { data: savedMsg, error } = await supabase.from('messages').insert({ sender_id: user.id, sender_name: `${user.firstName} ${user.lastName}`.trim(), sender_role: 'customer', recipient_id: adminUserId, message: message.trim(), conversation_id: `session_${user.id}`, is_read: false, created_at: new Date().toISOString() }).select().single();
      if (error) return res.json({ success: true, message: 'Message queued', persisted: false });
      const adminChannel = supabase.channel('admin-chat-inbox');
      adminChannel.send({ type: 'broadcast', event: 'new_customer_message', payload: { userId: user.id, userName: `${user.firstName} ${user.lastName}`, message: message.trim(), messageId: savedMsg?.id, timestamp: new Date().toISOString() } });
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').eq('is_active', true);
      if (admins && admins.length > 0) { const adminAlerts = admins.map((admin: Record<string, unknown>) => ({ user_id: admin.id, title: 'New Chat Message', message: `New message from ${req.user?.email}`, type: 'info', priority: 'normal', is_read: false })); await supabase.from('alerts').insert(adminAlerts); }
      return res.json({ success: true, messageId: savedMsg?.id });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to send message' }); }
  }));
  app.post('/api/chat/notify', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, type, message } = req.body;
      const authReq = req as AuthenticatedRequest;
      if (userId !== authReq.user?.id && authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to send notifications to other users' });
      }
      const channel = supabase.channel(`notifications:${userId}`);
      channel.send({ type: 'broadcast', event: type, payload: { message, timestamp: new Date() } });
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  }));
}
