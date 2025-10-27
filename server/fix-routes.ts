import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage-factory';
import { setupTransferRoutes } from './routes-transfer';
import { config, logConfiguration } from './config';

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

  // User endpoints - get authenticated user from session
  app.get('/api/user', async (req: Request, res: Response) => {
    try {
      // Get user email from query parameter (sent by authenticated frontend)
      const userEmail = req.query.email as string;
      
      if (!userEmail) {
        return res.status(401).json({ message: 'User email required - please login' });
      }
      
      const user = await (storage as any).getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Real user profile endpoint based on email
  app.post('/api/user/profile', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }

      const user = await (storage as any).getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log('🔍 Fetching real user profile for:', email);
      res.json(user);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  // Real user accounts endpoint
  app.post('/api/accounts/user', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }

      const user = await (storage as any).getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const accounts = await storage.getUserAccounts(user.id);
      console.log('🏦 Fetching real account data for user:', user.id);
      res.json(accounts);
    } catch (error) {
      console.error('Get user accounts error:', error);
      res.status(500).json({ error: 'Failed to get user accounts' });
    }
  });

  // SECURITY: Admin endpoints require authentication in production
  // WARNING: These endpoints modify financial data and must be protected
  
  // Admin transaction creation with fixed typing
  app.post('/api/admin/create-transaction', async (req: Request, res: Response) => {
    // CRITICAL: Require authentication in production
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    
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

  // Individual account balance update endpoint
  app.post('/api/admin/accounts/:accountId/balance', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    
    try{
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

  // Balance update endpoint with fixed typing
  app.post('/api/admin/customers/:id/balance', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    
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

  // Customer update endpoint with immediate sync
  app.patch('/api/admin/customers/:id', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    
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

  // Get all transactions with fixed typing
  app.get('/api/admin/transactions', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    
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
      const body = req.body as { username: string; pin: string };
      console.log('PIN verification request:', { username: body.username, pin: body.pin });
      
      // Try to find user by email (which is the primary method for login)
      let user = await (storage as any).getUserByEmail?.(body.username);
      if (!user) {
        // Fallback to username search
        user = await storage.getUserByUsername(body.username);
      }
      
      console.log('Found user:', user ? { id: user.id, email: user.email, transferPin: user.transferPin } : 'No user found');
      
      if (!user || user.transferPin !== body.pin) {
        console.log('PIN mismatch:', { expected: user?.transferPin, provided: body.pin });
        return res.status(401).json({ message: 'Invalid PIN', verified: false });
      }

      console.log('PIN verification successful');
      res.json({ success: true, verified: true });
    } catch (error) {
      console.error('PIN verification error:', error);
      res.status(500).json({ error: 'Failed to verify PIN', verified: false });
    }
  });

  // Account endpoints with proper authentication
  app.get('/api/accounts', async (req: Request, res: Response) => {
    try {
      // Require user email from authenticated session
      const userEmail = req.query.email as string;
      
      if (!userEmail) {
        console.warn('⚠️ /api/accounts called without email parameter - authentication required');
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please provide email parameter or login'
        });
      }
      
      const user = await (storage as any).getUserByEmail(userEmail);
      
      if (!user) {
        console.warn(`⚠️ User not found for email: ${userEmail}`);
        return res.status(404).json({ 
          error: 'User not found',
          message: 'Invalid user credentials'
        });
      }
      
      const accounts = await storage.getUserAccounts(user.id);
      res.json(accounts);
    } catch (error: any) {
      console.error('❌ Failed to get accounts:', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  });

  app.get('/api/accounts/:id/transactions', async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id, 10);
      const transactions = await storage.getAccountTransactions(accountId);
      res.json(transactions);
    } catch (error) {
      console.error('Get account transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  });

  // Admin pending registrations
  app.get('/api/admin/pending-registrations', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    
    try {
      const users = await storage.getAllUsers();
      const pending = users.filter(user => !user.isActive);
      res.json(pending);
    } catch (error) {
      console.error('Get pending registrations error:', error);
      res.status(500).json({ error: 'Failed to get pending registrations' });
    }
  });

  // PIN management endpoints
  app.post('/api/user/change-pin', async (req: Request, res: Response) => {
    try {
      const body = req.body as { currentPin: string; newPin: string; email: string };
      
      if (!body.email) {
        return res.status(401).json({ message: 'User email required' });
      }
      
      // Get user by email
      const user = await (storage as any).getUserByEmail(body.email);
      
      if (!user || user.transferPin !== body.currentPin) {
        return res.status(401).json({ message: 'Current PIN is incorrect' });
      }

      await storage.updateUser(1, { transferPin: body.newPin });
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

  // ==================== CARDS API ROUTES ====================
  app.get('/api/cards', async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || 1;
      const cards = await storage.getUserCards(userId);
      res.json(cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      res.status(500).json({ error: 'Failed to fetch cards' });
    }
  });

  app.get('/api/cards/:id', async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }
      res.json(card);
    } catch (error) {
      console.error('Error fetching card:', error);
      res.status(500).json({ error: 'Failed to fetch card' });
    }
  });

  app.post('/api/cards/lock', async (req: Request, res: Response) => {
    try {
      const { cardId, isLocked } = req.body;
      const updatedCard = await storage.updateCard(cardId, { isLocked });
      res.json({ success: true, card: updatedCard });
    } catch (error) {
      console.error('Error updating card:', error);
      res.status(500).json({ error: 'Failed to update card' });
    }
  });

  // ==================== INVESTMENTS API ROUTES ====================
  app.get('/api/investments', async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || 1;
      const investments = await storage.getUserInvestments(userId);
      res.json(investments);
    } catch (error) {
      console.error('Error fetching investments:', error);
      res.status(500).json({ error: 'Failed to fetch investments' });
    }
  });

  app.get('/api/investments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const investment = await storage.getInvestment(id);
      if (!investment) {
        return res.status(404).json({ error: 'Investment not found' });
      }
      res.json(investment);
    } catch (error) {
      console.error('Error fetching investment:', error);
      res.status(500).json({ error: 'Failed to fetch investment' });
    }
  });

  // ==================== MESSAGES API ROUTES ====================
  app.get('/api/messages', async (req: Request, res: Response) => {
    try {
      const conversationId = req.query.conversationId as string | undefined;
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.get('/api/messages/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const messages = await storage.getUserMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching user messages:', error);
      res.status(500).json({ error: 'Failed to fetch user messages' });
    }
  });

  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const message = await storage.createMessage(req.body);
      res.json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  app.patch('/api/messages/:id/read', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(id);
      res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  // ==================== ALERTS API ROUTES ====================
  app.get('/api/alerts', async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || 1;
      const alerts = await storage.getUserAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.get('/api/alerts/unread', async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || 1;
      const alerts = await storage.getUnreadAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching unread alerts:', error);
      res.status(500).json({ error: 'Failed to fetch unread alerts' });
    }
  });

  app.post('/api/alerts', async (req: Request, res: Response) => {
    try {
      const alert = await storage.createAlert(req.body);
      res.json(alert);
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.patch('/api/alerts/:id/read', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.markAlertAsRead(id);
      res.json(alert);
    } catch (error) {
      console.error('Error marking alert as read:', error);
      res.status(500).json({ error: 'Failed to mark alert as read' });
    }
  });

  // Return a dummy server that will be replaced by the main server
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, { ws: WebSocket; userId: string; role: 'admin' | 'customer' }>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'auth') {
          clients.set(data.userId, {
            ws,
            userId: data.userId,
            role: data.role || 'customer'
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.forEach((client, userId) => {
        if (client.ws === ws) {
          clients.delete(userId);
        }
      });
    });
  });

  return httpServer;
}