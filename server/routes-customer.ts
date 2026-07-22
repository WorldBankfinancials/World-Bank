import { Express, Request, Response, RequestHandler } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { storage } from './storage-factory';
import { atomicBalanceUpdate, BankingTransaction } from './transaction-wrapper';
import { cryptoRandomInt } from './crypto-utils';
import { authRateLimiter } from './rate-limiter';

function wrap(handler: (req: AuthenticatedRequest, res: Response) => Promise<any>): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req as AuthenticatedRequest, res as Response)).catch(next);
}

function sanitizeUser(user: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!user) return {};
  const { password, transferPin, transfer_pin, password_hash, idNumber, identification_number, ...safe } = user;
  return safe;
}

export function setupCustomerRoutes(app: Express) {
  app.get('/api/alerts', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const alerts = await storage.getUserAlerts(user.id);
      return res.json(alerts);
    } catch { return res.json([]); }
  }));

  app.patch('/api/alerts/:id/read', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { data: alert, error } = await getAdminClient().from('alerts').select('user_id').eq('id', req.params.id).maybeSingle();
      if (error || !alert) return res.status(404).json({ error: 'Alert not found' });
      if ((alert as Record<string, unknown>).user_id !== user.id) return res.status(403).json({ error: 'Access denied' });
      return res.json(await storage.markAlertAsRead(req.params.id));
    } catch { return res.status(500).json({ error: 'Failed to mark alert as read' }); }
  }));

  app.delete('/api/alerts/:id', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { data: alert, error } = await getAdminClient().from('alerts').select('user_id').eq('id', req.params.id).maybeSingle();
      if (error || !alert) return res.status(404).json({ error: 'Alert not found' });
      if ((alert as Record<string, unknown>).user_id !== user.id) return res.status(403).json({ error: 'Access denied' });
      await storage.deleteAlert(req.params.id); return res.json({ success: true });
    } catch { return res.status(500).json({ error: 'Failed to delete alert' }); }
  }));

  app.get('/api/cards', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      return res.json(await storage.getUserCards(user.id) || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/cards', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const { cardType, cardholderName, dailyLimit, monthlyLimit } = req.body;
      const cardNumber = cryptoRandomInt(9e15, 1e16 - 1).toString();
      const cvv = cryptoRandomInt(100, 999).toString();
      const expiryDate = `${String(cryptoRandomInt(1, 12)).padStart(2, '0')}/${String(new Date().getFullYear() + 4).slice(-2)}`;
      const card = await storage.createCard({
        accountId: String(accounts[0].id), cardType: cardType || 'debit', cardNumber,
        cardholderName: cardholderName || `${user.firstName} ${user.lastName}`,
        expiryDate, cvv, status: 'active', dailyLimit: dailyLimit || 5000,
        monthlyLimit: monthlyLimit || 50000, isContactless: true, pinSet: false,
      } as any);
      const safeCard = sanitizeUser(card as Record<string, unknown>);
      (safeCard as Record<string, unknown>).cardNumber = `**** **** **** ${cardNumber.slice(-4)}`;
      delete (safeCard as Record<string, unknown>).cvv;
      return res.json(safeCard);
    } catch { return res.status(500).json({ error: 'Failed to create card' }); }
  }));

  app.post('/api/cards/lock', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, action } = req.body;
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { data: card, error } = await getAdminClient().from('cards').select('account_id').eq('id', cardId).maybeSingle();
      if (error || !card) return res.status(404).json({ error: 'Card not found' });
      const { data: account } = await getAdminClient().from('accounts').select('user_id').eq('id', (card as Record<string, unknown>).account_id).maybeSingle();
      if (!account || (account as Record<string, unknown>).user_id !== user.id) return res.status(403).json({ error: 'Access denied' });
      const status = action === 'unlock' ? 'active' : 'locked';
      return res.json(await storage.updateCard(cardId, { status } as any));
    } catch { return res.status(500).json({ error: 'Failed to update card' }); }
  }));

  app.post('/api/cards/settings', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, dailyLimit, monthlyLimit, isContactless } = req.body;
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { data: card, error } = await getAdminClient().from('cards').select('account_id').eq('id', cardId).maybeSingle();
      if (error || !card) return res.status(404).json({ error: 'Card not found' });
      const { data: account } = await getAdminClient().from('accounts').select('user_id').eq('id', (card as Record<string, unknown>).account_id).maybeSingle();
      if (!account || (account as Record<string, unknown>).user_id !== user.id) return res.status(403).json({ error: 'Access denied' });
      const updates: Record<string, unknown> = {};
      if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
      if (monthlyLimit !== undefined) updates.monthlyLimit = monthlyLimit;
      if (isContactless !== undefined) updates.isContactless = isContactless;
      return res.json(await storage.updateCard(cardId, updates as any));
    } catch { return res.status(500).json({ error: 'Failed to update card settings' }); }
  }));

  app.get('/api/card-transactions', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const accountIds = accounts.map(a => String(a.id));
      const { data, error } = await getAdminClient().from('transactions')
        .select('*').or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`)
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/wallet-balance', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json({ balance: '0.00' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json({ balance: '0.00' });
      return res.json({ balance: accounts[0].balance, availableBalance: accounts[0].availableBalance || accounts[0].balance });
    } catch { return res.json({ balance: '0.00' }); }
  }));

  app.get('/api/wallet-transactions', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      return res.json(await storage.getAccountTransactions(accounts[0].id, 20) || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/add-funds', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, source } = req.body;
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      if (!Number.isFinite(numAmount)) return res.status(400).json({ error: 'Invalid amount' });
      const MAX_DEPOSIT = 50000;
      if (numAmount > MAX_DEPOSIT) return res.status(400).json({ error: `Deposit exceeds maximum limit of ${MAX_DEPOSIT}` });
      const validSources = ['card', 'bank_transfer', 'wire', 'external'];
      const safeSource = validSources.includes(source) ? source : 'external';
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const tx = new BankingTransaction();
      tx.addStep({
        name: 'Credit account',
        execute: async () => {
          const result = await atomicBalanceUpdate(String(accounts[0].id), numAmount, `Add funds from ${safeSource}`);
          if (!result.success) throw new Error(result.error || 'Failed to add funds');
          return result;
        },
        rollback: async () => {
          await atomicBalanceUpdate(String(accounts[0].id), -numAmount, `Rollback: Add funds`);
        }
      });
      tx.addStep({
        name: 'Create deposit transaction record',
        execute: async () => {
          return await storage.createTransaction({
            fromAccountId: null, toAccountId: String(accounts[0].id), amount: numAmount,
            transactionType: 'deposit', description: `Add funds from ${safeSource}`, status: 'completed',
          } as any);
        }
      });
      const result = await tx.execute();
      if (!result.success) return res.status(400).json({ error: result.error || 'Failed to add funds' });
      return res.json({ success: true, newBalance: (result.data as Record<string, unknown>)?.newBalance });
    } catch { return res.status(500).json({ error: 'Failed to add funds' }); }
  }));

  app.get('/api/payment-requests', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const { data, error } = await getAdminClient().from('payment_requests')
        .select('*').eq('requested_user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/payment-requests', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { requestedUserEmail, amount, description } = req.body;
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      if (numAmount > 100000) return res.status(400).json({ error: 'Payment request exceeds maximum limit' });
      if (!requestedUserEmail) return res.status(400).json({ error: 'Recipient email required' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const requester = await storage.getUserByEmail(requestedUserEmail);
      if (!requester) return res.status(404).json({ error: 'Recipient not found' });
      if (requester.id === user.id) return res.status(400).json({ error: 'Cannot request payment from yourself' });
      const { data, error } = await getAdminClient().from('payment_requests').insert({
        requester_id: user.id, requested_user_id: requester.id,
        amount: numAmount, description: description || 'Payment request', status: 'pending',
      }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to create payment request' }); }
  }));

  app.post('/api/support-tickets', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { subject, description, priority } = req.body;
      const ticketNumber = `TKT${Date.now()}${cryptoRandomInt(0, 9999)}`;
      const ticket = await storage.createSupportTicket({
        userId: user.id, ticketNumber, subject, description,
        priority: priority || 'medium', status: 'open',
      } as any);
      return res.json(ticket);
    } catch { return res.status(500).json({ error: 'Failed to create support ticket' }); }
  }));

  app.get('/api/branches', wrap(async (req: Request, res: Response) => {
    try { return res.json((await storage.getBranches()) || []); } catch { return res.json([]); }
  }));

  app.get('/api/atms', wrap(async (req: Request, res: Response) => {
    try { return res.json((await storage.getAtms()) || []); } catch { return res.json([]); }
  }));

  app.get('/api/statements', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      return res.json((await storage.getStatementsByUserId(user.id)) || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/transactions/export', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const allTxns: any[] = [];
      for (const account of accounts) {
        const txns = await storage.getAccountTransactions(account.id);
        allTxns.push(...txns);
      }
      const csv = ['Date,Type,Amount,Description,Status,Reference'];
      for (const t of allTxns) {
        const row = t as any;
        csv.push([row.created_at || '', row.transaction_type || '', row.amount || '', `"${row.description || ''}"`, row.status || '', row.reference_number || ''].join(','));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv.join('\n'));
    } catch { return res.status(500).json({ error: 'Failed to export transactions' }); }
  }));

  app.get('/api/investments', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      return res.json((await storage.getUserInvestments(user.id)) || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/investments/buy', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { symbol, quantity } = req.body;
      const numQty = parseFloat(String(quantity));
      if (isNaN(numQty) || numQty <= 0) return res.status(400).json({ error: 'Invalid quantity' });
      if (!symbol || typeof symbol !== 'string') return res.status(400).json({ error: 'Symbol required' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const { data: marketData } = await getAdminClient().from('market_rates')
        .select('price').eq('symbol', symbol.toUpperCase()).maybeSingle();
      if (!marketData) return res.status(400).json({ error: 'Market price unavailable for this symbol' });
      const serverPrice = parseFloat(String((marketData as Record<string, unknown>).price));
      if (isNaN(serverPrice) || serverPrice <= 0) return res.status(400).json({ error: 'Invalid market price' });
      const totalCost = numQty * serverPrice;
      const tx = new BankingTransaction();
      tx.addStep({
        name: 'Debit account for investment',
        execute: async () => {
          const result = await atomicBalanceUpdate(String(accounts[0].id), -totalCost, `Investment buy: ${symbol}`);
          if (!result.success) throw new Error(result.error || 'Insufficient funds');
          return result;
        },
        rollback: async () => { await atomicBalanceUpdate(String(accounts[0].id), totalCost, 'Rollback: Investment buy'); }
      });
      tx.addStep({
        name: 'Create investment record',
        execute: async () => {
          return await storage.createInvestment({
            userId: user.id, symbol: symbol.toUpperCase(), quantity: numQty,
            buyPrice: serverPrice, status: 'active',
          } as any);
        }
      });
      tx.addStep({
        name: 'Create transaction record',
        execute: async () => {
          return await storage.createTransaction({
            fromAccountId: String(accounts[0].id), toAccountId: null, amount: totalCost,
            transactionType: 'investment_buy', description: `Investment buy: ${numQty} ${symbol.toUpperCase()} @ ${serverPrice}`, status: 'completed',
          } as any);
        }
      });
      const result = await tx.execute();
      if (!result.success) return res.status(400).json({ error: result.error || 'Failed to buy investment' });
      return res.json(result.data);
    } catch { return res.status(500).json({ error: 'Failed to buy investment' }); }
  }));

  app.post('/api/investments/sell', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { investmentId, quantity } = req.body;
      const sellQuantity = parseFloat(String(quantity));
      if (isNaN(sellQuantity) || sellQuantity <= 0) return res.status(400).json({ error: 'Invalid quantity' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const investments = await storage.getUserInvestments(user.id);
      const investment = (investments as any[])?.find(inv => String(inv.id) === String(investmentId));
      if (!investment) return res.status(404).json({ error: 'Investment not found' });
      if (investment.status !== 'active' && investment.status !== 'pending') return res.status(400).json({ error: 'Investment not active' });
      const ownedQuantity = parseFloat(String(investment.quantity || investment.shares || 0));
      if (sellQuantity > ownedQuantity) return res.status(400).json({ error: 'Cannot sell more shares than owned' });
      const { data: marketData } = await getAdminClient().from('market_rates')
        .select('price').eq('symbol', String(investment.symbol || '').toUpperCase()).maybeSingle();
      if (!marketData) return res.status(400).json({ error: 'Market price unavailable' });
      const serverPrice = parseFloat(String((marketData as Record<string, unknown>).price));
      if (isNaN(serverPrice) || serverPrice <= 0) return res.status(400).json({ error: 'Invalid market price' });
      const totalValue = sellQuantity * serverPrice;
      const tx = new BankingTransaction();
      tx.addStep({
        name: 'Credit account for investment sale',
        execute: async () => {
          const result = await atomicBalanceUpdate(String(accounts[0].id), totalValue, `Investment sell: ${investment.symbol}`);
          if (!result.success) throw new Error(result.error || 'Failed to credit account');
          return result;
        },
        rollback: async () => { await atomicBalanceUpdate(String(accounts[0].id), -totalValue, 'Rollback: Investment sell'); }
      });
      tx.addStep({
        name: 'Update investment record',
        execute: async () => {
          if (sellQuantity >= ownedQuantity) {
            return await storage.updateInvestment(investmentId, { status: 'sold', quantity: 0 } as any);
          } else {
            return await storage.updateInvestment(investmentId, { quantity: ownedQuantity - sellQuantity } as any);
          }
        }
      });
      tx.addStep({
        name: 'Create transaction record',
        execute: async () => {
          return await storage.createTransaction({
            fromAccountId: null, toAccountId: String(accounts[0].id), amount: totalValue,
            transactionType: 'investment_sell', description: `Investment sell: ${sellQuantity} shares of ${investment.symbol || 'investment'} @ ${serverPrice}`, status: 'completed',
          } as any);
        }
      });
      const result = await tx.execute();
      if (!result.success) return res.status(400).json({ error: result.error || 'Failed to sell investment' });
      return res.json({ success: true, proceeds: totalValue, pricePerShare: serverPrice });
    } catch { return res.status(500).json({ error: 'Failed to sell investment' }); }
  }));

  app.get('/api/market-rates', wrap(async (req: Request, res: Response) => {
    try { return res.json((await storage.getMarketRates()) || []); } catch { return res.json([]); }
  }));

  app.get('/api/loans', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const { data, error } = await getAdminClient().from('loans')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/loans/apply', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { loanType, amount, term, purpose } = req.body;
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { data, error } = await getAdminClient().from('loans').insert({
        user_id: user.id, loan_type: loanType || 'personal', amount: parseFloat(String(amount)),
        term_months: parseInt(String(term || '12')), purpose: purpose || 'Personal loan',
        interest_rate: 8.5, status: 'pending',
      }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to apply for loan' }); }
  }));

  app.post('/api/loans/:id/approve', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await getAdminClient().from('loans')
        .update({ status: 'approved', approved_by: req.user?.id, approved_at: new Date().toISOString() })
        .eq('id', req.params.id).eq('status', 'pending').select().single();
      if (error || !data) return res.status(409).json({ error: 'Loan was already processed' });
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to approve loan' }); }
  }));

  app.post('/api/loans/:id/reject', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await getAdminClient().from('loans')
        .update({ status: 'rejected' }).eq('id', req.params.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to reject loan' }); }
  }));

  app.get('/api/admin/pending-loans', requireAdmin, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await getAdminClient().from('loans')
        .select('*, users(email, first_name, last_name)').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/mobile-pay/merchants', wrap(async (req: Request, res: Response) => {
    try {
      const { data, error } = await getAdminClient().from('merchants')
        .select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/mobile-payments', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const { data, error } = await getAdminClient().from('transactions')
        .select('*').eq('from_account_id', accounts[0].id)
        .eq('transaction_type', 'mobile_payment').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/kyc/status', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { data, error } = await getAdminClient().from('kyc')
        .select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return res.json(data || { status: user.kycStatus || 'pending' });
    } catch { return res.json({ status: 'pending' }); }
  }));

  app.post('/api/kyc/submit', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { documentType, documentNumber, fullName, dateOfBirth, nationality, address } = req.body;
      const { data, error } = await getAdminClient().from('kyc').insert({
        user_id: user.id, document_type: documentType, document_number: documentNumber,
        full_name: fullName || `${user.firstName} ${user.lastName}`, date_of_birth: dateOfBirth,
        nationality: nationality || 'US', address, status: 'pending', submitted_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      await storage.updateUser(user.id, { kycStatus: 'pending' } as any);
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to submit KYC' }); }
  }));

  app.post('/api/chat/send', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message content required' });
      }
      if (message.length > 5000) return res.status(400).json({ error: 'Message too long' });
      const convId = `conv-${user.id}`;
      const msg = await storage.createMessage({
        senderId: user.id, senderName: `${user.firstName} ${user.lastName}`,
        senderRole: 'customer', conversationId: convId, message: message.trim(), isRead: false,
      } as any);
      return res.json(msg);
    } catch { return res.status(500).json({ error: 'Failed to send message' }); }
  }));

  app.get('/api/chat/history', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      return res.json((await storage.getMessages(`conv-${user.id}`)) || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/chat/history/:sessionId', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const sessionId = req.params.sessionId;
      if (req.user?.role !== 'admin' && sessionId !== `conv-${user.id}`) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return res.json((await storage.getMessages(sessionId)) || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/chat/sessions', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.role === 'admin') {
        const { data, error } = await getAdminClient().from('messages')
          .select('conversation_id, sender_id, sender_name, sender_role, message, is_read, created_at')
          .order('created_at', { ascending: false }).limit(500);
        if (error) throw error;
        const sessionMap = new Map<string, any>();
        for (const msg of (data || []) as any[]) {
          if (!msg.conversation_id) continue;
          if (!sessionMap.has(msg.conversation_id)) {
            sessionMap.set(msg.conversation_id, {
              id: msg.conversation_id,
              customerName: msg.sender_role === 'customer' ? msg.sender_name : 'Unknown',
              customerId: msg.sender_role === 'customer' ? msg.sender_id : null,
              lastMessage: msg.message, lastMessageAt: msg.created_at,
              unreadCount: msg.sender_role === 'customer' && !msg.is_read ? 1 : 0,
            });
          } else {
            const s = sessionMap.get(msg.conversation_id);
            if (msg.sender_role === 'customer' && !msg.is_read) s.unreadCount++;
          }
        }
        return res.json(Array.from(sessionMap.values()));
      }
      return res.json([]);
    } catch { return res.json([]); }
  }));

  app.get('/api/exchange-rates/changes', wrap(async (req: Request, res: Response) => {
    try {
      const { data, error } = await getAdminClient().from('forex')
        .select('*').order('updated_at', { ascending: false }).limit(20);
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.get('/api/currencies', wrap(async (req: Request, res: Response) => {
    try {
      const { data, error } = await getAdminClient().from('forex')
        .select('currency_code, currency_name').order('currency_code');
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/currency-exchange', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      if (!fromCurrency || !toCurrency) return res.status(400).json({ error: 'Source and target currency required' });
      if (fromCurrency === toCurrency) return res.status(400).json({ error: 'Cannot exchange to the same currency' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const { data: rateData } = await getAdminClient().from('forex')
        .select('rate, currency_code').eq('currency_code', toCurrency).maybeSingle();
      const exchangeRate = rateData ? parseFloat(String((rateData as any).rate || '1')) : 1;
      const converted = numAmount * exchangeRate;
      const tx = new BankingTransaction();
      tx.addStep({
        name: 'Debit source currency',
        execute: async () => {
          const result = await atomicBalanceUpdate(String(accounts[0].id), -numAmount, `Currency exchange: ${fromCurrency} to ${toCurrency}`);
          if (!result.success) throw new Error(result.error || 'Insufficient funds');
          return result;
        },
        rollback: async () => {
          await atomicBalanceUpdate(String(accounts[0].id), numAmount, `Rollback: Currency exchange debit`);
        }
      });
      tx.addStep({
        name: 'Credit converted currency',
        execute: async () => {
          const result = await atomicBalanceUpdate(String(accounts[0].id), converted, `Currency exchange credit: ${toCurrency}`);
          if (!result.success) throw new Error(result.error || 'Failed to credit converted amount');
          return result;
        },
        rollback: async () => {
          await atomicBalanceUpdate(String(accounts[0].id), -converted, `Rollback: Currency exchange credit`);
        }
      });
      tx.addStep({
        name: 'Create exchange transaction record',
        execute: async () => {
          return await storage.createTransaction({
            fromAccountId: String(accounts[0].id), toAccountId: String(accounts[0].id), amount: numAmount,
            transactionType: 'currency_exchange', description: `Currency exchange: ${numAmount} ${fromCurrency} to ${converted.toFixed(2)} ${toCurrency}`, status: 'completed',
          } as any);
        }
      });
      const result = await tx.execute();
      if (!result.success) return res.status(400).json({ error: result.error || 'Currency exchange failed' });
      return res.json({ success: true, fromAmount: numAmount, toAmount: converted, rate: exchangeRate, fromCurrency, toCurrency, newBalance: (result.data as Record<string, unknown>)?.newBalance });
    } catch { return res.status(500).json({ error: 'Failed to exchange currency' }); }
  }));

  app.get('/api/user/preferences', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json({});
      return res.json((user as any).notificationPreferences || {});
    } catch { return res.json({}); }
  }));

  app.patch('/api/user/preferences', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const updated = await storage.updateUser(user.id, { notificationPreferences: req.body } as any);
      return res.json(sanitizeUser(updated as any));
    } catch { return res.status(500).json({ error: 'Failed to update preferences' }); }
  }));

  app.post('/api/auth/logout', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const token = req.headers.authorization?.slice(7) || '';
      if (token) await getAdminClient().auth.signOut(token);
      return res.json({ success: true });
    } catch { return res.json({ success: true }); }
  }));

  app.post('/api/auth/check-email', authRateLimiter, wrap(async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const existing = await storage.getUserByEmail(email);
      return res.json({ available: !existing });
    } catch { return res.status(500).json({ error: 'Failed to check email' }); }
  }));

  app.put('/api/user', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { firstName, lastName, phone, address, city, country, postalCode } = req.body;
      const updates: Record<string, unknown> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (address !== undefined) updates.address = address;
      if (city !== undefined) updates.city = city;
      if (country !== undefined) updates.country = country;
      if (postalCode !== undefined) updates.postalCode = postalCode;
      const updated = await storage.updateUser(user.id, updates as any);
      return res.json(sanitizeUser(updated as any));
    } catch { return res.status(500).json({ error: 'Failed to update profile' }); }
  }));
}
