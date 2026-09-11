import type { User } from '@shared/schema';
import { generateAccountNumber, generateTransferPin, generateTransactionId, generateReferenceNumber } from './crypto-utils';
import { validateId, validateAmount } from './validators';
import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage-factory';
import { setupTransferRoutes } from './routes-transfer';
import { config, logConfiguration } from './config';
import { createClient } from '@supabase/supabase-js';
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
  currency?: string | null;
  recipientBank?: string | null;
  recipientCountry?: string | null;
  updatedAt?: string | Date | null;
}

interface Investment {
  id: number;
  userId: number;
  type: string;
  symbol: string;
  shares: string;
  averagePrice: string;
  currentPrice: string;
  status: string;
  asset_type?: string;
  assetType?: string;
  total_value?: string | number;
  totalValue?: string | number;
  gain_loss?: string | number;
  gainLoss?: string | number;
}

interface Alert {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean | null;
  createdAt: Date | null;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Fixed route handlers with proper typing
export async function registerFixedRoutes(app: Express): Promise<Server> {
  logConfiguration();
  
  // CRITICAL: Run startup sanity checks to verify database functions
  await runStartupChecks();
  
  // Runtime config endpoint - serves Supabase credentials to frontend
  app.get('/api/config', (req: Request, res: Response) => {
    return res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    });
  });
  
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    return res.json({ status: 'OK', timestamp: new Date() });
  });

  // Get user by Supabase UUID
  app.get('/api/users/supabase/:supabaseId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { supabaseId } = req.params;
      if (!supabaseId) return res.status(400).json({ error: 'Supabase ID required' });
      const user = await storage.getUserBySupabaseId?.(supabaseId) || null;
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get user' });
    }
  });

  app.post('/api/auth/register-complete', registrationRateLimiter, async (req: Request, res: Response) => {
    let supabaseUserId: string | null = null;
    try {
      const registrationData = req.body;
      const validation = validateRequest(registrationSchema, registrationData);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid registration data', details: (validation as { success: false; errors: string[] }).errors });
      }
      const validatedData = validation.data;
      const hashedPin = await bcrypt.hash(validatedData.transferPin, 10);
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: validatedData.email, password: validatedData.password, email_confirm: true,
        user_metadata: { first_name: validatedData.firstName, last_name: validatedData.lastName, phone: validatedData.phone }
      });
      if (authError || !authData.user) return res.status(500).json({ error: authError?.message || 'Failed to create authentication account' });
      supabaseUserId = authData.user.id;
      try {
        const newUser = await storage.createUser({
          username: validatedData.email.split('@')[0], firstName: validatedData.firstName || validatedData.email.split('@')[0],
          lastName: validatedData.lastName || 'User', email: validatedData.email, phone: validatedData.phone,
          dateOfBirth: validatedData.dateOfBirth, address: validatedData.address, city: validatedData.city,
          state: validatedData.state, country: validatedData.country, postalCode: validatedData.postalCode,
          profession: validatedData.profession, annualIncome: validatedData.annualIncome, idType: validatedData.idType,
          idNumber: validatedData.idNumber, accountNumber: `${generateAccountNumber()}`, accountId: Date.now(),
          password: 'supabase_auth', transferPin: hashedPin, role: 'customer', isVerified: false, isActive: false, balance: '0',
        });
        await storage.createAccount({ userId: newUser.id, accountNumber: newUser.accountNumber || `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'pending' });
        const verifyUser = await (storage).getUserByEmail(newUser.email || '');
        if (!verifyUser) throw new Error('User created but not found in database');
        return res.status(201).json({ success: true, message: 'Registration successful. Awaiting admin approval.', user: { email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName } });
      } catch (dbError: unknown) {
        if (supabaseUserId) await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch(() => {});
        return res.status(500).json({ error: 'Database error during registration', details: (dbError as any)?.message });
      }
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Registration failed', details: (error as Error)?.message || 'Unknown error' });
    }
  });

  app.post('/api/auth/check-email', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const existingUser = await (storage).getUserByEmail(email);
      if (existingUser) return res.json({ available: false, message: 'Email already registered in database' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error } = await supabase.auth.admin.listUsers();
      if (!users) return res.status(500).json({ error: 'Failed to fetch users' });
      if (!error && users) {
        const emailExists = users.users.some((u: any) => u.email === email);
        if (emailExists) return res.json({ available: false, message: 'Email already registered in authentication system' });
      }
      return res.json({ available: true, message: 'Email available' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to check email availability. Please try again.' });
    }
  });

  app.post('/api/admin/reset-user-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) return res.status(400).json({ error: 'Email and newPassword are required' });
      if (newPassword.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters with uppercase, lowercase, and numbers' });
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) return res.status(400).json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError || !users) return res.status(500).json({ error: 'Failed to list users' });
      const user = users.users.find((u: any) => u.email === email);
      if (!user) return res.status(404).json({ error: 'User not found in authentication system' });
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
      if (updateError) return res.status(500).json({ error: 'Failed to update password', details: updateError.message });
      return res.json({ success: true, message: 'Password updated successfully', email });
    } catch (error: any) {
      return res.status(500).json({ error: 'Password reset failed', details: error.message || 'Unknown error' });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      if (!userData.email || !userData.supabaseUserId) return res.status(400).json({ error: 'Missing required fields: email and supabaseUserId are required' });
      if (userData.password) return res.status(400).json({ error: 'Invalid request - passwords must not be sent to this endpoint' });
      if (userData.role && userData.role !== 'customer') return res.status(400).json({ error: 'Invalid request - role cannot be set by client' });
      const existingUser = await (storage).getUserByEmail(userData.email);
      if (existingUser) return res.status(409).json({ error: 'User already exists' });
      const newUserPin = generateTransferPin();
      const hashedNewUserPin = await bcrypt.hash(newUserPin, 10);
      const newUser = await storage.createUser({
        username: userData.username || userData.email.split('@')[0], firstName: userData.firstName || userData.email.split('@')[0],
        lastName: userData.lastName || 'User', email: userData.email, phone: userData.phone,
        dateOfBirth: userData.dateOfBirth, address: userData.address, city: userData.city, state: userData.state,
        country: userData.country, postalCode: userData.postalCode, profession: userData.profession,
        annualIncome: userData.annualIncome, idType: userData.idType, idNumber: userData.idNumber,
        accountNumber: userData.accountNumber || `${generateAccountNumber()}`, accountId: Date.now(),
        password: 'supabase_auth', transferPin: hashedNewUserPin, role: 'customer', isVerified: false, isActive: false, balance: '0',
      });
      await storage.createAccount({ userId: newUser.id, accountNumber: `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'pending' });
      return res.status(201).json({ success: true, message: 'User profile created successfully', user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role } });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create user profile', details: error.message || 'Unknown error' });
    }
  });

  app.get('/api/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const email = req.user!.email;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get user', details: error.message });
    }
  });

  app.get('/api/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const email = req.user!.email;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      const cards = await storage.getUserCards(user.id);
      return res.json({ ...user, accounts, cards });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get profile', details: error.message });
    }
  });

  app.get('/api/users/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = validateId(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get user' });
    }
  });

  app.post('/api/user/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  app.post('/api/user/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const preferences = req.body;
      return res.json({ success: true, preferences, message: 'Preferences saved' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to save preferences' });
    }
  });

  app.post('/api/user/upload-avatar', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { avatarUrl } = req.body as { avatarUrl: string };
      if (!avatarUrl) return res.status(400).json({ error: 'Avatar URL required' });
      if (!avatarUrl.startsWith('data:image/')) return res.status(400).json({ error: 'Invalid image format' });
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true, message: 'Profile photo updated successfully', user });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload avatar', details: error.message || 'Unknown error' });
    }
  });

  app.post('/api/accounts/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get user accounts' });
    }
  });

  app.get('/api/admin/accounts', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allAccounts: any[] = [];
      for (const user of allUsers) {
        const userAccounts = await storage.getUserAccounts(user.id);
        userAccounts.forEach(acc => allAccounts.push({ ...acc, ownerEmail: user.email, ownerName: (user as any).fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() }));
      }
      return res.json(allAccounts);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get all accounts' });
    }
  });

  app.post('/api/admin/accounts', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, accountType, accountName, balance, currency, accountNumber, isActive } = req.body;
      if (!userId || !accountType) return res.status(400).json({ error: 'userId and accountType are required' });
      const account = await storage.createAccount({ userId: parseInt(userId), accountType, accountNumber: accountNumber || `${accountType.charAt(0).toUpperCase() + accountType.slice(1)}-${Date.now()}`, balance: balance || '0.00', currency: currency || 'USD', status: isActive !== false ? 'active' : 'frozen' });
      return res.json({ success: true, account });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create account' });
    }
  });

  app.patch('/api/admin/accounts/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedAccount = await (storage as any).updateAccount(id, updates);
      if (!updatedAccount) return res.status(404).json({ error: 'Account not found' });
      return res.json({ success: true, account: updatedAccount });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update account' });
    }
  });

  app.delete('/api/admin/accounts/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedAccount = await (storage as any).updateAccount(id, { isActive: false });
      if (!updatedAccount) return res.status(404).json({ error: 'Account not found' });
      return res.json({ success: true, message: 'Account deactivated successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to deactivate account' });
    }
  });

  app.post('/api/admin/create-transaction', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = req.body as { customerId: string; type: string; amount: string; description: string; category: string; reference: string; status: string };
      const customerIdNum = validateId(body.customerId);
      const accounts = await storage.getUserAccounts(customerIdNum);
      if (accounts.length === 0) return res.status(404).json({ error: 'No accounts found for customer' });
      const primaryAccount = accounts[0];
      const transaction = await storage.createTransaction({ fromAccountId: primaryAccount.id, type: body.type, amount: body.amount, description: body.description, status: body.status || 'completed', createdAt: new Date() });
      if (body.type === 'credit' || body.type === 'debit') {
        const amountNum = validateAmount(body.amount);
        const balanceChange = body.type === 'credit' ? amountNum : -amountNum;
        await storage.updateUserBalance(customerIdNum, balanceChange);
      }
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'create_transaction', targetType: 'transaction', targetId: transaction.id, details: { customerId: customerIdNum, amount: body.amount, type: body.type } });
      return res.json({ success: true, transaction, message: 'Transaction created successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  app.post('/api/admin/accounts/:accountId/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = parseInt(req.params.accountId, 10);
      const body = req.body as { amount: string; description: string; type: 'credit' | 'debit' };
      const amountNum = validateAmount(body.amount);
      const balanceChange = body.type === 'credit' ? amountNum : -amountNum;
      const account = await storage.getAccount(accountId);
      if (!account) return res.status(404).json({ error: 'Account not found' });
      const newBalance = parseFloat((account.balance || '0').toString()) + balanceChange;
      await storage.updateAccount?.(accountId, { balance: newBalance.toString() });
      const transaction = await storage.createTransaction({ fromAccountId: accountId, type: body.type, amount: amountNum.toString(), description: body.description, status: 'success', createdAt: new Date() });
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'update_account_balance', targetType: 'account', targetId: accountId, details: { accountId, amount: body.amount, type: body.type, oldBalance: account.balance, newBalance } });
      return res.json({ success: true, message: 'Account balance updated successfully', newBalance, timestamp: new Date().toISOString() });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update account balance' });
    }
  });

  app.post('/api/admin/customers/:id/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const body = req.body as { amount: string | number; description: string; type?: string };
      const amountNum = parseFloat(String(body.amount));
      if (isNaN(amountNum) || amountNum <= 0) return res.status(400).json({ error: 'Invalid amount' });
      const isCredit = ['credit', 'deposit', 'add', 'fund'].includes((body.type || 'credit').toLowerCase());
      const delta = isCredit ? amountNum : -amountNum;
      const oldUser = await (storage).getUser(customerId);
      const oldBalance = parseFloat(String(oldUser?.balance || '0'));
      const updatedUser = await storage.updateUserBalance(customerId, delta);
      if (!updatedUser) return res.status(404).json({ error: 'Customer not found' });
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'update_customer_balance', targetType: 'user', targetId: customerId, details: { customerId, amount: body.amount, oldBalance: oldUser?.balance, newBalance: updatedUser.balance, description: body.description } });
      const newBalance = parseFloat(String(updatedUser.balance || '0'));
      const userAccounts = await storage.getUserAccounts(customerId);
      if (userAccounts.length > 0) {
        await storage.createTransaction({ fromAccountId: userAccounts[0].id, toAccountId: isCredit ? userAccounts[0].id : undefined, type: isCredit ? 'credit' : 'debit', transactionType: isCredit ? 'deposit' : 'withdrawal', amount: amountNum.toString(), currency: 'USD', description: body.description || (isCredit ? 'Admin credit' : 'Admin debit'), status: 'success', createdAt: new Date() } as any);
      }
      try {
        const { supabase } = await import('./supabase-public-storage');
        const channel = supabase.channel(`user-balance-${customerId}`);
        channel.send({ type: 'broadcast', event: 'balance_update', payload: { userId: customerId, newBalance, oldBalance, delta, timestamp: new Date().toISOString() } });
      } catch (_) {}
      return res.json({ success: true, user: updatedUser, oldBalance, newBalance, delta, message: `Balance ${isCredit ? 'credited' : 'debited'} successfully. New balance: $${newBalance.toFixed(2)}`, timestamp: new Date().toISOString() });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }
  });

  app.patch('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const updates = req.body as Record<string, any>;
      const updatedUser = await storage.updateUser(customerId, updates);
      if (!updatedUser) return res.status(404).json({ error: 'Customer not found' });
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'update_customer', targetType: 'user', targetId: customerId, details: { customerId, updates } });
      return res.json({ success: true, user: updatedUser, message: 'Customer updated successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  app.get('/api/admin/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      return res.json(transactions);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  app.patch('/api/admin/transactions/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const txId = parseInt(req.params.id, 10);
      const body = req.body as { status?: string; description?: string; amount?: string };
      const { supabase: supa } = await import('./supabase-public-storage');
      const updates: Record<string, any> = {};
      if (body.status) updates.status = body.status;
      if (body.description) updates.description = body.description;
      if (body.amount) updates.amount = body.amount;
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supa.from('transactions').update(updates).eq('id', txId).select().single();
      if (error) throw new Error(error.message);
      return res.json({ success: true, transaction: data, message: 'Transaction updated' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update transaction' });
    }
  });

  app.post('/api/verify-pin', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = req.body as { email?: string; username?: string; pin: string };
      const identifier = body.email || body.username;
      if (!identifier || !body.pin) return res.status(400).json({ message: 'Email and PIN required', verified: false });
      const user = await storage.getUserByEmail(identifier);
      if (!user) return res.status(404).json({ message: 'User not found', verified: false });
      if (!user.isActive) return res.status(403).json({ message: 'Your account is pending approval by our customer support team. You will receive a notification once your account is activated.', verified: false, error: 'Account pending approval' });
      if (!user.transferPin || user.transferPin.length === 0) return res.status(400).json({ message: 'PIN not configured for account', verified: false, error: 'Account PIN setup required' });
      let pinMatch = false;
      if (user.transferPin && user.transferPin.startsWith('$2')) {
        pinMatch = await bcrypt.compare(body.pin, user.transferPin);
      } else if (user.transferPin === body.pin) {
        pinMatch = true;
      }
      if (!pinMatch) return res.status(401).json({ message: 'Invalid PIN', verified: false });
      return res.json({ success: true, verified: true });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to verify PIN', verified: false });
    }
  });

  app.get('/api/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) return res.json([]);
      const allTransactions: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        allTransactions.push(...txns);
      }
      allTransactions.sort((a: Transaction, b: Transaction) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTransactions);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.get('/api/accounts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found', message: 'Invalid user credentials' });
      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get accounts' });
    }
  });

  app.get('/api/accounts/:id/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = validateId(req.params.id);
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const userAccounts = await storage.getUserAccounts(user.id);
      const ownsAccount = userAccounts.some(acc => acc.id === accountId);
      if (!ownsAccount) return res.status(403).json({ error: 'Access denied' });
      const transactions = await storage.getAccountTransactions(accountId);
      return res.json(transactions);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  app.get('/api/admin/pending-registrations', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const pending = users.filter(user => !user.isActive && user.role === 'customer');
      return res.json(pending);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get pending registrations' });
    }
  });

  app.post('/api/admin/approve-registration/:registrationId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrationId = validateId(req.params.registrationId);
      const validationData = { registrationId, ...req.body };
      const validation = validateRequest(approvalSchema, validationData);
      if (!validation.success) return res.status(400).json({ error: 'Invalid approval data', details: (validation as { success: false; errors: string[] }).errors });
      const { initialBalance } = validation.data;
      const transaction = new BankingTransaction();
      let updatedUser: User | null = null;
      transaction.addStep({ name: 'Activate user account', execute: async () => { const user = await storage.updateUser(registrationId, { isActive: true, isVerified: true }); if (!user) throw new Error('Registration not found'); updatedUser = user as User; return updatedUser; } });
      transaction.addStep({ name: 'Activate user bank accounts', execute: async () => { const accounts = await storage.getUserAccounts(registrationId); for (const account of accounts) { await storage.updateAccount?.(account.id, { status: 'active' }); } return accounts; } });
      if (initialBalance && initialBalance > 0) transaction.addStep({ name: 'Set initial balance', execute: async () => { await storage.updateUserBalance(registrationId, initialBalance); } });
      const result = await transaction.execute();
      if (!result.success) return res.status(500).json({ error: result.error });
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'approve_registration', targetType: 'user', targetId: registrationId, details: { userId: registrationId, initialBalance: initialBalance || 0 } });
      try {
        const { supabase } = await import('./supabase-public-storage');
        const adminChannel = supabase.channel('admin-actions');
        adminChannel.send({ type: 'broadcast', event: 'registration_approved', payload: { userId: registrationId, approvedBy: admin?.email, user: updatedUser } });
      } catch (error: any) {}
      return res.json({ success: true, message: 'Registration approved successfully', user: updatedUser });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to approve registration' });
    }
  });

  app.post('/api/admin/reject-registration/:registrationId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrationId = validateId(req.params.registrationId);
      const { reason } = req.body;
      const user = await (storage).getUser(registrationId);
      if (!user) return res.status(404).json({ error: 'Registration not found' });
      await storage.updateUser(registrationId, { isActive: false, isVerified: false });
      await storage.createSupportTicket({ userId: registrationId, subject: 'Registration Status - Action Required', description: `Your registration has been reviewed. ${reason || 'Please contact support for more information.'}`, priority: 'high', status: 'open' });
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'reject_registration', targetType: 'user', targetId: registrationId, details: { userId: registrationId, reason } });
      try {
        const { supabase } = await import('./supabase-public-storage');
        const adminChannel = supabase.channel('admin-actions');
        adminChannel.send({ type: 'broadcast', event: 'registration_rejected', payload: { userId: registrationId, rejectedBy: admin?.email, reason } });
      } catch (error: any) {}
      return res.json({ success: true, message: 'Registration rejected successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to reject registration' });
    }
  });

  app.post('/api/user/change-pin', requireAuth, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = validateRequest(pinChangeSchema, req.body);
      if (!validation.success) return res.status(400).json({ error: 'Invalid PIN format', details: (validation as { success: false; errors: string[] }).errors });
      const { currentPin, newPin } = validation.data;
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const pinMatch = await bcrypt.compare(currentPin, user.transferPin || '');
      if (!pinMatch) return res.status(401).json({ message: 'Current PIN is incorrect' });
      const newPinMatch = await bcrypt.compare(newPin, user.transferPin || '');
      if (newPinMatch) return res.status(400).json({ message: 'New PIN must be different from current PIN' });
      const hashedNewPin = await bcrypt.hash(newPin, 10);
      await storage.updateUser(user.id, { transferPin: hashedNewPin });
      return res.json({ success: true, message: 'PIN updated successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to change PIN' });
    }
  });

  app.post('/api/user/change-password', requireAuth, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;
      if (!currentPassword || !newPassword || !confirmNewPassword) return res.status(400).json({ error: 'currentPassword, newPassword, and confirmNewPassword are required' });
      if (newPassword !== confirmNewPassword) return res.status(400).json({ error: 'New passwords do not match' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      if (newPassword === currentPassword) return res.status(400).json({ error: 'New password must be different from current password' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email: req.user!.email, password: currentPassword });
      if (signInError) return res.status(401).json({ error: 'Current password is incorrect' });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError || !users) return res.status(500).json({ error: 'Failed to retrieve user' });
      const supabaseUser = users.users.find((u: any) => u.email === req.user!.email);
      if (!supabaseUser) return res.status(404).json({ error: 'User not found in authentication system' });
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, { password: newPassword });
      if (updateError) return res.status(500).json({ error: 'Failed to update password', details: updateError.message });
      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Password change failed', details: error.message });
    }
  });

  setupTransferRoutes(app);

  app.get('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const cards = await storage.getUserCards(user.id);
      return res.json(cards);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }
  });

  app.get('/api/cards/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cardId = parseInt(req.params.id);
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const card = await storage.getCard(cardId);
      if (!card) return res.status(404).json({ error: 'Card not found' });
      const account = await storage.getAccount(card.accountId);
      if (!account || account.userId !== user.id) return res.status(403).json({ error: 'Access denied' });
      return res.json(card);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch card' });
    }
  });

  app.post('/api/cards/lock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, isLocked } = req.body;
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const card = await storage.getCard(cardId);
      if (!card) return res.status(404).json({ error: 'Card not found' });
      const account = await storage.getAccount(card.accountId);
      if (!account || account.userId !== user.id) return res.status(403).json({ error: 'Access denied' });
      const updatedCard = await storage.updateCard(cardId, { status: isLocked ? 'locked' : 'active' });
      return res.json({ success: true, card: updatedCard });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update card' });
    }
  });

  app.post('/api/cards/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, dailyLimit, contactlessEnabled } = req.body;
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const card = await storage.getCard(cardId);
      if (!card) return res.status(404).json({ error: 'Card not found' });
      const account = await storage.getAccount(card.accountId);
      if (!account || account.userId !== user.id) return res.status(403).json({ error: 'Access denied' });
      const updates: any = {};
      if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
      if (contactlessEnabled !== undefined) updates.contactlessEnabled = contactlessEnabled;
      const updatedCard = await storage.updateCard(cardId, updates);
      return res.json({ success: true, card: updatedCard });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update card settings' });
    }
  });

  app.get('/api/investments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const investments = await storage.getUserInvestments(user.id);
      return res.json(investments);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch investments' });
    }
  });

  app.get('/api/investments/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const investment = await storage.getInvestment(id);
      if (!investment) return res.status(404).json({ error: 'Investment not found' });
      if (investment.userId !== user.id) return res.status(403).json({ error: 'Access denied' });
      return res.json(investment);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch investment' });
    }
  });

  app.get('/api/market-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const marketRates = await (storage).getMarketRates();
      const transformedData: Record<string, any> = {};
      marketRates.forEach((rate: Record<string, any>) => {
        const assetType = rate.asset_type || rate.assetType;
        transformedData[assetType] = { change: rate.change_percent || rate.changePercent || 0, trending: (rate.change_direction || rate.changeDirection || 'up') as 'up' | 'down' };
      });
      return res.json({ stocks: transformedData.stocks || { change: 0, trending: 'up' as const }, bonds: transformedData.bonds || { change: 0, trending: 'up' as const }, crypto: transformedData.crypto || { change: 0, trending: 'up' as const }, forex: transformedData.forex || { change: 0, trending: 'up' as const } });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch market rates' });
    }
  });

  app.get('/api/market-indices', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([
      { name: 'S&P 500', value: '4,783.45', change: '+32.87', changePercent: '+0.69%', trend: 'up' },
      { name: 'NASDAQ', value: '15,310.97', change: '+125.34', changePercent: '+0.83%', trend: 'up' },
      { name: 'DOW JONES', value: '37,248.35', change: '-43.89', changePercent: '-0.12%', trend: 'down' },
      { name: 'FTSE 100', value: '7,733.24', change: '+18.45', changePercent: '+0.24%', trend: 'up' },
      { name: 'DAX', value: '16,784.86', change: '+92.12', changePercent: '+0.55%', trend: 'up' },
      { name: 'NIKKEI 225', value: '33,377.42', change: '-124.56', changePercent: '-0.37%', trend: 'down' }
    ]);
  });

  app.get('/api/top-stocks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([
      { symbol: 'AAPL', name: 'Apple Inc.', price: '$185.92', change: '+2.34', changePercent: '+1.28%', trend: 'up' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: '$378.91', change: '+5.67', changePercent: '+1.52%', trend: 'up' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$142.67', change: '-1.23', changePercent: '-0.85%', trend: 'down' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '$156.78', change: '+3.45', changePercent: '+2.25%', trend: 'up' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '$495.34', change: '+12.87', changePercent: '+2.67%', trend: 'up' },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: '$248.42', change: '-4.56', changePercent: '-1.80%', trend: 'down' }
    ]);
  });

  app.get('/api/portfolio-assets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const investments = await storage.getUserInvestments(user.id);
      const assetAllocation: Record<string, { value: number, allocation: number, change: number }> = {};
      let totalValue = 0;
      investments.forEach((inv: any) => {
        const assetType = inv.asset_type || inv.assetType || 'Other';
        const value = parseFloat(String(inv.total_value || inv.totalValue || 0));
        const gainLoss = parseFloat(String(inv.gain_loss || inv.gainLoss || 0));
        totalValue += value;
        if (!assetAllocation[assetType]) assetAllocation[assetType] = { value: 0, allocation: 0, change: 0 };
        assetAllocation[assetType].value += value;
        assetAllocation[assetType].change += gainLoss;
      });
      const assets = Object.keys(assetAllocation).map(name => ({ name, value: `$${assetAllocation[name].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, allocation: totalValue > 0 ? `${((assetAllocation[name].value / totalValue) * 100).toFixed(1)}%` : '0%', change: assetAllocation[name].change >= 0 ? `+${assetAllocation[name].change.toFixed(2)}%` : `${assetAllocation[name].change.toFixed(2)}%` }));
      return res.json(assets);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch portfolio assets' });
    }
  });

  app.post('/api/currency-exchange', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!fromCurrency || !toCurrency || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const exchangeRates: Record<string, number> = { 'USD': 1.0, 'EUR': 0.92, 'GBP': 0.79, 'JPY': 149.5, 'CNY': 7.24, 'AUD': 1.53, 'CAD': 1.36, 'CHF': 0.88 };
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;
      const convertedAmount = (amount / fromRate) * toRate;
      const exchangeRate = toRate / fromRate;
      return res.json({ success: true, fromCurrency, toCurrency, originalAmount: amount, convertedAmount: +convertedAmount.toFixed(2), exchangeRate: +exchangeRate.toFixed(4), timestamp: new Date().toISOString() });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to process currency exchange' });
    }
  });

  app.get('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const messages = await storage.getUserMessages(user.id);
      return res.json(messages);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.get('/api/messages/user/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const messages = await storage.getUserMessages(user.id);
      return res.json(messages);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch user messages' });
    }
  });

  app.post('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { content, recipientId, sessionId } = req.body;
      if (!content) return res.status(400).json({ error: 'content required' });
      const senderRole = req.user!.role === 'admin' ? 'admin' : 'customer';
      const finalRecipientId = typeof recipientId === 'string' && recipientId === 'admin' ? 1 : (recipientId || 1);
      const finalSessionId = sessionId || `session_${user.id}`;
      const { data, error } = await supabase.from('messages').insert({ sender_id: user.id, sender_role: senderRole, recipient_id: finalRecipientId, recipient_role: senderRole === 'admin' ? 'customer' : 'admin', content, session_id: finalSessionId, is_read: false }).select().single();
      if (error) return res.status(500).json({ error: 'Failed to save message', details: error.message });
      return res.json({ success: true, message: data });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to save message', details: error?.message || 'Unknown error' });
    }
  });

  app.get('/api/messages/session/:sessionId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { data, error } = await supabase.from('messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (error) return res.json([]);
      return res.json(data || []);
    } catch (error: any) {
      return res.json([]);
    }
  });

  app.get('/api/admin/chat-sessions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('bank_users').select('id, email, full_name').eq('role', 'customer').limit(20);
      if (error) throw error;
      const sessions = (data || []).map((u: any) => ({ id: `session_${u.id}`, customerId: u.id, customerName: u.full_name || u.email, status: 'active' }));
      return res.json(sessions);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const userMessages = await storage.getUserMessages(user.id);
      const ownsMessage = userMessages.some(msg => msg.id === id);
      if (!ownsMessage) return res.status(403).json({ error: 'Access denied' });
      const message = await storage.markMessageAsRead(id);
      return res.json(message);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  app.get('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) return res.json([]);
      return res.json(data || []);
    } catch (error: any) {
      return res.json([]);
    }
  });

  app.get('/api/alerts/unread', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const alerts = await storage.getUnreadAlerts(user.id);
      return res.json(alerts);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch unread alerts' });
    }
  });

  app.post('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const alertData = { ...req.body, userId: user.id };
      const alert = await storage.createAlert(alertData);
      return res.json(alert);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const alerts = await storage.getUserAlerts(user.id);
      const alert = alerts.find((a: Alert) => a.id === id);
      if (!alert) return res.status(403).json({ error: 'Access denied' });
      await storage.deleteAlert(id);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete alert' });
    }
  });

  app.patch('/api/alerts/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const userAlerts = await storage.getUserAlerts(user.id);
      const ownsAlert = userAlerts.some(alert => alert.id === id);
      if (!ownsAlert) return res.status(403).json({ error: 'Access denied' });
      const alert = await storage.markAlertAsRead(id);
      return res.json(alert);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to mark alert as read' });
    }
  });

  app.get('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const tickets = user.role === 'admin' ? await storage.getSupportTickets() : await storage.getSupportTickets(user.id);
      return res.json(tickets);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  });

  app.post('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { z } = await import('zod');
      const supportTicketSchema = z.object({ subject: z.string().min(3).max(200), description: z.string().min(10).max(5000), priority: z.enum(['low', 'medium', 'high']).default('medium'), category: z.string().min(1).max(100).optional() });
      const parsed = supportTicketSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid ticket data', details: parsed.error.errors });
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const ticket = await storage.createSupportTicket({ userId: user.id, subject: parsed.data.subject, description: parsed.data.description, priority: parsed.data.priority, status: 'open', category: parsed.data.category || null });
      return res.json(ticket);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create support ticket' });
    }
  });

  app.patch('/api/support-tickets/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const ticket = await storage.getSupportTicket(id);
      const updatedTicket = await storage.updateSupportTicket(id, updates);
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin && updatedTicket) await storage.createAdminAction({ adminId: admin.id, action: 'update_support_ticket', targetType: 'support_ticket', targetId: id, details: { ticketId: id, updates, previousStatus: ticket?.status } });
      return res.json(updatedTicket);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  app.get('/api/branches', async (req: Request, res: Response) => {
    try { return res.json(await storage.getBranches()); } catch (error: any) { return res.status(500).json({ error: 'Failed to fetch branches' }); }
  });

  app.get('/api/atms', async (req: Request, res: Response) => {
    try { return res.json(await storage.getAtms()); } catch (error: any) { return res.status(500).json({ error: 'Failed to fetch ATMs' }); }
  });

  app.get('/api/exchange-rates', async (req: Request, res: Response) => {
    try {
      const rates = await storage.getExchangeRates();
      const ratesObject: Record<string, number> = {};
      rates.forEach((rate: Record<string, any>) => { ratesObject[rate.targetCurrency || rate.target_currency] = parseFloat(rate.rate); });
      return res.json(ratesObject);
    } catch (error: any) { return res.status(500).json({ error: 'Failed to fetch exchange rates' }); }
  });

  app.get('/api/admin/pending-transfers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allTransfers = await storage.getAllTransactions();
      const transfers = allTransfers.filter((t: Transaction) => t.status === 'pending' || t.status === 'processing' || t.status === 'pending_approval');
      const formattedTransfers = await Promise.all(transfers.map(async (t: Transaction) => {
        let customerName = 'Unknown', customerEmail = '';
        if ((t as any).fromUserId) {
          const customer = await storage.getUser((t as any).fromUserId);
          if (customer) { customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Unknown'; customerEmail = customer.email || ''; }
        }
        return { id: t.id, amount: t.amount, currency: t.currency || 'USD', recipientName: t.recipientName || 'Unknown', recipientBank: (t as any).bankName || (t as any).recipientBank || 'Unknown', recipientAccount: t.recipientAccount || '', recipientCountry: (t as any).recipientCountry || '', swiftCode: (t as any).swiftCode || '', customerName, customerEmail, fromUserId: (t as any).fromUserId, description: t.description || '', createdAt: t.createdAt, status: t.status, type: t.type };
      }));
      return res.json(formattedTransfers);
    } catch (error: any) {
      return res.status(500).json({ message: 'Failed to fetch pending transfers', error: error?.message || 'Unknown error' });
    }
  });

  app.get('/api/admin/support-tickets', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tickets = await storage.getSupportTickets();
      const formattedTickets = await Promise.all(tickets.map(async (t) => {
        let customerName = `User ${t.userId}`;
        try { const user = await storage.getUser(t.userId); if (user) customerName = `${user.firstName} ${user.lastName}` || user.email || customerName; } catch (e) {}
        return { id: t.id, subject: t.description?.substring(0, 50) || 'Support Ticket', customerName, priority: t.priority || 'Medium', status: t.status || 'Open', createdAt: t.createdAt, description: t.description || '' };
      }));
      return res.json(formattedTickets);
    } catch (error: any) {
      return res.status(500).json({ message: 'Failed to fetch support tickets', error: error?.message || 'Unknown error' });
    }
  });

  app.get('/api/admin/customers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      return res.json(customers.filter((user: User) => user.role !== 'admin' || req.query.includeAdmins === 'true').map((user: User) => ({ ...user, fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown', balance: parseFloat(String(user.balance || '0')) || 0 })));
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.put('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) return res.status(404).json({ error: 'Customer not found' });
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'update_customer', targetType: 'user', targetId: id, details: updates });
      return res.json(updatedUser);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  app.post('/api/admin/customers/:id/verify', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { verified = true, active } = req.body as { verified?: boolean; active?: boolean };
      const updates: any = { isVerified: verified };
      if (typeof active !== 'undefined') updates.isActive = active;
      else if (verified) updates.isActive = true;
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) return res.status(404).json({ error: 'Customer not found' });
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: verified ? 'verify_customer' : 'unverify_customer', targetType: 'user', targetId: id, details: { verified, active: updates.isActive } });
      return res.json({ success: true, user: updatedUser, message: verified ? 'Customer verified' : 'Customer unverified' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update customer verification' });
    }
  });

  app.post('/api/admin/customers/:id/profile-picture', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { profilePhoto } = req.body;
      if (!profilePhoto) return res.status(400).json({ error: 'profilePhoto is required' });
      const updatedUser = await storage.updateUser(id, { profilePhoto });
      return res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update profile picture' });
    }
  });

  app.get('/api/admin/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const customers = allUsers.filter((u: User) => u.role === 'customer');
      const allTransactions = await storage.getAllTransactions();
      const tickets = await storage.getSupportTickets();
      return res.json({ totalCustomers: customers.length, activeCustomers: customers.filter((u: User) => u.isActive).length, pendingApprovals: customers.filter((u: User) => !u.isActive).length, totalTransactions: allTransactions.length, pendingTransactions: allTransactions.filter((t: any) => t.status === 'pending').length, openSupportTickets: tickets.filter((t: any) => t.status !== 'resolved' && t.status !== 'closed').length });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.post('/api/admin/transfers/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id || 0;
      const { approveTransfer } = await import('./transfer-approval');
      const transaction = await approveTransfer(id, adminId, notes);
      return res.json({ success: true, transaction });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to approve transfer', details: error?.message });
    }
  });

  app.post('/api/admin/transfers/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id || 0;
      const { rejectTransfer } = await import('./transfer-approval');
      const transaction = await rejectTransfer(id, adminId, notes || 'Rejected by admin');
      return res.json({ success: true, transaction });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to reject transfer', details: error?.message });
    }
  });

  app.patch('/api/admin/support-tickets/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedTicket = await storage.updateSupportTicket(id, updates);
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin && updatedTicket) await storage.createAdminAction({ adminId: admin.id, action: 'update_support_ticket', targetType: 'support_ticket', targetId: id, details: { ticketId: id, updates } });
      return res.json(updatedTicket);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  app.post('/api/admin/tickets/:id/respond', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { response: adminResponse, notes, status } = req.body;
      const responseText = adminResponse || notes || '';
      const updates: any = {};
      if (responseText) updates.adminNotes = responseText;
      updates.status = status || 'responded';
      const updatedTicket = await storage.updateSupportTicket(id, updates);
      const ticket = await storage.getSupportTicket?.(id);
      if (ticket && ticket.userId && responseText) {
        try {
          const adminUser = await storage.getUserByEmail(req.user!.email);
          await storage.createMessage({ senderId: adminUser?.id ?? 1, recipientId: ticket.userId, senderRole: 'admin', content: `[Support Reply] ${responseText}`, sessionId: `support_${id}`, isRead: false });
        } catch (_) {}
      }
      return res.json({ success: true, ticket: updatedTicket, message: 'Reply sent successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to respond to ticket' });
    }
  });

  app.post('/api/admin/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, amount, description, type } = req.body as { accountId: number; amount: number; description: string; type: string };
      if (!accountId || !amount || !description) return res.status(400).json({ error: 'accountId, amount, and description are required' });
      const transaction = await storage.createTransaction({ fromAccountId: accountId, type: type || 'deposit', amount: amount.toString(), description, status: 'completed', createdAt: new Date() });
      const account = await storage.getAccount(accountId);
      if (account) {
        const amountNum = parseFloat(amount.toString());
        const isCredit = (type === 'deposit' || type === 'credit'), isDebit = (type === 'withdrawal' || type === 'debit');
        if (isCredit || isDebit) await storage.updateUserBalance(account.userId, isCredit ? amountNum : -amountNum);
      }
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'create_transaction', targetType: 'transaction', targetId: transaction.id, details: { accountId, amount, type, description } });
      return res.json({ success: true, transaction });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  app.get('/api/statements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = typeof req.user?.id === 'number' ? req.user.id : parseInt(String(req.user?.id) || '0');
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });
      return res.json(await storage.getStatementsByUserId(userId));
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch statements' });
    }
  });

  app.post('/api/objects/upload', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { file, fileName, fileType } = req.body;
      if (!file || !fileName) return res.status(400).json({ error: 'Missing file or fileName' });
      const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return res.json({ success: true, fileId, fileName, fileType: fileType || 'image/jpeg', uploadedAt: new Date().toISOString(), url: `/uploads/${fileId}`, message: 'File uploaded successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  app.post('/api/admin/create-admin-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) return res.status(400).json({ error: 'Email, password, and fullName are required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: 'admin' } });
      if (authError || !authData.user) return res.status(500).json({ error: authError?.message || 'Failed to create admin authentication account' });
      try {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || 'Admin';
        const adminUser = await storage.createUser({ username: email.split('@')[0] + '_admin', firstName, lastName, email, phone: '+1-000-000-0000', accountNumber: `ADMIN-${generateAccountNumber()}`, accountId: Date.now(), password: 'supabase_auth', transferPin: generateTransferPin(), role: 'admin', isVerified: true, isActive: true, balance: '0', dateOfBirth: '1990-01-01', address: 'World Bank HQ', city: 'Washington', state: 'DC', country: 'United States', postalCode: '20001', profession: 'Administrator', annualIncome: 'N/A', idType: 'Staff ID', idNumber: 'ADMIN-001' });
        return res.status(201).json({ success: true, message: 'Admin user created successfully', user: { id: adminUser.id, email: adminUser.email, fullName: `${adminUser.firstName} ${adminUser.lastName}`, role: adminUser.role }, credentials: { email, note: 'Password was provided during creation' } });
      } catch (dbError: unknown) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }
    } catch (error: any) {
      return res.status(500).json({ error: 'Admin user creation failed', details: error?.message || 'Unknown error' });
    }
  });

  const sessionCache = new Map<string, any>();

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) return res.status(401).json({ error: 'Invalid credentials' });
      const supabaseUser = data.user;
      let dbUser = await storage.getUserByEmail(email);
      if (!dbUser) {
        try {
          dbUser = await storage.createUser({ username: email.split('@')[0], email, password: 'supabase_auth', firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0], lastName: supabaseUser.user_metadata?.last_name || 'User', phone: supabaseUser.user_metadata?.phone || '', profession: 'Not provided', accountNumber: `${generateAccountNumber()}`, accountId: Date.now(), balance: '0', isActive: true, isVerified: true, transferPin: supabaseUser.user_metadata?.transfer_pin || '', role: supabaseUser.app_metadata?.role || 'customer' });
          await storage.createAccount({ userId: dbUser.id, accountNumber: `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'active' });
        } catch (dbError: unknown) {}
      } else {
        const userAccounts = await storage.getUserAccounts(dbUser.id);
        if (userAccounts.length === 0) await storage.createAccount({ userId: dbUser.id, accountNumber: `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'active' });
        const supabaseRole = supabaseUser.app_metadata?.role || 'customer';
        const updates: any = { lastLogin: new Date() };
        if (dbUser.role !== supabaseRole) updates.role = supabaseRole;
        await storage.updateUser(dbUser.id, updates);
        const refreshed = await storage.getUserByEmail(email);
        if (refreshed) dbUser = refreshed;
      }
      const cacheKey = email.toLowerCase();
      sessionCache.set(cacheKey, { email, id: supabaseUser.id, role: supabaseUser.app_metadata?.role || 'customer', firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0], lastName: supabaseUser.user_metadata?.last_name || 'User', phone: supabaseUser.user_metadata?.phone || '', transferPin: supabaseUser.user_metadata?.transfer_pin || '0192', isActive: true, balance: '0', lastLogin: Date.now() });
      const accessToken = data.session?.access_token;
      if (!accessToken) return res.status(500).json({ error: 'Failed to generate authentication token' });
      const fullProfile: any = dbUser || { id: supabaseUser.id || Date.now(), email: supabaseUser.email || '', password: '', firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0], lastName: supabaseUser.user_metadata?.last_name || 'User', username: email.split('@')[0], phone: supabaseUser.user_metadata?.phone || '', role: supabaseUser.app_metadata?.role || 'customer', profession: 'Customer', accountId: (dbUser as any)?.accountId || Date.now(), accountNumber: (dbUser as any)?.accountNumber || '****1234', isVerified: true, isActive: true };
      return res.json({ token: accessToken, refreshToken: data.session?.refresh_token, user: fullProfile });
    } catch (error: any) {
      return res.status(500).json({ error: 'Login failed', details: error?.message || 'Unknown error' });
    }
  });

  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    return res.json({ message: 'Logged out successfully', status: 'ok' });
  });

  app.get('/api/admin/list-users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) return res.status(500).json({ error: 'Failed to list users', details: error?.message || 'Unknown error' });
      return res.json({ total: data.users.length, users: data.users.map((u: any) => ({ id: u.id, email: u.email, role: u.app_metadata?.role || 'customer', verified: u.email_confirmed_at ? 'yes' : 'no' })) });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to list users', details: error?.message || 'Unknown error' });
    }
  });

  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: 'Invalid admin credentials' });
      if (data.user.app_metadata?.role !== 'admin') return res.status(403).json({ error: 'Admin access required. Contact system administrator.' });
      const accessToken = data.session?.access_token;
      if (!accessToken) return res.status(500).json({ error: 'Failed to generate authentication token' });
      return res.json({ token: accessToken, refreshToken: data.session?.refresh_token, user: { id: data.user.id, email: data.user.email, role: data.user.app_metadata?.role } });
    } catch (error: any) {
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/admin/set-user-role', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, email, role } = req.body;
      if (!role || !['admin', 'customer'].includes(role)) return res.status(400).json({ error: 'Role must be "admin" or "customer"' });
      if (!userId && !email) return res.status(400).json({ error: 'userId or email required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      let supabaseUserId = userId;
      if (!supabaseUserId && email) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const found = users?.users?.find((u: any) => u.email === email);
        if (!found) return res.status(404).json({ error: 'User not found in Supabase Auth' });
        supabaseUserId = found.id;
      }
      const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, { app_metadata: { role } });
      if (supabaseError) return res.status(500).json({ error: 'Failed to update Supabase role', details: supabaseError.message });
      const targetUser = email ? await storage.getUserByEmail(email) : await storage.getUser(parseInt(supabaseUserId));
      if (targetUser) await storage.updateUser(targetUser.id, { role });
      return res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to set user role', details: error.message });
    }
  });

  app.post('/api/admin/reset-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) return res.status(500).json({ error: 'Failed to list users' });
      const userToUpdate = users.users.find((u: any) => u.email === email);
      if (!userToUpdate) return res.status(404).json({ error: 'User not found in Supabase Auth' });
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userToUpdate.id, { password: newPassword });
      if (updateError) return res.status(500).json({ error: 'Failed to reset password', details: updateError.message });
      return res.json({ success: true, message: `Password reset successfully for ${email}. You can now login with the new password.`, email });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to reset password', details: error?.message || 'Unknown error' });
    }
  });

  app.post('/api/admin/users/:id/profile-photo', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { photoUrl } = req.body;
      if (!id || !photoUrl) return res.status(400).json({ error: 'User ID and photo URL required' });
      const userId = parseInt(id);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });
      const updatedUser = await storage.updateUser(userId, { profilePhoto: photoUrl });
      if (!updatedUser) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true, message: 'Profile photo updated successfully', user: updatedUser });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload profile photo', details: error?.message || 'Unknown error' });
    }
  });

  app.post('/api/admin/delete-user/:email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.params;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) return res.status(500).json({ error: 'Failed to list users' });
      const userToDelete = users.users.find((u: any) => u.email === email);
      if (!userToDelete) return res.status(404).json({ error: 'User not found in Supabase Auth' });
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      if (deleteAuthError) return res.status(500).json({ error: 'Failed to delete from authentication system' });
      return res.json({ success: true, message: `User ${email} deleted successfully from Supabase Auth`, deleted_email: email });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete user', details: error?.message || 'Unknown error' });
    }
  });

  app.post('/api/transactions/:id/reverse', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const txnId = parseInt(req.params.id);
      if (isNaN(txnId)) return res.status(400).json({ error: 'Invalid transaction ID' });
      const allTransactions = await storage.getAllTransactions();
      const transaction = allTransactions.find((t: Transaction) => t.id === txnId);
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      if (transaction.status === 'reversed') return res.status(400).json({ error: 'Transaction already reversed' });
      if (transaction.fromAccountId) {
        const fromAccount = await storage.getAccount(transaction.fromAccountId as number);
        if (fromAccount) {
          const refundAmount = parseFloat(String(transaction.amount)) || 0;
          const newBalance = parseFloat(String(fromAccount.balance)) + refundAmount;
          if (storage.updateAccount) await storage.updateAccount(transaction.fromAccountId as number, { balance: newBalance.toString() });
        }
      }
      const reversalTxn = await storage.createTransaction({ fromAccountId: transaction.toAccountId as number || transaction.fromAccountId as number, toAccountId: transaction.fromAccountId as number, type: 'reversal', amount: String(transaction.amount), status: 'reversed', description: `Reversal of transaction #${txnId}. Reason: ${req.body.reason || 'No reason provided'}`, currency: transaction.currency || 'USD' });
      await storage.updateTransactionStatus(txnId, 'reversed', req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(req.user.id)) : 1, req.body.reason);
      return res.json({ success: true, message: 'Transaction reversed successfully', reversalTransactionId: reversalTxn.id, amountRefunded: transaction.amount });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to reverse transaction', details: error?.message || 'Unknown error' });
    }
  });

  const transferIdempotencyCache = new Map<string, { response: { id: string | number; transactionId: string; status: string }; timestamp: number }>();

  app.post('/api/transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, recipientName, recipientCountry, recipientAccount, purpose, transferPin, idempotencyKey } = req.body;
      if (idempotencyKey) { const cached = transferIdempotencyCache.get(idempotencyKey); if (cached && Date.now() - cached.timestamp < 300000) return res.json(cached.response); }
      if (!amount || !recipientName || !recipientAccount || !transferPin) return res.status(400).json({ error: 'Missing required fields', fields: { amount: !!amount, recipientName: !!recipientName, recipientAccount: !!recipientAccount, transferPin: !!transferPin } });
      if (isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount - must be positive number' });
      const referenceNumber = generateReferenceNumber('WB');
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user || !user.id) return res.status(400).json({ error: 'User not found or invalid user ID' });
      const userAccounts = await storage.getUserAccounts(user.id);
      if (!userAccounts || userAccounts.length === 0) return res.status(400).json({ error: 'User has no accounts' });
      const senderAccountId = typeof userAccounts[0].id === 'string' ? parseInt(userAccounts[0].id) : userAccounts[0].id;
      if (!senderAccountId || senderAccountId <= 0) return res.status(400).json({ error: 'Invalid sender account - account ID must be positive' });
      const transfer = await storage.createTransaction({ fromAccountId: senderAccountId, type: 'transfer', amount: amount.toString(), description: `Transfer to ${recipientName} in ${recipientCountry}`, status: 'processing', currency: 'USD', referenceNumber });
      try {
        const senderAccount = userAccounts[0];
        const newBalance = (parseFloat(String(senderAccount?.balance || '0')) - parseFloat(amount.toString())).toFixed(2);
        if (!isNaN(parseFloat(newBalance)) && senderAccountId && storage?.updateAccount) await storage.updateAccount(senderAccountId, { balance: String(parseFloat(newBalance)) });
      } catch (balanceError) {}
      const response: any = { id: transfer.id, transactionId: transfer.referenceNumber || String(transfer.id), status: 'processing' };
      if (idempotencyKey) transferIdempotencyCache.set(idempotencyKey, { response, timestamp: Date.now() });
      return res.json(response);
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create transfer' });
    }
  });

  app.get('/api/transfers/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const allTransactions = await storage.getAllTransactions();
      const transfer = allTransactions.find((t: Transaction) => t.id?.toString() === id?.toString() || t.referenceNumber === id);
      if (!transfer) return res.status(404).json({ error: 'Transfer not found', searchedId: id });
      return res.json({ id: transfer.id, status: transfer.status, referenceNumber: transfer.referenceNumber, amount: transfer.amount, type: transfer.type, currency: transfer.currency, description: transfer.description, recipientName: transfer.recipientName, createdAt: transfer.createdAt });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to fetch transfer status' });
    }
  });

  app.get('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id); allTxns.push(...txns); }
      return res.json(allTxns.filter((t: Transaction) => t.type === 'payment_request' || t.description?.toLowerCase()?.includes('payment request')));
    } catch (error: any) { return res.json([]); }
  });

  app.post('/api/add-funds', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { method, amount } = req.body as { method: string; amount: number };
      if (!method || !amount || isNaN(parseFloat(String(amount))) || parseFloat(String(amount)) <= 0) return res.status(400).json({ error: 'Method and valid amount are required' });
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const parsedAmount = parseFloat(String(amount));
      const transaction = await storage.createTransaction({ fromAccountId: accounts[0].id, type: 'deposit', amount: parsedAmount.toString(), description: `Funds added via ${method}`, status: 'completed', currency: 'USD', referenceNumber: `DEP-${Date.now()}`, createdAt: new Date() });
      await storage.updateUserBalance(user.id, parsedAmount);
      return res.json({ success: true, transaction, amount: parsedAmount });
    } catch (error: any) { return res.status(500).json({ error: 'Failed to add funds' }); }
  });

  app.get('/api/transactions/recent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id); allTxns.push(...txns); }
      allTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns.slice(0, 10));
    } catch (error: any) { return res.json([]); }
  });

  app.get('/api/currencies', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ code: 'USD', name: 'US Dollar', symbol: '$' }, { code: 'EUR', name: 'Euro', symbol: '\u20ac' }, { code: 'GBP', name: 'British Pound', symbol: '\u00a3' }, { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5' }, { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00a5' }, { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' }, { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }, { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' }, { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }, { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' }]);
  });

  app.get('/api/admin/customers-list', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try { return res.json((await storage.getAllUsers()).filter((user: User) => user.role === 'customer')); } catch (error: any) { return res.status(500).json({ error: 'Failed to fetch customers list' }); }
  });

  app.get('/api/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try { return res.json(await storage.getAllUsers()); } catch (error: any) { return res.status(500).json({ error: 'Failed to fetch users' }); }
  });

  app.get('/api/card-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id, 20); allTxns.push(...txns); }
      return res.json(allTxns.slice(0, 30));
    } catch (error: any) { return res.json([]); }
  });

  app.get('/api/wallet-balance', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ balance: parseFloat(String(user.balance || '0')), currency: 'USD', available: parseFloat(String(user.balance || '0')), pending: 0 });
    } catch (error: any) { return res.status(500).json({ error: 'Failed to fetch wallet balance' }); }
  });

  app.get('/api/wallet-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      return res.json(await storage.getAccountTransactions(accounts[0].id, 20));
    } catch (error: any) { return res.json([]); }
  });

  app.get('/api/mobile-payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      return res.json(txns.filter((t: Transaction) => t.type === 'mobile_pay' || t.description?.toLowerCase().includes('mobile')));
    } catch (error: any) { return res.json([]); }
  });

  app.get('/api/mobile-pay/merchants', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ id: 1, name: 'Apple Pay', logo: '\ud83c\udf4e', category: 'Digital Wallet' }, { id: 2, name: 'Google Pay', logo: '\ud83d\udd35', category: 'Digital Wallet' }, { id: 3, name: 'Samsung Pay', logo: '\ud83d\udcf1', category: 'Digital Wallet' }, { id: 4, name: 'PayPal', logo: '\ud83d\udc99', category: 'Online Payment' }, { id: 5, name: 'Venmo', logo: '\ud83d\udc9c', category: 'P2P Transfer' }, { id: 6, name: 'Cash App', logo: '\ud83d\udc9a', category: 'P2P Transfer' }, { id: 7, name: 'Zelle', logo: '\ud83d\udfe3', category: 'Bank Transfer' }]);
  });

  app.get('/api/user/activity-log', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      const recentActivity: any[] = [];
      if (accounts && accounts.length > 0) {
        const txns = await storage.getAccountTransactions(accounts[0].id, 10);
        txns.forEach((t: Transaction) => recentActivity.push({ id: t.id, action: `${t.type || 'Transaction'} of $${t.amount}`, timestamp: t.createdAt, ipAddress: '***.***.*.***', device: 'Web Browser', status: t.status || 'completed' }));
      }
      recentActivity.unshift({ id: 'login-recent', action: 'Account login', timestamp: user.lastLogin || new Date().toISOString(), ipAddress: req.ip || '***', device: req.get('user-agent')?.substring(0, 30) || 'Unknown', status: 'success' });
      return res.json(recentActivity);
    } catch (error: any) { return res.json([]); }
  });

  app.get('/api/user/trusted-devices', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ id: 1, name: 'Current Browser', type: 'web', lastUsed: new Date().toISOString(), trusted: true, current: true }]);
  });

  app.get('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      return res.json(allTransactions.map((t: Transaction) => ({ id: t.id, amount: t.amount, currency: t.currency || 'USD', status: t.status, type: t.type, description: t.description, recipientName: t.recipientName, createdAt: t.createdAt })));
    } catch (error: any) { return res.status(500).json({ error: 'Failed to fetch transaction routes' }); }
  });

  app.patch('/api/admin/transaction-routes/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id || 0;
      const transaction = await storage.updateTransactionStatus(id, status, adminId, notes);
      return res.json({ success: true, transaction });
    } catch (error: any) { return res.status(500).json({ error: 'Failed to update transaction route' }); }
  });

  app.post('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, amount, description, type, status } = req.body;
      const transaction = await storage.createTransaction({ fromAccountId: accountId, type: type || 'transfer', amount: String(amount), description, status: status || 'pending', createdAt: new Date() });
      return res.json({ success: true, transaction });
    } catch (error: any) { return res.status(500).json({ error: 'Failed to create transaction route' }); }
  });

  const intlTransferIdempotencyCache = new Map<string, { response: { id: string | number; transactionId: string; status: string }; timestamp: number }>();

  app.post('/api/international-transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, recipientCountry, transferPin, idempotencyKey } = req.body;
      if (idempotencyKey) { const cached = intlTransferIdempotencyCache.get(idempotencyKey); if (cached && Date.now() - cached.timestamp < 300000) return res.json(cached.response); }
      if (!amount || !recipientCountry || !transferPin) return res.status(400).json({ error: 'Missing required fields' });
      if (isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount - must be positive number' });
      const referenceNumber = generateReferenceNumber('INT');
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user || !user.id) return res.status(400).json({ error: 'User not found or invalid user ID' });
      const userAccounts = await storage.getUserAccounts(user.id);
      if (!userAccounts || userAccounts.length === 0) return res.status(400).json({ error: 'User has no accounts' });
      const senderAccountId = typeof userAccounts[0].id === 'string' ? parseInt(userAccounts[0].id) : userAccounts[0].id;
      if (!senderAccountId || senderAccountId <= 0) return res.status(400).json({ error: 'Invalid sender account - account ID must be positive' });
      const transfer = await storage.createTransaction({ fromAccountId: senderAccountId, type: 'international_transfer', amount: amount.toString(), description: `International transfer to ${recipientCountry}`, status: 'processing', currency: 'USD', referenceNumber });
      const response: any = { id: transfer.id || Date.now(), transactionId: transfer.referenceNumber || '', status: 'processing' };
      if (idempotencyKey) intlTransferIdempotencyCache.set(idempotencyKey, { response, timestamp: Date.now() });
      return res.json(response);
    } catch (error: any) { return res.status(500).json({ error: error?.message || 'Failed to create international transfer' }); }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export async function registerLiveChatRoutes(app: Express) {
  const { getChatHistory, getActiveSessions, createTicketFromChat } = await import('./supabase-live-chat');
  const { supabase } = await import('./supabase-public-storage');

  app.get('/api/chat/history', getChatHistory);
  app.get('/api/chat/sessions', requireAdmin, getActiveSessions);
  app.post('/api/chat/create-ticket', requireAuth, createTicketFromChat);

  app.post('/api/chat/send', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      let adminUserId = 1;
      try { const { data: adminUsers } = await supabase.from('bank_users').select('id').eq('role', 'admin').limit(1).single(); if (adminUsers?.id) adminUserId = adminUsers.id; } catch (_) {}
      const { data: savedMsg, error } = await supabase.from('messages').insert({ sender_id: user.id, sender_role: 'customer', recipient_id: adminUserId, recipient_role: 'admin', content: message.trim(), session_id: `session_${user.id}`, is_read: false, created_at: new Date().toISOString() }).select().single();
      if (error) return res.json({ success: true, message: 'Message queued', persisted: false });
      const adminChannel = supabase.channel('admin-chat-inbox');
      adminChannel.send({ type: 'broadcast', event: 'new_customer_message', payload: { userId: user.id, userName: `${user.firstName} ${user.lastName}`, message: message.trim(), messageId: savedMsg?.id, timestamp: new Date().toISOString() } });
      return res.json({ success: true, messageId: savedMsg?.id });
    } catch (error: any) { return res.status(500).json({ error: 'Failed to send message' }); }
  });

  app.post('/api/chat/notify', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, type, message } = req.body;
      const channel = supabase.channel(`notifications:${userId}`);
      channel.send({ type: 'broadcast', event: type, payload: { message, timestamp: new Date() } });
      return res.json({ success: true });
    } catch (error: any) { return res.status(500).json({ error: error?.message || 'Unknown error' }); }
  });
}
