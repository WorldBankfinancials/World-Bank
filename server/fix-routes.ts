import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage-factory';
import { setupTransferRoutes } from './routes-transfer';
import { config, logConfiguration } from './config';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth-middleware';

// Fixed route handlers with proper typing
export async function registerFixedRoutes(app: Express): Promise<Server> {
  logConfiguration();
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
        .limit(5);
      
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
      const { supabaseId } = req.params;
      
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
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.users.find((u: any) => u.email === email);

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

        res.json({ 
          success: true, 
          message: 'Test user created successfully in Supabase Auth',
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
        accountId: primaryAccount.id,
        type: body.type,
        amount: body.amount,
        description: body.description,
        category: body.category || 'admin',
        status: body.status || 'completed',
        adminNotes: `Admin created transaction: ${body.description}`,
        date: new Date()
      });

      // Update account balance if it's a credit/debit
      if (body.type === 'credit' || body.type === 'debit') {
        const amountNum = parseFloat(body.amount);
        const balanceChange = body.type === 'credit' ? amountNum : -amountNum;
        await storage.updateUserBalance(customerIdNum, balanceChange);
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
      await storage.createTransaction({
        accountId: accountId,
        type: body.type,
        amount: amountNum.toString(),
        description: body.description,
        category: 'admin',
        status: 'completed',
        date: new Date()
      });

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
      const updatedUser = await storage.updateUserBalance(customerId, amountNum);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'Customer not found' });
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
      
      if (!user || user.password !== body.password) {
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
      const body = req.body as { email: string; pin: string };
      console.log('🔐 PIN verification request for:', body.email);
      
      // Always use email for lookup (primary login method)
      const user = await (storage as any).getUserByEmail(body.email);
      
      if (!user) {
        console.log('❌ User not found for email:', body.email);
        return res.status(404).json({ message: 'User not found', verified: false });
      }
      
      console.log('✅ Found user:', { id: user.id, email: user.email });
      
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
      const pending = users.filter(user => !user.isActive);
      res.json(pending);
    } catch (error) {
      console.error('Get pending registrations error:', error);
      res.status(500).json({ error: 'Failed to get pending registrations' });
    }
  });

  // PIN management endpoints - PROTECTED with JWT authentication
  app.post('/api/user/change-pin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = req.body as { currentPin: string; newPin: string };
      
      // Get authenticated user (email from JWT token)
      const user = await (storage as any).getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.transferPin !== body.currentPin) {
        return res.status(401).json({ message: 'Current PIN is incorrect' });
      }

      // Use authenticated user's ID (not hardcoded)
      await storage.updateUser(user.id, { transferPin: body.newPin });
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
      
      if (card.userId !== user.id) {
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
      if (!card || card.userId !== user.id) {
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
      if (!card || card.userId !== user.id) {
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
      // Mock market data - replace with real market data API integration
      const marketData = {
        stocks: { 
          change: +(Math.random() * 6 - 1).toFixed(2), 
          trending: Math.random() > 0.5 ? 'up' : 'down' 
        },
        bonds: { 
          change: +(Math.random() * 3 - 1.5).toFixed(2), 
          trending: Math.random() > 0.5 ? 'up' : 'down' 
        },
        crypto: { 
          change: +(Math.random() * 15 - 5).toFixed(2), 
          trending: Math.random() > 0.5 ? 'up' : 'down' 
        },
        forex: { 
          change: +(Math.random() * 4 - 1).toFixed(2), 
          trending: Math.random() > 0.5 ? 'up' : 'down' 
        }
      };
      
      res.json(marketData);
    } catch (error) {
      console.error('Error fetching market rates:', error);
      res.status(500).json({ error: 'Failed to fetch market rates' });
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
      
      // Filter by conversationId if provided
      const conversationId = req.query.conversationId as string | undefined;
      const filteredMessages = conversationId 
        ? messages.filter(msg => msg.conversationId === conversationId)
        : messages;
      
      res.json(filteredMessages);
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
      
      // Create message with server-derived sender information
      const messageData = {
        senderId: user.id,
        senderName: senderName,
        senderRole: senderRole,
        recipientId: recipientId,
        message: messageText,
        conversationId: conversationId || user.id.toString(), // Default to user's own conversation
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
      
      const updatedTicket = await storage.updateSupportTicket(id, updates);
      res.json(updatedTicket);
    } catch (error) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // ==================== OBJECT STORAGE API ROUTES ====================
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

  // Return a dummy server that will be replaced by the main server
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, { ws: WebSocket; userId: string; role: 'admin' | 'customer'; email: string }>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client attempting connection');
    let isAuthenticated = false;
    let clientId: string | null = null;
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('WebSocket message received:', data.type);
        
        if (data.type === 'auth') {
          // SECURITY: Validate JWT token before registering client
          const token = data.token;
          
          if (!token) {
            console.warn('🚫 WebSocket auth attempt without token');
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
            ws.close();
            return;
          }
          
          // Validate token using Supabase
          const { supabase } = await import('./supabase-public-storage');
          const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
          
          if (error || !authUser) {
            console.warn('🚫 WebSocket auth failed: Invalid token');
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid authentication token' }));
            ws.close();
            return;
          }
          
          // SECURITY: Derive role from app_metadata (immutable, server-controlled)
          const role = authUser.app_metadata?.role || 'customer';
          
          // Fetch user from database to get userId
          const dbUser = await (storage as any).getUserByEmail(authUser.email);
          
          if (!dbUser) {
            console.warn(`🚫 WebSocket auth failed: User ${authUser.email} not found in database`);
            ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
            ws.close();
            return;
          }
          
          // Register authenticated client
          clientId = authUser.id;
          clients.set(clientId, {
            ws,
            userId: dbUser.id.toString(),
            role: role as 'admin' | 'customer',
            email: authUser.email || ''
          });
          
          isAuthenticated = true;
          console.log(`✅ WebSocket client authenticated: ${authUser.email} (${role})`);
          ws.send(JSON.stringify({ type: 'auth_success', role, userId: dbUser.id }));
        } else if (!isAuthenticated) {
          // Reject all messages until client authenticates
          console.warn('🚫 WebSocket message rejected: Client not authenticated');
          ws.send(JSON.stringify({ type: 'error', message: 'Must authenticate first' }));
          ws.close();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      if (clientId) {
        clients.delete(clientId);
      }
    });
  });

  return httpServer;
}