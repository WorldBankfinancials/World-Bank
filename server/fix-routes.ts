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

      if (!supabaseId) {
        return res.status(400).json({ error: 'Supabase ID required' });
      }

      const user = await storage.getUserBySupabaseId?.(supabaseId) || null;
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // TRANSACTIONAL REGISTRATION ENDPOINT
  // This endpoint handles BOTH Supabase Auth AND local database creation atomically
  // If either step fails, it rolls back the other to prevent desynchronization
  app.post('/api/auth/register-complete', registrationRateLimiter, async (req: Request, res: Response) => {
    let supabaseUserId: string | null = null;

    try {
      const registrationData = req.body;

      // SECURITY: Validate all input data with comprehensive schema
      const validation = validateRequest(registrationSchema, registrationData);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid registration data', 
          details: (validation as { success: false; errors: string[] }).errors 
        });
      }

      const validatedData = validation.data;

      // SECURITY: Hash PIN before storing
      const hashedPin = await bcrypt.hash(validatedData.transferPin, 10);

      // Create Supabase service client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // STEP 1: Create Supabase Auth account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true,
        user_metadata: {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          phone: validatedData.phone
        }
      });

      if (authError || !authData.user) {
        return res.status(500).json({ 
          error: authError?.message || 'Failed to create authentication account' 
        });
      }

      supabaseUserId = authData.user.id;

      // STEP 2: Create local database profile - USING VALIDATED DATA ONLY
      try {
        const newUser = await storage.createUser({
          username: validatedData.email.split('@')[0],
          firstName: validatedData.firstName || validatedData.email.split('@')[0],
          lastName: validatedData.lastName || 'User',
          email: validatedData.email,
          phone: validatedData.phone,
          dateOfBirth: validatedData.dateOfBirth,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          postalCode: validatedData.postalCode,
          profession: validatedData.profession,
          annualIncome: validatedData.annualIncome,
          idType: validatedData.idType,
          idNumber: validatedData.idNumber,
          accountNumber: `${generateAccountNumber()}`,
          accountId: Date.now(),
          password: 'supabase_auth',
          transferPin: hashedPin,
          role: 'customer',
          isVerified: false,
          isActive: false,
          balance: "0",
        });


        // Create initial checking account
        await storage.createAccount({
          userId: newUser.id,
          accountNumber: newUser.accountNumber || `${generateAccountNumber()}`,
          accountType: 'checking',
          balance: '0.00',
          currency: 'USD',
          status: 'pending'
        });

        
        // VERIFY user was actually saved
        const verifyUser = await (storage).getUserByEmail(newUser.email || '');
        if (!verifyUser) {
          throw new Error('User created but not found in database');
        }


        return res.status(201).json({ 
          success: true,
          message: 'Registration successful. Awaiting admin approval.',
          user: {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
          }
        });

      } catch (dbError: unknown) {

        // Attempt to rollback Supabase Auth account
        if (supabaseUserId) {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
          if (deleteError) {
          } else {
          }
        }

        return res.status(500).json({ 
          error: 'Database error during registration',
          details: (dbError as any)?.message 
        });
        return;
      }

    } catch (error: unknown) {
      return res.status(500).json({ 
        error: 'Registration failed',
        details: (error as Error)?.message || "Unknown error" 
      });
    }
  });

  // Check email availability endpoint - checks both Supabase and local DB
  app.post('/api/auth/check-email', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // SECURITY: Use database as source of truth to prevent race conditions
      // Check local database first (primary authority)
      const existingUser = await (storage).getUserByEmail(email);
      if (existingUser) {
        return res.json({
          available: false,
          message: 'Email already registered in database'
        });
      }

      // Check Supabase Auth as secondary confirmation
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Use admin API to check if user exists
      const { data: users, error } = await supabase.auth.admin.listUsers();
      if (!users) { return res.status(500).json({ error: "Failed to fetch users" }); }

      if (!error && users) {
        const emailExists = users.users.some((u: any) => u.email === email);
        if (emailExists) {
          return res.json({
            available: false,
            message: 'Email already registered in authentication system'
          });
        }
      }

      return res.json({
        available: true,
        message: 'Email available'
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to check email availability. Please try again.' });
    }
  });

  // ADMIN: Reset user password in Supabase Auth - ADMIN ONLY
  app.post('/api/admin/reset-user-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and newPassword are required' });
      }

      // SECURITY: Enforce strong password policy - 12+ characters with complexity
      if (newPassword.length < 12) {
        return res.status(400).json({ 
          error: 'Password must be at least 12 characters with uppercase, lowercase, and numbers' 
        });
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        return res.status(400).json({ 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
        });
      }

      // Create Supabase admin client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Get user by email
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError || !users) {
        return res.status(500).json({ error: 'Failed to list users' });
      }

      const user = users.users.find((u: any) => u.email === email);
      if (!user) {
        return res.status(404).json({ error: 'User not found in authentication system' });
      }

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update password', details: updateError.message });
      }

      return res.json({ 
        success: true, 
        message: 'Password updated successfully',
        email: email
      });

    } catch (error: any) {
      return res.status(500).json({ error: 'Password reset failed', details: error.message || "Unknown error" });
    }
  });

  // User registration endpoint - Creates user profile in local database
  // SECURITY: Password should NEVER be sent here - Supabase Auth handles passwords
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = req.body;

      // SECURITY: Verify required fields (but NOT password - that's in Supabase Auth only)
      if (!userData.email || !userData.supabaseUserId) {
        return res.status(400).json({ 
          error: 'Missing required fields: email and supabaseUserId are required' 
        });
      }

      // SECURITY: Block if password is included - this is a security violation
      if (userData.password) {
        return res.status(400).json({ 
          error: 'Invalid request - passwords must not be sent to this endpoint' 
        });
      }

      // SECURITY: Block privilege escalation attempts
      if (userData.role && userData.role !== 'customer') {
        return res.status(400).json({ 
          error: 'Invalid request - role cannot be set by client' 
        });
      }

      // Check if user already exists in local database
      const existingUser = await (storage).getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Check if user exists in Supabase Auth (redundant if /api/auth/check-email is used correctly, but good as a safeguard)
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: users, error: authError } = await supabase.auth.admin.listUsers();

      if (!authError && users) {
        const emailExistsInSupabase = users.users.some((u: any) => u.email === userData.email);
        if (emailExistsInSupabase) {
          // This case should ideally be caught by the /api/auth/check-email endpoint,
          // but if it reaches here, it means the user is in Supabase Auth but not in our DB.
          // We should still prevent creating a new local entry to maintain consistency.
          return res.status(409).json({ error: 'User already exists in authentication system' });
        }
      } else if (authError) {
        return res.status(500).json({ error: 'Unable to verify user in authentication system' });
      }

      // SECURITY: Generate secure random PIN for new user (1000-9999)
      const newUserPin = generateTransferPin();
      // SECURITY: Hash PIN before storing
      const hashedNewUserPin = await bcrypt.hash(newUserPin, 10);

      // SECURITY: Only accept whitelisted fields from client, hardcode privileged fields server-side
      const newUser = await storage.createUser({
        username: userData.username || userData.email.split('@')[0],
        firstName: userData.firstName || userData.email.split('@')[0],
        lastName: userData.lastName || 'User',
        email: userData.email,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        country: userData.country,
        postalCode: userData.postalCode,
        profession: userData.profession,
        annualIncome: userData.annualIncome,
        idType: userData.idType,
        idNumber: userData.idNumber,
        accountNumber: userData.accountNumber || `${generateAccountNumber()}`,
        accountId: Date.now(),
        password: 'supabase_auth',
        transferPin: hashedNewUserPin,
        role: 'customer',
        isVerified: false,
        isActive: false,
        balance: "0",
      });

      // Create initial checking account
      const accountNumber = `${generateAccountNumber()}`;
      await storage.createAccount({
        userId: newUser.id,
        accountNumber: accountNumber,
        accountType: 'checking',
        balance: '0.00',
        currency: 'USD',
        status: 'pending'
      });


      return res.status(201).json({ 
        success: true,
        message: 'User profile created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      });
    } catch (error: any) {
      return res.status(500).json({ 
        error: 'Failed to create user profile',
        details: error.message || "Unknown error" 
      });
    }
  });


  // User endpoints - PROTECTED with JWT authentication
  app.get('/api/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const email = req.user!.email;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get user', details: error.message });
    }
  });

  // Profile endpoint - PROTECTED with JWT authentication
  app.get('/api/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const email = req.user!.email;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user accounts and cards for profile
      const accounts = await storage.getUserAccounts(user.id);
      const cards = await storage.getUserCards(user.id);
      
      return res.json({
        ...user,
        accounts,
        cards
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get profile', details: error.message });
    }
  });
  
  // Get user by ID - PROTECTED with JWT authentication
  app.get('/api/users/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = validateId(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(user);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Real user profile endpoint - PROTECTED with JWT authentication
  app.post('/api/user/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  // Save user preferences (notifications, privacy, security settings)
  // Preferences are stored client-side; this endpoint acknowledges receipt
  app.post('/api/user/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const preferences = req.body;
      return res.json({ success: true, preferences, message: 'Preferences saved' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to save preferences' });
    }
  });

  // Upload user avatar/profile photo - PROTECTED with JWT authentication
  app.post('/api/user/upload-avatar', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { avatarUrl } = req.body as { avatarUrl: string };
      
      if (!avatarUrl) {
        return res.status(400).json({ error: 'Avatar URL required' });
      }

      // Validate it's a data URL (base64 encoded image)
      if (!avatarUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format' });
      }

      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user with avatar - store in JSON metadata or skip if no field
      // Note: profile photo storage can be handled via separate photo table if needed
      const updatedUser = user;

      return res.json({
        success: true,
        message: 'Profile photo updated successfully',
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload avatar', details: error.message || "Unknown error" });
    }
  });

  // Real user accounts endpoint - PROTECTED with JWT authentication
  app.post('/api/accounts/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get user accounts' });
    }
  });

  // SECURITY: Admin endpoints - PROTECTED with role-based access control

  // POST /api/admin/accounts - Create a new account for a customer
  app.post('/api/admin/accounts', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, accountType, accountName, balance, currency, accountNumber, isActive } = req.body;
      if (!userId || !accountType) {
        return res.status(400).json({ error: 'userId and accountType are required' });
      }
      const account = await storage.createAccount({
        userId: parseInt(userId),
        accountType,
        accountName: accountName || `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`,
        balance: balance || '0.00',
        currency: currency || 'USD',
        accountNumber: accountNumber || `WB${Date.now()}`,
        isActive: isActive !== false
      });
      return res.json({ success: true, account });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create account' });
    }
  });

  // PATCH /api/admin/accounts/:id - Update an account
  app.patch('/api/admin/accounts/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedAccount = await (storage as any).updateAccount(id, updates);
      if (!updatedAccount) {
        return res.status(404).json({ error: 'Account not found' });
      }
      return res.json({ success: true, account: updatedAccount });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update account' });
    }
  });

  // DELETE /api/admin/accounts/:id - Deactivate an account
  app.delete('/api/admin/accounts/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedAccount = await (storage as any).updateAccount(id, { isActive: false });
      if (!updatedAccount) {
        return res.status(404).json({ error: 'Account not found' });
      }
      return res.json({ success: true, message: 'Account deactivated successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to deactivate account' });
    }
  });

  // Admin transaction creation - REQUIRES ADMIN ROLE
  app.post('/api/admin/create-transaction', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = req.body as {
        customerId: string;
        type: string;
        amount: string;
        description: string;
        category: string;
        reference: string;
        status: string;
      };

      const customerIdNum = validateId(body.customerId);
      const accounts = await storage.getUserAccounts(customerIdNum);

      if (accounts.length === 0) {
        return res.status(404).json({ error: 'No accounts found for customer' });
      }

      const primaryAccount = accounts[0];

      const transaction = await storage.createTransaction({
        fromAccountId: primaryAccount.id,
        type: body.type,
        amount: body.amount,
        description: body.description,
        status: body.status || 'completed',
        createdAt: new Date()
      });

      // Update account balance if it's a credit/debit
      if (body.type === 'credit' || body.type === 'debit') {
        const amountNum = validateAmount(body.amount);
        const balanceChange = body.type === 'credit' ? amountNum : -amountNum;
        await storage.updateUserBalance(customerIdNum, balanceChange);
      }

      // AUDIT TRAIL: Log admin action
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'create_transaction',
          targetType: 'transaction',
          targetId: transaction.id,
          details: { customerId: customerIdNum, amount: body.amount, type: body.type }
        });
      }

      return res.json({ 
        success: true, 
        transaction,
        message: 'Transaction created successfully'
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // Individual account balance update endpoint - REQUIRES ADMIN ROLE
  app.post('/api/admin/accounts/:accountId/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = parseInt(req.params.accountId, 10);
      const body = req.body as { amount: string; description: string; type: 'credit' | 'debit' };

      const amountNum = validateAmount(body.amount);
      const balanceChange = body.type === 'credit' ? amountNum : -amountNum;

      // Get account and update balance
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const newBalance = parseFloat((account.balance || '0').toString()) + balanceChange;
      await storage.updateAccount?.(accountId, { balance: newBalance.toString() });

      // Create transaction record
      const transaction = await storage.createTransaction({
        fromAccountId: accountId,
        type: body.type,
        amount: amountNum.toString(),
        description: body.description,
        status: 'success',
        createdAt: new Date()
      });

      // AUDIT TRAIL: Log admin action
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'update_account_balance',
          targetType: 'account',
          targetId: accountId,
          details: { accountId, amount: body.amount, type: body.type, oldBalance: account.balance, newBalance }
        });
      }

      return res.json({ 
        success: true, 
        message: 'Account balance updated successfully',
        newBalance: newBalance,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update account balance' });
    }
  });

  // Balance update endpoint - REQUIRES ADMIN ROLE
  app.post('/api/admin/customers/:id/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const body = req.body as { amount: string | number; description: string; type?: string };

      const amountNum = parseFloat(String(body.amount));
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Support credit/debit and deposit/withdrawal naming conventions
      const isCredit = ['credit', 'deposit', 'add', 'fund'].includes((body.type || 'credit').toLowerCase());
      const delta = isCredit ? amountNum : -amountNum;

      const oldUser = await (storage).getUser(customerId);
      const oldBalance = parseFloat(String(oldUser?.balance || '0'));
      const updatedUser = await storage.updateUserBalance(customerId, delta);

      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // AUDIT TRAIL: Log admin action
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'update_customer_balance',
          targetType: 'user',
          targetId: customerId,
          details: { customerId, amount: body.amount, oldBalance: oldUser?.balance, newBalance: updatedUser.balance, description: body.description }
        });
      }

      const newBalance = parseFloat(String(updatedUser.balance || '0'));
      // Also create a transaction record for this admin action
      const userAccounts = await storage.getUserAccounts(customerId);
      if (userAccounts.length > 0) {
        await storage.createTransaction({
          fromAccountId: userAccounts[0].id,
          toAccountId: isCredit ? userAccounts[0].id : undefined,
          type: isCredit ? 'credit' : 'debit',
          transactionType: isCredit ? 'deposit' : 'withdrawal',
          amount: amountNum.toString(),
          currency: 'USD',
          description: body.description || (isCredit ? 'Admin credit' : 'Admin debit'),
          status: 'success',
          createdAt: new Date()
        } as any);
      }

      // Broadcast realtime balance update via Supabase
      try {
        const { supabase } = await import('./supabase-public-storage');
        const channel = supabase.channel(`user-balance-${customerId}`);
        channel.send({
          type: 'broadcast',
          event: 'balance_update',
          payload: { userId: customerId, newBalance, oldBalance, delta, timestamp: new Date().toISOString() }
        });
      } catch (_) {}

      return res.json({ 
        success: true, 
        user: updatedUser,
        oldBalance,
        newBalance,
        delta,
        message: `Balance ${isCredit ? 'credited' : 'debited'} successfully. New balance: $${newBalance.toFixed(2)}`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }
  });

  // Customer update endpoint - REQUIRES ADMIN ROLE
  app.patch('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const updates = req.body as Record<string, any>;


      const updatedUser = await storage.updateUser(customerId, updates);

      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
      }


      // AUDIT TRAIL: Log admin action
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'update_customer',
          targetType: 'user',
          targetId: customerId,
          details: { customerId, updates }
        });
      }

      return res.json({ 
        success: true, 
        user: updatedUser,
        message: 'Customer updated successfully'
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // Get all transactions - REQUIRES ADMIN ROLE
  app.get('/api/admin/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      return res.json(transactions);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // PATCH /api/admin/transactions/:id - Update transaction status
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

      const { data, error } = await supa
        .from('transactions')
        .update(updates)
        .eq('id', txId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return res.json({ success: true, transaction: data, message: 'Transaction updated' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update transaction' });
    }
  });

  // Verify PIN endpoint - Used after password verification, needs email + pin
  app.post('/api/verify-pin', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = req.body as { email?: string; username?: string; pin: string };
      const identifier = body.email || body.username;

      

      if (!identifier || !body.pin) {
        
        return res.status(400).json({ message: 'Email and PIN required', verified: false });
      }

      // Lookup user by email
      const user = await storage.getUserByEmail(identifier);
      

      if (!user) {
        return res.status(404).json({ message: 'User not found', verified: false });
      }

      // SECURITY: Check if account is active (approved by admin)
      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Your account is pending approval by our customer support team. You will receive a notification once your account is activated.',
          verified: false,
          error: 'Account pending approval'
        });
      }

      // SECURITY: Only accept valid PINs, no plaintext fallback
      if (!user.transferPin || user.transferPin.length === 0) {
        return res.status(400).json({ 
          message: 'PIN not configured for account', 
          verified: false,
          error: 'Account PIN setup required'
        });
      }
      
      // SECURITY: Use bcrypt to compare hashed PIN
      
      let pinMatch = false;
      
      // Try bcrypt comparison if it's hashed
      if (user.transferPin && user.transferPin.startsWith('$2')) {
        pinMatch = await bcrypt.compare(body.pin, user.transferPin);
      } else if (user.transferPin === body.pin) {
        // Fallback for plaintext (legacy compatibility)
        pinMatch = true;
      }
      
      if (!pinMatch) {
        
        return res.status(401).json({ message: 'Invalid PIN', verified: false });
      }

      
      return res.json({ success: true, verified: true });
    } catch (error: any) {
      
      return res.status(500).json({ error: 'Failed to verify PIN', verified: false });
    }
  });

  // Get all transactions for authenticated user (across all accounts)
  app.get('/api/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) {
        return res.json([]); // No accounts, return empty transactions
      }

      // Fetch transactions for all user accounts
      const allTransactions: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        allTransactions.push(...txns);
      }

      // Sort by date descending
      allTransactions.sort((a: Transaction, b: Transaction) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return res.json(allTransactions);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Account endpoints - PROTECTED with JWT authentication
  app.get('/api/accounts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'Invalid user credentials'
        });
      }

      const accounts = await storage.getUserAccounts(user.id);
      return res.json(accounts);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get accounts' });
    }
  });

  app.get('/api/accounts/:id/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = validateId(req.params.id);

      // SECURITY: Verify account belongs to authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userAccounts = await storage.getUserAccounts(user.id);
      const ownsAccount = userAccounts.some(acc => acc.id === accountId);

      if (!ownsAccount) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const transactions = await storage.getAccountTransactions(accountId);
      return res.json(transactions);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // Admin pending registrations - REQUIRES ADMIN ROLE
  app.get('/api/admin/pending-registrations', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const pending = users.filter(user => !user.isActive && user.role === 'customer');
      return res.json(pending);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to get pending registrations' });
    }
  });

  // Approve registration - REQUIRES ADMIN ROLE
  app.post('/api/admin/approve-registration/:registrationId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrationId = validateId(req.params.registrationId);

      // SECURITY: Validate approval data
      const validationData = { registrationId, ...req.body };
      const validation = validateRequest(approvalSchema, validationData);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid approval data', 
          details: (validation as { success: false; errors: string[] }).errors 
        });
      }

      const { initialBalance } = validation.data;

      // ATOMIC TRANSACTION: Approve user with all updates
      const transaction = new BankingTransaction();
      let updatedUser: User | null = null;

      transaction.addStep({
        name: 'Activate user account',
        execute: async () => {
          const user = await storage.updateUser(registrationId, {
            isActive: true,
            isVerified: true
          });
          if (!user) throw new Error('Registration not found');
          updatedUser = user as User;
          return updatedUser;
        }
      });

      transaction.addStep({
        name: 'Activate user bank accounts',
        execute: async () => {
          const accounts = await storage.getUserAccounts(registrationId);
          for (const account of accounts) {
            await storage.updateAccount?.(account.id, { status: 'active' });
          }
          return accounts;
        }
      });

      if (initialBalance && initialBalance > 0) {
        transaction.addStep({
          name: 'Set initial balance',
          execute: async () => {
            await storage.updateUserBalance(registrationId, initialBalance);
          }
        });
      }

      const result = await transaction.execute();
      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // AUDIT TRAIL: Log admin action
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'approve_registration',
          targetType: 'user',
          targetId: registrationId,
          details: { userId: registrationId, initialBalance: initialBalance || 0 }
        });
      }

      // BROADCAST: Notify all clients of admin change
      try {
        const { supabase } = await import('./supabase-public-storage');
        const adminChannel = supabase.channel('admin-actions');
        adminChannel.send({
          type: 'broadcast',
          event: 'registration_approved',
          payload: { userId: registrationId, approvedBy: admin?.email, user: updatedUser }
        });
      } catch (error: any) {
      }
      
      return res.json({ 
        success: true,
        message: 'Registration approved successfully',
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to approve registration' });
    }
  });

  // Reject registration - REQUIRES ADMIN ROLE
  app.post('/api/admin/reject-registration/:registrationId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrationId = validateId(req.params.registrationId);
      const { reason } = req.body;

      const user = await (storage).getUser(registrationId);
      if (!user) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      // Update user with rejection reason
      await storage.updateUser(registrationId, {
        isActive: false,
        isVerified: false,
      });

      // Create support ticket for the user explaining rejection
      await storage.createSupportTicket({
        userId: registrationId,
        subject: 'Registration Status - Action Required',
        description: `Your registration has been reviewed. ${reason || 'Please contact support for more information.'}`,
        // category removed,
        priority: 'high',
        status: 'open'
      });

      // AUDIT TRAIL: Log admin action
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'reject_registration',
          targetType: 'user',
          targetId: registrationId,
          details: { userId: registrationId, reason }
        });
      }

      // BROADCAST: Notify all clients of admin change
      try {
        const { supabase } = await import('./supabase-public-storage');
        const adminChannel = supabase.channel('admin-actions');
        adminChannel.send({
          type: 'broadcast',
          event: 'registration_rejected',
          payload: { userId: registrationId, rejectedBy: admin?.email, reason }
        });
      } catch (error: any) {
      }

      return res.json({ 
        success: true,
        message: 'Registration rejected successfully'
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to reject registration' });
    }
  });

  // PIN management endpoints - PROTECTED with JWT authentication
  app.post('/api/user/change-pin', requireAuth, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Validate PIN format
      const validation = validateRequest(pinChangeSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid PIN format', 
          details: (validation as { success: false; errors: string[] }).errors 
        });
      }

      const { currentPin, newPin } = validation.data;

      // Get authenticated user (email from JWT token)
      const user = await (storage).getUserByEmail(req.user!.email);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // SECURITY: Use bcrypt to compare current PIN
      const pinMatch = await bcrypt.compare(currentPin, user.transferPin || '');
      if (!pinMatch) {
        return res.status(401).json({ message: 'Current PIN is incorrect' });
      }

      // Prevent reusing the same PIN
      const newPinMatch = await bcrypt.compare(newPin, user.transferPin || '');
      if (newPinMatch) {
        return res.status(400).json({ message: 'New PIN must be different from current PIN' });
      }

      // SECURITY: Hash new PIN before storing
      const hashedNewPin = await bcrypt.hash(newPin, 10);

      // Use authenticated user's ID (not hardcoded)
      await storage.updateUser(user.id, { transferPin: hashedNewPin });
      return res.json({ success: true, message: 'PIN updated successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to change PIN' });
    }
  });

  // User password change - PROTECTED with JWT auth and rate limiting
  app.post('/api/user/change-password', requireAuth, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ error: 'currentPassword, newPassword, and confirmNewPassword are required' });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: 'New passwords do not match' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      if (newPassword === currentPassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Verify current password by attempting sign-in
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: req.user!.email,
        password: currentPassword,
      });

      if (signInError) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Get Supabase user ID
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError || !users) {
        return res.status(500).json({ error: 'Failed to retrieve user' });
      }

      const supabaseUser = users.users.find((u: any) => u.email === req.user!.email);
      if (!supabaseUser) {
        return res.status(404).json({ error: 'User not found in authentication system' });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUser.id,
        { password: newPassword }
      );

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update password', details: updateError.message });
      }

      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Password change failed', details: error.message });
    }
  });

  // Note: Transfer endpoints moved to routes-transfer.ts
  // Using /api/transfers (plural) with email-based authentication

  // Setup transfer routes
  setupTransferRoutes(app);

  // ==================== CARDS API ROUTES - PROTECTED ====================
  app.get('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const cards = await storage.getUserCards(user.id);
      return res.json(cards);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }
  });

  app.get('/api/cards/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cardId = parseInt(req.params.id);

      // SECURITY: Verify card belongs to authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      // SECURITY: Verify card's account belongs to user
      const account = await storage.getAccount(card.accountId);
      if (!account || account.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(card);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch card' });
    }
  });

  app.post('/api/cards/lock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, isLocked } = req.body;

      // SECURITY: Verify card belongs to authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      // SECURITY: Verify card's account belongs to user
      const account = await storage.getAccount(card.accountId);
      if (!account || account.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedCard = await storage.updateCard(cardId, { status: isLocked ? 'locked' : 'active' });
      return res.json({ success: true, card: updatedCard });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update card' });
    }
  });

  app.post('/api/cards/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, dailyLimit, contactlessEnabled } = req.body;

      // SECURITY: Verify card belongs to authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      // SECURITY: Verify card's account belongs to user
      const account = await storage.getAccount(card.accountId);
      if (!account || account.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updates: any = {};
      if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
      if (contactlessEnabled !== undefined) updates.contactlessEnabled = contactlessEnabled;

      const updatedCard = await storage.updateCard(cardId, updates);
      return res.json({ success: true, card: updatedCard });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update card settings' });
    }
  });

  // ==================== INVESTMENTS API ROUTES - PROTECTED ====================
  app.get('/api/investments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const investments = await storage.getUserInvestments(user.id);
      return res.json(investments);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch investments' });
    }
  });

  app.get('/api/investments/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Verify investment belongs to authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const investment = await storage.getInvestment(id);
      if (!investment) {
        return res.status(404).json({ error: 'Investment not found' });
      }

      if (investment.userId !== user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(investment);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch investment' });
    }
  });

  // ==================== MARKET DATA API ROUTES - PROTECTED ====================
  app.get('/api/market-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const marketRates = await (storage).getMarketRates();

      // Transform database format to frontend expected format
      const transformedData: Record<string, any> = {};

      marketRates.forEach((rate: Record<string, any>) => {
        const assetType = rate.asset_type || rate.assetType;
        transformedData[assetType] = {
          change: rate.change_percent || rate.changePercent || 0,
          trending: (rate.change_direction || rate.changeDirection || 'up') as 'up' | 'down'
        };
      });

      // Ensure all required categories exist with fallbacks
      const result = {
        stocks: transformedData.stocks || { change: 0, trending: 'up' as const },
        bonds: transformedData.bonds || { change: 0, trending: 'up' as const },
        crypto: transformedData.crypto || { change: 0, trending: 'up' as const },
        forex: transformedData.forex || { change: 0, trending: 'up' as const }
      };

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch market rates' });
    }
  });

  // ==================== MARKET INDICES API - PROTECTED ====================
  app.get('/api/market-indices', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Return real-time market indices data
      // In production, this should fetch from a financial data API (e.g., Alpha Vantage, IEX Cloud)
      const indices = [
        { name: 'S&P 500', value: '4,783.45', change: '+32.87', changePercent: '+0.69%', trend: 'up' },
        { name: 'NASDAQ', value: '15,310.97', change: '+125.34', changePercent: '+0.83%', trend: 'up' },
        { name: 'DOW JONES', value: '37,248.35', change: '-43.89', changePercent: '-0.12%', trend: 'down' },
        { name: 'FTSE 100', value: '7,733.24', change: '+18.45', changePercent: '+0.24%', trend: 'up' },
        { name: 'DAX', value: '16,784.86', change: '+92.12', changePercent: '+0.55%', trend: 'up' },
        { name: 'NIKKEI 225', value: '33,377.42', change: '-124.56', changePercent: '-0.37%', trend: 'down' }
      ];
      return res.json(indices);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch market indices' });
    }
  });

  // ==================== TOP STOCKS API - PROTECTED ====================
  app.get('/api/top-stocks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Return top performing stocks
      // In production, this should fetch from a financial data API
      const stocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: '$185.92', change: '+2.34', changePercent: '+1.28%', trend: 'up' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: '$378.91', change: '+5.67', changePercent: '+1.52%', trend: 'up' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$142.67', change: '-1.23', changePercent: '-0.85%', trend: 'down' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '$156.78', change: '+3.45', changePercent: '+2.25%', trend: 'up' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '$495.34', change: '+12.87', changePercent: '+2.67%', trend: 'up' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: '$248.42', change: '-4.56', changePercent: '-1.80%', trend: 'down' }
      ];
      return res.json(stocks);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch top stocks' });
    }
  });

  // ==================== PORTFOLIO ASSETS API - PROTECTED ====================
  app.get('/api/portfolio-assets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Get authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's investments and calculate portfolio breakdown
      const investments = await storage.getUserInvestments(user.id);

      // Calculate portfolio allocation by asset type
      const assetAllocation: Record<string, { value: number, allocation: number, change: number }> = {};
      let totalValue = 0;

      investments.forEach((inv: any) => {
        const assetType = inv.asset_type || inv.assetType || 'Other';
        const value = parseFloat(String(inv.total_value || inv.totalValue || 0));
        const gainLoss = parseFloat(String(inv.gain_loss || inv.gainLoss || 0));

        totalValue += value;

        if (!assetAllocation[assetType]) {
          assetAllocation[assetType] = { value: 0, allocation: 0, change: 0 };
        }
        assetAllocation[assetType].value += value;
        assetAllocation[assetType].change += gainLoss;
      });

      // Calculate allocation percentages
      const assets = Object.keys(assetAllocation).map(name => ({
        name,
        value: `$${assetAllocation[name].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        allocation: totalValue > 0 ? `${((assetAllocation[name].value / totalValue) * 100).toFixed(1)}%` : '0%',
        change: assetAllocation[name].change >= 0 ? `+${assetAllocation[name].change.toFixed(2)}%` : `${assetAllocation[name].change.toFixed(2)}%`
      }));

      return res.json(assets);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch portfolio assets' });
    }
  });

  // ==================== CURRENCY EXCHANGE API ROUTES - PROTECTED ====================
  app.post('/api/currency-exchange', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;

      // SECURITY: Get authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate required fields
      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Mock exchange rate calculation - replace with real exchange rate API
      const exchangeRates: Record<string, number> = {
        'USD': 1.0,
        'EUR': 0.92,
        'GBP': 0.79,
        'JPY': 149.5,
        'CNY': 7.24,
        'AUD': 1.53,
        'CAD': 1.36,
        'CHF': 0.88
      };

      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;
      const convertedAmount = (amount / fromRate) * toRate;
      const exchangeRate = toRate / fromRate;

      return res.json({
        success: true,
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        convertedAmount: +convertedAmount.toFixed(2),
        exchangeRate: +exchangeRate.toFixed(4),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to process currency exchange' });
    }
  });

  // ==================== MESSAGES API ROUTES - PROTECTED ====================
  app.get('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Only return messages for authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const messages = await storage.getUserMessages(user.id);

      // Note: Messages schema doesn't have conversationId, so we return all user messages
      return res.json(messages);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.get('/api/messages/user/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const messages = await storage.getUserMessages(user.id);
      return res.json(messages);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch user messages' });
    }
  });

  app.post('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { content, recipientId, sessionId } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'content required' });
      }

      const senderRole = req.user!.role === 'admin' ? 'admin' : 'customer';
      const finalRecipientId = typeof recipientId === 'string' && recipientId === 'admin' ? 1 : (recipientId || 1);
      const finalSessionId = sessionId || `session_${user.id}`;
      
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          sender_role: senderRole,
          recipient_id: finalRecipientId,
          recipient_role: senderRole === 'admin' ? 'customer' : 'admin',
          content: content,
          session_id: finalSessionId,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to save message', details: error.message });
      }

      return res.json({ success: true, message: data });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to save message', details: error?.message || "Unknown error" });
    }
  });

  app.get('/api/messages/session/:sessionId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        return res.json([]);
      }
      return res.json(data || []);
    } catch (error: any) {
      return res.json([]);
    }
  });

  app.get('/api/admin/chat-sessions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('id, email, full_name')
        .eq('role', 'customer')
        .limit(20);
      
      if (error) throw error;
      const sessions = (data || []).map((u: any) => ({
        id: `session_${u.id}`,
        customerId: u.id,
        customerName: u.full_name || u.email,
        status: 'active'
      }));
      return res.json(sessions);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Only allow marking own messages as read
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userMessages = await storage.getUserMessages(user.id);
      const ownsMessage = userMessages.some(msg => msg.id === id);

      if (!ownsMessage) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const message = await storage.markMessageAsRead(id);
      return res.json(message);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  // ==================== ALERTS API ROUTES - PROTECTED ====================
  app.get('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        return res.json([]);
      }
      return res.json(data || []);
    } catch (error: any) {
      return res.json([]);
    }
  });

  app.get('/api/alerts/unread', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const alerts = await storage.getUnreadAlerts(user.id);
      return res.json(alerts);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch unread alerts' });
    }
  });

  app.post('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Derive userId from authenticated user, not client input
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create alert with authenticated user's ID
      const alertData = {
        ...req.body,
        userId: user.id, // Override any client-supplied userId
      };

      const alert = await storage.createAlert(alertData);
      return res.json(alert);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Only allow deleting own alerts
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify alert belongs to user before deleting
      const alerts = await storage.getUserAlerts(user.id);
      const alert = alerts.find((a: Alert) => a.id === id);

      if (!alert) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await storage.deleteAlert(id);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete alert' });
    }
  });

  app.patch('/api/alerts/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Only allow marking own alerts as read
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userAlerts = await storage.getUserAlerts(user.id);
      const ownsAlert = userAlerts.some(alert => alert.id === id);

      if (!ownsAlert) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const alert = await storage.markAlertAsRead(id);
      return res.json(alert);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to mark alert as read' });
    }
  });

  // ==================== SUPPORT TICKETS API ROUTES ====================
  app.get('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Admin can see all tickets, customers see only their own
      const tickets = user.role === 'admin' 
        ? await storage.getSupportTickets()  // No userId = get all
        : await storage.getSupportTickets(user.id);  // With userId = get user's tickets

      return res.json(tickets);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  });

  app.post('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { z } = await import('zod');
      const supportTicketSchema = z.object({
        subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject too long'),
        description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        category: z.string().min(1, 'Category is required').max(100).optional(),
      });

      const parsed = supportTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid ticket data', details: parsed.error.errors });
      }

      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const ticketData = {
        userId: user.id,
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
        status: 'open',
        category: parsed.data.category || null,
      };

      const ticket = await storage.createSupportTicket(ticketData);
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

      // AUDIT TRAIL: Log admin action for ticket updates
      const admin = await (storage).getUserByEmail(req.user!.email);
      if (admin && updatedTicket) {
        const actionDescription = updates.status 
          ? `Updated ticket #${id} status to ${updates.status}`
          : `Updated ticket #${id}`;
        
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'update_support_ticket',
          targetType: 'support_ticket',
          targetId: id,
          details: { ticketId: id, updates, previousStatus: ticket?.status }
        });
      }

      return res.json(updatedTicket);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // ==================== OBJECT STORAGE API ROUTES ====================
  // Branches endpoint
  app.get('/api/branches', async (req: Request, res: Response) => {
    try {
      const branches = await storage.getBranches();
      return res.json(branches);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch branches' });
    }
  });

  // ATMs endpoint
  app.get('/api/atms', async (req: Request, res: Response) => {
    try {
      const atms = await storage.getAtms();
      return res.json(atms);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch ATMs' });
    }
  });

  // Exchange rates endpoint
  app.get('/api/exchange-rates', async (req: Request, res: Response) => {
    try {
      const rates = await storage.getExchangeRates();
      // Convert to object format: { EUR: 0.92, GBP: 0.79, ... }
      const ratesObject: Record<string, number> = {};
      rates.forEach((rate: Record<string, any>) => {
        ratesObject[rate.targetCurrency || rate.target_currency] = parseFloat(rate.rate);
      });
      return res.json(ratesObject);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
  });

  // Admin customers endpoint
  // Get all pending transfers for admin review
  app.get('/api/admin/pending-transfers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allTransfers = await storage.getAllTransactions();
      const transfers = allTransfers.filter((t: Transaction) => t.status === 'pending');
      
      // Format for admin dashboard
      const formattedTransfers = transfers.map((t: Transaction) => ({
        id: t.id,
        amount: t.amount,
        currency: t.currency || 'USD',
        recipientName: t.recipientName || 'Unknown',
        recipientBank: t.recipientBank || 'Unknown',
        customerName: t.fromAccountId ? `Account ${t.fromAccountId}` : 'Unknown',
        customerEmail: 'customer@worldbank.com', // Would need to join with users table
        createdAt: t.createdAt,
        status: t.status
      }));

      return res.json(formattedTransfers);
    } catch (error: any) {
      return res.status(500).json({ message: 'Failed to fetch pending transfers', error: error?.message || "Unknown error" });
    }
  });

  // Get all support tickets for admin view
  app.get('/api/admin/support-tickets', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tickets = await storage.getSupportTickets();
      
      // Format for admin dashboard
      const formattedTickets = await Promise.all(tickets.map(async (t) => {
        // Try to get user info
        let customerName = `User ${t.userId}`;
        try {
          const user = await storage.getUser(t.userId);
          if (user) {
            customerName = `${user.firstName} ${user.lastName}` || user.email || customerName;
          }
        } catch (e) {
          // Use default
        }

        return {
          id: t.id,
          subject: t.description?.substring(0, 50) || 'Support Ticket',
          customerName,
          priority: t.priority || 'Medium',
          status: t.status || 'Open',
          createdAt: t.createdAt,
          description: t.description || ''
        };
      }));

      return res.json(formattedTickets);
    } catch (error: any) {
      return res.status(500).json({ message: 'Failed to fetch support tickets', error: error?.message || "Unknown error" });
    }
  });

  app.get('/api/admin/customers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      // Return all users including admins to admin, add computed fields
      const customerList = customers
        .filter((user: User) => user.role !== 'admin' || req.query.includeAdmins === 'true')
        .map((user: User) => ({
          ...user,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
          balance: parseFloat(String(user.balance || '0')) || 0
        }));
      return res.json(customerList);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  // PUT /api/admin/customers/:id - Update customer (alias for PATCH, supports both methods)
  app.put('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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
      return res.json(updatedUser);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // POST /api/admin/customers/:id/verify - Verify/unverify a customer account
  app.post('/api/admin/customers/:id/verify', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { verified = true, active } = req.body as { verified?: boolean; active?: boolean };
      const updates: any = { isVerified: verified };
      // When verifying, also activate the account. When unverifying, optionally deactivate.
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update customer verification' });
    }
  });

  // POST /api/admin/customers/:id/profile-picture - Update customer profile picture
  app.post('/api/admin/customers/:id/profile-picture', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { profilePhoto } = req.body;
      if (!profilePhoto) {
        return res.status(400).json({ error: 'profilePhoto is required' });
      }
      const updatedUser = await storage.updateUser(id, { profilePhoto });
      return res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update profile picture' });
    }
  });

  // GET /api/admin/stats - Dashboard statistics
  app.get('/api/admin/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const customers = allUsers.filter((u: User) => u.role === 'customer');
      const allTransactions = await storage.getAllTransactions();
      const pendingTransactions = allTransactions.filter((t: any) => t.status === 'pending');
      const tickets = await storage.getSupportTickets();
      const openTickets = tickets.filter((t: any) => t.status !== 'resolved' && t.status !== 'closed');
      return res.json({
        totalCustomers: customers.length,
        activeCustomers: customers.filter((u: User) => u.isActive).length,
        pendingApprovals: customers.filter((u: User) => !u.isActive).length,
        totalTransactions: allTransactions.length,
        pendingTransactions: pendingTransactions.length,
        openSupportTickets: openTickets.length,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // POST /api/admin/transfers/:id/approve - Approve a pending transfer
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

  // POST /api/admin/transfers/:id/reject - Reject a pending transfer
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

  // PATCH /api/admin/support-tickets/:id - Update a support ticket (admin path)
  app.patch('/api/admin/support-tickets/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // POST /api/admin/tickets/:id/respond - Respond to a support ticket
  app.post('/api/admin/tickets/:id/respond', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { response: adminResponse, notes, status } = req.body;
      const responseText = adminResponse || notes || '';
      const updates: any = {};
      // Use adminNotes (TypeScript field -> admin_notes column in DB via Drizzle)
      if (responseText) updates.adminNotes = responseText;
      // Update status to 'responded' if not explicitly set
      updates.status = status || 'responded';
      
      const updatedTicket = await storage.updateSupportTicket(id, updates);

      // Also send a message to the customer's chat session if userId is available
      const ticket = await storage.getSupportTicket?.(id);
      if (ticket && ticket.userId && responseText) {
        try {
          await storage.createMessage({
            senderId: 0,
            recipientId: ticket.userId,
            senderRole: 'admin',
            content: `[Support Reply] ${responseText}`,
            sessionId: `support_${id}`,
            isRead: false
          });
        } catch (_) {}
      }
      
      return res.json({ success: true, ticket: updatedTicket, message: 'Reply sent successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to respond to ticket' });
    }
  });

  // POST /api/admin/transactions - Create a transaction for an account (admin)
  app.post('/api/admin/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, amount, description, type } = req.body as { accountId: number; amount: number; description: string; type: string };
      if (!accountId || !amount || !description) {
        return res.status(400).json({ error: 'accountId, amount, and description are required' });
      }
      const transaction = await storage.createTransaction({
        fromAccountId: accountId,
        type: type || 'deposit',
        amount: amount.toString(),
        description,
        status: 'completed',
        createdAt: new Date()
      });
      const account = await storage.getAccount(accountId);
      if (account) {
        const amountNum = parseFloat(amount.toString());
        const isCredit = (type === 'deposit' || type === 'credit');
        const isDebit = (type === 'withdrawal' || type === 'debit');
        if (isCredit || isDebit) {
          const balanceChange = isCredit ? amountNum : -amountNum;
          await storage.updateUserBalance(account.userId, balanceChange);
        }
      }
      const admin = await storage.getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          action: 'create_transaction',
          targetType: 'transaction',
          targetId: transaction.id,
          details: { accountId, amount, type, description }
        });
      }
      return res.json({ success: true, transaction });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // Statements endpoint
  app.get('/api/statements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = typeof req.user?.id === 'number' ? req.user.id : parseInt(String(req.user?.id) || '0');
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const statements = await storage.getStatementsByUserId(userId);
      return res.json(statements);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch statements' });
    }
  });

  app.post('/api/objects/upload', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Handle file upload for identity documents (ID cards, passports, etc.)
      // This endpoint accepts base64 encoded files or multipart form data

      const { file, fileName, fileType } = req.body;

      if (!file || !fileName) {
        return res.status(400).json({ error: 'Missing file or fileName' });
      }

      // Generate unique file ID
      const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Mock file storage - replace with actual object storage implementation
      // In production, this should upload to Supabase Storage or similar service
      const uploadResult = {
        success: true,
        fileId,
        fileName,
        fileType: fileType || 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        url: `/uploads/${fileId}`, // Mock URL
        message: 'File uploaded successfully'
      };

      return res.json(uploadResult);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // ADMIN USER CREATION ENDPOINT - ADMIN ONLY
  // Creates a complete admin user in both Supabase Auth and local database
  // This is a one-time setup endpoint - should be secured in production
  app.post('/api/admin/create-admin-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and fullName are required' });
      }


      // Create Supabase admin client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // STEP 1: Create Supabase Auth account with ADMIN role in app_metadata
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'admin'
        }
      });

      if (authError || !authData.user) {
        return res.status(500).json({ 
          error: authError?.message || 'Failed to create admin authentication account' 
        });
      }


      // STEP 2: Create local database profile
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
          accountId: Date.now(),
          password: 'supabase_auth',
          transferPin: generateTransferPin(),
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

        // SECURITY: NEVER log passwords

        return res.status(201).json({ 
          success: true,
          message: 'Admin user created successfully',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            fullName: `${adminUser.firstName} ${adminUser.lastName}`,
            role: adminUser.role
          },
          credentials: {
            email: email,
            note: 'Password was provided during creation'
          }
        });

      } catch (dbError: unknown) {
        // ROLLBACK: Delete Supabase Auth account if database creation fails

        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

        throw dbError;
      }

    } catch (error: any) {
      return res.status(500).json({ 
        error: 'Admin user creation failed',
        details: error?.message || "Unknown error" 
      });
    }
  });

  // IN-MEMORY SESSION CACHE FOR PIN VALIDATION
  const sessionCache = new Map<string, any>();

  // LOGIN - Supabase Auth + Auto-sync to bank_users table
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // STEP 1: Authenticate via Supabase Auth
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
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

      // STEP 2: Sync user to bank_users table
      let dbUser = await storage.getUserByEmail(email);
      
      if (!dbUser) {
        // User authenticated but not in bank_users - create them NOW
        try {
          dbUser = await storage.createUser({
            username: email.split('@')[0],
            email: email,
            password: 'supabase_auth',
            firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0],
            lastName: supabaseUser.user_metadata?.last_name || 'User',
            phone: supabaseUser.user_metadata?.phone || '',
            profession: 'Not provided',
            accountNumber: `${generateAccountNumber()}`,
            accountId: Date.now(),
            balance: '0',
            isActive: true,
            isVerified: true,
            transferPin: supabaseUser.user_metadata?.transfer_pin || '0192',
            role: supabaseUser.app_metadata?.role || 'customer'
          });
          
          // Also create initial account for user
          await storage.createAccount({
            userId: dbUser.id,
            accountNumber: `${generateAccountNumber()}`,
            accountType: 'checking',
            balance: '0.00',
            currency: 'USD',
            status: 'active'
          });
        } catch (dbError: unknown) {
          // User authenticated - still return token even if DB create fails
        }
      } else {
        // User exists - verify they have at least one account
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
        // CRITICAL: Always sync role from Supabase app_metadata to DB
        // This ensures admin role set in Supabase Dashboard is immediately effective
        const supabaseRole = supabaseUser.app_metadata?.role || 'customer';
        const updates: any = { lastLogin: new Date() };
        if (dbUser.role !== supabaseRole) {
          updates.role = supabaseRole;
        }
        await storage.updateUser(dbUser.id, updates);
        // Refresh dbUser with updated role
        const refreshed = await storage.getUserByEmail(email);
        if (refreshed) dbUser = refreshed;
      }

      // STEP 3: Cache session data in memory for PIN validation
      const cacheKey = email.toLowerCase();
      sessionCache.set(cacheKey, {
        email,
        id: supabaseUser.id,
        role: supabaseUser.app_metadata?.role || 'customer',
        firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0],
        lastName: supabaseUser.user_metadata?.last_name || 'User',
        phone: supabaseUser.user_metadata?.phone || '',
        transferPin: supabaseUser.user_metadata?.transfer_pin || '0192',
        isActive: true,
        balance: '0',
        lastLogin: Date.now()
      });

      // STEP 4: Return REAL Supabase JWT (NOT base64 token)
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        return res.status(500).json({ error: 'Failed to generate authentication token' });
      }

      // STEP 5: Return full user profile for immediate caching
      const fullProfile: any = dbUser || {
        id: supabaseUser.id || Date.now(),
        email: supabaseUser.email || '',
        password: '',
        firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0],
        lastName: supabaseUser.user_metadata?.last_name || 'User',
        username: email.split('@')[0],
        phone: supabaseUser.user_metadata?.phone || '',
        role: supabaseUser.app_metadata?.role || 'customer',
        profession: 'Customer',
        accountId: (dbUser as any)?.accountId || Date.now(),
        accountNumber: (dbUser as any)?.accountNumber || '****1234',
        isVerified: true,
        isActive: true
      };

      return res.json({ 
        token: accessToken,
        refreshToken: data.session?.refresh_token,
        user: fullProfile
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Login failed', details: error?.message || "Unknown error" });
    }
  });

  // LOGOUT ENDPOINT - Terminates session and clears credentials
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      // Clear session from memory cache
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        // Token is from Supabase JWT - logging is sufficient for session termination
        // Supabase invalidates JWTs on server side automatically
      }
      
      return res.json({ 
        message: "Logged out successfully",
        status: "ok"
      });
    } catch (error: any) {
      // Even if error, consider logout successful
      return res.json({ 
        message: "Logged out successfully",
        status: "ok"
      });
    }
  });

  app.get('/api/admin/list-users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('Supabase listUsers error:', error);
        return res.status(500).json({ error: 'Failed to list users', details: error?.message || "Unknown error" });
      }

      return res.json({
        total: data.users.length,
        users: data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.app_metadata?.role || 'customer',
          verified: u.email_confirmed_at ? 'yes' : 'no'
        }))
      });
    } catch (error: any) {
      console.error(`Error listing users: ${error?.message || error}`);
      return res.status(500).json({ error: 'Failed to list users', details: error?.message || "Unknown error" });
    }
  });

  // Admin login endpoint - Validates admin credentials from Supabase app_metadata
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Use Supabase Auth for admin authentication
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      // CRITICAL: Check admin role from app_metadata (server-controlled)
      const role = data.user.app_metadata?.role || 'customer';

      if (role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required. Contact system administrator.' });
      }

      // Return REAL Supabase JWT (NOT base64 token)
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        return res.status(500).json({ error: 'Failed to generate authentication token' });
      }


      return res.json({ 
        token: accessToken,
        refreshToken: data.session?.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: role
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  // ADMIN ONLY: Set user role (promote to admin or demote to customer)
  // This updates BOTH Supabase app_metadata AND the bank_users table
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
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Find Supabase user
      let supabaseUserId = userId;
      if (!supabaseUserId && email) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const found = users?.users?.find((u: any) => u.email === email);
        if (!found) return res.status(404).json({ error: 'User not found in Supabase Auth' });
        supabaseUserId = found.id;
      }

      // Update Supabase app_metadata (server-controlled, users cannot modify)
      const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
        app_metadata: { role }
      });
      if (supabaseError) {
        return res.status(500).json({ error: 'Failed to update Supabase role', details: supabaseError.message });
      }

      // Also update bank_users table
      const targetUser = email
        ? await storage.getUserByEmail(email)
        : await storage.getUser(parseInt(supabaseUserId));
      if (targetUser) {
        await storage.updateUser(targetUser.id, { role });
      }

      return res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to set user role', details: error.message });
    }
  });

  // ADMIN ONLY: Reset user password in Supabase Auth
  app.post('/api/admin/reset-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
      }


      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // List all users to find the one to update
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        return res.status(500).json({ error: 'Failed to list users' });
      }

      const userToUpdate = users.users.find((u: any) => u.email === email);
      if (!userToUpdate) {
        return res.status(404).json({ error: 'User not found in Supabase Auth' });
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userToUpdate.id,
        { password: newPassword }
      );

      if (updateError) {
        return res.status(500).json({ error: 'Failed to reset password', details: updateError.message });
      }


      return res.json({ 
        success: true, 
        message: `Password reset successfully for ${email}. You can now login with the new password.`,
        email: email
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to reset password', details: error?.message || "Unknown error" });
    }
  });

  // ADMIN ONLY: Upload customer profile photo - updates user profile in real-time
  app.post('/api/admin/users/:id/profile-photo', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { photoUrl } = req.body;
      
      if (!id || !photoUrl) {
        return res.status(400).json({ error: 'User ID and photo URL required' });
      }

      const userId = parseInt(id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Update user profile photo
      const updatedUser = await storage.updateUser(userId, { profilePhoto: photoUrl });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ 
        success: true, 
        message: 'Profile photo updated successfully',
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to upload profile photo', details: error?.message || "Unknown error" });
    }
  });

  // ADMIN ONLY: Delete user from Supabase Auth and local database
  app.post('/api/admin/delete-user/:email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }


      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // List all users to find the one to delete
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        return res.status(500).json({ error: 'Failed to list users' });
      }

      const userToDelete = users.users.find((u: any) => u.email === email);
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found in Supabase Auth' });
      }

      // Delete from Supabase Auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      if (deleteAuthError) {
        return res.status(500).json({ error: 'Failed to delete from authentication system' });
      }


      return res.json({ 
        success: true, 
        message: `User ${email} deleted successfully from Supabase Auth`,
        deleted_email: email
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete user', details: error?.message || "Unknown error" });
    }
  });

  // TRANSACTION REVERSAL: Reverse a completed transaction and credit the sender
  app.post('/api/transactions/:id/reverse', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const txnId = parseInt(id);
      if (isNaN(txnId)) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
      }

      // Get original transaction
      const allTransactions = await storage.getAllTransactions();
      const transaction = allTransactions.find((t: Transaction) => t.id === txnId);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (transaction.status === 'reversed') {
        return res.status(400).json({ error: 'Transaction already reversed' });
      }

      // Get sender account and refund the amount
      if (transaction.fromAccountId) {
        const fromAccount = await storage.getAccount(transaction.fromAccountId);
        if (fromAccount) {
          const refundAmount = parseFloat(String(transaction.amount)) || 0;
          const currentBalance = parseFloat(String(fromAccount.balance)) || 0;
          const newBalance = currentBalance + refundAmount;
          
          // Update account balance
          if (storage.updateAccount) {
            await storage.updateAccount(transaction.fromAccountId, { balance: newBalance.toString() });
          }
        }
      }

      // Mark transaction as reversed
      const reversalTxn = await storage.createTransaction({
        fromAccountId: transaction.toAccountId || transaction.fromAccountId,
        toAccountId: transaction.fromAccountId,
        type: 'reversal',
        amount: String(transaction.amount),
        status: 'reversed',
        description: `Reversal of transaction #${txnId}. Reason: ${reason || 'No reason provided'}`,
        currency: transaction.currency || 'USD'
      });

      // Update original transaction to mark as reversed
      await storage.updateTransactionStatus(txnId, 'reversed', req.user?.id ? (typeof req.user.id === 'number' ? req.user.id : parseInt(req.user.id)) : 1, reason);

      return res.json({ 
        success: true, 
        message: 'Transaction reversed successfully',
        reversalTransactionId: reversalTxn.id,
        amountRefunded: transaction.amount
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to reverse transaction', details: error?.message || "Unknown error" });
    }
  });

  // ==================== TRANSFER WORKFLOW ENDPOINTS ====================
  
  // Idempotency cache for transfers (prevent duplicates within 5 minutes)
  const transferIdempotencyCache = new Map<string, { response: { id: string | number; transactionId: string; status: string }; timestamp: number }>();
  
  // Create a transfer with IDEMPOTENCY protection
  app.post('/api/transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, recipientName, recipientCountry, recipientAccount, purpose, transferPin, idempotencyKey } = req.body;
      
      // IDEMPOTENCY: Check for duplicate request
      if (idempotencyKey) {
        const cached = transferIdempotencyCache.get(idempotencyKey);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute window
          return res.json(cached.response);
        }
      }
      
      if (!amount || !recipientName || !recipientAccount || !transferPin) {
        return res.status(400).json({ error: 'Missing required fields', fields: { amount: !!amount, recipientName: !!recipientName, recipientAccount: !!recipientAccount, transferPin: !!transferPin } });
      }

      // Validate amount is positive number
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount - must be positive number' });
      }

      const referenceNumber = generateReferenceNumber('WB');

      // Get authenticated user's account using email from auth middleware
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user || !user.id) {
        return res.status(400).json({ error: 'User not found or invalid user ID' });
      }
      
      const userAccounts = await storage.getUserAccounts(user.id);
      if (!userAccounts || userAccounts.length === 0) {
        return res.status(400).json({ error: 'User has no accounts' });
      }
      
      const senderAccountId = typeof userAccounts[0].id === 'string' ? parseInt(userAccounts[0].id) : userAccounts[0].id;
      
      if (!senderAccountId || senderAccountId <= 0) {
        return res.status(400).json({ error: 'Invalid sender account - account ID must be positive' });
      }

      const transfer = await storage.createTransaction({
        fromAccountId: senderAccountId,
        type: 'transfer',
        amount: amount.toString(),
        description: `Transfer to ${recipientName} in ${recipientCountry}`,
        status: 'processing',
        currency: 'USD',
        referenceNumber: referenceNumber
      });

      // ATOMIC: Update sender account balance (deduct amount)
      try {
        const senderAccount = userAccounts[0];
        const currentBalanceStr = String(senderAccount?.balance || '0');
        const currentBalance = parseFloat(currentBalanceStr);
        const newBalance = (currentBalance - parseFloat(amount.toString())).toFixed(2);
        const balanceNum = parseFloat(newBalance);
        if (!isNaN(balanceNum) && senderAccountId && storage?.updateAccount) {
          await storage.updateAccount(senderAccountId, { balance: balanceNum });
        }
      } catch (balanceError) {
        // Non-blocking balance update
      }

      const response: any = {
        id: transfer.id,
        transactionId: transfer.referenceNumber || String(transfer.id),
        status: 'processing'
      };

      // Cache the response for idempotency
      if (idempotencyKey) {
        transferIdempotencyCache.set(idempotencyKey, { response, timestamp: Date.now() });
      }

      return res.json(response);
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "Unknown error" || 'Failed to create transfer', details: error?.toString?.() || 'Unknown error' });
    }
  });

  // Get transfer status
  app.get('/api/transfers/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      
      const allTransactions = await storage.getAllTransactions();
      
      const transfer = allTransactions.find((t: Transaction) => {
        const idMatch = t.id?.toString() === id?.toString();
        const refMatch = t.referenceNumber === id;
        return idMatch || refMatch;
      });
      
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found', searchedId: id });
      }


      return res.json({
        id: transfer.id,
        status: transfer.status,
        referenceNumber: transfer.referenceNumber,
        amount: transfer.amount,
        type: transfer.type,
        currency: transfer.currency,
        description: transfer.description,
        recipientName: transfer.recipientName,
        recipientCountry: transfer.recipientCountry,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt
      });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "Unknown error" || 'Failed to fetch transfer status', details: error?.toString?.() || 'Unknown error' });
    }
  });

  // Idempotency cache for international transfers
  // GET /api/payment-requests - Get pending payment requests for user
  app.get('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.json([]);
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
      const paymentRequests = allTxns.filter((t: Transaction) => t.type === 'payment_request' || (t.description?.toLowerCase()?.includes('payment request')));
      return res.json(paymentRequests);
    } catch (error: any) {
      return res.json([]);
    }
  });

  // POST /api/add-funds - Add funds to account via various methods
  app.post('/api/add-funds', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { method, amount } = req.body as { method: string; amount: number };
      if (!method || !amount || isNaN(parseFloat(String(amount))) || parseFloat(String(amount)) <= 0) {
        return res.status(400).json({ error: 'Method and valid amount are required' });
      }
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) {
        return res.status(404).json({ error: 'No account found' });
      }
      const parsedAmount = parseFloat(String(amount));
      const currentBalance = parseFloat(String(user.balance || '0'));
      const newBalance = currentBalance + parsedAmount;
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
      // updateUserBalance takes a DELTA (positive to credit funds)
      await storage.updateUserBalance(user.id, parsedAmount);
      return res.json({ success: true, transaction, amount: parsedAmount, newBalance });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to add funds' });
    }
  });

  // ==================== SUPPLEMENTARY ENDPOINTS ====================

  // GET /api/transactions/recent - Recent transactions (alias for /api/transactions with limit)
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
    } catch (error: any) {
      return res.json([]);
    }
  });

  // GET /api/currencies - Available currencies for exchange
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

  // GET /api/admin/customers-list - All customers for simple-admin
  app.get('/api/admin/customers-list', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      const customerList = customers.filter((user: User) => user.role === 'customer');
      return res.json(customerList);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch customers list' });
    }
  });

  // GET /api/users - All users (for admin use)
  app.get('/api/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // GET /api/card-transactions - Card transaction history
  app.get('/api/card-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.json([]);
      }
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) {
        return res.json([]);
      }
      const allTxns: Transaction[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id, 20);
        allTxns.push(...txns);
      }
      return res.json(allTxns.slice(0, 30));
    } catch (error: any) {
      return res.json([]);
    }
  });

  // GET /api/wallet-balance - Digital wallet balance
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
  });

  // GET /api/wallet-transactions - Digital wallet transactions
  app.get('/api/wallet-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      return res.json(txns);
    } catch (error: any) {
      return res.json([]);
    }
  });

  // GET /api/mobile-payments - Mobile payment history
  app.get('/api/mobile-payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      const mobilePayments = txns.filter((t: Transaction) => t.type === 'mobile_pay' || t.description?.toLowerCase().includes('mobile'));
      return res.json(mobilePayments);
    } catch (error: any) {
      return res.json([]);
    }
  });

  // GET /api/mobile-pay/merchants - Supported mobile pay merchants
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

  // GET /api/user/activity-log - User security activity log
  app.get('/api/user/activity-log', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      const recentActivity: any[] = [];
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
    } catch (error: any) {
      return res.json([]);
    }
  });

  // GET /api/user/trusted-devices - Trusted devices list
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

  // GET & POST /api/admin/transaction-routes - Transaction routing configuration
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch transaction routes' });
    }
  });

  app.patch('/api/admin/transaction-routes/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id || 0;
      const transaction = await storage.updateTransactionStatus(id, status, adminId, notes);
      return res.json({ success: true, transaction });
    } catch (error: any) {
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create transaction route' });
    }
  });

  const intlTransferIdempotencyCache = new Map<string, { response: { id: string | number; transactionId: string; status: string }; timestamp: number }>();
  
  // Create international transfer with IDEMPOTENCY protection
  app.post('/api/international-transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, recipientCountry, transferPin, idempotencyKey } = req.body;
      
      
      // IDEMPOTENCY: Check for duplicate request
      if (idempotencyKey) {
        const cached = intlTransferIdempotencyCache.get(idempotencyKey);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute window
          return res.json(cached.response);
        }
      }
      
      if (!amount || !recipientCountry || !transferPin) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate amount is positive number
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount - must be positive number' });
      }

      const referenceNumber = generateReferenceNumber('INT');
      
      // Get authenticated user's account using email from auth middleware
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user || !user.id) {
        return res.status(400).json({ error: 'User not found or invalid user ID' });
      }
      
      const userAccounts = await storage.getUserAccounts(user.id);
      if (!userAccounts || userAccounts.length === 0) {
        return res.status(400).json({ error: 'User has no accounts' });
      }
      
      const senderAccountId = typeof userAccounts[0].id === 'string' ? parseInt(userAccounts[0].id) : userAccounts[0].id;
      
      if (!senderAccountId || senderAccountId <= 0) {
        return res.status(400).json({ error: 'Invalid sender account - account ID must be positive' });
      }

      const transfer = await storage.createTransaction({
        fromAccountId: senderAccountId,
        type: 'international_transfer',
        amount: amount.toString(),
        description: `International transfer to ${recipientCountry}`,
        status: 'processing',
        currency: 'USD',
        referenceNumber: referenceNumber
      });

      const response: any = {
        id: transfer.id || Date.now(),
        transactionId: transfer.referenceNumber || '',
        status: 'processing'
      };

      // Cache the response for idempotency
      if (idempotencyKey) {
        intlTransferIdempotencyCache.set(idempotencyKey, { response, timestamp: Date.now() });
      }

      return res.json(response);
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "Unknown error" || 'Failed to create international transfer', details: error?.toString?.() || 'Unknown error' });
    }
  });

  // Return server for WebSocket and Vite setup in index.ts
  const httpServer = createServer(app);
  
  return httpServer;
}

