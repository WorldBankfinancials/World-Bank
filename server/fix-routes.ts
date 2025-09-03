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

  // User endpoints with proper typing
  app.get('/api/user', async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(1); // Legacy endpoint for compatibility
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
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

  // Admin transaction creation with fixed typing
  app.post('/api/admin/create-transaction', async (req: Request, res: Response) => {
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
      
      const newBalance = parseFloat(account.balance) + balanceChange;
      await storage.updateAccount(accountId, { balance: newBalance.toString() });
      
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

  // Account endpoints with fixed typing
  app.get('/api/accounts', async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getUserAccounts(1); // Liu Wei's ID
      res.json(accounts);
    } catch (error) {
      console.error('Get accounts error:', error);
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
      const body = req.body as { currentPin: string; newPin: string };
      const user = await storage.getUser(1); // Liu Wei's ID
      
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

  // Transfer endpoint with proper PostgreSQL integration
  app.post('/api/transfer', async (req: Request, res: Response) => {
    try {
      const { fromUserId, amount, currency, transactionType, recipientName, recipientAccount, description, pin } = req.body;
      
      console.log('🏦 Processing transfer:', { fromUserId, amount, currency, transactionType });
      
      // Validate PIN
      const user = await storage.getUser(fromUserId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.transferPin !== pin) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }
      
      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create transaction with PostgreSQL storage
      const transaction = await storage.createTransaction({
        transactionId,
        fromUserId,
        toUserId: null,
        fromAccountId: 1,
        toAccountId: null,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        transactionType,
        status: 'pending',
        description,
        recipientName,
        recipientAccount,
        referenceNumber: transactionId,
        fee: transactionType === 'international' ? 25 : 0,
        countryCode: 'US',
        bankName: 'World Bank',
        adminNotes: 'Awaiting admin approval'
      });
      
      console.log('✅ Transfer created successfully:', transaction);
      res.json({ 
        success: true, 
        transactionId: transaction.transactionId,
        status: 'pending',
        message: 'Transfer submitted for admin approval'
      });
      
    } catch (error) {
      console.error('❌ Transfer error:', error);
      res.status(500).json({ error: 'Transfer failed' });
    }
  });

  // Setup transfer routes
  setupTransferRoutes(app);

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