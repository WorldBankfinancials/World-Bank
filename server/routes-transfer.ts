import { Express, Request, Response } from 'express';
import { storage } from './storage-factory';

function generateReferenceNumber(): string {
  return `WB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function setupTransferRoutes(app: Express) {
  // Enhanced Transfer API with proper workflow
  app.post('/api/transfers/create', async (req: Request, res: Response) => {
    try {
      const { 
        amount, 
        recipientName, 
        recipientAccount, 
        recipientCountry, 
        bankName, 
        swiftCode, 
        transferPurpose,
        notes 
      } = req.body;

      // Validate required fields
      if (!amount || !recipientName || !recipientAccount || !bankName) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: amount, recipient name, account, and bank name are required" 
        });
      }

      // Generate unique transaction ID
      const transactionId = generateReferenceNumber();

      // Create transaction record
      const transaction = {
        id: Date.now(),
        transactionId,
        amount: parseFloat(amount),
        currency: 'USD',
        recipientName,
        recipientAccount,
        recipientCountry: recipientCountry || 'Unknown',
        bankName,
        swiftCode: swiftCode || '',
        transferPurpose: transferPurpose || 'Personal',
        notes: notes || '',
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        userId: 'current-user' // Will be replaced with real auth
      };

      // Store in memory for demo (replace with real database)
      if (!global.pendingTransfers) {
        global.pendingTransfers = [];
      }
      global.pendingTransfers.push(transaction);

      res.json({ 
        success: true,
        message: "Transfer submitted successfully", 
        transaction,
        transactionId
      });
    } catch (error) {
      console.error("Error creating transfer:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process transfer" 
      });
    }
  });

  // Get pending transfers for admin
  app.get('/api/admin/pending-transfers', async (req: Request, res: Response) => {
    try {
      const pendingTransfers = global.pendingTransfers || [];
      res.json(pendingTransfers);
    } catch (error) {
      console.error("Error getting pending transfers:", error);
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