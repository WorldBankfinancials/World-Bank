import { Express, Request, Response } from 'express';
import { storage } from './storage-factory';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth-middleware';
import { transferSchema, validateRequest } from './validation-schemas';
import { atomicTransfer } from './transaction-wrapper';
import { supabase } from './supabase-public-storage';
import bcrypt from 'bcryptjs';

function generateReferenceNumber(): string {
  return `WB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function setupTransferRoutes(app: Express) {
  // Regular Transfer API - PROTECTED: requires authentication
  app.post('/api/transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request body with Zod schema
      const validation = validateRequest(transferSchema, req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.errors
        });
      }

      const {
        amount,
        recipientName,
        recipientAccount,
        recipientCountry,
        bankName,
        swiftCode,
        transferPin
      } = validation.data;

      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await (storage as any).getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate PIN against real user data from Supabase
      // Check if PIN is hashed (starts with $2) or plaintext (for backwards compatibility)
      let pinValid = false;
      if (user.transferPin && user.transferPin.startsWith('$2')) {
        // Hashed PIN - use bcrypt compare
        pinValid = await bcrypt.compare(transferPin, user.transferPin);
      } else {
        // Plaintext PIN - direct comparison (legacy support)
        pinValid = transferPin === user.transferPin;
      }
      
      if (!pinValid) {
        return res.status(400).json({ message: "Invalid transfer PIN. Please check your PIN and try again." });
      }

      // Get user's primary account
      const userAccounts = await (storage as any).getUserAccounts(user.id);
      if (userAccounts.length === 0) {
        return res.status(400).json({ message: "No account found for transfer" });
      }
      
      const fromAccount = userAccounts[0];
      const currentBalance = parseFloat(fromAccount.balance || '0');
      
      // Check sufficient balance
      if (currentBalance < amount) {
        return res.status(400).json({ 
          message: "Insufficient balance. Please add funds to your account.",
          availableBalance: currentBalance,
          requestedAmount: amount
        });
      }

      // CRITICAL: Look up recipient account by account number for domestic transfers
      const { data: recipientAccountData } = await supabase
        .from('bank_accounts')
        .select('id, user_id, account_number, is_active')
        .eq('account_number', recipientAccount)
        .single();

      if (!recipientAccountData) {
        return res.status(404).json({ 
          message: "Recipient account not found. Please verify the account number.",
          error: "Invalid recipient account"
        });
      }

      if (!recipientAccountData.is_active) {
        return res.status(400).json({ 
          message: "Recipient account is not active. Transfer cannot be completed.",
          error: "Inactive recipient account"
        });
      }

      // Prevent self-transfers
      if (recipientAccountData.id === fromAccount.id) {
        return res.status(400).json({ 
          message: "Cannot transfer to your own account. Please use a different recipient.",
          error: "Self-transfer not allowed"
        });
      }

      // CRITICAL FIX: Actually move money using atomicTransfer with BOTH sender and recipient
      const transferResult = await atomicTransfer({
        fromAccountId: fromAccount.id,
        toAccountId: recipientAccountData.id,  // CRITICAL: Credit recipient account
        amount: amount,
        transactionType: 'domestic_transfer',
        description: `Transfer to ${recipientName} (${recipientAccount})`,
        recipientName: recipientName,
        recipientCountry: recipientCountry
      });

      if (!transferResult.success) {
        return res.status(500).json({ 
          message: "Transfer failed", 
          error: transferResult.error 
        });
      }

      res.json({ 
        message: "Transfer completed successfully", 
        transactionId: transferResult.transaction?.id || `WB-${Date.now()}`,
        status: "completed",
        amount: amount,
        newBalance: parseFloat(fromAccount.balance) - amount
      });
    } catch (error) {
      console.error("Regular transfer error:", error);
      res.status(500).json({ message: "Transfer system error" });
    }
  });

  // International Transfer API - PROTECTED: requires authentication
  app.post('/api/international-transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Require real account number - no fallback values allowed
      const recipientAccount = req.body.accountNumber || req.body.recipientAccount;
      
      if (!recipientAccount || recipientAccount.trim() === '') {
        return res.status(400).json({ 
          message: "Recipient account number is required",
          error: "Missing required field: recipientAccount"
        });
      }

      // Validate request body with Zod schema
      const validation = validateRequest(transferSchema, {
        ...req.body,
        recipientAccount: recipientAccount
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.errors
        });
      }

      const {
        amount,
        recipientName,
        recipientCountry,
        bankName,
        swiftCode,
        transferPin
      } = validation.data;

      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await (storage as any).getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate PIN against real user data from Supabase
      // Check if PIN is hashed (starts with $2) or plaintext (for backwards compatibility)
      let pinValid = false;
      if (user.transferPin && user.transferPin.startsWith('$2')) {
        // Hashed PIN - use bcrypt compare
        pinValid = await bcrypt.compare(transferPin, user.transferPin);
      } else {
        // Plaintext PIN - direct comparison (legacy support)
        pinValid = transferPin === user.transferPin;
      }
      
      if (!pinValid) {
        return res.status(400).json({ message: "Invalid transfer PIN. Please check your PIN and try again." });
      }

      // Get user's primary account
      const userAccounts = await (storage as any).getUserAccounts(user.id);
      if (userAccounts.length === 0) {
        return res.status(400).json({ message: "No account found for transfer" });
      }
      
      const fromAccount = userAccounts[0];
      const currentBalance = parseFloat(fromAccount.balance || '0');
      
      // Check sufficient balance
      if (currentBalance < amount) {
        return res.status(400).json({ 
          message: "Insufficient balance. Please add funds to your account.",
          availableBalance: currentBalance,
          requestedAmount: amount
        });
      }

      // CRITICAL FIX: Actually move money using atomicTransfer
      const transferResult = await atomicTransfer({
        fromAccountId: fromAccount.id,
        amount: amount,
        transactionType: 'international_transfer',
        description: `International transfer to ${recipientName} (${recipientAccount}) - ${bankName}, ${recipientCountry}`,
        recipientName: recipientName,
        recipientCountry: recipientCountry
      });

      if (!transferResult.success) {
        return res.status(500).json({ 
          message: "Transfer failed", 
          error: transferResult.error 
        });
      }

      res.json({ 
        message: "International transfer completed successfully", 
        id: transferResult.transaction?.id || `INT-${Date.now()}`,
        status: "completed",
        amount: amount,
        newBalance: parseFloat(fromAccount.balance) - amount
      });
    } catch (error) {
      console.error("International transfer error:", error);
      res.status(500).json({ message: "International transfer system error" });
    }
  });

  // Enhanced Transfer API with proper workflow - PROTECTED: requires authentication
  app.post('/api/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await (storage as any).getUserByEmail(req.user!.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const {
        transactionId,
        amount,
        currency,
        recipientName,
        recipientAccount,
        recipientCountry,
        bankName,
        swiftCode,
        transferType,
        purpose,
        status = 'pending_approval'
      } = req.body;

      // Validate required fields
      if (!amount || !recipientName || !recipientAccount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get user accounts
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) {
        return res.status(400).json({ message: "No account found" });
      }

      const fromAccount = accounts[0];

      // Create transaction record for admin approval (all transfers require approval)
      const transaction = await storage.createTransaction({
        createdAt: new Date(),
        fromAccountId: fromAccount.id,
        transactionType: transferType || "international_transfer",
        amount: amount.toString(),
        description: `Transfer to ${recipientName}`,
        recipientName: recipientName,
        recipientCountry: recipientCountry || "Unknown",
        bankName: bankName || "Unknown Bank",
        swiftCode: swiftCode || "",
        status: "pending_approval" // All transfers require admin approval
      });

      res.json({ 
        message: "Transfer submitted for approval", 
        transaction: transaction,
        transactionId: transactionId || generateReferenceNumber()
      });
    } catch (error) {
      console.error("Error creating transfer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin approve transfer - PROTECTED: requires admin role
  app.post('/api/admin/transfers/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      const adminId = admin?.id || 1;

      const transaction = await storage.updateTransactionStatus(transactionId, 'approved', adminId, notes);
      
      if (transaction) {
        // Log admin action
        await storage.createAdminAction({
          adminId: adminId,
          actionType: 'approve_transfer',
          targetType: 'transaction',
          targetId: transactionId.toString(),
          description: `Approved transfer #${transactionId}`,
          metadata: notes ? JSON.stringify({ notes }) : null
        });
      }

      res.json({ message: "Transfer approved successfully", transaction });
    } catch (error) {
      console.error("Error approving transfer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin reject transfer with automatic support ticket creation - PROTECTED: requires admin role
  app.post('/api/admin/transfers/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await (storage as any).getUserByEmail(req.user!.email);
      const adminId = admin?.id || 1;

      const transaction = await storage.updateTransactionStatus(transactionId, 'rejected', adminId, notes);
      
      if (transaction) {
        // Log admin action
        await storage.createAdminAction({
          adminId: adminId,
          actionType: 'reject_transfer',
          targetType: 'transaction',
          targetId: transactionId.toString(),
          description: `Rejected transfer #${transactionId}`,
          metadata: JSON.stringify({ notes })
        });

        // Create automatic support ticket for rejected transfer
        if (transaction.fromAccountId) {
          const account = await storage.getAccount(transaction.fromAccountId);
          if (account) {
          await storage.createSupportTicket({
            userId: account.userId,
            subject: `Transfer Rejection - Transaction #${transaction.id}`,
            description: `Your transfer has been rejected.\n\nTransaction Details:\n- Amount: $${transaction.amount}\n- Recipient: ${transaction.recipientName}\n- Reason for rejection: ${notes}\n\nPlease contact support for assistance.`,
            category: 'transfer_issue',
            priority: 'high',
            status: 'open'
          });
          }
        }
      }

      res.json({ message: "Transfer rejected and support ticket created", transaction });
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get pending transfers for admin - PROTECTED: requires admin role
  app.get('/api/admin/pending-transfers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pendingTransfers = await storage.getPendingTransactions();
      res.json(pendingTransfers);
    } catch (error) {
      console.error("Error getting pending transfers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}