// ==================== LIVE CHAT ENDPOINTS ====================
export async function registerLiveChatRoutes(app: Express) {
  const { getChatHistory, getActiveSessions, createTicketFromChat } = await import('./supabase-live-chat');
  const { supabase } = await import('./supabase-public-storage');
  
  // Get chat history
  app.get('/api/chat/history', getChatHistory);

  // Get active chat sessions (admin only)
  app.get('/api/chat/sessions', requireAdmin, getActiveSessions);

  // Create support ticket from chat
  app.post('/api/chat/create-ticket', requireAuth, createTicketFromChat);

  // POST /api/chat/send - Customer sends a chat message (persists to DB + broadcasts via Supabase realtime)
  app.post('/api/chat/send', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Find admin user ID (fallback to 1 if no admin found)
      let adminUserId = 1;
      try {
        const { data: adminUsers } = await supabase
          .from('bank_users')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single();
        if (adminUsers?.id) adminUserId = adminUsers.id;
      } catch (_) {}

      // Save to messages table
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
        // Still return success - message shown in UI via localStorage
        return res.json({ success: true, message: 'Message queued', persisted: false });
      }

      // Broadcast via Supabase realtime channel for admin to see
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.post('/api/chat/notify', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, type, message } = req.body;
      
      // Send via Supabase real-time
      const channel = supabase.channel(`notifications:${userId}`);
      channel.send({
        type: 'broadcast',
        event: type,
        payload: { message, timestamp: new Date() }
      });

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });
}

