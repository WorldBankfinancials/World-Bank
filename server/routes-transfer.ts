import { Express, Request, Response } from 'express';
import { storage } from './storage-factory';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth-middleware';

function generateReferenceNumber(): string {
  return `WB-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export function setupTransferRoutes(app: Express) {
  // Regular Transfer API - PROTECTED: requires authentication
  app.post('/api/transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        amount,
        recipientName,
        recipientAccount,
        recipientCountry,
        bankName,
        swiftCode,
        transferPin,
        purpose
      } = req.body;

      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await storage.getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate required fields first
      if (!amount || !recipientName || !recipientAccount) {
        return res.status(400).json({ message: "Missing required transfer details: amount, recipient name, and account number" });
      }

      // PIN VALIDATION - Verify against stored PIN
      if (!transferPin || String(transferPin).length !== 4) {
        return res.status(401).json({ message: "Invalid PIN format - must be 4 digits" });
      }

      // Get fresh user data to verify PIN
      const userForPin = await storage.getUserByEmail(req.user!.email);
      if (!userForPin || !userForPin.transferPin) {
        return res.status(401).json({ message: "PIN not set on account" });
      }

      const storedPin = String(userForPin.transferPin).trim();
      const providedPin = String(transferPin).trim();

      if (storedPin !== providedPin) {
        return res.status(401).json({ message: "Incorrect PIN - transfer denied" });
      }

      // Create transaction with PENDING status - awaiting admin review
      const transactionId = `WB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Save transaction to database with pending status
      try {
        // Truncate all fields to match database constraints
        const recipientNameTrunc = String(recipientName).substring(0, 20);
        const recipientAccountTrunc = String(recipientAccount).substring(0, 50);
        const recipientCountryTrunc = String(recipientCountry || '').substring(0, 20);
        
        const transactionData: any = {
          fromUserId: user.id,
          amount: String(amount),
          currency: 'USD',
          type: 'transfer',
          transactionType: 'transfer',
          status: 'pending',
          description: `Transfer to ${recipientNameTrunc}`.substring(0, 255),
          recipientName: recipientNameTrunc,
          recipientAccount: recipientAccountTrunc,
          recipientCountry: recipientCountryTrunc,
          bankName: bankName ? String(bankName).substring(0, 20) : undefined,
          swiftCode: swiftCode ? String(swiftCode).substring(0, 20) : undefined,
          transferPurpose: (purpose || 'transfer').substring(0, 20)
        };
        const transaction = await storage.createTransaction(transactionData);

        // Return pending response - transaction submitted
        res.json({ 
          message: "Transfer submitted successfully",
          transactionId: transactionId,
          status: "pending",
          amount: amount
        });
      } catch (dbError: any) {
        console.error('Transfer creation error:', dbError);
        return res.status(500).json({ message: "Failed to submit transfer", error: dbError.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Transfer system error" });
    }
  });

  // International Transfer API - PROTECTED: requires authentication
  app.post('/api/international-transfers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
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

      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await storage.getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // PIN VALIDATION - Verify against stored PIN
      if (!transferPin || String(transferPin).length !== 4) {
        return res.status(401).json({ message: "Invalid PIN format - must be 4 digits" });
      }

      // Get fresh user data to verify PIN
      const userForPin = await storage.getUserByEmail(req.user!.email);
      if (!userForPin || !userForPin.transferPin) {
        return res.status(401).json({ message: "PIN not set on account" });
      }

      const storedPin = String(userForPin.transferPin).trim();
      const providedPin = String(transferPin).trim();

      if (storedPin !== providedPin) {
        return res.status(401).json({ message: "Incorrect PIN - transfer denied" });
      }

      // Validate required fields
      if (!amount || !recipientName || !recipientCountry) {
        return res.status(400).json({ message: "Missing required international transfer details" });
      }

      const transactionId = `INT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create transaction with pending status
      try {
        // Truncate all fields to match database constraints
        const recipientNameTrunc = String(recipientName).substring(0, 20);
        const recipientCountryTrunc = String(recipientCountry).substring(0, 20);
        
        const transactionData: any = {
          fromUserId: user.id,
          amount: String(amount),
          currency: 'USD',
          type: 'intl_transfer',
          status: 'pending',
          description: `Intl transfer to ${recipientNameTrunc}`.substring(0, 255),
          recipientName: recipientNameTrunc,
          recipientCountry: recipientCountryTrunc,
          bankName: bankName ? String(bankName).substring(0, 20) : undefined,
          swiftCode: swiftCode ? String(swiftCode).substring(0, 20) : undefined,
          accountNumber: accountNumber ? String(accountNumber).substring(0, 50) : undefined,
          transferPurpose: (transferPurpose || 'wire_xfer').substring(0, 20)
        };
        const transaction = await storage.createTransaction(transactionData);

        res.json({ 
          message: "International transfer submitted successfully", 
          transactionId: transactionId,
          status: "pending",
          amount: amount
        });
      } catch (dbError: any) {
        console.error('International transfer creation error:', dbError);
        return res.status(500).json({ message: "Failed to submit international transfer", error: dbError.message });
      }
    } catch (error) {
      res.status(500).json({ message: "International transfer system error" });
    }
  });

  // Enhanced Transfer API with proper workflow - PROTECTED: requires authentication
  app.post('/api/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await storage.getUserByEmail(req.user!.email);
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
        fromAccountId: fromAccount.id,
        type: transferType || "international_transfer",
        amount: amount.toString(),
        description: `Transfer to ${recipientName}`,
        recipientName: recipientName,
        recipientCountry: recipientCountry || "Unknown",
        currency: currency || "USD",
        status: "pending_approval"
      });

      res.json({ 
        message: "Transfer submitted for approval", 
        transaction: transaction,
        transactionId: transactionId || generateReferenceNumber()
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin approve transfer - PROTECTED: requires admin role
  app.post('/api/admin/transfers/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id || 1;

      const transaction = await storage.updateTransactionStatus(transactionId, 'approved', adminId, notes);
      
      if (transaction) {
        // Log admin action
        await storage.createAdminAction({
          adminId: adminId,
          action: 'approve_transfer',
          targetType: 'transaction',
          targetId: transactionId,
          details: notes ? { notes } : {}
        });
      }

      res.json({ message: "Transfer approved successfully", transaction });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin reject transfer with automatic support ticket creation - PROTECTED: requires admin role
  app.post('/api/admin/transfers/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id || 1;

      const transaction = await storage.updateTransactionStatus(transactionId, 'rejected', adminId, notes);
      
      if (transaction) {
        // Log admin action
        await storage.createAdminAction({
          adminId: adminId,
          action: 'reject_transfer',
          targetType: 'transaction',
          targetId: transactionId,
          details: notes ? { notes } : {}
        });

        // Create automatic support ticket for rejected transfer
        if (transaction.fromAccountId) {
          const account = await storage.getAccount(transaction.fromAccountId);
          if (account) {
          await storage.createSupportTicket({
            userId: account.userId,
            subject: `Transfer Rejection - Transaction #${transaction.id}`,
            description: `Your transfer has been rejected.\n\nTransaction Details:\n- Amount: $${transaction.amount}\n- Recipient: ${transaction.recipientName}\n- Reason for rejection: ${notes}\n\nPlease contact support for assistance.`,
            priority: 'high',
            status: 'open'
          });
          }
        }
      }

      res.json({ message: "Transfer rejected and support ticket created", transaction });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get pending transfers for admin - PROTECTED: requires admin role
  app.get('/api/admin/pending-transfers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pendingTransfers = await storage.getPendingTransactions();
      res.json(pendingTransfers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get transfer status - PROTECTED: requires authentication
  app.get('/api/transfers/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all user transactions and find by reference ID
      const transactions = await storage.getUserTransactions(user.id);
      const transaction = transactions.find((t: any) => {
        // Match by transaction ID or description containing the reference
        return String(t.id) === id || String(t.transactionId) === id;
      });

      if (!transaction) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      res.json({
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        description: transaction.description
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get international transfer status - PROTECTED: requires authentication
  app.get('/api/international-transfers/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all user transactions and find by reference ID
      const transactions = await storage.getUserTransactions(user.id);
      const transaction = transactions.find((t: any) => {
        // Match by transaction ID or ID string
        return String(t.id) === id || String(t.transactionId) === id || t.id === id;
      });

      if (!transaction) {
        return res.status(404).json({ message: "International transfer not found" });
      }

      res.json({
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
