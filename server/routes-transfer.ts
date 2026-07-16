import { Express, Request, Response, RequestHandler } from 'express';
import { storage } from './storage-factory';
import { requireAuth, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { transactionRateLimiter } from './rate-limiter';
import { supabase } from './supabase-public-storage';
import { atomicTransfer, atomicBalanceUpdate } from './transaction-wrapper';
import * as bcrypt from 'bcryptjs';

// Wrap async handlers to catch rejected promises and satisfy Express's RequestHandler type
function wrap(
  handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as AuthenticatedRequest, res as Response)).catch(next);
  };
}

export function setupTransferRoutes(app: Express) {
  // POST /api/transfers - Create a transfer
  app.post('/api/transfers', requireAuth as RequestHandler, transactionRateLimiter, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { recipientAccount, recipientName, amount, currency, description, transferPin, transferType } = req.body;
      
      // Validation
      if (!recipientAccount || !recipientName || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      // Max transfer limit validation
      const MAX_TRANSFER = 1000000;
      if (numAmount > MAX_TRANSFER) {
        return res.status(400).json({ error: `Transfer amount exceeds maximum limit of $${MAX_TRANSFER}` });
      }
      
      // Verify PIN
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.transferPin) return res.status(400).json({ error: 'PIN not set' });
      
      const pinMatch = await bcrypt.compare(String(transferPin), user.transferPin);
      if (!pinMatch) return res.status(401).json({ error: 'Invalid PIN' });
      
      // Check balance
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      
      const account = accounts[0];
      const currentBalance = parseFloat(String(account.balance || '0'));
      if (currentBalance < numAmount) return res.status(400).json({ error: 'Insufficient funds' });
      
      // Execute transfer
      const reference = `TRF${Date.now()}${Math.floor(Math.random() * 10000)}`;
      
      try {
        await atomicTransfer({
          fromAccountId: String(account.id),
          toAccountId: String(recipientAccount),
          amount: numAmount,
          transactionType: 'transfer',
          description: description || `Transfer to ${recipientName}`,
          recipientName,
          currency: currency || 'USD',
          referenceNumber: reference,
        });
        
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
          return typeVal === 'transfer' || typeVal === 'domestic_transfer' || typeVal === 'international_transfer';
        });
        allTxns.push(...(transfers as unknown as typeof allTxns));
      }
      allTxns.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to load transfers' });
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
        await atomicTransfer({
          fromAccountId: String(account.id),
          toAccountId: String(recipientAccount),
          amount: numAmount,
          transactionType: 'international_transfer',
          description: description || `International transfer to ${recipientName}`,
          recipientName,
          recipientCountry,
          currency: currency || 'USD',
          referenceNumber: reference,
        });
        
        return res.json({ success: true, reference, amount: numAmount });
      } catch (transferError) {
        return res.status(500).json({ error: transferError instanceof Error ? transferError.message : 'Transfer failed' });
      }
    } catch (error: unknown) {
      return res.status(500).json({ error: 'International transfer failed' });
    }
  }));
}
