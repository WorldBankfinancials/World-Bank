import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage-factory';
import { setupTransferRoutes } from './routes-transfer';
import { config, logConfiguration } from './config';
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

// Fixed route handlers with proper typing
export async function registerFixedRoutes(app: Express): Promise<Server> {
  logConfiguration();
  
  // CRITICAL: Run startup sanity checks to verify database functions
  await runStartupChecks();
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date() });
  });

  // Test Supabase connection and verify tables exist
  app.get('/test-supabase-connection', async (req: Request, res: Response) => {
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

  // SECURITY: Test user creation endpoint - DEVELOPMENT ONLY

  // Get user by Supabase UUID
  app.get('/api/users/supabase/:supabaseId', async (req: Request, res: Response) => {
    try {
      const {supabaseId } = req.params;

      const user = await (storage as any).getUserBySupabaseId(supabaseId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user by Supabase ID error:', error);
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
        email_confirm: true, // Auto-confirm for banking app
        user_metadata: {
          full_name: validatedData.fullName,
          phone: validatedData.phone,
          registration_date: new Date().toISOString()
        }
      });

      if (authError || !authData.user) {
        console.error('❌ Supabase Auth creation failed for email:', validatedData.email);
        console.error('❌ Error details:', JSON.stringify(authError, null, 2));
        console.error('❌ Error message:', authError?.message);
        console.error('❌ Error status:', authError?.status);
        return res.status(500).json({ 
          error: authError?.message || 'Failed to create authentication account' 
        });
      }

      supabaseUserId = authData.user.id;
      console.log(`✅ Supabase Auth account created: ${supabaseUserId}`);

      // STEP 2: Create local database profile - USING VALIDATED DATA ONLY
      try {
        console.log(`🔧 DEBUG: About to create user in database with supabaseUserId: ${supabaseUserId}`);
        const newUser = await storage.createUser({
          username: validatedData.email.split('@')[0],
          fullName: validatedData.fullName,
          email: validatedData.email,
          phone: validatedData.phone,
          dateOfBirth: validatedData.dateOfBirth,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          postalCode: validatedData.postalCode,
          nationality: validatedData.nationality,
          profession: validatedData.profession,
          annualIncome: validatedData.annualIncome,
          idType: validatedData.idType,
          idNumber: validatedData.idNumber,
          supabaseUserId: supabaseUserId,
          accountNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`,
          accountId: `WB${Date.now()}`,
          passwordHash: 'supabase_auth',
          transferPin: validatedData.transferPin,
          role: 'customer',
          isVerified: false,
          isOnline: false,
          isActive: false, // Requires admin approval
          balance: "0",
        });

        console.log(`🔧 DEBUG: User created successfully, returned user ID: ${newUser.id}, email: ${newUser.email}`);

        // Create initial checking account
        console.log(`🔧 DEBUG: About to create account for user ID: ${newUser.id}`);
        await storage.createAccount({
          userId: newUser.id,
          accountNumber: newUser.accountNumber || `${Math.floor(10000000 + Math.random() * 90000000)}`,
          accountType: 'checking',
          balance: '0.00',
          currency: 'USD',
          isActive: false // Requires admin approval
        });

        console.log(`🔧 DEBUG: Account created successfully`);
        
        // VERIFY user was actually saved
        const verifyUser = await (storage as any).getUserByEmail(newUser.email);
        console.log(`🔧 DEBUG: Verification - user exists in database:`, verifyUser ? 'YES' : 'NO');
        if (verifyUser) {
          console.log(`🔧 DEBUG: Verified user ID: ${verifyUser.id}, email: ${verifyUser.email}`);
        } else {
          console.error(`❌ CRITICAL BUG: User was created but not found in database!`);
        }

        console.log(`✅ Complete registration successful: ${newUser.email}`);

        res.status(201).json({ 
          success: true,
          message: 'Registration successful. Awaiting admin approval.',
          user: {
            email: newUser.email,
            fullName: newUser.fullName
          }
        });

      } catch (dbError: any) {
        console.error('❌ Database error during registration:', dbError);

        // Attempt to rollback Supabase Auth account
        if (supabaseUserId) {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
          if (deleteError) {
            console.error('⚠️ Failed to rollback Supabase Auth account:', deleteError);
            console.error(`⚠️ ORPHANED ACCOUNT: ${registrationData.email} (${supabaseUserId})`);
          } else {
            console.log(`✅ Rolled back Supabase Auth account: ${supabaseUserId}`);
          }
        }

        res.status(500).json({ 
          error: 'Database error during registration',
          details: dbError.message 
        });
        return;
      }

    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        details: error.message 
      });
    }
  });

  // Check email availability endpoint - checks both Supabase and local DB
  app.post('/api/auth/check-email', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check local database first
      const existingUser = await (storage as any).getUserByEmail(email);
      if (existingUser) {
        return res.json({
          available: false,
          message: 'Email already registered in database'
        });
      }

      // Check Supabase Auth
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Use admin API to check if user exists
      const { data: users, error } = await supabase.auth.admin.listUsers();

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
      console.error('Email check error:', error);
      res.status(500).json({ error: 'Failed to check email availability' });
    }
  });

  // ADMIN: Reset user password in Supabase Auth
  app.post('/api/admin/reset-user-password', async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and newPassword are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
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
        console.error('Password update error:', updateError);
        return res.status(500).json({ error: 'Failed to update password', details: updateError.message });
      }

      console.log(`✅ Password reset successful for: ${email}`);
      res.json({ 
        success: true, 
        message: 'Password updated successfully',
        email: email
      });

    } catch (error: any) {
      console.error('Password reset error:', error);
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
        console.error('🚨 SECURITY VIOLATION: Password sent to /api/auth/register endpoint!');
        return res.status(400).json({ 
          error: 'Invalid request - passwords must not be sent to this endpoint' 
        });
      }

      // SECURITY: Block privilege escalation attempts
      if (userData.role && userData.role !== 'customer') {
        console.error(`🚨 PRIVILEGE ESCALATION ATTEMPT: Client tried to set role to "${userData.role}"`);
        return res.status(400).json({ 
          error: 'Invalid request - role cannot be set by client' 
        });
      }

      // Check if user already exists in local database
      const existingUser = await (storage as any).getUserByEmail(userData.email);
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
        console.error('Error checking Supabase Auth during registration:', authError);
        return res.status(500).json({ error: 'Unable to verify user in authentication system' });
      }

      // SECURITY: Only accept whitelisted fields from client, hardcode privileged fields server-side
      const newUser = await storage.createUser({
        // WHITELISTED FIELDS (client-provided)
        username: userData.username || userData.email.split('@')[0],
        fullName: userData.fullName,
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
        supabaseUserId: userData.supabaseUserId, // This should be the ID from Supabase Auth
        accountNumber: userData.accountNumber || `${Math.floor(10000000 + Math.random() * 90000000)}`,
        accountId: userData.accountId || `WB${Date.now()}`,

        // SERVER-CONTROLLED FIELDS (never trust client)
        passwordHash: 'supabase_auth', // Marker indicating password is in Supabase Auth
        transferPin: '0000', // Default PIN, user MUST change on first login
        role: 'customer', // Always customer for new registrations
        isVerified: false, // Admin must verify
        isOnline: true,
        isActive: false, // Admin must activate
        balance: "0", // Always start at 0
      });

      // Create initial checking account
      const accountNumber = `${Math.floor(10000000 + Math.random() * 90000000)}`;
      await storage.createAccount({
        userId: newUser.id,
        accountNumber: accountNumber,
        accountType: 'checking',
        balance: '0.00',
        currency: 'USD',
        isActive: true
      });

      console.log(`✅ New user profile created in DB: ${newUser.fullName} (${newUser.email})`);

      res.status(201).json({ 
        success: true,
        message: 'User profile created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Failed to create user profile',
        details: error.message 
      });
    }
  });

  // WARNING: This endpoint uses service role key and should NEVER be exposed in production
  app.post('/api/create-test-user', async (req: Request, res: Response) => {
    // CRITICAL: Block in production to prevent privilege escalation
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Create Supabase admin client with service role key
      const supabaseAdmin = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Try to get user by email first
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.find((u: any) => u.email === email);

      if (existingUser) {
        // Update password for existing user
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password, email_confirm: true }
        );

        if (updateError) {
          return res.status(400).json({ error: updateError.message });
        }

        res.json({ 
          success: true, 
          message: 'Test user password updated successfully',
          user: { email, id: existingUser.id }
        });
      } else {
        // Create new user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (authError) {
          return res.status(400).json({ error: authError.message });
        }

        // Create user in local database with default values
        await storage.createUser({
          supabaseUserId: authData.user?.id,
          email: email,
          username: email.split('@')[0],
          fullName: 'Test User',
          role: 'customer',
          isVerified: true,
          isActive: true,
          balance: "0",
          transferPin: '0000',
          passwordHash: 'supabase_auth', // Indicate password managed by Supabase Auth
          accountNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`,
          accountId: `WB${Date.now()}`,
        });

        res.json({ 
          success: true, 
          message: 'Test user created successfully in Supabase Auth and DB',
          user: { email, id: authData.user?.id }
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create/update test user', details: error.message });
    }
  });

  // User endpoints - PROTECTED with JWT authentication
  app.get('/api/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('🔍 Fetching authenticated user profile for:', req.user!.email);
      res.json(user);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  // Real user accounts endpoint - PROTECTED with JWT authentication
  app.post('/api/accounts/user', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const accounts = await storage.getUserAccounts(user.id);
      console.log('🏦 Fetching authenticated account data for user:', user.id);
      res.json(accounts);
    } catch (error) {
      console.error('Get user accounts error:', error);
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

      const customerIdNum = parseInt(body.customerId, 10);
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
        adminNotes: `Admin created transaction: ${body.description}`,
        createdAt: new Date()
      });

      // Update account balance if it's a credit/debit
      if (body.type === 'credit' || body.type === 'debit') {
        const amountNum = parseFloat(body.amount);
        const balanceChange = body.type === 'credit' ? amountNum : -amountNum;
        await storage.updateUserBalance(customerIdNum, balanceChange);
      }

      // AUDIT TRAIL: Log admin action
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          actionType: 'create_transaction',
          targetType: 'transaction',
          targetId: transaction.id.toString(),
          description: `Created ${body.type} transaction of $${body.amount} for customer ${customerIdNum}`,
          metadata: JSON.stringify({ customerId: customerIdNum, amount: body.amount, type: body.type })
        });
      }

      res.json({ 
        success: true, 
        transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // Individual account balance update endpoint - REQUIRES ADMIN ROLE
  app.post('/api/admin/accounts/:accountId/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = parseInt(req.params.accountId, 10);
      const body = req.body as { amount: string; description: string; type: 'credit' | 'debit' };

      const amountNum = parseFloat(body.amount);
      const balanceChange = body.type === 'credit' ? amountNum : -amountNum;

      // Get account and update balance
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const newBalance = parseFloat(account.balance.toString()) + balanceChange;
      await storage.updateAccount?.(accountId, { balance: newBalance.toString() });

      // Create transaction record
      const transaction = await storage.createTransaction({
        fromAccountId: accountId,
        transactionType: body.type,
        amount: amountNum.toString(),
        description: body.description,
        status: 'completed',
        createdAt: new Date()
      });

      // AUDIT TRAIL: Log admin action
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          actionType: 'update_account_balance',
          targetType: 'account',
          targetId: accountId.toString(),
          description: `${body.type === 'credit' ? 'Credited' : 'Debited'} $${body.amount} - ${body.description}`,
          metadata: JSON.stringify({ accountId, amount: body.amount, type: body.type, oldBalance: account.balance, newBalance })
        });
      }

      res.json({ 
        success: true, 
        message: 'Account balance updated successfully',
        newBalance: newBalance,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Account balance update error:', error);
      res.status(500).json({ error: 'Failed to update account balance' });
    }
  });

  // Balance update endpoint - REQUIRES ADMIN ROLE
  app.post('/api/admin/customers/:id/balance', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const body = req.body as { amount: string; description: string };

      const amountNum = parseFloat(body.amount);
      const oldUser = await (storage as any).getUser(customerId);
      const updatedUser = await storage.updateUserBalance(customerId, amountNum);

      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // AUDIT TRAIL: Log admin action
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          actionType: 'update_customer_balance',
          targetType: 'user',
          targetId: customerId.toString(),
          description: `Updated customer balance by $${body.amount} - ${body.description}`,
          metadata: JSON.stringify({ customerId, amount: body.amount, oldBalance: oldUser?.balance, newBalance: updatedUser.balance, description: body.description })
        });
      }

      res.json({ 
        success: true, 
        user: updatedUser,
        message: 'Balance updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update balance error:', error);
      res.status(500).json({ error: 'Failed to update balance' });
    }
  });

  // Customer update endpoint - REQUIRES ADMIN ROLE
  app.patch('/api/admin/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const updates = req.body as Record<string, any>;

      console.log(`🔄 ADMIN UPDATE: Updating customer ${customerId} with:`, updates);

      const updatedUser = await storage.updateUser(customerId, updates);

      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      console.log(`✅ ADMIN UPDATE SUCCESS: Customer ${customerId} updated successfully`);

      // AUDIT TRAIL: Log admin action
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          actionType: 'update_customer',
          targetType: 'user',
          targetId: customerId.toString(),
          description: `Updated customer profile: ${Object.keys(updates).join(', ')}`,
          metadata: JSON.stringify({ customerId, updates })
        });
      }

      res.json({ 
        success: true, 
        user: updatedUser,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // Get all transactions - REQUIRES ADMIN ROLE
  app.get('/api/admin/transactions', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // Authentication endpoints with fixed typing
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const body = req.body as { username: string; password: string };
      const user = await storage.getUserByUsername(body.username);

      if (!user || user.passwordHash !== body.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  app.post('/api/verify-pin', async (req: Request, res: Response) => {
    try {
      const body = req.body as { email?: string; username?: string; pin: string };
      const identifier = body.email || body.username;
      console.log('🔐 PIN verification request for:', identifier);

      // Use email for lookup (supports both email and username fields for compatibility)
      const user = await (storage as any).getUserByEmail(identifier);

      if (!user) {
        console.log('❌ User not found for identifier:', identifier);
        return res.status(404).json({ message: 'User not found', verified: false });
      }

      console.log('✅ Found user:', { id: user.id, email: user.email, isActive: user.isActive });

      // SECURITY: Check if account is active (approved by admin)
      if (!user.isActive) {
        console.log('🚫 PIN verification blocked - account pending approval:', user.email);
        return res.status(403).json({ 
          message: 'Your account is pending approval by our customer support team. You will receive a notification once your account is activated.',
          verified: false,
          error: 'Account pending approval'
        });
      }

      if (user.transferPin !== body.pin) {
        console.log('❌ PIN mismatch - Expected:', user.transferPin, 'Got:', body.pin);
        return res.status(401).json({ message: 'Invalid PIN', verified: false });
      }

      console.log('✅ PIN verification successful');
      res.json({ success: true, verified: true });
    } catch (error) {
      console.error('❌ PIN verification error:', error);
      res.status(500).json({ error: 'Failed to verify PIN', verified: false });
    }
  });

  // Account endpoints - PROTECTED with JWT authentication
  app.get('/api/accounts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'Invalid user credentials'
        });
      }

      const accounts = await storage.getUserAccounts(user.id);
      console.log('🔐 Authenticated access to accounts for:', req.user!.email);
      res.json(accounts);
    } catch (error: any) {
      console.error('❌ Failed to get accounts:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  });

  app.get('/api/accounts/:id/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = parseInt(req.params.id, 10);

      // SECURITY: Verify account belongs to authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userAccounts = await storage.getUserAccounts(user.id);
      const ownsAccount = userAccounts.some(acc => acc.id === accountId);

      if (!ownsAccount) {
        console.warn(`🚫 Unauthorized account access attempt: user ${req.user!.email} tried to access account ${accountId}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      const transactions = await storage.getAccountTransactions(accountId);
      console.log(`🔐 Authorized transaction access for account: ${accountId}`);
      res.json(transactions);
    } catch (error) {
      console.error('Get account transactions error:', error);
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
      console.error('Get pending registrations error:', error);
      res.status(500).json({ error: 'Failed to get pending registrations' });
    }
  });

  // Approve registration - REQUIRES ADMIN ROLE
  app.post('/api/admin/approve-registration/:registrationId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrationId = parseInt(req.params.registrationId, 10);

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
            await storage.updateAccount?.(account.id, { isActive: true });
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
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          actionType: 'approve_registration',
          targetType: 'user',
          targetId: registrationId.toString(),
          description: `Approved registration for ${updatedUser.fullName} (${updatedUser.email})`,
          metadata: JSON.stringify({ userId: registrationId, initialBalance: initialBalance || 0 })
        });
      }

      console.log(`✅ Registration approved for user ${registrationId} by admin ${admin?.fullName}`);
      
      res.json({ 
        success: true,
        message: 'Registration approved successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Approve registration error:', error);
      res.status(500).json({ error: 'Failed to approve registration' });
    }
  });

  // Reject registration - REQUIRES ADMIN ROLE
  app.post('/api/admin/reject-registration/:registrationId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registrationId = parseInt(req.params.registrationId, 10);
      const { reason } = req.body;

      const user = await (storage as any).getUser(registrationId);
      if (!user) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      // Update user with rejection reason
      await storage.updateUser(registrationId, {
        isActive: false,
        isVerified: false,
        adminNotes: `Registration rejected: ${reason || 'No reason provided'}`
      });

      // Create support ticket for the user explaining rejection
      await storage.createSupportTicket({
        userId: registrationId,
        subject: 'Registration Status - Action Required',
        description: `Your registration has been reviewed. ${reason || 'Please contact support for more information.'}`,
        category: 'account_verification',
        priority: 'high',
        status: 'open'
      });

      // AUDIT TRAIL: Log admin action
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      if (admin) {
        await storage.createAdminAction({
          adminId: admin.id,
          actionType: 'reject_registration',
          targetType: 'user',
          targetId: registrationId.toString(),
          description: `Rejected registration for ${user.fullName} (${user.email})`,
          metadata: JSON.stringify({ userId: registrationId, reason })
        });
      }

      console.log(`❌ Registration rejected for user ${registrationId} by admin ${admin?.fullName}`);
      
      res.json({ 
        success: true,
        message: 'Registration rejected successfully'
      });
    } catch (error) {
      console.error('Reject registration error:', error);
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
      const user = await (storage as any).getUserByEmail(req.user!.email);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.transferPin !== currentPin) {
        return res.status(401).json({ message: 'Current PIN is incorrect' });
      }

      // Prevent reusing the same PIN
      if (currentPin === newPin) {
        return res.status(400).json({ message: 'New PIN must be different from current PIN' });
      }

      // Use authenticated user's ID (not hardcoded)
      await storage.updateUser(user.id, { transferPin: newPin });
      console.log(`🔐 PIN updated successfully for user: ${req.user!.email}`);
      res.json({ success: true, message: 'PIN updated successfully' });
    } catch (error) {
      console.error('Change PIN error:', error);
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
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const cards = await storage.getUserCards(user.id);
      res.json(cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      res.status(500).json({ error: 'Failed to fetch cards' });
    }
  });

  app.get('/api/cards/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cardId = parseInt(req.params.id);

      // SECURITY: Verify card belongs to authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
        console.warn(`🚫 Unauthorized card access: user ${req.user!.email} tried to access card ${cardId}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(card);
    } catch (error) {
      console.error('Error fetching card:', error);
      res.status(500).json({ error: 'Failed to fetch card' });
    }
  });

  app.post('/api/cards/lock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, isLocked } = req.body;

      // SECURITY: Verify card belongs to authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
        console.warn(`🚫 Unauthorized card lock attempt: user ${req.user!.email} tried to lock card ${cardId}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedCard = await storage.updateCard(cardId, { isLocked });
      res.json({ success: true, card: updatedCard });
    } catch (error) {
      console.error('Error updating card:', error);
      res.status(500).json({ error: 'Failed to update card' });
    }
  });

  app.post('/api/cards/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, dailyLimit, contactlessEnabled } = req.body;

      // SECURITY: Verify card belongs to authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
        console.warn(`🚫 Unauthorized card settings update: user ${req.user!.email} tried to update card ${cardId}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      const updates: any = {};
      if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
      if (contactlessEnabled !== undefined) updates.contactlessEnabled = contactlessEnabled;

      const updatedCard = await storage.updateCard(cardId, updates);
      res.json({ success: true, card: updatedCard });
    } catch (error) {
      console.error('Error updating card settings:', error);
      res.status(500).json({ error: 'Failed to update card settings' });
    }
  });

  // ==================== INVESTMENTS API ROUTES - PROTECTED ====================
  app.get('/api/investments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const investments = await storage.getUserInvestments(user.id);
      res.json(investments);
    } catch (error) {
      console.error('Error fetching investments:', error);
      res.status(500).json({ error: 'Failed to fetch investments' });
    }
  });

  app.get('/api/investments/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Verify investment belongs to authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const investment = await storage.getInvestment(id);
      if (!investment) {
        return res.status(404).json({ error: 'Investment not found' });
      }

      if (investment.userId !== user.id) {
        console.warn(`🚫 Unauthorized investment access: user ${req.user!.email} tried to access investment ${id}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(investment);
    } catch (error) {
      console.error('Error fetching investment:', error);
      res.status(500).json({ error: 'Failed to fetch investment' });
    }
  });

  // ==================== MARKET DATA API ROUTES - PROTECTED ====================
  app.get('/api/market-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const marketRates = await (storage as any).getMarketRates();

      // Transform database format to frontend expected format
      const transformedData: any = {};

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
      console.error('Error fetching market rates:', error);
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
      console.error('Error fetching market indices:', error);
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
      console.error('Error fetching top stocks:', error);
      res.status(500).json({ error: 'Failed to fetch top stocks' });
    }
  });

  // ==================== PORTFOLIO ASSETS API - PROTECTED ====================
  app.get('/api/portfolio-assets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Get authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
      console.error('Error fetching portfolio assets:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio assets' });
    }
  });

  // ==================== CURRENCY EXCHANGE API ROUTES - PROTECTED ====================
  app.post('/api/currency-exchange', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;

      // SECURITY: Get authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
      console.error('Error processing currency exchange:', error);
      res.status(500).json({ error: 'Failed to process currency exchange' });
    }
  });

  // ==================== MESSAGES API ROUTES - PROTECTED ====================
  app.get('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Only return messages for authenticated user
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const messages = await storage.getUserMessages(user.id);

      // Note: Messages schema doesn't have conversationId, so we return all user messages
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.get('/api/messages/user/:userId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const messages = await storage.getUserMessages(user.id);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching user messages:', error);
      res.status(500).json({ error: 'Failed to fetch user messages' });
    }
  });

  app.post('/api/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Derive sender from authenticated user, not client input
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { recipientId, conversationId, message: messageText } = req.body;

      // SECURITY: Verify conversation ownership/participation
      // In a banking system, conversationId typically represents the customer's thread
      // Customers can only post to their own conversations (conversationId matches their ID)
      // Admins can post to any conversation (for customer support)

      // Enforce that non-admin users can only create messages in their own conversation
      const isAdmin = req.user!.role === 'admin';

      if (!isAdmin && conversationId && conversationId !== user.id.toString()) {
        console.warn(`🚫 Unauthorized conversation access: user ${req.user!.email} tried to post to conversation ${conversationId}`);
        return res.status(403).json({ error: 'Access denied: Cannot post to other users\' conversations' });
      }

      // SECURITY: Derive senderRole and senderName from authenticated user (server-side only)
      // Never trust client-supplied role/name to prevent impersonation
      const senderRole = req.user!.role === 'admin' ? 'admin' : 'customer';
      const senderName = user.fullName || user.email;

      // Create message with correct schema properties
      const messageData = {
        fromUserId: user.id,
        toUserId: recipientId,
        content: messageText,
        isRead: false,
      };

      const createdMessage = await storage.createMessage(messageData);
      res.json(createdMessage);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  app.patch('/api/messages/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Only allow marking own messages as read
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userMessages = await storage.getUserMessages(user.id);
      const ownsMessage = userMessages.some(msg => msg.id === id);

      if (!ownsMessage) {
        console.warn(`🚫 Unauthorized message modification: user ${req.user!.email} tried to mark message ${id} as read`);
        return res.status(403).json({ error: 'Access denied' });
      }

      const message = await storage.markMessageAsRead(id);
      res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  // ==================== ALERTS API ROUTES - PROTECTED ====================
  app.get('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const alerts = await storage.getUserAlerts(user.id);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.get('/api/alerts/unread', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const alerts = await storage.getUnreadAlerts(user.id);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching unread alerts:', error);
      res.status(500).json({ error: 'Failed to fetch unread alerts' });
    }
  });

  app.post('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Derive userId from authenticated user, not client input
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
      console.error('Error creating alert:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Only allow deleting own alerts
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify alert belongs to user before deleting
      const alerts = await storage.getUserAlerts(user.id);
      const alert = alerts.find((a: any) => a.id === id);

      if (!alert) {
        console.warn(`🚫 Unauthorized alert delete attempt: user ${req.user!.email} tried to delete alert ${id}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      await storage.deleteAlert(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({ error: 'Failed to delete alert' });
    }
  });

  app.patch('/api/alerts/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // SECURITY: Only allow marking own alerts as read
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userAlerts = await storage.getUserAlerts(user.id);
      const ownsAlert = userAlerts.some(alert => alert.id === id);

      if (!ownsAlert) {
        console.warn(`🚫 Unauthorized alert modification: user ${req.user!.email} tried to mark alert ${id} as read`);
        return res.status(403).json({ error: 'Access denied' });
      }

      const alert = await storage.markAlertAsRead(id);
      res.json(alert);
    } catch (error) {
      console.error('Error marking alert as read:', error);
      res.status(500).json({ error: 'Failed to mark alert as read' });
    }
  });

  // ==================== SUPPORT TICKETS API ROUTES ====================
  app.get('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Admin can see all tickets, customers see only their own
      const tickets = user.role === 'admin' 
        ? await storage.getSupportTickets()  // No userId = get all
        : await storage.getSupportTickets(user.id);  // With userId = get user's tickets

      res.json(tickets);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  });

  app.post('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await (storage as any).getUserByEmail(req.user!.email);
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
      console.error('Error creating support ticket:', error);
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
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      if (admin && updatedTicket) {
        const actionDescription = updates.status 
          ? `Updated ticket #${id} status to ${updates.status}`
          : `Updated ticket #${id}`;
        
        await storage.createAdminAction({
          adminId: admin.id,
          actionType: 'update_support_ticket',
          targetType: 'support_ticket',
          targetId: id.toString(),
          description: actionDescription,
          metadata: JSON.stringify({ ticketId: id, updates, previousStatus: ticket?.status })
        });
      }

      res.json(updatedTicket);
    } catch (error) {
      console.error('Error updating support ticket:', error);
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
      console.error('Get branches error:', error);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  });

  // ATMs endpoint
  app.get('/api/atms', async (req: Request, res: Response) => {
    try {
      const atms = await storage.getAtms();
      res.json(atms);
    } catch (error) {
      console.error('Get ATMs error:', error);
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
      console.error('Get exchange rates error:', error);
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
      console.error('Error fetching pending transfers:', error);
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
            customerName = user.fullName || user.email || customerName;
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
      console.error('Error fetching support tickets:', error);
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
      console.error('Get customers error:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  // Statements endpoint
  app.get('/api/statements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.user?.id || '0');
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const statements = await storage.getStatementsByUserId(userId);
      res.json(statements);
    } catch (error) {
      console.error('Get statements error:', error);
      res.status(500).json({ error: 'Failed to fetch statements' });
    }
  });

  app.post('/api/objects/upload', async (req: Request, res: Response) => {
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

      console.log(`📤 File uploaded: ${fileName} (${fileId})`);
      res.json(uploadResult);
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // ADMIN USER CREATION ENDPOINT
  // Creates a complete admin user in both Supabase Auth and local database
  // This is a one-time setup endpoint - should be secured in production
  app.post('/api/admin/create-admin-user', async (req: Request, res: Response) => {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and fullName are required' });
      }

      console.log(`🔧 Creating admin user: ${email}`);

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
        email_confirm: true, // Auto-confirm
        user_metadata: {
          full_name: fullName
        },
        app_metadata: {
          role: 'admin' // CRITICAL: Sets admin role in app_metadata
        }
      });

      if (authError || !authData.user) {
        console.error('❌ Supabase Auth admin creation failed:', authError);
        return res.status(500).json({ 
          error: authError?.message || 'Failed to create admin authentication account' 
        });
      }

      console.log(`✅ Supabase Auth admin account created: ${authData.user.id}`);

      // STEP 2: Create local database profile
      try {
        const adminUser = await storage.createUser({
          username: email.split('@')[0] + '_admin',
          fullName: fullName,
          email: email,
          phone: '+1-000-000-0000',
          supabaseUserId: authData.user.id,
          accountNumber: `ADMIN-${Math.floor(10000000 + Math.random() * 90000000)}`,
          accountId: `WB-ADMIN-${Date.now()}`,
          passwordHash: 'supabase_auth', // Marker
          transferPin: '9999', // Admin PIN
          role: 'admin', // ADMIN ROLE
          isVerified: true,
          isOnline: true,
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

        console.log(`✅ Admin user created successfully: ${fullName} (${email})`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔐 Password: ${password}`);
        console.log(`👤 Role: admin`);

        res.status(201).json({ 
          success: true,
          message: 'Admin user created successfully',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            fullName: adminUser.fullName,
            role: adminUser.role
          },
          credentials: {
            email: email,
            note: 'Password was provided during creation'
          }
        });

      } catch (dbError: any) {
        // ROLLBACK: Delete Supabase Auth account if database creation fails
        console.error('❌ Database creation failed, rolling back Supabase Auth account:', dbError);

        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log(`✅ Rolled back Supabase Auth account: ${authData.user.id}`);

        throw dbError;
      }

    } catch (error: any) {
      console.error('❌ Admin user creation failed:', error);
      res.status(500).json({ 
        error: 'Admin user creation failed',
        details: error.message 
      });
    }
  });

  // CUSTOMER LOGIN ENDPOINT
  // Authenticates customers using Supabase Auth
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      console.log(`🔐 Customer login attempt: ${email}`);

      // Authenticate with Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Customer auth failed:', error);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // CRITICAL: Check role from app_metadata (server-controlled)
      const role = data.user.app_metadata?.role || 'customer';

      // SECURITY: Check if user account is active (approved by admin)
      const dbUser = await storage.getUserByEmail(email);
      if (!dbUser) {
        console.error(`❌ User authenticated but not found in database: ${email}`);
        return res.status(403).json({ 
          error: 'Account not found. Please contact support.' 
        });
      }

      if (!dbUser.isActive) {
        console.log(`🚫 Login blocked - account pending approval: ${email}`);
        return res.status(403).json({ 
          error: 'Your account is pending approval by our customer support team. You will receive a notification once your account is activated.' 
        });
      }

      console.log(`✅ Customer login successful: ${email} (role: ${role})`);

      res.json({ 
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: role
        }
      });
    } catch (error) {
      console.error('Customer login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Comprehensive user lookup - searches Supabase Auth, database, and all related banking data
  app.post('/api/auth/comprehensive-lookup', authRateLimiter, async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and password are required' });
      }

      console.log(`🔍 Comprehensive auth lookup for: ${identifier}`);

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseClient = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );

      // STEP 1: Search Supabase Auth (try as email first)
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: identifier,
        password
      });

      if (authError || !authData.user) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          details: 'User not found in authentication system'
        });
      }

      const authUser = authData.user;
      const session = authData.session;

      // STEP 2: Search database public schema for banking profile
      const dbUser = await (storage as any).getUserByEmail(authUser.email);
      
      if (!dbUser) {
        return res.status(404).json({ 
          error: 'Account not found in banking system',
          details: 'Please contact support'
        });
      }

      // STEP 3: Get all related banking data from public schema tables
      const [accounts, cards, allTransactions, investments, alerts, tickets] = await Promise.all([
        storage.getUserAccounts(dbUser.id).catch(() => []),
        (storage as any).getUserCards(dbUser.id).catch(() => []),
        storage.getAllTransactions().catch(() => []),
        (storage as any).getUserInvestments(dbUser.id).catch(() => []),
        (storage as any).getUserAlerts(dbUser.id).catch(() => []),
        (storage as any).getUserTickets(dbUser.id).catch(() => [])
      ]);

      // Filter transactions for this user
      const userAccountIds = accounts.map((acc: any) => acc.id);
      const transactions = allTransactions.filter((tx: any) => 
        userAccountIds.includes(tx.fromAccountId) || userAccountIds.includes(tx.toAccountId)
      );

      console.log(`✅ Comprehensive lookup complete for ${authUser.email}:`);
      console.log(`   - DB User ID: ${dbUser.id}`);
      console.log(`   - Supabase User ID: ${authUser.id}`);
      console.log(`   - Accounts: ${accounts.length}`);
      console.log(`   - Cards: ${cards.length}`);
      console.log(`   - Transactions: ${transactions.length}`);
      console.log(`   - Investments: ${investments.length}`);
      console.log(`   - Active alerts: ${alerts.filter((a: any) => !a.isRead).length}`);
      console.log(`   - Open tickets: ${tickets.filter((t: any) => t.status === 'open').length}`);

      // STEP 4: Check account status
      const role = authUser.app_metadata?.role || 'customer';
      
      if (role === 'customer' && !dbUser.isActive) {
        return res.status(403).json({ 
          error: 'Account pending approval',
          details: 'Your account is being reviewed by our team. You will be notified once approved.',
          code: 'ACCOUNT_PENDING_APPROVAL'
        });
      }

      // Return comprehensive user data from all sources
      res.json({
        success: true,
        auth: {
          supabaseUserId: authUser.id,
          email: authUser.email,
          role: role,
          token: session?.access_token
        },
        profile: {
          id: dbUser.id,
          username: dbUser.username,
          fullName: dbUser.fullName,
          email: dbUser.email,
          phone: dbUser.phone,
          accountNumber: dbUser.accountNumber,
          isActive: dbUser.isActive,
          isVerified: dbUser.isVerified,
          balance: dbUser.balance
        },
        bankingData: {
          accountsCount: accounts.length,
          cardsCount: cards.length,
          recentTransactionsCount: transactions.length,
          investmentsCount: investments.length,
          unreadAlertsCount: alerts.filter((a: any) => !a.isRead).length,
          openTicketsCount: tickets.filter((t: any) => t.status === 'open').length,
          totalBalance: accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || 0), 0)
        }
      });

    } catch (error: any) {
      console.error('Comprehensive lookup error:', error);
      res.status(500).json({ 
        error: 'Authentication system error',
        details: error.message 
      });
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
        console.error('Admin auth failed:', error);
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      // CRITICAL: Check admin role from app_metadata (server-controlled)
      const role = data.user.app_metadata?.role || 'customer';

      if (role !== 'admin') {
        console.warn(`🚫 Non-admin login attempt by ${email}`);
        return res.status(403).json({ error: 'Admin access required. Contact system administrator.' });
      }

      console.log(`✅ Admin login successful: ${email}`);

      res.json({ 
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: role
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // ================================================================
  // REMOVED: WebSocket server (replaced with Supabase Realtime)
  // Supabase Realtime provides better scalability and works on Vercel
  // All real-time features (chat, notifications, updates) use Supabase Realtime
  // ================================================================

  // Return a dummy server that will be replaced by the main server
  const httpServer = createServer(app);

  // NOTE: Error handlers NOT registered here because Vite middleware
  // needs to handle frontend routes. Error handling is in index.ts

  return httpServer;
}