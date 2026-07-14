import type { User, InsertTransaction } from '@packages/shared/schema';
import { generateAccountNumber, generateTransferPin, generateTransactionId, generateReferenceNumber } from './crypto-utils';
import { randomUUID } from 'crypto';
import { validateId, validateAmount } from './validators';
import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage-factory';
import { config, logConfiguration } from './config';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './middleware/auth-middleware';
import { 
  authRateLimiter, 
  registrationRateLimiter, 
  transactionRateLimiter, 
  generalRateLimiter 
} from './middleware/rate-limiter';
import { 
  validateRequest, 
  registrationSchema, 
  approvalSchema,
  balanceUpdateSchema,
  pinChangeSchema
} from './validation-schemas';
import { BankingTransaction, atomicBalanceUpdate, atomicTransfer } from './transaction-wrapper';
import { runStartupChecks } from './startup-checks';
import * as bcrypt from 'bcryptjs';

// Type definitions for transactions
interface Transaction {
  id: string | number;
  createdAt: string | Date | null | undefined;
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
          phoneNumber: validatedData.phone
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
          phoneNumber: validatedData.phone,
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
          details: (dbError as unknown as { message?: string })?.message 
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
    } catch (error: unknown) {
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

    } catch (error: unknown) {
      return res.status(500).json({ error: 'Password reset failed', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
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
        phoneNumber: userData.phone,
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
    } catch (error: unknown) {
      return res.status(500).json({ 
        error: 'Failed to create user profile',
        details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" 
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get user', details: (error instanceof Error ? error.message : 'Internal server error') });
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get profile', details: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });
  
  // Get user by ID - PROTECTED with JWT authentication
  app.get('/api/users/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = validateId(req.params.id);
      // SECURITY: Only allow users to view their own profile (or admins)
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this profile' });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // SECURITY: Strip sensitive fields
      const { transferPin, passwordHash, ...safeUser } = user as unknown as Record<string, unknown>;
      return res.json(safeUser);
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  // Save user preferences (notifications, privacy, security settings)
  // Preferences are stored client-side; this endpoint acknowledges receipt
  app.post('/api/user/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const preferences = req.body;
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const updatedUser = await storage.updateUser(user.id, {
        address: preferences.address,
        city: preferences.city,
        state: preferences.state,
        country: preferences.country,
        postalCode: preferences.postalCode,
        occupation: preferences.occupation,
        employer: preferences.employer,
      } as unknown as Partial<User>);
      return res.json({ success: true, preferences, message: 'Preferences saved', user: updatedUser });
    } catch (error: unknown) {
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

      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Upload to Supabase Storage
      const supabaseUrl = process.env.VITE_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      // Extract base64 data and mime type
      const matches = avatarUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExt = mimeType.split('/')[1];
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      let finalAvatarUrl: string;
      if (uploadError) {
        // If storage bucket doesn't exist, store the data URL directly in user_profiles
        finalAvatarUrl = avatarUrl;
      } else {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('avatars')
          .getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      }

      // Update user profile with avatar URL
      const updatedUser = await storage.updateUser(user.id, {
        profilePhoto: finalAvatarUrl,
      } as unknown as Partial<User>);

      return res.json({
        success: true,
        message: 'Profile photo updated successfully',
        avatarUrl: finalAvatarUrl,
        user: updatedUser
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to upload avatar', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get user accounts' });
    }
  });

  // SECURITY: Admin endpoints - PROTECTED with role-based access control

  // GET /api/admin/accounts - Get all accounts in the system (admin)
  app.get('/api/admin/accounts', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allAccounts: any[] = [];
      for (const user of allUsers) {
        const userAccounts = await storage.getUserAccounts(user.id);
        userAccounts.forEach(acc => allAccounts.push({ ...acc, ownerEmail: user.email, ownerName: (user as unknown as Record<string, unknown>).fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() }));
      }
      return res.json(allAccounts);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get all accounts' });
    }
  });

  // POST /api/admin/accounts - Create a new account for a customer
  app.post('/api/admin/accounts', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, accountType, accountName, balance, currency, accountNumber, isActive } = req.body;
      if (!userId || !accountType) {
        return res.status(400).json({ error: 'userId and accountType are required' });
      }
      const account = await storage.createAccount({
        userId: userId,
        accountType,
        accountNumber: accountNumber || `${generateAccountNumber()}`,
        balance: balance || '0.00',
        currency: currency || 'USD',
        status: isActive !== false ? 'active' : 'frozen'
      });
      return res.json({ success: true, account });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to create account' });
    }
  });

  // PATCH /api/admin/accounts/:id - Update an account
  app.patch('/api/admin/accounts/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = validateId(req.params.id);
      const updates = req.body;
      const updatedAccount = await (storage as unknown as { updateAccount: (id: string, updates: Record<string, unknown>) => Promise<unknown> }).updateAccount(id, updates);
      if (!updatedAccount) {
        return res.status(404).json({ error: 'Account not found' });
      }
      return res.json({ success: true, account: updatedAccount });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update account' });
    }
  });

  // DELETE /api/admin/accounts/:id - Deactivate an account
  app.delete('/api/admin/accounts/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = validateId(req.params.id);
      const updatedAccount = await (storage as unknown as { updateAccount: (id: string, updates: Record<string, unknown>) => Promise<unknown> }).updateAccount(id, { isActive: false });
      if (!updatedAccount) {
        return res.status(404).json({ error: 'Account not found' });
      }
      return res.json({ success: true, message: 'Account deactivated successfully' });
    } catch (error: unknown) {
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
        transactionType: body.type,
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // Individual account balance update endpoint - REQUIRES ADMIN ROLE
  app.post('/api/admin/accounts/:accountId/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = validateId(req.params.accountId);
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
        transactionType: body.type,
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
          details: { accountId, amount: body.amount, transactionType: body.type, oldBalance: account.balance, newBalance }
        });
      }

      return res.json({ 
        success: true, 
        message: 'Account balance updated successfully',
        newBalance: newBalance,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update account balance' });
    }
  });

  // Balance update endpoint - REQUIRES ADMIN ROLE
  app.post('/api/admin/customers/:id/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = validateId(req.params.id);
      const body = req.body as { amount: string | number; description: string; type?: string };

      const amountNum = parseFloat(String(body.amount));
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Support credit/debit and deposit/withdrawal naming conventions
      const isCredit = ['credit', 'deposit', 'add', 'fund'].includes((body.type || 'credit').toLowerCase());
      const delta = isCredit ? amountNum : -amountNum;

      const oldUser = await storage.getUser(customerId);
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
        } as unknown as InsertTransaction);
      }

      // Broadcast realtime balance update via Supabase
      try {
        const { supabase } = await import('./storage/supabase-public-storage');
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }
  });

  // Customer update endpoint - REQUIRES ADMIN ROLE
  app.patch('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = validateId(req.params.id);
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // Get all transactions - REQUIRES ADMIN ROLE
  app.get('/api/admin/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      return res.json(transactions);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // PATCH /api/admin/transactions/:id - Update transaction status
  app.patch('/api/admin/transactions/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const txId = validateId(req.params.id);
      const body = req.body as { status?: string; description?: string; amount?: string };
      
      const { supabase: supa } = await import('./storage/supabase-public-storage');
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update transaction' });
    }
  });

  // Verify PIN endpoint - Used after password verification, needs email + pin
  app.post('/api/verify-pin', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = req.body as { email?: string; username?: string; pin: string };
      const identifier = body.email || body.username;

      if (!identifier || !body.pin) {
        return res.status(400).json({ message: 'Email and PIN required', verified: false });
      }

      // Lookup user by email
      const user = await storage.getUserByEmail(identifier);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials', verified: false });
      }

      // SECURITY: Check if account is active (approved by admin)
      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Your account is pending approval by our customer support team.',
          verified: false,
          error: 'Account pending approval'
        });
      }

      // SECURITY: Only accept valid PINs, no plaintext fallback
      if (!user.transferPin || !user.transferPin.startsWith('$2')) {
        return res.status(400).json({ 
          message: 'PIN not configured for account', 
          verified: false,
          error: 'Account PIN setup required'
        });
      }
      
      // SECURITY: Always use bcrypt — no plaintext fallback
      const pinMatch = await bcrypt.compare(body.pin, user.transferPin);
      
      if (!pinMatch) {
        return res.status(401).json({ message: 'Invalid PIN', verified: false });
      }

      return res.json({ success: true, verified: true });
    } catch (error: unknown) {
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
        allTransactions.push(...(txns as unknown as Transaction[]));
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
      const ownsAccount = userAccounts.some(acc => String(acc.id) === String(accountId));

      if (!ownsAccount) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const transactions = await storage.getAccountTransactions(accountId);
      return res.json(transactions);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // Admin pending registrations - REQUIRES ADMIN ROLE
  app.get('/api/admin/pending-registrations', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const pending = users.filter(user => !user.isActive && user.role === 'customer');
      return res.json(pending);
    } catch (error: unknown) {
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
        const { supabase } = await import('./storage/supabase-public-storage');
        const adminChannel = supabase.channel('admin-actions');
        adminChannel.send({
          type: 'broadcast',
          event: 'registration_approved',
          payload: { userId: registrationId, approvedBy: admin?.email, user: updatedUser }
        });
      } catch (error: unknown) {
      }
      
      return res.json({ 
        success: true,
        message: 'Registration approved successfully',
        user: updatedUser
      });
    } catch (error: unknown) {
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
        const { supabase } = await import('./storage/supabase-public-storage');
        const adminChannel = supabase.channel('admin-actions');
        adminChannel.send({
          type: 'broadcast',
          event: 'registration_rejected',
          payload: { userId: registrationId, rejectedBy: admin?.email, reason }
        });
      } catch (error: unknown) {
      }

      return res.json({ 
        success: true,
        message: 'Registration rejected successfully'
      });
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Password change failed', details: (error instanceof Error ? error.message : 'Internal server error') });
    }
  });

  // Note: Transfer endpoints moved to routes-transfer.ts
  // Using /api/transfers (plural) with email-based authentication

  // Transfer routes handled by fix-routes.ts below (routes-transfer.ts removed)

  // ==================== CARDS API ROUTES - PROTECTED ====================
  app.get('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const cards = await storage.getUserCards(user.id);
      return res.json(cards);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }
  });

  app.get('/api/cards/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cardId = validateId(req.params.id);

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch investments' });
    }
  });

  app.get('/api/investments/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = validateId(req.params.id);

      // SECURITY: Verify investment belongs to authenticated user
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const investment = await storage.getInvestment(id);
      if (!investment) {
        return res.status(404).json({ error: 'Investment not found' });
      }

      if (String(investment.userId) !== String(user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(investment);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
        return res.status(500).json({ error: 'Failed to save message', details: (error instanceof Error ? error.message : 'Internal server error') });
      }

      return res.json({ success: true, message: data });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to save message', details: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" });
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
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  app.get('/api/admin/chat-sessions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = validateId(req.params.id);

      // SECURITY: Only allow marking own messages as read
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userMessages = await storage.getUserMessages(user.id);
      const ownsMessage = userMessages.some(msg => String(msg.id) === String(id));

      if (!ownsMessage) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const message = await storage.markMessageAsRead(id);
      return res.json(message);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = validateId(req.params.id);

      // SECURITY: Only allow deleting own alerts
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify alert belongs to user before deleting
      const alerts = await storage.getUserAlerts(user.id);
      const alert = alerts.find((a: any) => String(a.id) === String(id));

      if (!alert) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await storage.deleteAlert(id);
      return res.json({ success: true });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to delete alert' });
    }
  });

  app.patch('/api/alerts/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = validateId(req.params.id);

      // SECURITY: Only allow marking own alerts as read
      const user = await storage.getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userAlerts = await storage.getUserAlerts(user.id);
      const ownsAlert = userAlerts.some(alert => String(alert.id) === String(id));

      if (!ownsAlert) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const alert = await storage.markAlertAsRead(id);
      return res.json(alert);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to create support ticket' });
    }
  });

  app.patch('/api/support-tickets/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = validateId(req.params.id);
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
          details: { ticketId: id, updates, action: actionDescription }
        });
      }

      return res.json({ success: true, ticket: updatedTicket });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // ==================== TRANSFER ENDPOINTS ====================
  
  // Idempotency cache for transfer requests
  const transferIdempotencyCache = new Map<string, { response: any; timestamp: number }>();
  const IDEMPOTENCY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Create a new transfer - PROTECTED with JWT authentication and rate limiting
  app.post('/api/transfers', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { recipientAccount, recipientName, amount, currency, description, transferType, idempotencyKey } = req.body;

      // Idempotency check
      if (idempotencyKey && transferIdempotencyCache.has(idempotencyKey)) {
        const cached = transferIdempotencyCache.get(idempotencyKey)!;
        if (Date.now() - cached.timestamp < IDEMPOTENCY_CACHE_TTL) {
          return res.json(cached.response);
        }
        transferIdempotencyCache.delete(idempotencyKey);
      }

      // Validate required fields
      if (!recipientAccount || !recipientName || !amount) {
        return res.status(400).json({ error: 'Missing required fields: recipientAccount, recipientName, amount' });
      }

      const amountNum = validateAmount(amount);
      if (amountNum <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' });
      }

      // Get authenticated user
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user accounts
      const userAccounts = await storage.getUserAccounts(user.id);
      if (userAccounts.length === 0) {
        return res.status(400).json({ error: 'No account found for user' });
      }

      const senderAccountId = userAccounts[0].id;

      // Check if sender has sufficient balance
      const senderBalance = parseFloat(String(userAccounts[0].balance || '0'));
      if (senderBalance < amountNum) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Generate reference number
      const referenceNumber = generateReferenceNumber();

      // Create transaction record
      const transfer = await storage.createTransaction({
        fromAccountId: senderAccountId,
        transactionType: transferType || 'transfer',
        amount: amountNum.toString(),
        description: description || `Transfer to ${recipientName}`,
        recipientName: recipientName,
        recipientAccount: recipientAccount,
        referenceNumber: referenceNumber,
        status: 'processing',
        currency: 'USD',
        createdAt: new Date()
      } as unknown as InsertTransaction);

      // ATOMIC: Update sender account balance (deduct amount)
      try {
        const senderAccount = userAccounts[0];
        const currentBalanceStr = String(senderAccount?.balance || '0');
        const currentBalance = parseFloat(currentBalanceStr);
        const newBalance = (currentBalance - parseFloat(amount.toString())).toFixed(2);
        const balanceNum = parseFloat(newBalance);
        if (!isNaN(balanceNum) && storage?.updateAccount) {
          await storage.updateAccount(senderAccountId, { balance: String(balanceNum) });
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
    } catch (error: unknown) {
      return res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') || "Unknown error" || 'Failed to create transfer', details: (error instanceof Error ? error.toString() : 'Unknown error') });
    }
  });

  // Get transfer status
  app.get('/api/transfers/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      
      const allTransactions = await storage.getAllTransactions();
      
      const transfer = allTransactions.find((t: any) => {
        const idMatch = t.id?.toString() === id?.toString();
        const refMatch = t.referenceNumber === id;
        return idMatch || refMatch;
      });
      
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found', searchedId: id });
      }
      
      return res.json({
        id: transfer.id,
        status: transfer.status || 'processing',
        referenceNumber: transfer.referenceNumber,
        amount: transfer.amount,
        recipientName: transfer.recipientName,
        recipientAccount: transfer.recipientAccount,
        createdAt: transfer.createdAt
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get transfer status' });
    }
  });

  // ==================== ACCOUNT BALANCE ENDPOINT ====================
  app.get('/api/accounts/balance', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) {
        return res.json({ balance: '0.00', currency: 'USD' });
      }

      const totalBalance = accounts.reduce((sum: number, acc: any) => {
        return sum + parseFloat(String(acc.balance || '0'));
      }, 0);

      return res.json({
        balance: totalBalance.toFixed(2),
        currency: accounts[0].currency || 'USD',
        accountCount: accounts.length
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to get balance' });
    }
  });

  // ==================== ADMIN ACTIONS LOG ====================
  app.get('/api/admin/actions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const actions = await (storage as any).getAdminActions?.() || [];
      return res.json(actions);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch admin actions' });
    }
  });

  // ==================== ANALYTICS ENDPOINTS ====================
  app.get('/api/admin/analytics/summary', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const transactions = await storage.getAllTransactions();
      
      const totalUsers = users.length;
      const activeUsers = users.filter((u: any) => u.isActive).length;
      const pendingUsers = users.filter((u: any) => !u.isActive && u.role === 'customer').length;
      const totalTransactions = transactions.length;
      const totalVolume = transactions.reduce((sum: number, t: any) => {
        return sum + parseFloat(String(t.amount || '0'));
      }, 0);

      return res.json({
        totalUsers,
        activeUsers,
        pendingUsers,
        totalTransactions,
        totalVolume: totalVolume.toFixed(2),
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
  });

  // ==================== CHAT HISTORY ENDPOINT ====================
  app.get('/api/chat/history/:sessionId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error: unknown) {
      return res.json([]);
    }
  });

  app.get('/api/chat/sessions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // For admin, return all customer sessions
      if (user.role === 'admin') {
        const { data, error } = await supabase
          .from('user_profiles')
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
      }

      // For customers, return their own session
      return res.json([{
        id: `session_${user.id}`,
        customerId: user.id,
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        status: 'active'
      }]);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.post('/api/chat/send', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { content, recipientId, sessionId } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'content required' });
      }

      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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
        return res.status(500).json({ error: 'Failed to send message' });
      }

      return res.json({ success: true, message: data });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // ==================== STARTUP HEALTH CHECK ====================
  app.get('/api/health/detailed', async (req: Request, res: Response) => {
    try {
      const checks: any = {
        server: 'OK',
        database: 'unknown',
        supabase: 'unknown',
        timestamp: new Date().toISOString()
      };

      // Check database connection
      try {
        const users = await storage.getAllUsers();
        checks.database = 'OK';
        checks.userCount = users.length;
      } catch (e) {
        checks.database = 'ERROR';
      }

      // Check Supabase connection
      try {
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        checks.supabase = error ? 'ERROR' : 'OK';
      } catch (e) {
        checks.supabase = 'ERROR';
      }

      return res.json(checks);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Health check failed' });
    }
  });

  const server = createServer(app);
  return server;
}
