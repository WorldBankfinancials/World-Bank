      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/transactions', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, userId, amount, type, description } = req.body;
      if (!accountId || !amount || !type) return res.status(400).json({ error: 'Missing required fields' });
      const reference = `ADM${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('transactions').insert({ from_account_id: accountId, to_account_id: null, from_user_id: userId || req.user?.id || '' as string, amount: Number(amount).toFixed(2), transaction_type: type, category: 'admin', status: 'completed', description: description || 'Admin transaction', reference_number: reference, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/savings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('savings').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/savings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountType, initialDeposit, goalName, targetAmount } = req.body;
      const supabaseClient = getAdminClient();
      const deposit = parseFloat(String(initialDeposit || '0'));
      if (isNaN(deposit) || deposit < 0) return res.status(400).json({ error: 'Invalid deposit amount' });
      if (deposit > 0) { const { data: userAccount } = await supabaseClient.from('accounts').select('balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single(); if (!userAccount) return res.status(404).json({ error: 'Account not found' }); const currentBalance = parseFloat(String((userAccount as Record<string, unknown>).balance || '0')); if (currentBalance < deposit) return res.status(400).json({ error: 'Insufficient funds for initial deposit' }); const newBalance = (currentBalance - deposit).toFixed(2); await supabaseClient.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', req.user?.id || '' as string).eq('status', 'active'); }
      const savingsNumber = `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabaseClient.from('savings').insert({ user_id: req.user?.id || '' as string, account_number: savingsNumber, account_type: accountType || 'savings', balance: deposit.toFixed(2), goal_name: goalName || null, target_amount: targetAmount || null, interest_rate: '2.50', status: 'active' }).select().single();
      if (error) throw error;
      if (deposit > 0) { await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: req.user?.id || '' as string, amount: deposit.toFixed(2), currency: 'USD', transaction_type: 'savings_deposit', category: 'savings', status: 'completed', description: `Initial deposit to savings account ${savingsNumber}`, reference_number: `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() }); }
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/savings/deposit', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { savingsId, amount } = req.body;
      if (!savingsId || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
      const supabaseClient = getAdminClient();
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -numAmount, 'Deposit to savings account');
      if (!balanceResult.success) { return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' }); }
      const { data: savings } = await supabaseClient.from('savings').select('balance').eq('id', savingsId).eq('user_id', req.user?.id || '' as string).single();
      if (!savings) return res.status(404).json({ error: 'Savings account not found' });
      const newSavingsBalance = (parseFloat(String((savings as Record<string, unknown>).balance || '0')) + numAmount).toFixed(2);
      await supabaseClient.from('savings').update({ balance: newSavingsBalance, updated_at: new Date().toISOString() }).eq('id', savingsId);
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: 'USD', transaction_type: 'savings_deposit', category: 'savings', status: 'completed', description: `Deposit to savings account`, reference_number: `SAV${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, newSavingsBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/savings/withdraw', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { savingsId, amount } = req.body;
      if (!savingsId || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
      const supabaseClient = getAdminClient();
      const { data: savings } = await supabaseClient.from('savings').select('balance').eq('id', savingsId).eq('user_id', req.user?.id || '' as string).single();
      if (!savings) return res.status(404).json({ error: 'Savings account not found' });
      const savingsBalance = parseFloat(String((savings as Record<string, unknown>).balance || '0'));
      if (savingsBalance < numAmount) return res.status(400).json({ error: 'Insufficient savings balance' });
      const newSavingsBalance = (savingsBalance - numAmount).toFixed(2);
      const { data: updatedSavings, error: savingsUpdateError } = await supabaseClient.from('savings').update({ balance: newSavingsBalance, updated_at: new Date().toISOString() }).eq('id', savingsId).eq('balance', savingsBalance).select().single();
      if (savingsUpdateError || !updatedSavings) { return res.status(409).json({ error: 'Savings balance was modified by another transaction. Please try again.' }); }
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (userAccount) {
        const accountId = (userAccount as Record<string, unknown>).id as string;
        await atomicBalanceUpdate(accountId, numAmount, 'Withdrawal from savings account');
      }
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: 'USD', transaction_type: 'savings_withdrawal', category: 'savings', status: 'completed', description: `Withdrawal from savings account`, reference_number: `SAW${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, newSavingsBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/investments/buy', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { symbol, assetType, shares, price } = req.body;
      if (!symbol || !shares || !price) return res.status(400).json({ error: 'Missing required fields' });
      const sanitizedSymbol = sanitizeInput(String(symbol));
      const numShares = parseFloat(String(shares));
      const numPrice = parseFloat(String(price));
      if (isNaN(numShares) || numShares <= 0) return res.status(400).json({ error: 'Invalid shares amount' });
      if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ error: 'Invalid price' });
      const totalCost = numShares * numPrice;
      const supabaseClient = getAdminClient();
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -totalCost, `Bought ${numShares} shares of ${sanitizedSymbol} at ${numPrice.toFixed(2)}`);
      if (!balanceResult.success) { return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' }); }
      const newBalance = balanceResult.newBalance || '0';
      const { data: existing } = await supabaseClient.from('investments').select('id, shares, average_price').eq('user_id', req.user?.id || '' as string).eq('symbol', sanitizedSymbol).limit(1);
      if (existing && existing.length > 0) { const existingShares = parseFloat(String((existing[0] as Record<string, unknown>).shares || '0')); const existingAvg = parseFloat(String((existing[0] as Record<string, unknown>).average_price || '0')); const newTotalShares = existingShares + numShares; const newAvgPrice = ((existingAvg * existingShares) + (numPrice * numShares)) / newTotalShares; await supabaseClient.from('investments').update({ shares: newTotalShares.toString(), average_price: newAvgPrice.toFixed(2), current_price: numPrice.toFixed(2), updated_at: new Date().toISOString() }).eq('id', String((existing[0] as Record<string, unknown>).id)); } else { await supabaseClient.from('investments').insert({ user_id: req.user?.id || '' as string, symbol: sanitizedSymbol, asset_type: assetType || 'stock', shares: numShares.toString(), average_price: numPrice.toFixed(2), current_price: numPrice.toFixed(2), status: 'active' }); }
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, amount: totalCost.toFixed(2), currency: 'USD', transaction_type: 'investment_buy', category: 'investment', status: 'completed', description: `Bought ${numShares} shares of ${sanitizedSymbol} at ${numPrice.toFixed(2)}`, reference_number: `INV${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, totalCost: totalCost.toFixed(2), newBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/investments/sell', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { investmentId, shares, price } = req.body;
      if (!investmentId || !shares || !price) return res.status(400).json({ error: 'Missing required fields' });
      const numShares = parseFloat(String(shares));
      const numPrice = parseFloat(String(price));
      if (isNaN(numShares) || numShares <= 0) return res.status(400).json({ error: 'Invalid shares amount' });
      if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ error: 'Invalid price' });
      const totalProceeds = numShares * numPrice;
      const supabaseClient = getAdminClient();
      const { data: investment } = await supabaseClient.from('investments').select('id, shares, average_price, symbol').eq('id', investmentId).eq('user_id', req.user?.id || '' as string).single();
      if (!investment) return res.status(404).json({ error: 'Investment not found' });
      const heldShares = parseFloat(String((investment as Record<string, unknown>).shares || '0'));
      if (heldShares < numShares) return res.status(400).json({ error: 'Insufficient shares' });
      const remainingShares = heldShares - numShares;
      const newSharesValue = remainingShares > 0 ? remainingShares.toString() : '0';
      const newStatus = remainingShares > 0 ? undefined : 'sold';
      const updatePayload: Record<string, unknown> = { shares: newSharesValue, current_price: numPrice.toFixed(2), updated_at: new Date().toISOString() };
      if (newStatus) updatePayload.status = newStatus;
      const { data: updatedInvestment, error: investmentUpdateError } = await supabaseClient.from('investments').update(updatePayload).eq('id', investmentId).eq('shares', heldShares).select().single();
      if (investmentUpdateError || !updatedInvestment) { return res.status(409).json({ error: 'Investment shares were modified by another transaction. Please try again.' }); }
      const { data: userAccount } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (userAccount) {
        const accountId = (userAccount as Record<string, unknown>).id as string;
        await atomicBalanceUpdate(accountId, totalProceeds, `Sold ${numShares} shares of ${(investment as Record<string, unknown>).symbol} at ${numPrice.toFixed(2)}`);
      }
      const symbol = (investment as Record<string, unknown>).symbol as string;
      await supabaseClient.from('transactions').insert({ from_user_id: null, to_user_id: req.user?.id || '' as string, amount: totalProceeds.toFixed(2), currency: 'USD', transaction_type: 'investment_sell', category: 'investment', status: 'completed', description: `Sold ${numShares} shares of ${symbol} at ${numPrice.toFixed(2)}`, reference_number: `SEL${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      return res.json({ success: true, totalProceeds: totalProceeds.toFixed(2) });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('payments').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/kyc/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('kyc').select('*').eq('user_id', req.user?.id || '' as string).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      const { data: user } = await supabase.from('users').select('is_verified, kyc_status, email, phone, full_name, address, city, country, profession, annual_income').eq('id', req.user?.id || '' as string).single();
      const verificationItems = [{ id: 'identity', name: 'Identity Verification', status: user?.is_verified ? 'verified' : 'pending', completedAt: user?.is_verified ? new Date().toISOString() : null }, { id: 'email', name: 'Email Verification', status: user?.email ? 'verified' : 'pending', completedAt: user?.email ? new Date().toISOString() : null }, { id: 'phone', name: 'Phone Verification', status: user?.phone ? 'verified' : 'pending', completedAt: null }, { id: 'address', name: 'Address Verification', status: user?.address ? 'verified' : 'required', completedAt: null }, { id: 'income', name: 'Income Verification', status: user?.annual_income ? 'verified' : 'required', completedAt: null }, { id: 'kyc', name: 'KYC Compliance', status: user?.kyc_status || 'pending', completedAt: user?.kyc_status === 'approved' ? new Date().toISOString() : null }];
      return res.json({ kycRecord: data, verificationItems, user: { isVerified: user?.is_verified, kycStatus: user?.kyc_status } });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/kyc/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { documentType, documentNumber, fullName, dateOfBirth, nationality, address } = req.body;
      if (!documentType || !fullName) return res.status(400).json({ error: 'Document type and full name required' });
      const supabaseClient = getAdminClient();
      const { data, error } = await supabaseClient.from('kyc').upsert({ user_id: req.user?.id || '' as string, document_type: documentType, document_number: documentNumber || null, full_name: fullName, date_of_birth: dateOfBirth || null, nationality: nationality || null, address: address || null, status: 'pending', submitted_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      await supabaseClient.from('users').update({ kyc_status: 'in_review' }).eq('id', req.user?.id || '' as string);
      await supabaseClient.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'KYC Submitted', message: 'Your KYC documents have been submitted for review.', type: 'info', priority: 'normal', is_read: false });
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/user/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('users').select('notification_preferences, privacy_preferences, display_preferences, security_preferences').eq('id', req.user?.id || '' as string).single();
      if (error) throw error;
      return res.json({ notificationPreferences: data?.notification_preferences || {}, privacyPreferences: data?.privacy_preferences || {}, displayPreferences: data?.display_preferences || {}, securityPreferences: data?.security_preferences || {} });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.put('/api/user/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { notificationPreferences, privacyPreferences, displayPreferences, securityPreferences } = req.body;
      const updateData: Record<string, unknown> = {};
      if (notificationPreferences) updateData.notification_preferences = notificationPreferences;
      if (privacyPreferences) updateData.privacy_preferences = privacyPreferences;
      if (displayPreferences) updateData.display_preferences = displayPreferences;
      if (securityPreferences) updateData.security_preferences = securityPreferences;
      const { error } = await supabase.from('users').update(updateData).eq('id', req.user?.id || '' as string);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.put('/api/user/security-questions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2 } = req.body;
      if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) return res.status(400).json({ error: 'Both security questions and answers are required' });
      const hashedAnswer1 = crypto.createHash('sha256').update(String(securityAnswer1).toLowerCase().trim()).digest('hex');
      const hashedAnswer2 = crypto.createHash('sha256').update(String(securityAnswer2).toLowerCase().trim()).digest('hex');
      const { error } = await supabase.from('users').update({ security_question_1: securityQuestion1, security_answer_1: hashedAnswer1, security_question_2: securityQuestion2, security_answer_2: hashedAnswer2 }).eq('id', req.user?.id || '' as string);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/transactions/export', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', req.user?.id || '' as string);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No accounts found' });
      const accountIds = accounts.map((a: Record<string, unknown>) => a.id);
      const { data: transactions } = await supabase.from('transactions').select('*').in('from_account_id', accountIds).or(`to_account_id.in.(${accountIds.join(',')})`).order('created_at', { ascending: false }).limit(1000);
      const csvHeader = 'Date,Reference,Type,Amount,Currency,Status,Description\n';
      const csvRows = (transactions || []).map((t: Record<string, unknown>) => {
        const date = sanitizeCsvCell(String(t.created_at || ''));
        const ref = sanitizeCsvCell(String(t.reference_number || ''));
        const type = sanitizeCsvCell(String(t.transaction_type || ''));
        const amount = sanitizeCsvCell(String(t.amount || '0'));
        const currency = sanitizeCsvCell(String(t.currency || 'USD'));
        const status = sanitizeCsvCell(String(t.status || ''));
        const desc = sanitizeCsvCell(String(t.description || '').replace(/"/g, '""'));
        return `${date},${ref},${type},${amount},${currency},${status},"${desc}"`;
      }).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csvHeader + csvRows);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/:id/repay', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount } = req.body;
      if (!amount) return res.status(400).json({ error: 'Amount required' });
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      const supabaseClient = getAdminClient();
      const { data: loan } = await supabaseClient.from('loans').select('*').eq('id', req.params.id).eq('user_id', req.user?.id || '' as string).single();
      if (!loan) return res.status(404).json({ error: 'Loan not found' });
      if ((loan as Record<string, unknown>).status !== 'approved' && (loan as Record<string, unknown>).status !== 'active') return res.status(400).json({ error: 'Loan is not active' });
      const { data: account } = await supabaseClient.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!account) return res.status(404).json({ error: 'Account not found' });
      const accountId = (account as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -numAmount, `Loan repayment for loan ${req.params.id}`);
      if (!balanceResult.success) { return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' }); }
      const newBalance = balanceResult.newBalance || '0';
      const remainingBalance = parseFloat(String((loan as Record<string, unknown>).remaining_balance || (loan as Record<string, unknown>).principal_amount || '0')) - numAmount;
      await supabaseClient.from('loans').update({ remaining_balance: remainingBalance.toFixed(2), status: remainingBalance <= 0 ? 'completed' : 'active', updated_at: new Date().toISOString() }).eq('id', req.params.id);
      await supabaseClient.from('transactions').insert({ from_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: 'USD', transaction_type: 'loan_repayment', category: 'loan', status: 'completed', description: `Loan repayment for loan ${req.params.id}`, reference_number: `LRP${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      await supabaseClient.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'Loan Payment Made', message: `Payment of ${numAmount.toFixed(2)} applied to your loan. Remaining balance: ${remainingBalance.toFixed(2)}.`, type: 'success', priority: 'normal', is_read: false });
      return res.json({ success: true, newBalance, remainingBalance: remainingBalance.toFixed(2) });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/loans/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('loans').select('*').eq('id', req.params.id).eq('user_id', req.user?.id || '' as string).single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/cards/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: account } = await supabase.from('accounts').select('id').eq('user_id', req.user?.id || '' as string);
      if (!account) return res.status(404).json({ error: 'Account not found' });
      const { data, error } = await supabase.from('cards').select('*').eq('id', req.params.id).in('account_id', account.map((a: Record<string, unknown>) => a.id)).single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// ==================== LIVE CHAT ENDPOINTS ====================
export async function registerLiveChatRoutes(app: Express) {
  const { getChatHistory, getActiveSessions, createTicketFromChat } = await import('./supabase-live-chat');
  const { supabase } = await import('./supabase-public-storage');
  const wrap = wrapAsync;
  app.get('/api/chat/history', wrapAsync(requireAuth), wrapAsync(getChatHistory));
  app.get('/api/chat/sessions', wrapAsync(requireAdmin), wrapAsync(getActiveSessions));
  app.post('/api/chat/create-ticket', wrapAsync(requireAuth), wrapAsync(createTicketFromChat));
  app.post('/api/chat/send', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      let adminUserId = '00000000-0000-0000-0000-000000000000';
      try { const { data: adminUsers } = await supabase.from('users').select('id').eq('role', 'admin').limit(1); if (adminUsers && adminUsers.length > 0) adminUserId = adminUsers[0].id; } catch (error: unknown) { console.warn('Failed to query admin users:', error instanceof Error ? error.message : 'Unknown error'); }
      const { data: savedMsg, error } = await supabase.from('messages').insert({ sender_id: user.id, sender_role: 'customer', recipient_id: adminUserId, recipient_role: 'admin', message: message.trim(), session_id: `session_${user.id}`, is_read: false, created_at: new Date().toISOString() }).select().single();
      if (error) return res.status(500).json({ error: 'Failed to send message' });
      const adminChannel = supabase.channel('admin-chat-inbox');
      adminChannel.send({ type: 'broadcast', event: 'new_customer_message', payload: { userId: user.id, userName: `${user.firstName} ${user.lastName}`, message: message.trim(), messageId: savedMsg?.id, timestamp: new Date().toISOString() } });
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').eq('is_active', true);
      if (admins && admins.length > 0) { const adminAlerts = admins.map((admin: Record<string, unknown>) => ({ user_id: admin.id, title: 'New Chat Message', message: `New message from ${req.user?.email}`, type: 'info', priority: 'normal', is_read: false })); await supabase.from('alerts').insert(adminAlerts); }
      return res.json({ success: true, messageId: savedMsg?.id });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to send message' }); }
  }));
  app.post('/api/chat/notify', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, type, message } = req.body;
      const authReq = req as AuthenticatedRequest;
      if (userId !== authReq.user?.id && authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to send notifications to other users' });
      }
      const channel = supabase.channel(`notifications:${userId}`);
      channel.send({ type: 'broadcast', event: type, payload: { message, timestamp: new Date() } });
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  }));
}
