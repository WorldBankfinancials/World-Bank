import { storage } from "./storage-factory";

export interface TransferApprovalData {
  transactionId: string;
  amount: number;
  currency: string;
  recipientName: string;
  recipientAccount: string;
  bankName: string;
  transferType: string;
  purpose: string;
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
      date: new Date(),
      accountId: fromAccount.id,
      type: data.transferType,
      amount: data.amount.toString(),
      description: `Transfer to ${data.recipientName} - ${data.purpose}`,
      status: 'pending_approval',
      recipientName: data.recipientName,
      recipientCountry: 'Unknown',
      bankName: data.bankName,
      swiftCode: '',
      adminNotes: null
    });

    return transaction;
  } catch (error) {
    console.error('Error creating transfer for approval:', error);
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
        actionType: 'approve_transfer',
        targetType: 'transaction',
        targetId: transactionId.toString(),
        description: `Approved transfer #${transactionId}`,
        metadata: notes ? JSON.stringify({ notes }) : null
      });
    }

    return transaction;
  } catch (error) {
    console.error('Error approving transfer:', error);
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
        actionType: 'reject_transfer',
        targetType: 'transaction',
        targetId: transactionId.toString(),
        description: `Rejected transfer #${transactionId}`,
        metadata: JSON.stringify({ notes })
      });

      // Create automatic support ticket for rejected transfer
      await createSupportTicketForRejection(transaction, notes);
    }

    return transaction;
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    throw error;
  }
}

async function createSupportTicketForRejection(transaction: any, rejectionReason: string) {
  try {
    // Get account details to find user
    const account = await storage.getAccount(transaction.accountId);
    if (!account) {
      console.error('Account not found for transaction');
      return;
    }

    // Create support ticket
    const ticket = await storage.createSupportTicket({
      userId: account.userId,
      subject: `Transfer Rejection - Transaction #${transaction.id}`,
      description: `Your transfer has been rejected.\n\nTransaction Details:\n- Amount: $${transaction.amount}\n- Recipient: ${transaction.recipientName}\n- Reason for rejection: ${rejectionReason}\n\nPlease contact support for assistance.`,
      category: 'transfer_issue',
      priority: 'high',
      status: 'open'
    });

    console.log(`Auto-created support ticket #${ticket.id} for rejected transfer #${transaction.id}`);
    return ticket;
  } catch (error) {
    console.error('Error creating support ticket for rejection:', error);
  }
}

export async function getPendingTransfers() {
  try {
    return await storage.getPendingTransactions();
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    throw error;
  }
}