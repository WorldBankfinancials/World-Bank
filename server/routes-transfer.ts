import { Express, Request, Response } from 'express';
import { storage } from './storage-factory';

function generateReferenceNumber(): string {
  return `WB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function setupTransferRoutes(app: Express) {
  // Enhanced Transfer API with proper workflow
  app.post('/api/transactions', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
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
      const accounts = await storage.getUserAccounts(userId);
      if (accounts.length === 0) {
        return res.status(400).json({ message: "No account found" });
      }

      const fromAccount = accounts[0];

      // Create transaction record for admin approval (all transfers require approval)
      const transaction = await storage.createTransaction({
        date: new Date(),
        accountId: fromAccount.id,
        type: transferType || "international_transfer",
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

  // Admin approve transfer
  app.post('/api/admin/transfers/:id/approve', async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = (req as any).session?.userId || 1; // Default admin

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

  // Admin reject transfer with automatic support ticket creation
  app.post('/api/admin/transfers/:id/reject', async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = (req as any).session?.userId || 1; // Default admin

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
        const account = await storage.getAccount(transaction.accountId);
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

      res.json({ message: "Transfer rejected and support ticket created", transaction });
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get pending transfers for admin
  app.get('/api/admin/pending-transfers', async (req: Request, res: Response) => {
    try {
      const pendingTransfers = await storage.getPendingTransactions();
      res.json(pendingTransfers);
    } catch (error) {
      console.error("Error getting pending transfers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}