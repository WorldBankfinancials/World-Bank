import { Express, Request, Response } from 'express';
import { storage } from './storage-factory';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './auth-middleware';
import * as bcrypt from 'bcryptjs';
import { generateTransactionId, generateReferenceNumber } from './crypto-utils';
import { transactionRateLimiter } from './rate-limiter';
import { supabase } from './supabase-public-storage';

export function setupTransferRoutes(app: Express) {
  // Regular Transfer API - PROTECTED: requires authentication
  app.post('/api/transfers', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Idempotency check - prevent duplicate transfers
      const { idempotencyKey } = req.body;
      if (idempotencyKey) {
        const { data: existing } = await supabase.from('transactions')
          .select('id, reference')
          .eq('metadata->>idempotencyKey', idempotencyKey)
          .limit(1);
        if (existing && existing.length > 0) {
          return res.json(existing[0]);
        }
      }

      const {
        amount,
        recipientName,
        recipientAccount,
        recipientCountry,
        bankName,
        swiftCode,
        transferPin,
        purpose,
        fee = 0
      } = req.body;

      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await storage.getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate required fields first - with better error messaging
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      if (!recipientName) {
        return res.status(400).json({ message: "Recipient name is required" });
      }
      if (!recipientAccount) {
        return res.status(400).json({ message: "Recipient account/number is required" });
      }

      // Negative/zero transfer amount protection
      if (!amount || isNaN(parseFloat(String(amount))) || parseFloat(String(amount)) <= 0) {
        return res.status(400).json({ error: 'Transfer amount must be greater than zero' });
      }

      // Self-transfer protection
      const senderAccountNumber = String(user.accountNumber || '');
      if (senderAccountNumber && String(recipientAccount) === senderAccountNumber) {
        return res.status(400).json({ error: 'Cannot transfer to your own account' });
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

      const pinMatch = await bcrypt.compare(String(transferPin).trim(), String(userForPin.transferPin).trim());
      if (!pinMatch) {
        return res.status(401).json({ message: "Incorrect PIN - transfer denied" });
      }

      // Create transaction with PENDING status - awaiting admin review
      const transactionId = generateTransactionId();

      // Save transaction to database with pending status
      try {
        // Truncate all fields to match database constraints
        const recipientNameTrunc = String(recipientName).substring(0, 20);
        const recipientAccountTrunc = String(recipientAccount).substring(0, 50);
        const recipientCountryTrunc = String(recipientCountry || '').substring(0, 20);
        
        // ✅ CRITICAL: DEBIT ACCOUNT IMMEDIATELY WHEN TRANSFER SUBMITTED
        const numAmount = parseFloat(String(amount));
        const numFee = Number(fee) || 0;
        const totalDebit = numAmount + numFee;
        
        // FIX: Get actual balance from all user accounts, not from users.balance
        // (used only for the friendly insufficient-funds message; the RPC
        // performs the authoritative atomic overdraft check)
        const userAccounts = await storage.getUserAccounts(user.id);
        if (!userAccounts || userAccounts.length === 0) {
          return res.status(400).json({ message: "User has no account" });
        }
        const fromAccountId = userAccounts[0].id;
        if (!fromAccountId) {
          return res.status(400).json({ message: "Invalid account ID" });
        }
        let currentBalance = 0;
        currentBalance = userAccounts.reduce((sum, acc) => sum + parseFloat(String(acc.balance || '0')), 0);
        if (currentBalance < totalDebit) {
          return res.status(400).json({ message: `Insufficient funds. Your total balance is ${currentBalance.toFixed(2)} but you're trying to transfer ${numAmount.toFixed(2)} plus ${numFee.toFixed(2)} fee` });
        }
        
        // ✅ ATOMIC TRANSFER: Use the execute_external_transfer RPC to debit
        // the account and create the transaction record in a single DB
        // transaction. This eliminates the TOCTOU race condition that existed
        // with the previous separate read-then-updateUserBalance approach.
        const reference = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
        const { data: transferResult, error: transferError } = await supabase
          .rpc('execute_external_transfer', {
            p_from_account_id: fromAccountId,
            p_from_user_id: user.id,
            p_amount: numAmount,
            p_fee: numFee,
            p_currency: 'USD',
            p_recipient_name: recipientNameTrunc,
            p_recipient_account: recipientAccountTrunc,
            p_recipient_country: recipientCountryTrunc,
            p_bank_name: bankName ? String(bankName).substring(0, 20) : '',
            p_swift_code: swiftCode ? String(swiftCode).substring(0, 20) : '',
            p_reference: reference,
            p_description: `Transfer to ${recipientNameTrunc}`.substring(0, 255),
            p_transfer_purpose: (purpose || 'transfer').substring(0, 20),
            p_transaction_type: 'transfer',
            p_status: 'processing'
          });
        if (transferError) throw transferError;
        
        const newBalance = currentBalance - totalDebit;

        // Auto-create alert on transfer
        try {
          await supabase.from('alerts').insert({
            user_id: user.id,
            title: 'Transfer Initiated',
            message: `Transfer of \${numAmount.toFixed(2)} to ${recipientName} (${recipientAccount}) is being processed.`,
            type: 'info',
            priority: 'normal',
            is_read: false
          });
        } catch (alertError: unknown) {
          console.warn('Failed to create transfer alert:', alertError instanceof Error ? alertError.message : 'Unknown error');
        }

        // After successful transfer, save to recent_contacts
        try {
          const { data: existingContact } = await supabase
            .from('recent_contacts')
            .select('id, transfer_count')
            .eq('user_id', user.id)
            .eq('contact_account', recipientAccountTrunc)
            .limit(1);

          if (existingContact && existingContact.length > 0) {
            await supabase.from('recent_contacts').update({
              contact_name: recipientNameTrunc,
              contact_bank_name: bankName ? String(bankName).substring(0, 20) : null,
              contact_swift_code: swiftCode ? String(swiftCode).substring(0, 20) : null,
              last_amount: numAmount.toFixed(2),
              transfer_count: (existingContact[0] as Record<string, unknown>).transfer_count as number + 1,
              updated_at: new Date().toISOString()
            }).eq('id', (existingContact[0] as Record<string, unknown>).id as string);
          } else {
            await supabase.from('recent_contacts').insert({
              user_id: user.id,
              contact_name: recipientNameTrunc,
              contact_account: recipientAccountTrunc,
              contact_bank_name: bankName ? String(bankName).substring(0, 20) : null,
              contact_swift_code: swiftCode ? String(swiftCode).substring(0, 20) : null,
              last_amount: numAmount.toFixed(2),
              transfer_count: 1
            });
          }
        } catch (contactError: unknown) {
          // Non-fatal: recent_contacts save failure should not fail the transfer
          console.warn('Failed to save recent contact:', contactError instanceof Error ? contactError.message : 'Unknown error');
        }

        // Return processing response - transaction submitted and being processed
        res.json({ 
          message: "Transfer submitted successfully - funds debited, processing transfer",
          transactionId: transactionId,
          transaction: transferResult,
          status: "processing",
          amount: amount,
          fee: fee,
          newBalance: newBalance
        });
      } catch (dbError: unknown) {
        return res.status(500).json({ message: "Failed to submit transfer", error: (dbError as Error).message });
      }
    } catch (error) {
      res.status(500).json({ message: "Transfer system error" });
    }
  });

  // International Transfer API - PROTECTED: requires authentication
  app.post('/api/international-transfers', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
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

      // Negative/zero transfer amount protection
      if (!amount || isNaN(parseFloat(String(amount))) || parseFloat(String(amount)) <= 0) {
        return res.status(400).json({ error: 'Transfer amount must be greater than zero' });
      }

      // SECURITY: Get user from authenticated JWT (set by requireAuth middleware)
      const user = await storage.getUserByEmail(req.user!.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Self-transfer protection
      const senderAccountNumber = String(user.accountNumber || '');
      if (senderAccountNumber && String(accountNumber) === senderAccountNumber) {
        return res.status(400).json({ error: 'Cannot transfer to your own account' });
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

      const intlPinMatch = await bcrypt.compare(String(transferPin).trim(), String(userForPin.transferPin).trim());
      if (!intlPinMatch) {
        return res.status(401).json({ message: "Incorrect PIN - transfer denied" });
      }

      // Validate required fields
      if (!amount || !recipientName || !recipientCountry) {
        return res.status(400).json({ message: "Missing required international transfer details" });
      }

      const transactionId = generateTransactionId('INT');

      // Create transaction with pending status
      try {
        // ✅ CRITICAL: DEBIT ACCOUNT IMMEDIATELY FOR INTERNATIONAL TRANSFER
        const numAmount = parseFloat(String(amount));
        
        // FIX: Get actual balance from all user accounts, not from users.balance
        // (used only for the friendly insufficient-funds message; the RPC
        // performs the authoritative atomic overdraft check)
        const userAccounts = await storage.getUserAccounts(user.id);
        if (!userAccounts || userAccounts.length === 0) {
          return res.status(400).json({ message: "User has no account" });
        }
        const fromAccountId = userAccounts[0].id;
        if (!fromAccountId) {
          return res.status(400).json({ message: "Invalid account ID" });
        }
        let currentBalance = 0;
        currentBalance = userAccounts.reduce((sum, acc) => sum + parseFloat(String(acc.balance || '0')), 0);
        if (currentBalance < numAmount) {
          return res.status(400).json({ message: `Insufficient funds. Your total balance is ${currentBalance.toFixed(2)} but you're trying to transfer ${numAmount.toFixed(2)}` });
        }

        const internationalFee = Math.max(numAmount * 0.015, 15); // 1.5% or $15 minimum
        const totalDebit = numAmount + internationalFee;
        if (currentBalance < totalDebit) {
          return res.status(400).json({ message: `Insufficient funds. Your total balance is ${currentBalance.toFixed(2)} but you need ${totalDebit.toFixed(2)} (transfer + fee)` });
        }

        // Truncate all fields to match database constraints
        const recipientNameTrunc = String(recipientName).substring(0, 20);
        const recipientCountryTrunc = String(recipientCountry).substring(0, 20);
        const recipientAccountTrunc = accountNumber ? String(accountNumber).substring(0, 50) : '';

        // ✅ ATOMIC TRANSFER: Use the execute_external_transfer RPC to debit
        // the account and create the transaction record in a single DB
        // transaction. This eliminates the TOCTOU race condition that existed
        // with the previous separate read-then-updateUserBalance approach.
        const reference = `INT${Date.now()}${Math.floor(Math.random() * 10000)}`;
        const { data: transferResult, error: transferError } = await supabase
          .rpc('execute_external_transfer', {
            p_from_account_id: fromAccountId,
            p_from_user_id: user.id,
            p_amount: numAmount,
            p_fee: internationalFee,
            p_currency: 'USD',
            p_recipient_name: recipientNameTrunc,
            p_recipient_account: recipientAccountTrunc,
            p_recipient_country: recipientCountryTrunc,
            p_bank_name: bankName ? String(bankName).substring(0, 20) : '',
            p_swift_code: swiftCode ? String(swiftCode).substring(0, 20) : '',
            p_reference: reference,
            p_description: `Intl transfer to ${recipientNameTrunc}`.substring(0, 255),
            p_transfer_purpose: (transferPurpose || 'wire_xfer').substring(0, 20),
            p_transaction_type: 'international_transfer',
            p_status: 'processing'
          });
        if (transferError) throw transferError;

        const newBalance = currentBalance - totalDebit;

        // After successful transfer, save to recent_contacts
        try {
          const { data: existingContact } = await supabase
            .from('recent_contacts')
            .select('id, transfer_count')
            .eq('user_id', user.id)
            .eq('contact_account', recipientAccountTrunc)
            .limit(1);

          if (existingContact && existingContact.length > 0) {
            await supabase.from('recent_contacts').update({
              contact_name: recipientNameTrunc,
              contact_bank_name: bankName ? String(bankName).substring(0, 20) : null,
              contact_swift_code: swiftCode ? String(swiftCode).substring(0, 20) : null,
              last_amount: numAmount.toFixed(2),
              transfer_count: (existingContact[0] as Record<string, unknown>).transfer_count as number + 1,
              updated_at: new Date().toISOString()
            }).eq('id', (existingContact[0] as Record<string, unknown>).id as string);
          } else {
            await supabase.from('recent_contacts').insert({
              user_id: user.id,
              contact_name: recipientNameTrunc,
              contact_account: recipientAccountTrunc,
              contact_bank_name: bankName ? String(bankName).substring(0, 20) : null,
              contact_swift_code: swiftCode ? String(swiftCode).substring(0, 20) : null,
              last_amount: numAmount.toFixed(2),
              transfer_count: 1
            });
          }
        } catch (contactError: unknown) {
          // Non-fatal: recent_contacts save failure should not fail the transfer
          console.warn('Failed to save recent contact:', contactError instanceof Error ? contactError.message : 'Unknown error');
        }

        res.json({ 
          message: "International transfer submitted successfully - funds debited, processing transfer",
          transactionId: transactionId,
          transaction: transferResult,
          status: "processing",
          amount: amount,
          newBalance: newBalance
        });
      } catch (dbError: unknown) {
        return res.status(500).json({ message: "Failed to submit international transfer", error: (dbError as Error).message });
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
        purpose
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

      // Create transaction record as "processing" - admin approval happens secretly in admin dashboard
      const transaction = await storage.createTransaction({
        fromAccountId: fromAccount.id,
        type: transferType || "international_transfer",
        amount: amount.toString(),
        description: `Transfer to ${recipientName}`,
        recipientName: recipientName,
        recipientCountry: recipientCountry || "Unknown",
        currency: currency || "USD",
        status: "processing"
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
      const transactionId = req.params.id;
      const { notes } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id; if (!adminId) { return res.status(403).json({ message: 'Admin authentication required' }); }

      // Get transaction directly by ID
      const targetTxn = await storage.getTransactionById(transactionId);
      
      if (!targetTxn) {
        return res.status(404).json({ message: "Transfer not found or already processed" });
      }

      // Only allow approving transfers that are currently in 'processing' status
      if (targetTxn.status !== 'processing') {
        return res.status(400).json({ error: 'Transfer is not in processing status' });
      }

      // ✅ CRITICAL: When approved, funds are now TRANSFERRED (already debited)
      // Status changes to 'completed' to indicate success
      // Transition: processing → completed
      const transaction = await storage.updateTransactionStatus(transactionId, 'completed', adminId, notes);
      
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

      res.json({ message: "Transfer approved successfully - funds transferred", transaction });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin reject transfer with manual reversal option - PROTECTED: requires admin role
  app.post('/api/admin/transfers/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionId = req.params.id;
      const { notes, reverseToAccount } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id; if (!adminId) { return res.status(403).json({ message: 'Admin authentication required' }); }

      // Get transaction directly by ID
      const targetTxn = await storage.getTransactionById(transactionId);
      
      if (!targetTxn) {
        return res.status(404).json({ message: "Transfer not found or already processed" });
      }

      // Transition: processing → failed
      const transaction = await storage.updateTransactionStatus(transactionId, 'failed', adminId, notes);
      
      // ✅ CRITICAL: Admin MUST EXPLICITLY DECIDE if funds should be reversed
      // If reverseToAccount = true, credit back to user's account
      if (reverseToAccount && targetTxn.fromUserId) {
        // Credit back amount + fee
        const refundAmount = parseFloat(String(targetTxn.amount)) + parseFloat(String(targetTxn.fee || '0'));
        await storage.updateUserBalance(targetTxn.fromUserId, refundAmount);
      }
      
      if (transaction) {
        // Log admin action
        await storage.createAdminAction({
          adminId: adminId,
          action: 'reject_transfer',
          targetType: 'transaction',
          targetId: transactionId,
          details: { 
            notes, 
            reversed: reverseToAccount || false 
          }
        });

        // Create automatic support ticket for failed transfer
        if (targetTxn.fromUserId) {
          await storage.createSupportTicket({
            userId: targetTxn.fromUserId,
            subject: `Transfer Rejection - Transaction #${transaction.id}`,
            description: `Your transfer has failed.\n\nTransaction Details:\n- Amount: $${transaction.amount}\n- Recipient: ${transaction.recipientName}\n- Reason for rejection: ${notes}\n- Funds Reversed: ${reverseToAccount ? 'Yes' : 'No'}\n\nPlease contact support for assistance.`,
            priority: 'high',
            status: 'open'
          });
        }
      }

      res.json({ 
        message: reverseToAccount 
          ? "Transfer failed and funds reversed to customer account" 
          : "Transfer failed - funds retained in pending state", 
        transaction,
        reversed: reverseToAccount || false
      });
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

  // Admin approve international transfer - PROTECTED: requires admin role
  app.post('/api/admin/international-transfers/:id/approve', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionId = req.params.id;
      const { notes } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id; if (!adminId) { return res.status(403).json({ message: 'Admin authentication required' }); }

      // Get transaction directly by ID
      const targetTxn = await storage.getTransactionById(transactionId);
      
      if (!targetTxn) {
        return res.status(404).json({ message: "International transfer not found or already processed" });
      }

      // ✅ CRITICAL: When approved, funds are now TRANSFERRED (already debited)
      // Status changes to 'completed' to indicate success
      // Transition: processing → completed
      const transaction = await storage.updateTransactionStatus(transactionId, 'completed', adminId, notes);
      
      if (transaction) {
        // Log admin action
        await storage.createAdminAction({
          adminId: adminId,
          action: 'approve_international_transfer',
          targetType: 'transaction',
          targetId: transactionId,
          details: notes ? { notes } : {}
        });
      }

      res.json({ message: "International transfer approved successfully - funds transferred", transaction });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin reject international transfer with manual reversal option - PROTECTED: requires admin role
  app.post('/api/admin/international-transfers/:id/reject', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactionId = req.params.id;
      const { notes, reverseToAccount } = req.body;
      
      // SECURITY: Get admin user from authenticated JWT
      const admin = await storage.getUserByEmail(req.user!.email);
      const adminId = admin?.id; if (!adminId) { return res.status(403).json({ message: 'Admin authentication required' }); }

      // Get transaction directly by ID
      const targetTxn = await storage.getTransactionById(transactionId);
      
      if (!targetTxn) {
        return res.status(404).json({ message: "International transfer not found or already processed" });
      }

      // Transition: processing → failed
      const transaction = await storage.updateTransactionStatus(transactionId, 'failed', adminId, notes);
      
      // ✅ CRITICAL: Admin MUST EXPLICITLY DECIDE if funds should be reversed
      // If reverseToAccount = true, credit back to user's account
      if (reverseToAccount && targetTxn.fromUserId) {
        // Credit back amount + fee
        const refundAmount = parseFloat(String(targetTxn.amount)) + parseFloat(String(targetTxn.fee || '0'));
        await storage.updateUserBalance(targetTxn.fromUserId, refundAmount);
      }
      
      if (transaction) {
        // Log admin action
        await storage.createAdminAction({
          adminId: adminId,
          action: 'reject_international_transfer',
          targetType: 'transaction',
          targetId: transactionId,
          details: { 
            notes, 
            reversed: reverseToAccount || false 
          }
        });

        // Create automatic support ticket for rejected international transfer
        if (targetTxn.fromUserId) {
          await storage.createSupportTicket({
            userId: targetTxn.fromUserId,
            subject: `International Transfer Rejection - Transaction #${transaction.id}`,
            description: `Your international transfer has failed.\n\nTransaction Details:\n- Amount: $${transaction.amount}\n- Recipient Country: ${transaction.recipientCountry}\n- Reason for rejection: ${notes}\n- Funds Reversed: ${reverseToAccount ? 'Yes' : 'No'}\n\nPlease contact support for assistance.`,
            priority: 'high',
            status: 'open'
          });
        }
      }

      res.json({ 
        message: reverseToAccount 
          ? "International transfer failed and funds reversed to customer account" 
          : "International transfer failed - funds retained in pending state", 
        transaction,
        reversed: reverseToAccount || false
      });
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

      // Get transaction directly by ID
      const transaction = await storage.getTransactionById(id);

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

      // Get transaction directly by ID
      const transaction = await storage.getTransactionById(id);

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