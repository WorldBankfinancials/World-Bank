import { Express, Request, Response } from 'express';
import { storage } from './storage-factory';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth-middleware';
import { transferSchema, validateRequest } from './validation-schemas';

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
      if (transferPin !== user.transferPin) {
        return res.status(400).json({ message: "Invalid transfer PIN. Please check your PIN and try again." });
      }

      // Check if user has sufficient balance
      const userAccounts = await (storage as any).getUserAccounts(user.id);
      const totalBalance = userAccounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || '0'), 0);
      
      if (totalBalance < amount) {
        return res.status(400).json({ 
          message: "Insufficient balance. Please add funds to your account.",
          availableBalance: totalBalance,
          requestedAmount: amount
        });
      }

      const transactionId = `WB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      res.json({ 
        message: "Transfer submitted successfully", 
        transactionId: transactionId,
        status: "processing",
        amount: amount
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
      if (transferPin !== user.transferPin) {
        return res.status(400).json({ message: "Invalid transfer PIN. Please check your PIN and try again." });
      }

      // Check if user has sufficient balance
      const userAccounts = await (storage as any).getUserAccounts(user.id);
      const totalBalance = userAccounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || '0'), 0);
      
      if (totalBalance < amount) {
        return res.status(400).json({ 
          message: "Insufficient balance. Please add funds to your account.",
          availableBalance: totalBalance,
          requestedAmount: amount
        });
      }

      const transactionId = `INT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      res.json({ 
        message: "International transfer submitted successfully", 
        id: transactionId,
        status: "processing",
        amount: amount
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