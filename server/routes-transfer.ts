import { Express, Request, Response, RequestHandler } from 'express';
import { storage } from './storage-factory';
import { requireAuth, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { transactionRateLimiter } from './rate-limiter';
import { supabase } from './supabase-public-storage';
import { atomicTransfer, atomicBalanceUpdate } from './transaction-wrapper';
import * as bcrypt from 'bcryptjs';

function wrap(
  handler: (req: AuthenticatedRequest, res: Response) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as AuthenticatedRequest, res as Response)).catch(next);
  };
}

export function setupTransferRoutes(app: Express) {
  // POST /api/transfers - Create a domestic transfer
  app.post('/api/transfers', requireAuth as RequestHandler, transactionRateLimiter, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { recipientAccount, recipientName, amount, currency, description, transferPin, transferType } = req.body;

      if (!recipientAccount || !recipientName || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const MAX_TRANSFER = 1000000;
      if (numAmount > MAX_TRANSFER) {
        return res.status(400).json({ error: `Transfer amount exceeds maximum limit of $${MAX_TRANSFER}` });
      }

      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.transferPin) return res.status(400).json({ error: 'PIN not set' });

      const pinMatch = await bcrypt.compare(String(transferPin), user.transferPin);
      if (!pinMatch) return res.status(401).json({ error: 'Invalid PIN' });

      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });

      const account = accounts[0];
      const currentBalance = parseFloat(String(account.balance || '0'));
      if (currentBalance < numAmount) return res.status(400).json({ error: 'Insufficient funds' });

      const reference = `TRF${Date.now()}${Math.floor(Math.random() * 10000)}`;

      try {
        const result = await atomicTransfer({
          fromAccountId: String(account.id),
          recipientAccountNumber: String(recipientAccount),
          amount: numAmount,
          transactionType: transferType || 'transfer',
          description: description || `Transfer to ${recipientName}`,
          recipientName,
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error || 'Transfer failed' });
        }

        return res.json({ success: true, reference, amount: numAmount });
      } catch (transferError) {
        return res.status(500).json({ error: transferError instanceof Error ? transferError.message : 'Transfer failed' });
      }
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Transfer failed' });
    }
  }));

  // GET /api/transfers - List user transfers
  app.get('/api/transfers', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);

      const allTxns: Array<{ id: string | number; createdAt: string | Date | null; status: string | null; amount: string | number; type: string; description?: string | null; recipientName?: string | null; referenceNumber?: string | null }> = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        const transfers = txns.filter((t) => {
          const tType = (t as unknown as Record<string, unknown>).type as string | undefined;
          const txType = (t as unknown as Record<string, unknown>).transactionType as string | undefined;
          const typeVal = tType || txType || '';
          return typeVal === 'transfer' || typeVal === 'domestic_transfer' || typeVal === 'international_transfer' || typeVal === 'domestic' || typeVal === 'international';
        });
        allTxns.push(...(transfers as unknown as typeof allTxns));
      }
      allTxns.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns);
    } catch (error: unknown) {
      return res.json([]);
    }
  }));

  // GET /api/transfers/:id/status - Check transfer status
  app.get('/api/transfers/:id/status', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, status, amount, transaction_type, description, recipient_name, reference_number, created_at')
        .eq('id', req.params.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      return res.json(data);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch transfer status' });
    }
  }));

  // POST /api/transfers/international - International transfer
  app.post('/api/transfers/international', requireAuth as RequestHandler, transactionRateLimiter, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { recipientAccount, recipientName, recipientBank, swiftCode, amount, currency, description, transferPin, recipientCountry } = req.body;

      if (!recipientAccount || !recipientName || !recipientBank || !swiftCode || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const MAX_INTERNATIONAL = 500000;
      if (numAmount > MAX_INTERNATIONAL) {
        return res.status(400).json({ error: `International transfer exceeds maximum of $${MAX_INTERNATIONAL}` });
      }

      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.transferPin) return res.status(400).json({ error: 'PIN not set' });

      const pinMatch = await bcrypt.compare(String(transferPin), user.transferPin);
      if (!pinMatch) return res.status(401).json({ error: 'Invalid PIN' });

      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });

      const account = accounts[0];
      const currentBalance = parseFloat(String(account.balance || '0'));
      if (currentBalance < numAmount) return res.status(400).json({ error: 'Insufficient funds' });

      const reference = `INT${Date.now()}${Math.floor(Math.random() * 10000)}`;

      try {
        const result = await atomicTransfer({
          fromAccountId: String(account.id),
          recipientAccountNumber: String(recipientAccount),
          amount: numAmount,
          transactionType: 'international',
          description: description || `International transfer to ${recipientName}`,
          recipientName,
          recipientCountry,
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error || 'Transfer failed' });
        }

        // Update the transaction record with international transfer details
        const adminClient = getAdminClient();
        if (result.transaction) {
          await adminClient.from('transactions').update({
            recipient_name: recipientName,
            recipient_country: recipientCountry,
            bank_name: recipientBank,
            swift_code: swiftCode,
            reference_number: reference,
          }).eq('id', String(result.transaction.id));
        }

        return res.json({ success: true, reference, amount: numAmount });
      } catch (transferError) {
        return res.status(500).json({ error: transferError instanceof Error ? transferError.message : 'Transfer failed' });
      }
    } catch (error: unknown) {
      return res.status(500).json({ error: 'International transfer failed' });
    }
  }));
}
