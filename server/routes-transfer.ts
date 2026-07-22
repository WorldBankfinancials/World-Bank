import { Express, Request, Response, RequestHandler } from 'express';
import { storage } from './storage-factory';
import { requireAuth, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { transactionRateLimiter } from './rate-limiter';
import { atomicTransfer } from './transaction-wrapper';
import { generateReferenceNumber } from './crypto-utils';
import * as bcrypt from 'bcryptjs';

function wrap(
  handler: (req: AuthenticatedRequest, res: Response) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as AuthenticatedRequest, res as Response)).catch(next);
  };
}

export function setupTransferRoutes(app: Express) {
  app.post('/api/transfers', requireAuth as RequestHandler, transactionRateLimiter, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { recipientAccount, recipientName, amount, currency, description, transferPin, transferType } = req.body;
      if (!recipientAccount || !recipientName || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      if (!Number.isFinite(numAmount)) return res.status(400).json({ error: 'Invalid amount' });
      const MAX_TRANSFER = 1000000;
      if (numAmount > MAX_TRANSFER) return res.status(400).json({ error: `Transfer amount exceeds maximum limit of ${MAX_TRANSFER}` });
      const allowedTransferTypes = ['transfer', 'domestic', 'international'];
      const safeTransferType = allowedTransferTypes.includes(transferType) ? transferType : 'transfer';
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
      const reference = generateReferenceNumber();
      try {
        const result = await atomicTransfer({
          fromAccountId: String(account.id), fromUserId: String(user.id),
          recipientAccountNumber: String(recipientAccount), amount: numAmount,
          transactionType: safeTransferType, description: description || `Transfer to ${recipientName}`,
          recipientName, currency: currency || 'USD', referenceNumber: reference,
        });
        if (!result.success) return res.status(400).json({ error: result.error || 'Transfer failed' });
        return res.json({ success: true, reference, amount: numAmount, isExternal: result.isExternal,
          message: result.isExternal ? 'External transfer initiated. Funds will arrive in 1-3 business days.' : 'Transfer completed successfully' });
      } catch (transferError) {
        return res.status(500).json({ error: transferError instanceof Error ? transferError.message : 'Transfer failed' });
      }
    } catch { return res.status(500).json({ error: 'Transfer failed' }); }
  }));

  app.get('/api/transfers', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Array<Record<string, unknown>> = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        const transfers = txns.filter((t) => {
          const row = t as unknown as Record<string, unknown>;
          const typeVal = (row.transaction_type || row.type || '') as string;
          return typeVal === 'transfer' || typeVal === 'domestic_transfer' || typeVal === 'international_transfer' || typeVal === 'domestic' || typeVal === 'international';
        });
        allTxns.push(...(transfers as unknown as Array<Record<string, unknown>>));
      }
      allTxns.sort((a, b) => new Date((b.created_at || b.createdAt || 0) as string).getTime() - new Date((a.created_at || a.createdAt || 0) as string).getTime());
      return res.json(allTxns);
    } catch { return res.json([]); }
  }));

  app.get('/api/transfers/:id/status', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const accountIds = accounts.map(a => String(a.id));
      const { data, error } = await getAdminClient().from('transactions')
        .select('id, status, amount, transaction_type, description, recipient_name, reference_number, created_at, from_account_id, to_account_id')
        .eq('id', req.params.id).maybeSingle();
      if (error || !data) return res.status(404).json({ error: 'Transfer not found' });
      const txn = data as Record<string, unknown>;
      const fromAccId = txn.from_account_id ? String(txn.from_account_id) : null;
      const toAccId = txn.to_account_id ? String(txn.to_account_id) : null;
      const isOwner = (fromAccId && accountIds.includes(fromAccId)) || (toAccId && accountIds.includes(toAccId));
      if (!isOwner && req.user?.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to fetch transfer status' }); }
  }));

  app.post('/api/transfers/international', requireAuth as RequestHandler, transactionRateLimiter, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { recipientAccount, recipientName, recipientBank, swiftCode, amount, currency, description, transferPin, recipientCountry } = req.body;
      if (!recipientAccount || !recipientName || !recipientBank || !swiftCode || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      const MAX_INTERNATIONAL = 500000;
      if (numAmount > MAX_INTERNATIONAL) return res.status(400).json({ error: `International transfer exceeds maximum of $${MAX_INTERNATIONAL}` });
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
      const reference = generateReferenceNumber();
      try {
        const result = await atomicTransfer({
          fromAccountId: String(account.id), fromUserId: String(user.id),
          recipientAccountNumber: String(recipientAccount), amount: numAmount,
          transactionType: 'international', description: description || `International transfer to ${recipientName}`,
          recipientName, recipientCountry, currency: currency || 'USD', referenceNumber: reference,
          bankName: recipientBank, swiftCode,
        });
        if (!result.success) return res.status(400).json({ error: result.error || 'Transfer failed' });
        return res.json({ success: true, reference, amount: numAmount, isExternal: result.isExternal,
          message: result.isExternal ? 'International transfer initiated. Funds will arrive in 3-5 business days via SWIFT.' : 'Transfer completed successfully' });
      } catch (transferError) {
        return res.status(500).json({ error: transferError instanceof Error ? transferError.message : 'Transfer failed' });
      }
    } catch { return res.status(500).json({ error: 'International transfer failed' }); }
  }));
}
