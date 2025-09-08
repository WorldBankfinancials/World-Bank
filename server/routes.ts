import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage-factory";
import { setupTransferRoutes } from './routes-transfer';
import { ObjectStorageService } from './objectStorage';

// Supabase imports (live)
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Utility functions for generating account details
function generateAccountNumber(): string {
  return `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateAccountId(): string {
  return `WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Supabase health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const { error } = await supabase
        .from('bank_users')
        .select('id')
        .limit(1);
      if (error) {
        return res.status(500).json({ status: "error", error: error.message });
      }
      res.json({ status: 'OK', timestamp: new Date() });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });

  // Test Supabase connection and live table status
  app.get('/test-supabase-connection', async (req: Request, res: Response) => {
    try {
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

  // Get user by Supabase ID
  app.get('/api/users/supabase/:supabaseId', async (req: Request, res: Response) => {
    try {
      const { supabaseId } = req.params;
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('supabaseUserId', supabaseId)
        .single();
      if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
  });

  // Create new Supabase-linked user with PENDING status
  app.post('/api/users/create-supabase', async (req: Request, res: Response) => {
    try {
      const { supabaseUserId, email, fullName } = req.body;
      const { error } = await supabase
        .from('bank_users')
        .insert([{
          supabaseUserId,
          email,
          fullName: fullName || 'New Banking Customer',
          phone: 'Pending Admin Update',
          accountNumber: generateAccountNumber(),
          accountId: generateAccountId(),
          profession: 'Pending Admin Update',
          dateOfBirth: '1990-01-01',
          address: 'Pending Admin Update',
          city: 'Pending Admin Update',
          state: 'Pending Admin Update',
          country: 'Pending Admin Update',
          postalCode: '00000',
          annualIncome: 'Pending Admin Update',
          idType: 'Pending Admin Update',
          idNumber: 'Pending Admin Update',
          transferPin: '1234',
          role: 'customer',
          isVerified: false,
          isOnline: false,
          isActive: false,
          balance: 0.00,
          adminNotes: 'New Supabase registration - requires full admin verification and setup'
        }]);
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      res.json({ success: true, supabaseUserId, email, fullName });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  });

  // Get pending Supabase registrations for admin approval
  app.get('/api/admin/pending-registrations', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('isVerified', false)
        .eq('isActive', false);
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch pending registrations', details: error.message });
    }
  });

  // Approve Supabase registration
  app.post('/api/admin/approve-registration/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        approvalNotes,
        initialDeposit,
        phone,
        profession,
        address,
        city,
        state,
        country,
        avatarUrl
      } = req.body;
      // Update user
      const { error } = await supabase
        .from('bank_users')
        .update({
          isVerified: true,
          isActive: true,
          isOnline: true,
          phone: phone || 'Admin Updated',
          profession: profession || 'Banking Customer',
          address: address || 'Admin Updated Address',
          city: city || 'Admin Updated City',
          state: state || 'Admin Updated State',
          country: country || 'Admin Updated Country',
          balance: parseFloat(initialDeposit) || 5000.00,
          avatarUrl: avatarUrl || null,
          adminNotes: approvalNotes || 'Approved by admin',
          modifiedByAdmin: "1"
        })
        .eq('id', id);
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to approve registration', details: error.message });
    }
  });

  // Reject Supabase registration
  app.post('/api/admin/reject-registration/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const { error } = await supabase
        .from('bank_users')
        .update({
          isVerified: false,
          isActive: false,
          adminNotes: `REJECTED: ${rejectionReason}`,
          modifiedByAdmin: "1"
        })
        .eq('id', id);
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to reject registration', details: error.message });
    }
  });

  // Demo: Get user by email (for compatibility with frontend)
  app.post('/api/accounts/user', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email required' });
      const { data, error } = await supabase
        .from('bank_users')
        .select('id')
        .eq('email', email)
        .single();
      if (error || !data) return res.status(404).json({ message: 'User not found' });
      const { data: accounts, error: accError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('userId', data.id);
      if (accError) return res.status(500).json({ message: 'Error fetching accounts' });
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get user accounts', details: error.message });
    }
  });

  // Get all accounts for a user (demo: always user id 1)
  app.get('/api/accounts', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('userId', 1); // Replace with session logic
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get accounts', details: error.message });
    }
  });

  // Get transactions for a specific account
  app.get('/api/accounts/:id/transactions', async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id, 10);
      if (isNaN(accountId)) return res.status(400).json({ error: 'Invalid account ID' });
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('accountId', accountId)
        .order('date', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get transactions', details: error.message });
    }
  });

  // International Transfer API
  app.post("/api/international-transfers", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || 1; // Default to user ID 1 for demo
      const {
        amount,
        recipientName,
        recipientCountry,
        bankName,
        swiftCode,
        accountNumber,
        transferPurpose,
        transferPin
      } = req.body;

      // Required field validation
      if (
        !amount || !recipientName || !recipientCountry ||
        !bankName || !swiftCode || !accountNumber || !transferPurpose || !transferPin
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get user and validate PIN
      const { data: user, error: userError } = await supabase
        .from('bank_users')
        .select('*')
        .eq('id', userId)
        .single();
      if (userError || !user) return res.status(404).json({ error: 'User not found' });
      if (user.transferPin !== transferPin) {
        return res.status(401).json({ error: "Invalid transfer PIN" });
      }

      // Get first account for user
      const { data: accounts, error: accError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('userId', userId);
      if (accError || !accounts || accounts.length === 0) {
        return res.status(400).json({ error: "No account found" });
      }
      const fromAccount = accounts[0];

      // Create international transfer transaction (pending approval)
      const { error: txnError } = await supabase
        .from('bank_transactions')
        .insert([{
          accountId: fromAccount.id,
          type: "international_transfer",
          amount: amount.toString(),
          description: `International transfer to ${recipientName} in ${recipientCountry}`,
          recipientName,
          recipientCountry,
          bankName,
          swiftCode,
          accountNumber,
          transferPurpose,
          status: "pending_approval",
          date: new Date().toISOString()
        }]);
      if (txnError) return res.status(500).json({ error: txnError.message });

      res.json({
        success: true,
        message: "International transfer submitted for approval"
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to process international transfer", details: error.message });
    }
  });
  // Admin: Update balance for a customer
  app.post("/api/admin/customers/:id/balance", async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.id, 10);
      const { amount, description } = req.body;
      if (isNaN(customerId) || !amount) {
        return res.status(400).json({ error: "Invalid customer ID or missing amount" });
      }
      // Update user's balance
      const { data: user, error: userError } = await supabase
        .from('bank_users')
        .select('balance')
        .eq('id', customerId)
        .single();
      if (userError || !user) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const newBalance = parseFloat(user.balance) + parseFloat(amount);
      const { error: updateError } = await supabase
        .from('bank_users')
        .update({ balance: newBalance })
        .eq('id', customerId);
      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
      // Log transaction
      await supabase.from('bank_transactions').insert([{
        accountId: customerId, // If you have accountId, use accountId
        type: "admin",
        amount: amount.toString(),
        description: description || "Admin balance update",
        status: "completed",
        date: new Date().toISOString()
      }]);
      res.json({
        success: true,
        newBalance,
        message: "Balance updated successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update balance', details: error.message });
    }
  });

  // Admin: Get all transactions
  app.get('/api/admin/transactions', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get transactions', details: error.message });
    }
  });

  // PIN verification (used for transfers)
  app.post('/api/verify-pin', async (req: Request, res: Response) => {
    try {
      const { username, pin } = req.body;
      if (!username || !pin) return res.status(400).json({ message: "Username and PIN required" });
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('transferPin')
        .eq('email', username)
        .single();
      if (error || !user) return res.status(404).json({ message: "User not found", verified: false });
      if (user.transferPin !== pin) return res.status(401).json({ message: "Invalid PIN", verified: false });
      res.json({ success: true, verified: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to verify PIN", verified: false });
    }
  });

  // PIN management: change PIN for logged-in user
  app.post('/api/user/change-pin', async (req: Request, res: Response) => {
    try {
      const { currentPin, newPin } = req.body;
      // For demo, always userId = 1, replace with session
      const userId = 1;
      const { data: user, error: userError } = await supabase
        .from('bank_users')
        .select('transferPin')
        .eq('id', userId)
        .single();
      if (userError || !user) return res.status(404).json({ message: "User not found" });
      if (user.transferPin !== currentPin) return res.status(401).json({ message: "Current PIN is incorrect" });
      const { error: updateError } = await supabase
        .from('bank_users')
        .update({ transferPin: newPin })
        .eq('id', userId);
      if (updateError) return res.status(500).json({ error: updateError.message });
      res.json({ success: true, message: "PIN updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to change PIN" });
    }
  });

  // Transfer endpoint (internal & international, live Supabase)
  app.post('/api/transfer', async (req: Request, res: Response) => {
    try {
      const {
        fromUserId,
        amount,
        currency,
        transactionType,
        recipientName,
        recipientAccount,
        description,
        pin
      } = req.body;
      // Get user and validate PIN
      const { data: user, error: userError } = await supabase
        .from('bank_users')
        .select('transferPin')
        .eq('id', fromUserId)
        .single();
      if (userError || !user) return res.status(404).json({ error: "User not found" });
      if (user.transferPin !== pin) return res.status(401).json({ error: "Invalid PIN" });
      // Get sender's account
      const { data: accounts, error: accError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('userId', fromUserId);
      if (accError || !accounts || accounts.length === 0)
        return res.status(400).json({ error: "No account found" });
      const fromAccount = accounts[0];
      // Insert transaction (pending approval)
      const { error: txnError } = await supabase
        .from('bank_transactions')
        .insert([{
          accountId: fromAccount.id,
          type: transactionType,
          amount: amount.toString(),
          currency: currency || 'USD',
          recipientName,
          recipientAccount,
          description,
          status: "pending",
          date: new Date().toISOString()
        }]);
      if (txnError) return res.status(500).json({ error: txnError.message });
      res.json({
        success: true,
        status: "pending",
        message: "Transfer submitted for admin approval"
      });
    } catch (error: any) {
      res.status(500).json({ error: "Transfer failed" });
    }
  });

  // Setup transfer routes (custom logic)
  setupTransferRoutes(app);

   // WebSocket server for live chat
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients (for chat)
  const clients = new Map<string, { ws: WebSocket; userId: string; role: 'admin' | 'customer' }>();

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'auth') {
          clients.set(data.userId, {
            ws,
            userId: data.userId,
            role: data.role || 'customer'
          });
          ws.send(JSON.stringify({ type: 'auth_success', userId: data.userId, role: data.role || 'customer' }));
        } else if (data.type === 'chat_message') {
          // Broadcast chat message to all clients except sender
          clients.forEach((client, id) => {
            if (id !== data.userId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'chat_message',
                ...data
              }));
            }
          });
        } else if (data.type === 'typing') {
          // Broadcast typing event
          clients.forEach((client, id) => {
            if (id !== data.userId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'typing',
                senderId: data.userId,
                isTyping: data.isTyping
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.forEach((client, userId) => {
        if (client.ws === ws) {
          clients.delete(userId);
        }
      });
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.send(JSON.stringify({
      type: 'auth_request',
      message: 'Please authenticate'
    }));
  });

  // Object Storage Routes for ID Card Uploads
  app.post('/api/objects/upload', async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  // Catch-all for non-existent routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" });
  });

  return httpServer;
} 
  
