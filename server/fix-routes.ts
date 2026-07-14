import type { User } from '@shared/schema';
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
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth-middleware';
import { 
  authRateLimiter, 
  registrationRateLimiter, 
  transactionRateLimiter, 
  generalRateLimiter 
} from './rate-limiter';
import { 
  validateRequest, 
  registrationSchema, 
  approvalSchema,
  balanceUpdateSchema,
  pinChangeSchema
} from './validation-schemas';
import { BankingTransaction, atomicBalanceUpdate, atomicTransfer } from './transaction-wrapper';
import { errorHandler, notFoundHandler, asyncHandler, createApiError } from './error-handler';
import { runStartupChecks } from './startup-checks';
import * as bcrypt from 'bcryptjs';

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

const { randomUUID } = await import('crypto');

export async function registerRoutes(app: Express) {
  // Register transfer routes first (they take priority for /api/transfers endpoints)
  setupTransferRoutes(app);

  // ==================== HEALTH CHECK ====================
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      return res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Health check failed' });
    }
  });

  // ==================== USER PROFILE ENDPOINTS ====================

  // GET /api/user - Get current user profile
  app.get('/api/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(sanitizeUser(user));
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // PATCH /api/user - Update user profile
  app.patch('/api/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { role, isVerified, isActive, id, ...allowedUpdates } = req.body;
      const updatedUser = await storage.updateUser(user.id, allowedUpdates);
      return res.json(sanitizeUser(updatedUser));
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  // GET /api/user/accounts - Get user accounts
  app.get('/api/user/accounts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });

  // GET /api/accounts - Get user accounts (alias)
  app.get('/api/accounts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });

  // GET /api/transactions - Get user transactions
  app.get('/api/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) {
        return res.json([]);
      }
      const allTxns: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        allTxns.push(...txns);
      }
      allTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // GET /api/transactions/:id - Get single transaction
  app.get('/api/transactions/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransactionById(id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      return res.json(transaction);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  });

  // ==================== PIN MANAGEMENT ====================

  // POST /api/set-pin - Set transfer PIN
  app.post('/api/set-pin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin || String(pin).length !== 4) {
        return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      }
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const pinHash = await bcrypt.hash(String(pin), 12);
      await storage.updateUser(user.id, { transferPin: pinHash });
      return res.json({ success: true, message: 'PIN set successfully' });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to set PIN' });
    }
  });

  // POST /api/verify-pin - Verify transfer PIN
  app.post('/api/verify-pin', requireAuth, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { pin } = req.body;
      const email = req.user!.email;
      if (!email || !pin) {
        return res.status(400).json({ error: 'Email and PIN required' });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || !user.transferPin) {
        return res.status(401).json({ success: false, message: 'PIN not set on account' });
      }
      const pinMatch = await bcrypt.compare(String(pin).trim(), String(user.transferPin).trim());
      if (!pinMatch) {
        return res.status(401).json({ success: false, message: 'Invalid PIN' });
      }
      return res.json({ success: true, message: 'PIN verified' });
    } catch (error: unknown) {
      return res.status(500).json({ success: false, message: 'PIN verification failed' });
    }
  });

  // POST /api/change-pin - Change transfer PIN
  app.post('/api/change-pin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPin, newPin } = req.body;
      if (!currentPin || !newPin || String(newPin).length !== 4) {
        return res.status(400).json({ error: 'Current PIN and new PIN (4 digits) required' });
      }
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user || !user.transferPin) {
        return res.status(401).json({ error: 'PIN not set on account' });
      }
      const pinMatch = await bcrypt.compare(String(currentPin).trim(), String(user.transferPin).trim());
      if (!pinMatch) {
        return res.status(401).json({ error: 'Current PIN is incorrect' });
      }
      const pinHash = await bcrypt.hash(String(newPin), 12);
      await storage.updateUser(user.id, { transferPin: pinHash });
      return res.json({ success: true, message: 'PIN changed successfully' });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to change PIN' });
    }
  });

  // ==================== ADMIN ENDPOINTS ====================

  // Exchange rates endpoint
  app.get('/api/exchange-rates', async (req: Request, res: Response) => {
    try {
      const rates = await storage.getExchangeRates();
      const ratesObject: Record<string, number> = {};
      rates.forEach((rate: Record<string, any>) => {
        ratesObject[rate.targetCurrency || rate.target_currency] = parseFloat(rate.rate);
      });
      return res.json(ratesObject);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
  });

  // Admin customers endpoint
  app.get('/api/admin/customers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      const customerList = customers
        .filter((user: User) => user.role !== 'admin' || req.query.includeAdmins === 'true')
        .map((user: User) => ({
          ...sanitizeUser(user),
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
          balance: parseFloat(String(user.balance || '0')) || 0
        }));
      return res.json(customerList);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  // PUT /api/admin/customers/:id - Update customer
  app.put('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'update_customer',
          targetType: 'user',
          targetId: id,
          details: updates
        });
      }
      return res.json(sanitizeUser(updatedUser));
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // POST /api/admin/customers/:id/verify - Verify customer
  app.post('/api/admin/customers/:id/verify', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { verified = true, active } = req.body;
      const updates: Record<string, unknown> = { isVerified: verified };
      if (typeof active !== 'undefined') updates.isActive = active;
      else if (verified) updates.isActive = true;
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: verified ? 'verify_customer' : 'unverify_customer',
          targetType: 'user',
          targetId: id,
          details: { verified, active: updates.isActive }
        });
      }
      return res.json({ success: true, user: updatedUser, message: verified ? 'Customer verified' : 'Customer unverified' });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update customer verification' });
    }
  });

  // GET /api/admin/stats - Dashboard statistics
  app.get('/api/admin/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const customers = allUsers.filter((u: User) => u.role === 'customer');
      const allTransactions = await storage.getAllTransactions();
      const pendingTransactions = allTransactions.filter((t: { status?: string }) => t.status === 'pending');
      const tickets = await storage.getSupportTickets();
      const openTickets = tickets.filter((t: { status?: string }) => t.status !== 'resolved' && t.status !== 'closed');
      return res.json({
        totalCustomers: customers.length,
        activeCustomers: customers.filter((u: User) => u.isActive).length,
        pendingApprovals: customers.filter((u: User) => !u.isActive).length,
        totalTransactions: allTransactions.length,
        pendingTransactions: pendingTransactions.length,
        openSupportTickets: openTickets.length,
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // PATCH /api/admin/support-tickets/:id - Update support ticket
  app.patch('/api/admin/support-tickets/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const updatedTicket = await storage.updateSupportTicket(id, updates);
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin && updatedTicket) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'update_support_ticket',
          targetType: 'support_ticket',
          targetId: id,
          details: { ticketId: id, updates }
        });
      }
      return res.json(updatedTicket);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // POST /api/admin/tickets/:id/respond - Respond to support ticket
  app.post('/api/admin/tickets/:id/respond', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { response: adminResponse, notes, status } = req.body;
      const responseText = adminResponse || notes || '';
      const updates: Record<string, unknown> = {};
      if (responseText) updates.adminNotes = responseText;
      updates.status = status || 'responded';
      const updatedTicket = await storage.updateSupportTicket(id, updates);
      return res.json({ success: true, ticket: updatedTicket, message: 'Reply sent successfully' });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to respond to ticket' });
    }
  });

  // ==================== AUTH ENDPOINTS ====================

  // LOGIN - Supabase Auth + Auto-sync to users table
  app.post('/api/auth/login', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!data.session || !data.user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const supabaseUser = data.user;

      // Sync user to users table
      let dbUser = await storage.getUserByEmail(email);
      
      if (!dbUser) {
        dbUser = await storage.createUser({
          username: email.split('@')[0],
          email: email,
          password: randomUUID(),
          firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0],
          lastName: supabaseUser.user_metadata?.last_name || 'User',
          phone: supabaseUser.user_metadata?.phone || '',
          profession: 'Not provided',
          accountNumber: `${generateAccountNumber()}`,
          accountId: randomUUID(),
          balance: '0',
          isActive: false,
          isVerified: false,
          transferPin: supabaseUser.user_metadata?.transfer_pin || '',
          role: supabaseUser.app_metadata?.role || 'customer'
        });
        
        await storage.createAccount({
          userId: dbUser.id,
          accountNumber: `${generateAccountNumber()}`,
          accountType: 'checking',
          balance: '0.00',
          currency: 'USD',
          status: 'active'
        });
      } else {
        const userAccounts = await storage.getUserAccounts(dbUser.id);
        if (userAccounts.length === 0) {
          await storage.createAccount({
            userId: dbUser.id,
            accountNumber: `${generateAccountNumber()}`,
            accountType: 'checking',
            balance: '0.00',
            currency: 'USD',
            status: 'active'
          });
        }
        const supabaseRole = supabaseUser.app_metadata?.role || 'customer';
        const updates: Record<string, unknown> = { lastLogin: new Date() };
        if (dbUser.role !== supabaseRole) {
          updates.role = supabaseRole;
        }
        await storage.updateUser(dbUser.id, updates);
        const refreshed = await storage.getUserByEmail(email);
        if (refreshed) dbUser = refreshed;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        return res.status(500).json({ error: 'Failed to generate authentication token' });
      }

      return res.json({ 
        token: accessToken,
        refreshToken: data.session?.refresh_token,
        user: dbUser
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Login failed', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });

  // LOGOUT
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      // Extract the access token from the Authorization header
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.replace('Bearer ', '');

      // Use service role key to properly sign out the user's session
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Revoke the refresh token if provided
      const { refreshToken } = req.body || {};
      if (refreshToken) {
        await supabaseAdmin.auth.admin.signOut(refreshToken, 'refresh_token').catch(() => {});
      }

      // Also try to revoke the access token's session
      if (accessToken) {
        await supabaseAdmin.auth.admin.signOut(accessToken, 'access_token').catch(() => {});
      }

      return res.json({ message: "Logged out successfully", status: "ok" });
    } catch (error: unknown) {
      return res.json({ message: "Logged out successfully", status: "ok" });
    }
  });

  // POST /api/auth/refresh - Refresh session token
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      return res.json({
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: { id: data.user?.id, email: data.user?.email }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Token refresh failed' });
    }
  });

  // Admin login
  app.post('/api/admin/login', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
      const role = data.user.app_metadata?.role || 'customer';
      if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        return res.status(500).json({ error: 'Failed to generate authentication token' });
      }
      return res.json({ 
        token: accessToken,
        refreshToken: data.session?.refresh_token,
        user: { id: data.user.id, email: data.user.email, role }
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  // ==================== PAYMENT REQUESTS ====================

  // GET /api/payment-requests
  app.get('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        allTxns.push(...txns);
      }
      const paymentRequests = allTxns.filter((t: Transaction) => t.type === 'payment_request' || (t.description?.toLowerCase()?.includes('payment request')));
      return res.json(paymentRequests);
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  // POST /api/payment-requests - Create a payment request
  app.post('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency = 'USD', description, recipientName } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount required' });
      }
      const reference = `PR-${Date.now()}-${randomUUID().substring(0, 8).toUpperCase()}`;
      const transactionData = {
        fromUserId: req.user!.id,
        amount: String(amount),
        currency,
        transactionType: 'payment_request',
        status: 'pending',
        referenceNumber: reference,
        description: description || `Payment request to ${recipientName || 'recipient'}`,
        recipientName: recipientName || '',
      };
      const transaction = await storage.createTransaction(transactionData);
      return res.json({ success: true, reference, transaction });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create payment request' });
    }
  });

  // POST /api/add-funds - Add funds to account
  app.post('/api/add-funds', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { method, amount } = req.body;
      if (!method || !amount || isNaN(parseFloat(String(amount))) || parseFloat(String(amount)) <= 0) {
        return res.status(400).json({ error: 'Method and valid amount are required' });
      }
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const parsedAmount = parseFloat(String(amount));

      try {
        // Update balance first
        const updated = await storage.updateUserBalance(user.id, parsedAmount);
        if (!updated) {
          return res.status(500).json({ error: 'Failed to update balance' });
        }
        // Then create transaction record
        const transaction = await storage.createTransaction({
          fromAccountId: accounts[0].id,
          type: 'deposit',
          amount: parsedAmount.toString(),
          description: `Funds added via ${method}`,
          status: 'completed',
          currency: 'USD',
          referenceNumber: `DEP-${Date.now()}`,
          createdAt: new Date()
        });

        // Auto-create alert on transaction
        await supabase.from('alerts').insert({
          user_id: req.user!.id,
          title: 'Funds Added',
          message: `${parsedAmount.toFixed(2)} has been added to your account via ${method}.`,
          type: 'success',
          priority: 'normal',
          is_read: false
        });

        return res.json({ success: true, transaction, amount: parsedAmount, newBalance: updated.balance });
      } catch (error) {
        // If transaction creation fails, reverse the balance update
        await storage.updateUserBalance(user.id, -parsedAmount);
        return res.status(500).json({ error: 'Failed to complete deposit' });
      }
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to add funds' });
    }
  });

  // ==================== SUPPLEMENTARY ENDPOINTS ====================

  app.get('/api/transactions/recent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        allTxns.push(...txns);
      }
      allTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns.slice(0, 10));
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  app.get('/api/currencies', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([
      { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
      { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
      { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
    ]);
  });

  app.get('/api/admin/customers-list', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      const customerList = customers.filter((user: User) => user.role === 'customer');
      return res.json(customerList);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch customers list' });
    }
  });

  app.get('/api/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(sanitizeUsers(users));
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/card-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id, 20);
        allTxns.push(...txns);
      }
      return res.json(allTxns.slice(0, 30));
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  app.get('/api/wallet-balance', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({
        balance: parseFloat(String(user.balance || '0')),
        currency: 'USD',
        available: parseFloat(String(user.balance || '0')),
        pending: 0
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
  });

  app.get('/api/wallet-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      return res.json(txns);
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  app.get('/api/mobile-payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      const mobilePayments = txns.filter((t: Transaction) => t.type === 'mobile_pay' || t.description?.toLowerCase().includes('mobile'));
      return res.json(mobilePayments);
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  app.get('/api/mobile-pay/merchants', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([
      { id: 1, name: 'Apple Pay', logo: '🍎', category: 'Digital Wallet' },
      { id: 2, name: 'Google Pay', logo: '🔵', category: 'Digital Wallet' },
      { id: 3, name: 'Samsung Pay', logo: '📱', category: 'Digital Wallet' },
      { id: 4, name: 'PayPal', logo: '💙', category: 'Online Payment' },
      { id: 5, name: 'Venmo', logo: '💜', category: 'P2P Transfer' },
      { id: 6, name: 'Cash App', logo: '💚', category: 'P2P Transfer' },
      { id: 7, name: 'Zelle', logo: '🟣', category: 'Bank Transfer' },
    ]);
  });

  app.get('/api/user/activity-log', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      const recentActivity: Record<string, unknown>[] = [];
      if (accounts && accounts.length > 0) {
        const txns = await storage.getAccountTransactions(accounts[0].id, 10);
        txns.forEach((t: Transaction) => {
          recentActivity.push({
            id: t.id,
            action: `${t.type || 'Transaction'} of $${t.amount}`,
            timestamp: t.createdAt,
            ipAddress: '***.***.*.***',
            device: 'Web Browser',
            status: t.status || 'completed'
          });
        });
      }
      recentActivity.unshift({
        id: 'login-recent',
        action: 'Account login',
        timestamp: user.lastLogin || new Date().toISOString(),
        ipAddress: req.ip || '***',
        device: req.get('user-agent')?.substring(0, 30) || 'Unknown',
        status: 'success'
      });
      return res.json(recentActivity);
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  app.get('/api/user/trusted-devices', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([
      {
        id: 1,
        name: 'Current Browser',
        type: 'web',
        lastUsed: new Date().toISOString(),
        trusted: true,
        current: true
      }
    ]);
  });

  // Admin transaction routes
  app.get('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      return res.json(allTransactions.map((t: Transaction) => ({
        id: t.id,
        amount: t.amount,
        currency: t.currency || 'USD',
        status: t.status,
        type: t.type,
        description: t.description,
        recipientName: t.recipientName,
        createdAt: t.createdAt
      })));
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transaction routes' });
    }
  });

  app.patch('/api/admin/transaction-routes/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { status, notes } = req.body;
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id || 0;
      const transaction = await storage.updateTransactionStatus(id, status, adminId, notes);
      return res.json({ success: true, transaction });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update transaction route' });
    }
  });

  app.post('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, amount, description, type, status } = req.body;
      const transaction = await storage.createTransaction({
        fromAccountId: accountId,
        type: type || 'transfer',
        amount: String(amount),
        description,
        status: status || 'pending',
        createdAt: new Date()
      });
      return res.json({ success: true, transaction });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to create transaction route' });
    }
  });

  // ==================== RECENT CONTACTS ====================

  app.get('/api/recent-contacts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('recent_contacts')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('updated_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // ==================== LOANS ENDPOINTS ====================

  // GET /api/loans - Get all loans for the authenticated user
  app.get('/api/loans', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/loans/apply - Apply for a new loan
  app.post('/api/loans/apply', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { loanType, principalAmount, interestRate, termMonths, transferPin } = req.body;
      if (!loanType || !principalAmount || !interestRate || !termMonths) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const principal = Number(principalAmount);
      const rate = Number(interestRate);
      const term = Number(termMonths);
      if (isNaN(principal) || principal <= 0) return res.status(400).json({ error: 'Invalid principal amount' });
      if (isNaN(rate) || rate < 0 || rate > 100) return res.status(400).json({ error: 'Invalid interest rate' });
      if (isNaN(term) || term < 1 || term > 360) return res.status(400).json({ error: 'Invalid term (must be 1-360 months)' });
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.transferPin) return res.status(400).json({ error: 'PIN not set' });
      const pinMatch = await bcrypt.compare(String(transferPin), user.transferPin);
      if (!pinMatch) return res.status(400).json({ error: 'Invalid PIN' });

      const monthlyPayment = (Number(principalAmount) * (Number(interestRate) / 100 / 12)) / (1 - Math.pow(1 + Number(interestRate) / 100 / 12, -Number(termMonths)));
      const totalInterest = monthlyPayment * Number(termMonths) - Number(principalAmount);
      const totalPayable = Number(principalAmount) + totalInterest;
      const loanNumber = `LN${Date.now()}${Math.floor(Math.random() * 10000)}`;

      const { data, error } = await supabase
        .from('loans')
        .insert({
          user_id: req.user!.id,
          loan_number: loanNumber,
          loan_type: loanType,
          principal_amount: String(principalAmount),
          interest_rate: String(interestRate),
          term_months: termMonths,
          monthly_payment: monthlyPayment.toFixed(2),
          remaining_balance: String(principalAmount),
          total_interest: totalInterest.toFixed(2),
          total_payable: totalPayable.toFixed(2),
          status: 'pending'
        })
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/loans/:id/approve - Approve a loan (admin only)
  app.post('/api/loans/:id/approve', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: loan, error: loanError } = await supabase.from('loans').select('*').eq('id', req.params.id).single();
      if (loanError || !loan) return res.status(404).json({ error: 'Loan not found' });
      if (loan.status !== 'pending') return res.status(400).json({ error: 'Loan is not in pending status' });
      const { data, error } = await supabase
        .from('loans')
        .update({
          status: 'approved',
          approved_by: req.user!.id,
          approved_at: new Date().toISOString(),
          disbursement_date: new Date().toISOString(),
          maturity_date: new Date(Date.now() + (loan.term_months * 30 * 24 * 60 * 60 * 1000)).toISOString()
        })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;

      // Disburse loan funds to user account
      const { data: account } = await supabase.from('accounts').select('id, balance').eq('user_id', loan.user_id).eq('status', 'active').limit(1).single();
      if (account) {
        const newBalance = (parseFloat(String((account as Record<string, unknown>).balance || '0')) + parseFloat(String(loan.principal_amount))).toFixed(2);
        await supabase.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', (account as Record<string, unknown>).id);

        // Create disbursement transaction
        await supabase.from('transactions').insert({
          from_account_id: null,
          to_account_id: (account as Record<string, unknown>).id,
          from_user_id: null,
          to_user_id: loan.user_id,
          amount: parseFloat(String(loan.principal_amount)).toFixed(2),
          currency: 'USD',
          transaction_type: 'loan_disbursement',
          category: 'loan',
          status: 'completed',
          description: `Loan disbursement - ${loan.loan_type} - ${loan.loan_number}`,
          reference_number: `LOAN${Date.now()}${Math.floor(Math.random() * 10000)}`,
          processed_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

        // Create alert for user
        await supabase.from('alerts').insert({
          user_id: loan.user_id,
          title: 'Loan Approved',
          message: `Your ${loan.loan_type} loan of ${parseFloat(String(loan.principal_amount)).toFixed(2)} has been approved and disbursed to your account.`,
          type: 'success',
          priority: 'high',
          is_read: false
        });
      }

      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/loans/:id/reject - Reject a loan (admin only)
  app.post('/api/loans/:id/reject', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: loan, error: loanError } = await supabase.from('loans').select('status').eq('id', req.params.id).single();
      if (loanError || !loan) return res.status(404).json({ error: 'Loan not found' });
      if (loan.status !== 'pending') return res.status(400).json({ error: 'Loan is not in pending status' });
      const { data, error } = await supabase
        .from('loans')
        .update({ status: 'rejected' })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // GET /api/admin/pending-loans - Get pending loans (admin only)
  app.get('/api/admin/pending-loans', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // ==================== ADMIN USER MANAGEMENT ====================

  app.post('/api/admin/create-admin-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and fullName are required' });
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: 'admin' },
        user_metadata: {}
      });
      if (authError || !authData.user) {
        return res.status(500).json({ error: authError?.message || 'Failed to create admin auth account' });
      }
      const adminPin = generateTransferPin();
      const adminPinHash = await bcrypt.hash(adminPin, 12);
      try {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || 'Admin';
        const adminUser = await storage.createUser({
          username: email.split('@')[0] + '_admin',
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: '+1-000-000-0000',
          accountNumber: `ADMIN-${generateAccountNumber()}`,
          accountId: randomUUID(),
          password: randomUUID(),
          transferPin: adminPinHash,
          role: 'admin',
          isVerified: true,
          isActive: true,
          balance: "0",
          dateOfBirth: '1990-01-01',
          address: 'World Bank HQ',
          city: 'Washington',
          state: 'DC',
          country: 'United States',
          postalCode: '20001',
          profession: 'Administrator',
          annualIncome: 'N/A',
          idType: 'Staff ID',
          idNumber: 'ADMIN-001'
        });
        return res.status(201).json({ 
          success: true,
          message: 'Admin user created successfully',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            fullName: `${adminUser.firstName} ${adminUser.lastName}`,
            role: adminUser.role
          },
          credentials: { email, note: 'Password was provided during creation' }
        });
      } catch (dbError: unknown) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Admin user creation failed', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });

  app.post('/api/admin/set-user-role', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, email, role } = req.body;
      if (!role || !['admin', 'customer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be "admin" or "customer"' });
      }
      if (!userId && !email) {
        return res.status(400).json({ error: 'userId or email required' });
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      let supabaseUserId = userId;
      if (!supabaseUserId && email) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const found = users?.users?.find((u: { id?: string; email?: string }) => u.email === email);
        if (!found) return res.status(404).json({ error: 'User not found in Supabase Auth' });
        supabaseUserId = found.id;
      }
      const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
        app_metadata: { role }
      });
      if (supabaseError) {
        return res.status(500).json({ error: 'Failed to update Supabase role', details: supabaseError.message });
      }
      const targetUser = email
        ? await storage.getUserByEmail(email)
        : await storage.getUser(supabaseUserId);
      if (targetUser) {
        await storage.updateUser(targetUser.id, { role });
      }
      return res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to set user role', details: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  app.post('/api/admin/reset-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        return res.status(500).json({ error: 'Failed to list users' });
      }
      const userToUpdate = users.users.find((u: { id?: string; email?: string }) => u.email === email);
      if (!userToUpdate) {
        return res.status(404).json({ error: 'User not found in Supabase Auth' });
      }
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userToUpdate.id,
        { password: newPassword }
      );
      if (updateError) {
        return res.status(500).json({ error: 'Failed to reset password', details: updateError.message });
      }
      return res.json({ success: true, message: `Password reset successfully for ${email}.`, email });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to reset password', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });

  app.post('/api/admin/delete-user/:email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        return res.status(500).json({ error: 'Failed to list users' });
      }
      const userToDelete = users.users.find((u: { id?: string; email?: string }) => u.email === email);
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found in Supabase Auth' });
      }
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      if (deleteAuthError) {
        return res.status(500).json({ error: 'Failed to delete from authentication system' });
      }
      return res.json({ success: true, message: `User ${email} deleted successfully`, deleted_email: email });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to delete user', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });

  // Transaction reversal
  app.post('/api/transactions/:id/reverse', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const txnId = id;
      if (!txnId) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
      }
      const allTransactions = await storage.getAllTransactions();
      const transaction = allTransactions.find((t: Transaction) => t.id === txnId);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      if (transaction.status === 'reversed') {
        return res.status(400).json({ error: 'Transaction already reversed' });
      }
      if (transaction.fromAccountId) {
        const fromAccount = await storage.getAccount(transaction.fromAccountId);
        if (fromAccount) {
          const refundAmount = parseFloat(String(transaction.amount)) || 0;
          const currentBalance = parseFloat(String(fromAccount.balance)) || 0;
          const newBalance = currentBalance + refundAmount;
          if (storage.updateAccount) {
            await storage.updateAccount(transaction.fromAccountId, { balance: newBalance.toString() });
          }
        }
      }
      const reversalTxn = await storage.createTransaction({
        fromAccountId: transaction.toAccountId || transaction.fromAccountId,
        toAccountId: transaction.fromAccountId,
        type: 'reversal',
        amount: String(transaction.amount),
        status: 'reversed',
        description: `Reversal of transaction #${txnId}. Reason: ${reason || 'No reason provided'}`,
        currency: transaction.currency || 'USD'
      });
      await storage.updateTransactionStatus(txnId, 'reversed', req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : req.user.id) : 1, reason);
      return res.json({ 
        success: true, 
        message: 'Transaction reversed successfully',
        reversalTransactionId: reversalTxn.id,
        amountRefunded: transaction.amount
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to reverse transaction', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });

  // Statements endpoint
  app.get('/api/statements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = typeof req.user?.id === 'number' ? req.user.id : (String(req.user?.id) || '0');
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const statements = await storage.getStatementsByUserId(userId);
      return res.json(statements);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch statements' });
    }
  });

  // File upload
  app.post('/api/objects/upload', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { file, fileName, fileType } = req.body;
      if (!file || !fileName) {
        return res.status(400).json({ error: 'Missing file or fileName' });
      }
      const fileId = `upload_${Date.now()}_${randomUUID().substring(0, 8)}`;
      return res.json({
        success: true,
        fileId,
        fileName,
        fileType: fileType || 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        url: `/uploads/${fileId}`,
        message: 'File uploaded successfully'
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Admin list users
  app.get('/api/admin/list-users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        return res.status(500).json({ error: 'Failed to list users', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
      }
      return res.json({
        total: data.users.length,
        users: data.users.map((u: { id?: string; email?: string; app_metadata?: { role?: string }; email_confirmed_at?: string }) => ({
          id: u.id,
          email: u.email,
          role: u.app_metadata?.role || 'customer',
          verified: u.email_confirmed_at ? 'yes' : 'no'
        }))
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to list users', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });

  // Admin profile photo
  app.post('/api/admin/users/:id/profile-photo', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { photoUrl } = req.body;
      if (!id || !photoUrl) {
        return res.status(400).json({ error: 'User ID and photo URL required' });
      }
      const updatedUser = await storage.updateUser(id, { profilePhoto: photoUrl });
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ success: true, message: 'Profile photo updated successfully', user: updatedUser });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to upload profile photo', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });

  // ==================== MISSING API ENDPOINTS ====================

  // -------- Cards endpoints --------

  // GET /api/cards - list user's cards
  app.get('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/cards/lock - lock/unlock a card
  app.post('/api/cards/lock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, locked } = req.body;
      if (!cardId) return res.status(400).json({ error: 'Card ID required' });
      const { data, error } = await supabase.from('cards').update({
        status: locked ? 'locked' : 'active',
        updated_at: new Date().toISOString()
      }).eq('id', cardId).eq('user_id', req.user!.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/cards/settings - update card settings
  app.post('/api/cards/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, dailyLimit, monthlyLimit, isContactless } = req.body;
      if (!cardId) return res.status(400).json({ error: 'Card ID required' });
      const { data, error } = await supabase.from('cards').update({
        daily_limit: dailyLimit,
        monthly_limit: monthlyLimit,
        is_contactless: isContactless,
        updated_at: new Date().toISOString()
      }).eq('id', cardId).eq('user_id', req.user!.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Alerts endpoints --------

  // GET /api/alerts - list user's alerts
  app.get('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // PATCH /api/alerts/:id/read - mark alert as read
  app.patch('/api/alerts/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('alerts').update({
        is_read: true,
        read_at: new Date().toISOString()
      }).eq('id', req.params.id).eq('user_id', req.user!.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // DELETE /api/alerts/:id - delete an alert
  app.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Investments endpoints --------

  // GET /api/investments - list user's investments
  app.get('/api/investments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // GET /api/market-rates - get market rates from forex table
  app.get('/api/market-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('forex').select('*').order('currency', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Currency exchange endpoint --------

  // POST /api/currency-exchange - exchange currency
  app.post('/api/currency-exchange', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      if (!fromCurrency || !toCurrency || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

      // Get exchange rate
      const { data: rate, error: rateError } = await supabase.from('forex').select('rate').eq('currency', toCurrency).single();
      if (rateError || !rate) return res.status(400).json({ error: 'Exchange rate not found' });

      const exchangeRate = parseFloat(String((rate as Record<string, unknown>).rate));
      const convertedAmount = numAmount * exchangeRate;

      // Check balance first
      const { data: userAccount } = await supabase.from('accounts').select('balance').eq('user_id', req.user!.id).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const currentBalance = parseFloat(String((userAccount as Record<string, unknown>).balance || '0'));
      if (currentBalance < numAmount) return res.status(400).json({ error: 'Insufficient funds' });

      // Debit the amount
      const newBalance = (currentBalance - numAmount).toFixed(2);
      await supabase.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', req.user!.id).eq('status', 'active');

      // Create transaction record
      const reference = `EXC${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data: txn, error: txnError } = await supabase.from('transactions').insert({
        from_account_id: null,
        to_account_id: null,
        from_user_id: req.user!.id,
        amount: numAmount.toFixed(2),
        currency: fromCurrency,
        exchange_rate: exchangeRate.toFixed(4),
        converted_amount: convertedAmount.toFixed(2),
        transaction_type: 'currency_exchange',
        category: 'exchange',
        status: 'completed',
        description: `Currency exchange: ${numAmount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}`,
        reference_number: reference,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }).select().single();
      if (txnError) throw txnError;

      return res.json({ transaction: txn, convertedAmount: convertedAmount.toFixed(2), rate: exchangeRate });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Support tickets endpoints --------

  // GET /api/support-tickets - list user's support tickets
  app.get('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/support-tickets - create a support ticket
  app.post('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { subject, description, priority } = req.body;
      if (!subject || !description) return res.status(400).json({ error: 'Subject and description required' });
      const ticketId = `TKT${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('support_tickets').insert({
        user_id: req.user!.id,
        ticket_id: ticketId,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open'
      }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // GET /api/admin/support-tickets - list all support tickets (admin)
  app.get('/api/admin/support-tickets', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Admin transactions list endpoints --------

  // GET /api/admin/transactions - list all transactions (admin)
  app.get('/api/admin/transactions', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/admin/transactions - create transaction (admin)
  app.post('/api/admin/transactions', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, userId, amount, type, description } = req.body;
      if (!accountId || !amount || !type) return res.status(400).json({ error: 'Missing required fields' });
      const reference = `ADM${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('transactions').insert({
        from_account_id: accountId,
        to_account_id: null,
        from_user_id: userId || req.user!.id,
        amount: Number(amount).toFixed(2),
        transaction_type: type,
        category: 'admin',
        status: 'completed',
        description: description || 'Admin transaction',
        reference_number: reference,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Savings endpoint --------

  // GET /api/savings - list user's savings accounts
  app.get('/api/savings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('savings').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/savings - create a savings account
  app.post('/api/savings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountType, initialDeposit, goalName, targetAmount } = req.body;
      const supabaseClient = getAdminClient();
      const deposit = parseFloat(String(initialDeposit || '0'));
      if (isNaN(deposit) || deposit < 0) return res.status(400).json({ error: 'Invalid deposit amount' });

      // Check balance if initial deposit
      if (deposit > 0) {
        const { data: userAccount } = await supabaseClient.from('accounts').select('balance').eq('user_id', req.user!.id).eq('status', 'active').limit(1).single();
        if (!userAccount) return res.status(404).json({ error: 'Account not found' });
        const currentBalance = parseFloat(String((userAccount as Record<string, unknown>).balance || '0'));
        if (currentBalance < deposit) return res.status(400).json({ error: 'Insufficient funds for initial deposit' });
        // Debit from checking
        const newBalance = (currentBalance - deposit).toFixed(2);
        await supabaseClient.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', req.user!.id).eq('status', 'active');
      }

      const savingsNumber = `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabaseClient.from('savings').insert({
        user_id: req.user!.id,
        account_number: savingsNumber,
        account_type: accountType || 'savings',
        balance: deposit.toFixed(2),
        goal_name: goalName || null,
        target_amount: targetAmount || null,
        interest_rate: '2.50',
        status: 'active'
      }).select().single();
      if (error) throw error;

      if (deposit > 0) {
        await supabaseClient.from('transactions').insert({
          from_user_id: req.user!.id,
          to_user_id: req.user!.id,
          amount: deposit.toFixed(2),
          currency: 'USD',
          transaction_type: 'savings_deposit',
          category: 'savings',
          status: 'completed',
          description: `Initial deposit to savings account ${savingsNumber}`,
          reference_number: `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`,
          processed_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });
      }

      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/savings/deposit - deposit to savings
  app.post('/api/savings/deposit', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { savingsId, amount } = req.body;
      if (!savingsId || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

      const supabaseClient = getAdminClient();
      // Check and debit checking account
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user!.id).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const currentBalance = parseFloat(String((userAccount as Record<string, unknown>).balance || '0'));
      if (currentBalance < numAmount) return res.status(400).json({ error: 'Insufficient funds' });

      const newCheckingBalance = (currentBalance - numAmount).toFixed(2);
      await supabaseClient.from('accounts').update({ balance: newCheckingBalance, updated_at: new Date().toISOString() }).eq('id', (userAccount as Record<string, unknown>).id);

      // Credit savings account
      const { data: savings } = await supabaseClient.from('savings').select('balance').eq('id', savingsId).eq('user_id', req.user!.id).single();
      if (!savings) return res.status(404).json({ error: 'Savings account not found' });
      const newSavingsBalance = (parseFloat(String((savings as Record<string, unknown>).balance || '0')) + numAmount).toFixed(2);
      await supabaseClient.from('savings').update({ balance: newSavingsBalance, updated_at: new Date().toISOString() }).eq('id', savingsId);

      await supabaseClient.from('transactions').insert({
        from_user_id: req.user!.id,
        to_user_id: req.user!.id,
        amount: numAmount.toFixed(2),
        currency: 'USD',
        transaction_type: 'savings_deposit',
        category: 'savings',
        status: 'completed',
        description: `Deposit to savings account`,
        reference_number: `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

      return res.json({ success: true, newSavingsBalance });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/savings/withdraw - withdraw from savings
  app.post('/api/savings/withdraw', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { savingsId, amount } = req.body;
      if (!savingsId || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

      const supabaseClient = getAdminClient();
      const { data: savings } = await supabaseClient.from('savings').select('balance').eq('id', savingsId).eq('user_id', req.user!.id).single();
      if (!savings) return res.status(404).json({ error: 'Savings account not found' });
      const savingsBalance = parseFloat(String((savings as Record<string, unknown>).balance || '0'));
      if (savingsBalance < numAmount) return res.status(400).json({ error: 'Insufficient savings balance' });

      // Debit savings
      const newSavingsBalance = (savingsBalance - numAmount).toFixed(2);
      await supabaseClient.from('savings').update({ balance: newSavingsBalance, updated_at: new Date().toISOString() }).eq('id', savingsId);

      // Credit checking
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user!.id).eq('status', 'active').limit(1).single();
      if (userAccount) {
        const newCheckingBalance = (parseFloat(String((userAccount as Record<string, unknown>).balance || '0')) + numAmount).toFixed(2);
        await supabaseClient.from('accounts').update({ balance: newCheckingBalance, updated_at: new Date().toISOString() }).eq('id', (userAccount as Record<string, unknown>).id);
      }

      await supabaseClient.from('transactions').insert({
        from_user_id: req.user!.id,
        to_user_id: req.user!.id,
        amount: numAmount.toFixed(2),
        currency: 'USD',
        transaction_type: 'savings_withdrawal',
        category: 'savings',
        status: 'completed',
        description: `Withdrawal from savings account`,
        reference_number: `SAW${Date.now()}${Math.floor(Math.random() * 10000)}`,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

      return res.json({ success: true, newSavingsBalance });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Investment endpoints --------

  // POST /api/investments/buy - buy an investment
  app.post('/api/investments/buy', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { symbol, assetType, shares, price } = req.body;
      if (!symbol || !shares || !price) return res.status(400).json({ error: 'Missing required fields' });
      const numShares = parseFloat(String(shares));
      const numPrice = parseFloat(String(price));
      if (isNaN(numShares) || numShares <= 0) return res.status(400).json({ error: 'Invalid shares amount' });
      if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ error: 'Invalid price' });

      const totalCost = numShares * numPrice;
      const supabaseClient = getAdminClient();

      // Check balance
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user!.id).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const currentBalance = parseFloat(String((userAccount as Record<string, unknown>).balance || '0'));
      if (currentBalance < totalCost) return res.status(400).json({ error: 'Insufficient funds' });

      // Debit account
      const newBalance = (currentBalance - totalCost).toFixed(2);
      await supabaseClient.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', (userAccount as Record<string, unknown>).id);

      // Create or update investment
      const { data: existing } = await supabaseClient.from('investments').select('id, shares, average_price').eq('user_id', req.user!.id).eq('symbol', symbol).limit(1);
      if (existing && existing.length > 0) {
        const existingShares = parseFloat(String((existing[0] as Record<string, unknown>).shares || '0'));
        const existingAvg = parseFloat(String((existing[0] as Record<string, unknown>).average_price || '0'));
        const newTotalShares = existingShares + numShares;
        const newAvgPrice = ((existingAvg * existingShares) + (numPrice * numShares)) / newTotalShares;
        await supabaseClient.from('investments').update({
          shares: newTotalShares.toString(),
          average_price: newAvgPrice.toFixed(2),
          current_price: numPrice.toFixed(2),
          updated_at: new Date().toISOString()
        }).eq('id', (existing[0] as Record<string, unknown>).id);
      } else {
        await supabaseClient.from('investments').insert({
          user_id: req.user!.id,
          symbol,
          asset_type: assetType || 'stock',
          shares: numShares.toString(),
          average_price: numPrice.toFixed(2),
          current_price: numPrice.toFixed(2),
          status: 'active'
        });
      }

      // Create transaction
      await supabaseClient.from('transactions').insert({
        from_user_id: req.user!.id,
        amount: totalCost.toFixed(2),
        currency: 'USD',
        transaction_type: 'investment_buy',
        category: 'investment',
        status: 'completed',
        description: `Bought ${numShares} shares of ${symbol} at ${numPrice.toFixed(2)}`,
        reference_number: `INV${Date.now()}${Math.floor(Math.random() * 10000)}`,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

      return res.json({ success: true, totalCost: totalCost.toFixed(2), newBalance });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // POST /api/investments/sell - sell an investment
  app.post('/api/investments/sell', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { investmentId, shares, price } = req.body;
      if (!investmentId || !shares || !price) return res.status(400).json({ error: 'Missing required fields' });
      const numShares = parseFloat(String(shares));
      const numPrice = parseFloat(String(price));
      if (isNaN(numShares) || numShares <= 0) return res.status(400).json({ error: 'Invalid shares amount' });
      if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ error: 'Invalid price' });

      const totalProceeds = numShares * numPrice;
      const supabaseClient = getAdminClient();

      // Check investment
      const { data: investment } = await supabaseClient.from('investments').select('id, shares, average_price, symbol').eq('id', investmentId).eq('user_id', req.user!.id).single();
      if (!investment) return res.status(404).json({ error: 'Investment not found' });
      const heldShares = parseFloat(String((investment as Record<string, unknown>).shares || '0'));
      if (heldShares < numShares) return res.status(400).json({ error: 'Insufficient shares' });

      // Credit account
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user!.id).eq('status', 'active').limit(1).single();
      if (userAccount) {
        const newBalance = (parseFloat(String((userAccount as Record<string, unknown>).balance || '0')) + totalProceeds).toFixed(2);
        await supabaseClient.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', (userAccount as Record<string, unknown>).id);
      }

      // Update or delete investment
      const remainingShares = heldShares - numShares;
      if (remainingShares > 0) {
        await supabaseClient.from('investments').update({ shares: remainingShares.toString(), current_price: numPrice.toFixed(2), updated_at: new Date().toISOString() }).eq('id', investmentId);
      } else {
        await supabaseClient.from('investments').update({ shares: '0', status: 'sold', updated_at: new Date().toISOString() }).eq('id', investmentId);
      }

      const symbol = (investment as Record<string, unknown>).symbol as string;
      await supabaseClient.from('transactions').insert({
        from_user_id: null,
        to_user_id: req.user!.id,
        amount: totalProceeds.toFixed(2),
        currency: 'USD',
        transaction_type: 'investment_sell',
        category: 'investment',
        status: 'completed',
        description: `Sold ${numShares} shares of ${symbol} at ${numPrice.toFixed(2)}`,
        reference_number: `SEL${Date.now()}${Math.floor(Math.random() * 10000)}`,
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

      return res.json({ success: true, totalProceeds: totalProceeds.toFixed(2) });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // -------- Payments endpoint --------

  // GET /api/payments - list user's payments
  app.get('/api/payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('payments').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // Return server
  const httpServer = createServer(app);
  return httpServer;
}

// ==================== LIVE CHAT ENDPOINTS ====================
export async function registerLiveChatRoutes(app: Express) {
  const { getChatHistory, getActiveSessions, createTicketFromChat } = await import('./supabase-live-chat');
  const { supabase } = await import('./supabase-public-storage');
  
  app.get('/api/chat/history', getChatHistory);
  app.get('/api/chat/sessions', requireAdmin, getActiveSessions);
  app.post('/api/chat/create-ticket', requireAuth, createTicketFromChat);

  app.post('/api/chat/send', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });

      let adminUserId = 1;
      try {
        const { data: adminUsers } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single();
        if (adminUsers?.id) adminUserId = adminUsers.id;
      } catch (error: unknown) {
        console.warn('Failed to query admin users:', error instanceof Error ? error.message : 'Unknown error');
      }

      const { data: savedMsg, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          sender_role: 'customer',
          recipient_id: adminUserId,
          recipient_role: 'admin',
          content: message.trim(),
          session_id: `session_${user.id}`,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.json({ success: true, message: 'Message queued', persisted: false });
      }

      const adminChannel = supabase.channel('admin-chat-inbox');
      adminChannel.send({
        type: 'broadcast',
        event: 'new_customer_message',
        payload: {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          message: message.trim(),
          messageId: savedMsg?.id,
          timestamp: new Date().toISOString()
        }
      });

      return res.json({ success: true, messageId: savedMsg?.id });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.post('/api/chat/notify', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, type, message } = req.body;
      const channel = supabase.channel(`notifications:${userId}`);
      channel.send({
        type: 'broadcast',
        event: type,
        payload: { message, timestamp: new Date() }
      });
      return res.json({ success: true });
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
    }
  });
}