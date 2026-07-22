import { Express, Request, Response, RequestHandler } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { storage } from './storage-factory';
import { atomicBalanceUpdate } from './transaction-wrapper';
import { cryptoRandomInt } from './crypto-utils';

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
      return res.json(card);
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
        .select('*').in('from_account_id', accountIds)
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
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const result = await atomicBalanceUpdate(String(accounts[0].id), numAmount, `Add funds from ${source || 'external'}`);
      if (!result.success) return res.status(400).json({ error: result.error });
      await storage.createTransaction({
        fromAccountId: null, toAccountId: String(accounts[0].id), amount: numAmount,
        transactionType: 'deposit', description: `Add funds from ${source || 'external source'}`, status: 'completed',
      } as any);
      return res.json({ success: true, newBalance: result.newBalance });
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
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const requester = await storage.getUserByEmail(requestedUserEmail);
      if (!requester) return res.status(404).json({ error: 'Recipient not found' });
      const { data, error } = await getAdminClient().from('payment_requests').insert({
        requester_id: user.id, requested_user_id: requester.id,
        amount: parseFloat(String(amount)), description: description || 'Payment request', status: 'pending',
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
      const { symbol, quantity, price } = req.body;
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const totalCost = parseFloat(String(quantity)) * parseFloat(String(price));
      const balanceResult = await atomicBalanceUpdate(String(accounts[0].id), -totalCost, `Investment buy: ${symbol}`);
      if (!balanceResult.success) return res.status(400).json({ error: balanceResult.error });
      const investment = await storage.createInvestment({
        userId: user.id, symbol, quantity: parseFloat(String(quantity)),
        buyPrice: parseFloat(String(price)), status: 'active',
      } as any);
      await storage.createTransaction({
        fromAccountId: String(accounts[0].id), toAccountId: null, amount: totalCost,
        transactionType: 'investment_buy', description: `Investment buy: ${quantity} ${symbol}`, status: 'completed',
      } as any);
      return res.json(investment);
    } catch { return res.status(500).json({ error: 'Failed to buy investment' }); }
  }));

  app.post('/api/investments/sell', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { investmentId, quantity, price } = req.body;
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const investments = await storage.getUserInvestments(user.id);
      const investment = (investments as any[])?.find(inv => String(inv.id) === String(investmentId));
      if (!investment) return res.status(404).json({ error: 'Investment not found' });
      if (investment.status !== 'active' && investment.status !== 'pending') return res.status(400).json({ error: 'Investment not active' });
      const ownedQuantity = parseFloat(String(investment.quantity || investment.shares || 0));
      const sellQuantity = parseFloat(String(quantity));
      if (isNaN(sellQuantity) || sellQuantity <= 0) return res.status(400).json({ error: 'Invalid quantity' });
      if (sellQuantity > ownedQuantity) return res.status(400).json({ error: 'Cannot sell more shares than owned' });
      const totalValue = sellQuantity * parseFloat(String(price));
      await atomicBalanceUpdate(String(accounts[0].id), totalValue, `Investment sell`);
      if (sellQuantity >= ownedQuantity) {
        await storage.updateInvestment(investmentId, { status: 'sold', quantity: 0 } as any);
      } else {
        await storage.updateInvestment(investmentId, { quantity: ownedQuantity - sellQuantity } as any);
      }
      await storage.createTransaction({
        fromAccountId: null, toAccountId: String(accounts[0].id), amount: totalValue,
        transactionType: 'investment_sell', description: `Investment sell: ${quantity} shares of ${investment.symbol || 'investment'}`, status: 'completed',
      } as any);
      return res.json({ success: true, proceeds: totalValue });
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
        .eq('id', req.params.id).select().single();
      if (error) throw error;
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
      const { message, conversationId } = req.body;
      const convId = conversationId || `conv-${user.id}`;
      const msg = await storage.createMessage({
        senderId: user.id, senderName: `${user.firstName} ${user.lastName}`,
        senderRole: 'customer', conversationId: convId, message, isRead: false,
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
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const { data: rateData } = await getAdminClient().from('forex')
        .select('rate, currency_code').eq('currency_code', toCurrency).maybeSingle();
      const exchangeRate = rateData ? parseFloat(String((rateData as any).rate || '1')) : 1;
      const converted = numAmount * exchangeRate;
      const debitResult = await atomicBalanceUpdate(String(accounts[0].id), -numAmount, `Currency exchange: ${fromCurrency} to ${toCurrency}`);
      if (!debitResult.success) return res.status(400).json({ error: debitResult.error || 'Insufficient funds' });
      await atomicBalanceUpdate(String(accounts[0].id), converted, `Currency exchange credit: ${toCurrency}`);
      await storage.createTransaction({
        fromAccountId: String(accounts[0].id), toAccountId: String(accounts[0].id), amount: numAmount,
        transactionType: 'currency_exchange', description: `Currency exchange: ${numAmount} ${fromCurrency} to ${converted.toFixed(2)} ${toCurrency}`, status: 'completed',
      } as any);
      return res.json({ success: true, fromAmount: numAmount, toAmount: converted, rate: exchangeRate, fromCurrency, toCurrency, newBalance: debitResult.newBalance });
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

  app.post('/api/auth/check-email', wrap(async (req: Request, res: Response) => {
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
