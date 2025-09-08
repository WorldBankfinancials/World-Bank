import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { supabase } from "./supabase-public-storage";
import bcrypt from "bcryptjs";

// Ensure body-parser middleware is used in your main server file
// Example: app.use(express.json());

export function setupRoutes(app: express.Express) {
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date() });
  });

  // Test Supabase connection and verify tables exist
  app.get('/test-supabase-connection', async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('bank_users')
        .select('id, full_name, email, balance')
        .limit(5);
      if (error) {
        console.error('❌ Supabase table test failed:', error);
        return res.json({
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

  // Get user by Supabase ID (requires authentication)
  app.get('/api/users/supabase/:supabaseId', authenticate, async (req: Request, res: Response) => {
    try {
      const { supabaseId } = req.params;
      const { data, error } = await supabase
        .from('bank_users')
        .select('*')
        .eq('id', supabaseId)
        .single();
      if (error || !data) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get user', details: error.message });
    }
  });

  // Get pending registrations for admin approval (requires admin)
  app.get('/api/admin/pending-registrations', authenticateAdmin, async (req: Request, res: Response) => {
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

  // Approve registration (requires admin)
  app.post('/api/admin/approve-registration/:id', authenticateAdmin, async (req: Request, res: Response) => {
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
      } = req.body;

      const { error } = await supabase
        .from('bank_users')
        .update({
          isVerified: true,
          isActive: true,
          adminNotes: approvalNotes,
          balance: initialDeposit,
          phone,
          profession,
          address,
          city,
          state,
          country,
          modifiedByAdmin: req.user?.id || "admin",
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

  // Reject registration (requires admin)
  app.post('/api/admin/reject-registration/:id', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const { error } = await supabase
        .from('bank_users')
        .update({
          isVerified: false,
          isActive: false,
          adminNotes: `REJECTED: ${rejectionReason}`,
          modifiedByAdmin: req.user?.id || "admin"
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

  // Admin: Update balance for a customer (requires admin)
  app.post("/api/admin/customers/:id/balance", authenticateAdmin, async (req: Request, res: Response) => {
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
        accountId: customerId,
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

  // Admin: Get all transactions (requires admin)
  app.get('/api/admin/transactions', authenticateAdmin, async (req: Request, res: Response) => {
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

  // PIN verification: compare hashed PIN, never store/compare plaintext
  app.post('/api/verify-pin', authenticate, async (req: Request, res: Response) => {
    try {
      const { username, pin } = req.body;
      if (!username || !pin) return res.status(400).json({ message: "Username and PIN required" });
      const { data: user, error } = await supabase
        .from('bank_users')
        .select('transferPinHash')
        .eq('email', username)
        .single();
      if (error || !user) return res.status(404).json({ message: "User not found", verified: false });
      const valid = await bcrypt.compare(pin, user.transferPinHash);
      if (!valid) return res.status(401).json({ message: "Invalid PIN", verified: false });
      res.json({ success: true, verified: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to verify PIN", verified: false });
    }
  });

  // PIN management: change PIN (hash before storing)
  app.post('/api/user/change-pin', authenticate, async (req: Request, res: Response) => {
    try {
      const { currentPin, newPin } = req.body;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { data: user, error: userError } = await supabase
        .from('bank_users')
        .select('transferPinHash')
        .eq('id', userId)
        .single();
      if (userError || !user) return res.status(404).json({ message: "User not found" });
      const valid = await bcrypt.compare(currentPin, user.transferPinHash);
      if (!valid) return res.status(401).json({ message: "Current PIN is incorrect" });
      const newHash = await bcrypt.hash(newPin, 10);
      const { error: updateError } = await supabase
        .from('bank_users')
        .update({ transferPinHash: newHash })
        .eq('id', userId);
      if (updateError) return res.status(500).json({ error: updateError.message });
      res.json({ success: true, message: "PIN updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to change PIN" });
    }
  });

  // Transfer endpoint (internal & international, live Supabase)
  app.post('/api/transfer', authenticate, async (req: Request, res: Response) => {
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

      // Confirm user is authenticated and matches fromUserId
      if (req.user?.id !== fromUserId) return res.status(403).json({ error: "Forbidden" });

      // Get user and validate hashed PIN
      const { data: user, error: userError } = await supabase
        .from('bank_users')
        .select('transferPinHash')
        .eq('id', fromUserId)
        .single();
      if (userError || !user) return res.status(404).json({ error: "User not found" });
      const validPin = await bcrypt.compare(pin, user.transferPinHash);
      if (!validPin) return res.status(401).json({ error: "Invalid PIN" });

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

  // ... WebSocket/chat and object storage routes would be handled here, with authentication required.

  // Catch-all for non-existent routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" });
  });
}

// --- MIDDLEWARE EXAMPLES ---

// Simple authentication middleware stub. Replace with your actual auth/session logic.
function authenticate(req: Request, res: Response, next: NextFunction) {
  // Example: attach req.user if session/token valid
  if (req.headers.authorization) {
    // Validate token/session and attach req.user
    req.user = { id: "replace-with-real-user-id" }; // Replace with real session logic
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Admin authentication middleware stub
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  // Example: check req.user.role === 'admin'
  if (req.headers.authorization && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Forbidden - admin only" });
}

// Add type to Request for user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role?: string };
    }
  }
}
