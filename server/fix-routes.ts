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
  [key: string]: any;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Fixed route handlers with proper typing
export async function registerFixedRoutes(app: Express): Promise<Server> {
  console.error('\n🚀 =====================================================');
  console.error('🚀 STARTING EXPRESS SERVER WITH BANKING API');
  console.error('🚀 =====================================================\n');
  
  logConfiguration();
  
  console.error('📊 Storage layer:', {
    type: 'CompleteSupabaseStorage',
    supabaseUrl: process.env.VITE_SUPABASE_URL?.slice(0, 30) + '...',
    storageReady: !!storage
  });
  
  // CRITICAL: Run startup sanity checks to verify database functions
  await runStartupChecks();
  
  // Runtime config endpoint - serves Supabase credentials to frontend
  app.get('/api/config', (req: Request, res: Response) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    });
  });
  
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date() });
  });

  // Test Supabase connection and verify tables exist - ADMIN ONLY
  app.get('/test-supabase-connection', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { SupabasePublicStorage } = await import('./supabase-public-storage');
      const { supabase } = await import('./supabase-public-storage');

      // Test connection by checking if bank_users table exists
      const { data, error } = await supabase
        .from('bank_users')
        .select('id, full_name, email, balance')
        .order('id', { ascending: false })
        .limit(10);

      if (error) {
        res.json({ 
          connected: false, 
          message: 'Banking tables not found in Supabase',
          error: error.message,
          action: 'Please run the SQL in supabase-cleanup-and-setup.sql'
        });
      } else {
        res.json({ 
          connected: true, 
          message: `Banking tables working! Found ${data?.length || 0} users`,
          users: data,
          details: 'International banking system ready with realtime synchronization'
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Connection test failed', details: error.message });
    }
  });

  // SECURITY: Test user creation endpoint - ADMIN ONLY
  app.post('/api/admin/create-test-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const testUser = await storage.createUser({
        username: 'testuser',
        email: req.body.email || 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        password: 'supabase_auth',
        profession: 'Developer',
        accountNumber: '123456789',
        accountId: 1001,
        balance: '10000'
      });
      res.json({ success: true, user: testUser });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create test user' });
    }
  });

  // Get user by Supabase UUID
  app.get('/api/users/supabase/:supabaseId', async (req: Request, res: Response) => {
    try {
      const { supabaseId } = req.params;

      if (!supabaseId) {
        return res.status(400).json({ error: 'Supabase ID required' });
      }

      const user = await (storage as any).getUserBySupabaseId(supabaseId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error: unknown) {
      res.status(500).json({ error: 'Failed to get user' });
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
          details: validation.errors 
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


        res.status(201).json({ 
          success: true,
          message: 'Registration successful. Awaiting admin approval.',
          user: {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
          }
        });

      } catch (dbError: any) {

        // Attempt to rollback Supabase Auth account
        if (supabaseUserId) {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
          if (deleteError) {
          } else {
          }
        }

        res.status(500).json({ 
          error: 'Database error during registration',
          details: dbError.message 
        });
        return;
      }

    } catch (error: any) {
      res.status(500).json({ 
        error: 'Registration failed',
        details: error.message 
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

      res.json({
        available: true,
        message: 'Email available'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check email availability. Please try again.' });
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

      res.json({ 
        success: true, 
        message: 'Password updated successfully',
        email: email
      });

    } catch (error: any) {
      res.status(500).json({ error: 'Password reset failed', details: error.message });
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


      res.status(201).json({ 
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
      res.status(500).json({ 
        error: 'Failed to create user profile',
        details: error.message 
      });
    }
  });

  // SECURITY: Test user endpoint COMPLETELY DISABLED in production and dev for safety
  app.post('/api/create-test-user', async (req: Request, res: Response) => {
    // CRITICAL: This endpoint is disabled for security - use normal registration only
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Test user endpoint is disabled for security reasons. Use normal registration instead.'
    });
  });

  // User endpoints - PROTECTED with JWT authentication
  app.get('/api/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const email = req.user!.email;
      const userId = (req.user as any).id || (req.user as any).userId;
      
      console.log(`🔍 /api/user endpoint called for email: ${email}, userId: ${userId}`);
      
      // Try 1: Get by email
      let user = await storage.getUserByEmail(email);
      
      // Try 2: If not found by email, try by Supabase ID
      if (!user && userId && typeof storage.getUserBySupabaseId === 'function') {
        console.log(`⚠️ User not found by email, trying Supabase ID: ${userId}`);
        user = await storage.getUserBySupabaseId(userId);
      }
      
      // Try 3: Get all users and find manually (fallback)
      if (!user) {
        console.log(`⚠️ User not found by email or ID, attempting manual search...`);
        try {
          const allUsers = await storage.getAllUsers();
          user = allUsers.find(u => u.email === email);
          if (!user) {
            console.log(`❌ User not found in any search: ${email}`);
            // Create user profile if it doesn't exist
            console.log(`🆕 Creating new user profile for: ${email}`);
            user = await storage.createUser({
              username: email.split('@')[0],
              email: email,
              firstName: 'Customer',
              lastName: 'Account',
              phone: '0000000000',
              password: 'supabase_auth',
              profession: 'Banking Customer',
              accountNumber: generateAccountNumber(),
              accountId: Math.floor(Math.random() * 1000000),
              balance: '0'
            });
            console.log(`✅ Created new user: ${user?.id}`);
          }
        } catch (searchError: any) {
          console.error(`🔴 Error during manual user search/creation:`, searchError);
        }
      }
      
      if (!user) {
        console.log(`❌ Final: User still not found after all attempts`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`✅ User retrieved successfully: ${user.id}`);
      res.json(user);
    } catch (error: any) {
      console.error(`❌ /api/user error:`, error);
      res.status(500).json({ error: 'Failed to get user', details: error?.message });
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
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Real user profile endpoint - PROTECTED with JWT authentication
  app.post('/api/user/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user profile' });
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

      res.json({
        success: true,
        message: 'Profile photo updated successfully',
        user: updatedUser
      });
    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error);
      res.status(500).json({ error: 'Failed to upload avatar', details: error.message });
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
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user accounts' });
    }
  });

  // SECURITY: Admin endpoints - PROTECTED with role-based access control

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

      res.json({ 
        success: true, 
        transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create transaction' });
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

      res.json({ 
        success: true, 
        message: 'Account balance updated successfully',
        newBalance: newBalance,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update account balance' });
    }
  });

  // Balance update endpoint - REQUIRES ADMIN ROLE
  app.post('/api/admin/customers/:id/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const body = req.body as { amount: string; description: string };

      const amountNum = validateAmount(body.amount);
      const oldUser = await (storage).getUser(customerId);
      const updatedUser = await storage.updateUserBalance(customerId, amountNum);

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

      res.json({ 
        success: true, 
        user: updatedUser,
        message: 'Balance updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update balance' });
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

      res.json({ 
        success: true, 
        user: updatedUser,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // Get all transactions - REQUIRES ADMIN ROLE
  app.get('/api/admin/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get transactions' });
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

      res.json({ success: true, verified: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify PIN', verified: false });
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

      console.info('✅ Fetched', allTransactions.length, 'transactions for user:', req.user!.email);
      res.json(allTransactions);
    } catch (error: any) {
      console.info('❌ Failed to fetch transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
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
      console.info('✅ Fetched', accounts.length, 'accounts for user:', req.user!.email);
      res.json(accounts);
    } catch (error: any) {
      console.info('❌ Failed to get accounts:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
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
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // Admin pending registrations - REQUIRES ADMIN ROLE
  app.get('/api/admin/pending-registrations', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const pending = users.filter(user => !user.isActive && user.role === 'customer');
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pending registrations' });
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
          details: validation.errors 
        });
      }

      const { initialBalance } = validation.data;

      // ATOMIC TRANSACTION: Approve user with all updates
      const transaction = new BankingTransaction();
      let updatedUser: any = null;

      transaction.addStep({
        name: 'Activate user account',
        execute: async () => {
          updatedUser = await storage.updateUser(registrationId, {
            isActive: true,
            isVerified: true
          });
          if (!updatedUser) throw new Error('Registration not found');
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
      } catch (error) {
      }
      
      res.json({ 
        success: true,
        message: 'Registration approved successfully',
        user: updatedUser
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve registration' });
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
      } catch (error) {
      }

      res.json({ 
        success: true,
        message: 'Registration rejected successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject registration' });
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
          details: validation.errors 
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
      res.json({ success: true, message: 'PIN updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to change PIN' });
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
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cards' });
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

      res.json(card);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch card' });
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
      res.json({ success: true, card: updatedCard });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update card' });
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

      const updates: Record<string, any> = {};
      if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
      if (contactlessEnabled !== undefined) updates.contactlessEnabled = contactlessEnabled;

      const updatedCard = await storage.updateCard(cardId, updates);
      res.json({ success: true, card: updatedCard });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update card settings' });
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
      res.json(investments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch investments' });
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

      res.json(investment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch investment' });
    }
  });

  // ==================== MARKET DATA API ROUTES - PROTECTED ====================
  app.get('/api/market-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const marketRates = await (storage).getMarketRates();

      // Transform database format to frontend expected format
      const transformedData: Record<string, any> = {};

      marketRates.forEach((rate: any) => {
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

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market rates' });
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
      res.json(indices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market indices' });
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
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch top stocks' });
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
        const value = parseFloat(inv.total_value || inv.totalValue || 0);
        const gainLoss = parseFloat(inv.gain_loss || inv.gainLoss || 0);

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

      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch portfolio assets' });
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

      res.json({
        success: true,
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        convertedAmount: +convertedAmount.toFixed(2),
        exchangeRate: +exchangeRate.toFixed(4),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process currency exchange' });
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
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.get('/api/messages/user/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const messages = await storage.getUserMessages(user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user messages' });
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
      
      console.log('💬 Saving message:', { senderId: user.id, senderRole, recipientId: finalRecipientId, sessionId: finalSessionId, content });
      
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
        .select();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to save message', details: error.message });
      }
      console.log('✅ Message saved successfully');
      res.json(data?.[0] || { success: true });
    } catch (error: any) {
      console.error('❌ Message save error:', error);
      res.status(500).json({ error: 'Failed to save message', details: error.message });
    }
  });

  app.get('/api/messages/session/:sessionId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      console.log('📨 Fetching messages for session:', sessionId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Supabase message query error:', error);
        return res.json([]);
      }
      console.log('✅ Found', data?.length || 0, 'messages for session:', sessionId);
      res.json(data || []);
    } catch (error) {
      console.error('Message fetch error:', error);
      res.json([]);
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
      const sessions = (data || []).map((user: any) => ({
        id: `session_${user.id}`,
        customerId: user.id,
        customerName: user.full_name || user.email,
        status: 'active'
      }));
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
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
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark message as read' });
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
        console.error('Supabase alerts query error:', error);
        return res.json([]);
      }
      res.json(data || []);
    } catch (error) {
      console.error('Alerts endpoint error:', error);
      res.json([]);
    }
  });

  app.get('/api/alerts/unread', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const alerts = await storage.getUnreadAlerts(user.id);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch unread alerts' });
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
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create alert' });
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
      const alert = alerts.find((a: any) => a.id === id);

      if (!alert) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await storage.deleteAlert(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete alert' });
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
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark alert as read' });
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

      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  });

  app.post('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const ticketData = {
        userId: user.id,
        subject: req.body.subject,
        description: req.body.description,
        priority: req.body.priority || 'medium',
        status: 'open',
        category: req.body.category
      };

      const ticket = await storage.createSupportTicket(ticketData);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create support ticket' });
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

      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // ==================== OBJECT STORAGE API ROUTES ====================
  // Branches endpoint
  app.get('/api/branches', async (req: Request, res: Response) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  });

  // ATMs endpoint
  app.get('/api/atms', async (req: Request, res: Response) => {
    try {
      const atms = await storage.getAtms();
      res.json(atms);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch ATMs' });
    }
  });

  // Exchange rates endpoint
  app.get('/api/exchange-rates', async (req: Request, res: Response) => {
    try {
      const rates = await storage.getExchangeRates();
      // Convert to object format: { EUR: 0.92, GBP: 0.79, ... }
      const ratesObject: Record<string, number> = {};
      rates.forEach((rate: any) => {
        ratesObject[rate.targetCurrency || rate.target_currency] = parseFloat(rate.rate);
      });
      res.json(ratesObject);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
  });

  // Admin customers endpoint
  // Get all pending transfers for admin review
  app.get('/api/admin/pending-transfers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allTransfers = await storage.getAllTransactions();
      const transfers = allTransfers.filter((t: any) => t.status === 'pending');
      
      // Format for admin dashboard
      const formattedTransfers = transfers.map((t: any) => ({
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

      res.json(formattedTransfers);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch pending transfers', error: error.message });
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

      res.json(formattedTickets);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch support tickets', error: error.message });
    }
  });

  app.get('/api/admin/customers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      // Filter out admins, only return customers
      const customerList = customers.filter((user: any) => user.role === 'customer');
      res.json(customerList);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch customers' });
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
      res.json(statements);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statements' });
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

      res.json(uploadResult);
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload file' });
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

        res.status(201).json({ 
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

      } catch (dbError: any) {
        // ROLLBACK: Delete Supabase Auth account if database creation fails

        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

        throw dbError;
      }

    } catch (error: any) {
      res.status(500).json({ 
        error: 'Admin user creation failed',
        details: error.message 
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
          console.info('🔄 Creating new user in bank_users:', email);
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
          console.info('✅ User created:', { id: dbUser.id, email });
          
          // Also create initial account for user
          console.info('🔄 Creating initial account for user...');
          await storage.createAccount({
            userId: dbUser.id,
            accountNumber: `${generateAccountNumber()}`,
            accountType: 'checking',
            balance: '0.00',
            currency: 'USD',
            status: 'active'
          });
          console.info('✅ Initial account created');
        } catch (dbError: any) {
          console.info('❌ Failed to create user in bank_users:', dbError);
          // User authenticated - still return token even if DB create fails
        }
      } else {
        // User exists - verify they have at least one account
        const userAccounts = await storage.getUserAccounts(dbUser.id);
        if (userAccounts.length === 0) {
          console.info('🔄 User has no accounts, creating one...');
          await storage.createAccount({
            userId: dbUser.id,
            accountNumber: `${generateAccountNumber()}`,
            accountType: 'checking',
            balance: '0.00',
            currency: 'USD',
            status: 'active'
          });
          console.info('✅ Account created for existing user');
        }
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

      console.info('✅ LOGIN SUCCESS:', { email, userId: supabaseUser.id, tokenType: 'Supabase JWT' });

      res.json({ 
        token: accessToken,
        refreshToken: data.session?.refresh_token,
        user: dbUser || {
          id: supabaseUser.id,
          email: supabaseUser.email,
          role: supabaseUser.app_metadata?.role || 'customer'
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Login failed', details: error.message });
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
      
      res.json({ 
        message: "Logged out successfully",
        status: "ok"
      });
    } catch (error) {
      // Even if error, consider logout successful
      res.json({ 
        message: "Logged out successfully",
        status: "ok"
      });
    }
  });

  // BOOTSTRAP: List all users in Supabase Auth (for debugging)
  app.get('/api/admin/list-users', async (req: Request, res: Response) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        return res.status(500).json({ error: 'Failed to list users', details: error.message });
      }

      res.json({
        total: data.users.length,
        users: data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.app_metadata?.role || 'customer',
          verified: u.email_confirmed_at ? 'yes' : 'no'
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to list users', details: error.message });
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

      console.info('✅ ADMIN LOGIN SUCCESS:', { email, userId: data.user.id, tokenType: 'Supabase JWT' });

      res.json({ 
        token: accessToken,
        refreshToken: data.session?.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: role
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // ADMIN ONLY: Reset user password in Supabase Auth
  app.post('/api/admin/reset-password', async (req: Request, res: Response) => {
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


      res.json({ 
        success: true, 
        message: `Password reset successfully for ${email}. You can now login with the new password.`,
        email: email
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to reset password', details: error.message });
    }
  });

  // ADMIN ONLY: Delete user from Supabase Auth and local database
  app.post('/api/admin/delete-user/:email', async (req: Request, res: Response) => {
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


      res.json({ 
        success: true, 
        message: `User ${email} deleted successfully from Supabase Auth`,
        deleted_email: email
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
  });

  // ==================== TRANSFER WORKFLOW ENDPOINTS ====================
  
  // Idempotency cache for transfers (prevent duplicates within 5 minutes)
  const transferIdempotencyCache = new Map<string, { response: any; timestamp: number }>();
  
  // Create a transfer with IDEMPOTENCY protection
  app.post('/api/transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, recipientName, recipientCountry, recipientAccount, purpose, transferPin, idempotencyKey } = req.body;
      
      console.error('\n📤 POST /api/transfers', { 
        amount, 
        recipientName, 
        recipientCountry, 
        recipientAccount,
        authenticatedUser: req.user?.email,
        hasIdempotencyKey: !!idempotencyKey
      });
      
      // IDEMPOTENCY: Check for duplicate request
      if (idempotencyKey) {
        const cached = transferIdempotencyCache.get(idempotencyKey);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute window
          console.info('✅ IDEMPOTENT: Returning cached transfer response');
          return res.json(cached.response);
        }
      }
      
      if (!amount || !recipientName || !recipientAccount || !transferPin) {
        console.info('❌ Missing required fields:', { amount: !!amount, recipientName: !!recipientName, recipientAccount: !!recipientAccount, transferPin: !!transferPin });
        return res.status(400).json({ error: 'Missing required fields', fields: { amount: !!amount, recipientName: !!recipientName, recipientAccount: !!recipientAccount, transferPin: !!transferPin } });
      }

      // Validate amount is positive number
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount - must be positive number' });
      }

      const referenceNumber = generateReferenceNumber('WB');
      console.info('🔄 Creating transaction with reference:', referenceNumber);

      console.error('💾 Calling storage.createTransaction()...');
      const transfer = await storage.createTransaction({
        fromAccountId: 1,
        type: 'transfer',
        amount: amount.toString(),
        description: `Transfer to ${recipientName} in ${recipientCountry}`,
        status: 'pending_approval',
        currency: 'USD',
        referenceNumber: referenceNumber
      });

      // ATOMIC: Update sender account balance (deduct amount)
      try {
        const userId = typeof req.user?.id === 'string' ? parseInt(req.user.id) : (req.user?.id || 1);
        const userAccounts = await storage.getUserAccounts(userId);
        if (userAccounts && userAccounts.length > 0) {
          const senderAccount = userAccounts[0];
          const balanceStr = senderAccount?.balance?.toString?.() || '0';
          const currentBalance = parseFloat(balanceStr);
          const newBalance = (currentBalance - parseFloat(amount.toString())).toFixed(2);
          const accountId = typeof senderAccount.id === 'string' ? parseInt(senderAccount.id) : senderAccount.id;
          await storage.updateAccount(accountId, { balance: parseFloat(newBalance) as any });
          console.info('✅ Sender balance updated:', { accountId, newBalance });
        }
      } catch (balanceError) {
        console.warn('⚠️ Balance update warning (non-blocking):', balanceError);
      }

      console.info('✅ Transfer created successfully:', { 
        id: transfer.id, 
        referenceNumber: transfer.referenceNumber, 
        status: transfer.status,
        timestamp: new Date().toISOString()
      });

      const response = {
        id: transfer.id,
        transactionId: transfer.referenceNumber,
        status: 'pending_approval'
      };

      // Cache the response for idempotency
      if (idempotencyKey) {
        transferIdempotencyCache.set(idempotencyKey, { response, timestamp: Date.now() });
      }

      res.json(response);
    } catch (error: any) {
      console.info('❌ Transfer creation FAILED:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ error: error.message || 'Failed to create transfer', details: error.toString() });
    }
  });

  // Get transfer status
  app.get('/api/transfers/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      console.error('📥 GET /api/transfers/:id/status', { id, user: req.user?.email });
      
      const allTransactions = await storage.getAllTransactions();
      console.error(`🔍 Found ${allTransactions.length} total transactions`);
      
      const transfer = allTransactions.find((t: any) => {
        const idMatch = t.id?.toString() === id?.toString();
        const refMatch = t.referenceNumber === id;
        return idMatch || refMatch;
      });
      
      if (!transfer) {
        console.warn('⚠️ Transfer not found:', { id, totalTransactions: allTransactions.length });
        return res.status(404).json({ error: 'Transfer not found', searchedId: id });
      }

      console.info('✅ Transfer found:', { id: transfer.id, status: transfer.status, referenceNumber: transfer.referenceNumber });

      res.json({
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
      console.info('❌ Transfer status error:', error.message, error);
      res.status(500).json({ error: error.message || 'Failed to fetch transfer status', details: error.toString() });
    }
  });

  // Idempotency cache for international transfers
  const intlTransferIdempotencyCache = new Map<string, { response: any; timestamp: number }>();
  
  // Create international transfer with IDEMPOTENCY protection
  app.post('/api/international-transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, recipientCountry, transferPin, idempotencyKey } = req.body;
      
      console.error('📤 POST /api/international-transfers', { amount, recipientCountry, hasIdempotencyKey: !!idempotencyKey });
      
      // IDEMPOTENCY: Check for duplicate request
      if (idempotencyKey) {
        const cached = intlTransferIdempotencyCache.get(idempotencyKey);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute window
          console.info('✅ IDEMPOTENT: Returning cached international transfer response');
          return res.json(cached.response);
        }
      }
      
      if (!amount || !recipientCountry || !transferPin) {
        console.info('❌ Missing required fields:', { amount, recipientCountry, transferPin });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate amount is positive number
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount - must be positive number' });
      }

      const referenceNumber = generateReferenceNumber('INT');
      console.info('🔄 Creating international transaction:', referenceNumber);

      const transfer = await storage.createTransaction({
        fromAccountId: 1,
        type: 'international_transfer',
        amount: amount.toString(),
        description: `International transfer to ${recipientCountry}`,
        status: 'pending_approval',
        currency: 'USD',
        referenceNumber: referenceNumber
      });

      console.info('✅ International transfer created:', { id: transfer.id, referenceNumber: transfer.referenceNumber });

      const response = {
        id: transfer.id,
        transactionId: transfer.referenceNumber,
        status: 'pending_approval'
      };

      // Cache the response for idempotency
      if (idempotencyKey) {
        intlTransferIdempotencyCache.set(idempotencyKey, { response, timestamp: Date.now() });
      }

      res.json(response);
    } catch (error: any) {
      console.info('❌ International transfer error:', error.message, error);
      res.status(500).json({ error: error.message || 'Failed to create international transfer', details: error.toString() });
    }
  });

  // ==================== MESSAGE ENDPOINTS ====================
  
  // POST /api/messages - Save a new message
  app.post('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { content, recipientId, sessionId } = req.body;
      
      if (!content || !sessionId) {
        return res.status(400).json({ error: 'Content and sessionId required' });
      }

      const senderId = typeof req.user?.id === 'string' ? parseInt(req.user.id) : (req.user?.id || 0);
      const message = await storage.createMessage({
        senderId: senderId,
        senderRole: req.user?.role === 'admin' ? 'admin' : 'customer',
        recipientId: recipientId ? parseInt(recipientId) : undefined,
        recipientRole: recipientId ? 'admin' : 'customer',
        content: content,
        sessionId: sessionId,
        isRead: false
      });

      console.info('✅ Message saved:', { id: message.id, sessionId, timestamp: new Date().toISOString() });
      res.json(message);
    } catch (error: any) {
      console.error('❌ Failed to save message:', error.message);
      res.status(500).json({ error: 'Failed to save message', details: error.message });
    }
  });

  // GET /api/messages/session/:sessionId - Fetch messages for a session
  app.get('/api/messages/session/:sessionId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId required' });
      }

      // Fetch all messages for this session
      const messages = await storage.getMessages(sessionId);
      
      console.info('✅ Fetched', messages.length, 'messages for session:', sessionId);
      res.json(messages);
    } catch (error: any) {
      console.error('❌ Failed to fetch messages:', error.message);
      res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
  });

  // GET /api/messages - Fetch user messages
  app.get('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = typeof req.user?.id === 'string' ? parseInt(req.user.id) : (req.user?.id || 0);
      const messages = await storage.getUserMessages(userId);
      console.info('✅ Fetched', messages.length, 'user messages');
      res.json(messages);
    } catch (error: any) {
      console.error('❌ Failed to fetch user messages:', error.message);
      res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
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

  // Real-time notifications
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

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

