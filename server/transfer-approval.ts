import { storage } from "./storage-factory";

export interface TransferApprovalData {
  transactionId: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  adminNotes?: string;
  userId: number;
}

export async function createTransferForApproval(data: TransferApprovalData) {
  try {
    // Get user accounts
    const accounts = await storage.getUserAccounts(data.userId);
    if (accounts.length === 0) {
      throw new Error("No account found for user");
    }

    const fromAccount = accounts[0];

    // Create transaction record
    const transaction = await storage.createTransaction({
      fromAccountId: fromAccount.id,
      type: data.type,
      amount: data.amount.toString(),
      description: data.description,
      status: 'pending_approval',
      currency: data.currency,
      referenceNumber: `TXN-${Date.now()}`
    });

    return transaction;
  } catch (error) {
    throw error;
  }
}

export async function approveTransfer(transactionId: number, adminId: number, notes?: string) {
  try {
    // Update transaction status
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

    return transaction;
  } catch (error) {
    throw error;
  }
}

export async function rejectTransfer(transactionId: number, adminId: number, notes: string) {
  try {
    // Update transaction status
    const transaction = await storage.updateTransactionStatus(transactionId, 'rejected', adminId, notes);
    
    if (transaction) {
      // Log admin action
      await storage.createAdminAction({
        adminId: adminId,
        action: 'reject_transfer',
        targetType: 'transaction',
        targetId: transactionId,
        details: { notes }
      });

      // Create automatic support ticket for rejected transfer
      await createSupportTicketForRejection(transaction, notes);
    }

    return transaction;
  } catch (error) {
    throw error;
  }
}

async function createSupportTicketForRejection(transaction: any, rejectionReason: string) {
  try {
    // Get account details to find user
    const account = await storage.getAccount(transaction.accountId);
    if (!account) {
      return;
    }

    // Create support ticket
    const ticket = await storage.createSupportTicket({
      userId: account.userId,
      subject: `Transfer Rejection - Transaction #${transaction.id}`,
      description: `Your transfer has been rejected.\n\nTransaction Details:\n- Amount: $${transaction.amount}\n- Reason for rejection: ${rejectionReason}\n\nPlease contact support for assistance.`,
      status: 'open',
      priority: 'high'
    });

    return ticket;
  } catch (error) {
  }
}

export async function getPendingTransfers() {
  try {
    return await storage.getPendingTransactions();
  } catch (error) {
    throw error;
  }
}