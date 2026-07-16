      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: 'Invalid credentials' });
      if (!data.session || !data.user) return res.status(401).json({ error: 'Invalid credentials' });
      const supabaseUser = data.user;
      let dbUser = await storage.getUserByEmail(email);
      if (!dbUser) {
        dbUser = await storage.createUser({ username: email.split('@')[0], email, password: randomUUID(), firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0], lastName: supabaseUser.user_metadata?.last_name || 'User', phone: supabaseUser.user_metadata?.phone || '', profession: 'Not provided', accountNumber: `${generateAccountNumber()}`, accountId: randomUUID(), balance: '0', isActive: false, isVerified: false, transferPin: supabaseUser.user_metadata?.transfer_pin || '', role: supabaseUser.app_metadata?.role || 'customer' } as unknown as InsertUser);
        await storage.createAccount({ userId: dbUser.id, accountNumber: `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'active' });
      } else {
        const userAccounts = await storage.getUserAccounts(dbUser.id);
        if (userAccounts.length === 0) { await storage.createAccount({ userId: dbUser.id, accountNumber: `${generateAccountNumber()}`, accountType: 'checking', balance: '0.00', currency: 'USD', status: 'active' }); }
        const supabaseRole = supabaseUser.app_metadata?.role || 'customer';
        const updates: Record<string, unknown> = { lastLogin: new Date() };
        if (dbUser.role !== supabaseRole) updates.role = supabaseRole;
        await storage.updateUser(dbUser.id, updates);
        const refreshed = await storage.getUserByEmail(email);
        if (refreshed) dbUser = refreshed;
      }
      const accessToken = data.session?.access_token;
      if (!accessToken) return res.status(500).json({ error: 'Failed to generate authentication token' });
      return res.json({ token: accessToken, refreshToken: data.session?.refresh_token, user: sanitizeUser(dbUser as unknown as Record<string, unknown>) });
    } catch (error: unknown) { return res.status(500).json({ error: 'Login failed', details: 'An internal error occurred' }); }
  });

  api.post('/api/auth/logout', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.replace('Bearer ', '');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { refreshToken } = req.body || {};
      if (refreshToken) { await supabaseAdmin.auth.admin.signOut(refreshToken).catch((e: unknown) => console.error('Token cleanup error:', e)); }
      if (accessToken) { await supabaseAdmin.auth.admin.signOut(accessToken).catch((e: unknown) => console.error('Token cleanup error:', e)); }
      return res.json({ message: 'Logged out successfully', status: 'ok' });
    } catch (error: unknown) { return res.json({ message: 'Logged out successfully', status: 'ok' }); }
  });

  api.post('/api/auth/refresh', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data.session) return res.status(401).json({ error: 'Invalid refresh token' });
      return res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: { id: data.user?.id, email: data.user?.email } });
    } catch (error) { return res.status(500).json({ error: 'Token refresh failed' }); }
  });

  api.post('/api/auth/change-password', requireAuth, authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a number' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email: req.user?.email || '' as string, password: currentPassword });
      if (signInError) return res.status(401).json({ error: 'Current password is incorrect' });
      const { error: updateError } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/login', authRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: 'Invalid admin credentials' });
      const role = data.user.app_metadata?.role || 'customer';
      if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
      const accessToken = data.session?.access_token;
      if (!accessToken) return res.status(500).json({ error: 'Failed to generate authentication token' });
      return res.json({ token: accessToken, refreshToken: data.session?.refresh_token, user: { id: data.user.id, email: data.user.email, role } });
    } catch (error: unknown) { return res.status(500).json({ error: 'Login failed' }); }
  });

  api.get('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id); allTxns.push(...(txns as unknown as Transaction[])); }
      const paymentRequests = allTxns.filter((t: Transaction) => t.type === 'payment_request' || (t.description?.toLowerCase()?.includes('payment request')));
      return res.json(paymentRequests);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to load data' }); }
  });

  api.post('/api/payment-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency = 'USD', description, recipientName } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
      const reference = `PR-${Date.now()}-${randomUUID().substring(0, 8).toUpperCase()}`;
      const transaction = await storage.createTransaction({ fromUserId: req.user?.id || '' as string, amount: String(amount), currency, transactionType: 'payment_request', status: 'pending', referenceNumber: reference, description: description || `Payment request to ${recipientName || 'recipient'}`, recipientName: recipientName || '' } as unknown as InsertTransaction);
      return res.json({ success: true, reference, transaction });
    } catch (error) { return res.status(500).json({ error: 'Failed to create payment request' }); }
  });

  api.post('/api/payment-requests/:id/pay', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supabase = getAdminClient();
      const { data: request } = await supabase.from('transactions').select('*').eq('id', req.params.id).eq('transaction_type', 'payment_request').single();
      if (!request) return res.status(404).json({ error: 'Payment request not found' });
      if ((request as Record<string, unknown>).status !== 'pending') return res.status(400).json({ error: 'Payment request is no longer pending' });
      const amount = parseFloat(String((request as Record<string, unknown>).amount));
      const { data: userAccount } = await supabase.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -amount, `Payment for request ${req.params.id}`);
      if (!balanceResult.success) { return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' }); }
      const newBalance = balanceResult.newBalance || '0';
      await supabase.from('transactions').update({ status: 'completed', completed_at: new Date().toISOString(), from_user_id: req.user?.id || '' as string }).eq('id', req.params.id);
      await supabase.from('transactions').insert({ from_user_id: req.user?.id || '' as string, to_user_id: (request as Record<string, unknown>).to_user_id, amount: amount.toFixed(2), currency: 'USD', transaction_type: 'payment', category: 'payment', status: 'completed', description: `Payment for request ${req.params.id}`, reference_number: `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      await supabase.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'Payment Sent', message: `Payment of ${amount.toFixed(2)} has been sent.`, type: 'success', priority: 'normal', is_read: false });
      return res.json({ success: true, newBalance });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/add-funds', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { method, amount } = req.body;
      if (!method || !amount || isNaN(parseFloat(String(amount))) || parseFloat(String(amount)) <= 0) return res.status(400).json({ error: 'Method and valid amount are required' });
      const sanitizedMethod = sanitizeInput(String(method));
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      if (accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const parsedAmount = parseFloat(String(amount));
      try {
        const updated = await storage.updateUserBalance(user.id, parsedAmount);
        if (!updated) return res.status(500).json({ error: 'Failed to update balance' });
        const { data: account } = await supabase.from('accounts').select('id').eq('user_id', user.id).eq('status', 'active').limit(1).single();
        if (account) {
          const accountId = (account as Record<string, unknown>).id as string;
          const balanceResult = await atomicBalanceUpdate(accountId, parsedAmount, `Funds added via ${sanitizedMethod}`);
          if (!balanceResult.success) { await storage.updateUserBalance(user.id, -parsedAmount); return res.status(500).json({ error: balanceResult.error || 'Failed to update account balance' }); }
        }
        const newBalance = (parseFloat(String(updated.balance || '0'))).toFixed(2);
        const transaction = await storage.createTransaction({ fromAccountId: accounts[0].id, type: 'deposit', amount: parsedAmount.toString(), description: `Funds added via ${sanitizedMethod}`, status: 'completed', currency: 'USD', referenceNumber: `DEP-${Date.now()}`, createdAt: new Date() } as unknown as InsertTransaction);
        await supabase.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'Funds Added', message: `${parsedAmount.toFixed(2)} has been added to your account via ${sanitizedMethod}.`, type: 'success', priority: 'normal', is_read: false });
        return res.json({ success: true, transaction, amount: parsedAmount, newBalance: updated.balance });
      } catch (error) { await storage.updateUserBalance(user.id, -parsedAmount); return res.status(500).json({ error: 'Failed to complete deposit' }); }
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to add funds' }); }
  });

  api.get('/api/transactions/recent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id); allTxns.push(...(txns as unknown as Transaction[])); }
      allTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.json(allTxns.slice(0, 10));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to load data' }); }
  });

  api.get('/api/currencies', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ code: 'USD', name: 'US Dollar', symbol: '$', flag: 'US' }, { code: 'EUR', name: 'Euro', symbol: 'EUR', flag: 'EU' }, { code: 'GBP', name: 'British Pound', symbol: 'GBP', flag: 'UK' }, { code: 'JPY', name: 'Japanese Yen', symbol: 'YEN', flag: 'JP' }, { code: 'CNY', name: 'Chinese Yuan', symbol: 'Y', flag: 'CN' }, { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: 'CA' }, { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: 'AU' }, { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: 'CH' }, { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: 'SG' }, { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: 'HK' }]);
  });

  api.get('/api/admin/customers-list', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customers = await storage.getAllUsers();
      const customerList = customers.filter((user: User) => user.role === 'customer');
      return res.json(customerList);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch customers list' }); }
  });

  api.get('/api/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(sanitizeUsers(users));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch users' }); }
  });

  api.get('/api/card-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const allTxns: Transaction[] = [];
      for (const account of accounts) { const txns = await storage.getAccountTransactions(account.id, 20); allTxns.push(...(txns as unknown as Transaction[])); }
      return res.json(allTxns.slice(0, 30));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to load data' }); }
  });

  api.get('/api/wallet-balance', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ balance: parseFloat(String(user.balance || '0')), currency: 'USD', available: parseFloat(String(user.balance || '0')), pending: 0 });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch wallet balance' }); }
  });

  api.get('/api/wallet-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      return res.json(txns);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to load data' }); }
  });

  api.get('/api/mobile-payments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      if (!accounts || accounts.length === 0) return res.json([]);
      const txns = await storage.getAccountTransactions(accounts[0].id, 20);
      const mobilePayments = (txns as unknown as Transaction[]).filter((t: Transaction) => t.type === 'mobile_pay' || (typeof t.description === 'string' && t.description.toLowerCase().includes('mobile')));
      return res.json(mobilePayments);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to load data' }); }
  });

  api.get('/api/mobile-pay/merchants', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ id: 1, name: 'Apple Pay', logo: 'A', category: 'Digital Wallet' }, { id: 2, name: 'Google Pay', logo: 'G', category: 'Digital Wallet' }, { id: 3, name: 'Samsung Pay', logo: 'S', category: 'Digital Wallet' }, { id: 4, name: 'PayPal', logo: 'P', category: 'Online Payment' }, { id: 5, name: 'Venmo', logo: 'V', category: 'P2P Transfer' }, { id: 6, name: 'Cash App', logo: 'C', category: 'P2P Transfer' }, { id: 7, name: 'Zelle', logo: 'Z', category: 'Bank Transfer' }]);
  });

  api.get('/api/user/activity-log', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.json([]);
      const accounts = await storage.getUserAccounts(user.id);
      const recentActivity: Record<string, unknown>[] = [];
      if (accounts && accounts.length > 0) {
        const txns = await storage.getAccountTransactions(accounts[0].id, 10);
        (txns as unknown as Transaction[]).forEach((t: Transaction) => { recentActivity.push({ id: t.id, action: `${t.type || 'Transaction'} of ${t.amount}`, timestamp: t.createdAt, ipAddress: '***.***.*.***', device: 'Web Browser', status: t.status || 'completed' }); });
      }
      recentActivity.unshift({ id: 'login-recent', action: 'Account login', timestamp: user.lastLogin || new Date().toISOString(), ipAddress: req.ip || '***', device: req.get('user-agent')?.substring(0, 30) || 'Unknown', status: 'success' });
      return res.json(recentActivity);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to load data' }); }
  });

  api.get('/api/user/trusted-devices', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    return res.json([{ id: 1, name: 'Current Browser', type: 'web', lastUsed: new Date().toISOString(), trusted: true, current: true }]);
  });

  api.get('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      return res.json((allTransactions as unknown as Transaction[]).map((t: Transaction) => ({ id: t.id, amount: t.amount, currency: t.currency || 'USD', status: t.status, type: t.type, description: t.description, recipientName: t.recipientName, createdAt: t.createdAt })));
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch transaction routes' }); }
  });

  api.patch('/api/admin/transaction-routes/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { status, notes } = req.body;
      const admin = await storage.getUserByEmail(req.user?.email || '');
      const adminId = admin?.id || '0' as string;
      const transaction = await storage.updateTransactionStatus(id, status, adminId, notes);
      return res.json({ success: true, transaction });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to update transaction route' }); }
  });

  api.post('/api/admin/transaction-routes', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { accountId, amount, description, type, status } = req.body;
      const transaction = await storage.createTransaction({ fromAccountId: accountId, type: type || 'transfer', amount: String(amount), description, status: status || 'pending', createdAt: new Date() } as unknown as InsertTransaction);
      return res.json({ success: true, transaction });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to create transaction route' }); }
  });

  api.get('/api/recent-contacts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('recent_contacts').select('*').eq('user_id', req.user?.id || '' as string).order('updated_at', { ascending: false }).limit(10);
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/loans', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('loans').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/apply', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { loanType, principalAmount, interestRate, termMonths, transferPin } = req.body;
      if (!loanType || !principalAmount || !interestRate || !termMonths) return res.status(400).json({ error: 'Missing required fields' });
      const principal = Number(principalAmount);
      const rate = Number(interestRate);
      const term = Number(termMonths);
      if (isNaN(principal) || principal <= 0) return res.status(400).json({ error: 'Invalid principal amount' });
      if (isNaN(rate) || rate < 0 || rate > 100) return res.status(400).json({ error: 'Invalid interest rate' });
      if (isNaN(term) || term < 1 || term > 360) return res.status(400).json({ error: 'Invalid term (must be 1-360 months)' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.transferPin) return res.status(400).json({ error: 'PIN not set' });
      const pinMatch = await bcrypt.compare(String(transferPin), user.transferPin);
      if (!pinMatch) return res.status(400).json({ error: 'Invalid PIN' });
      const monthlyPayment = (Number(principalAmount) * (Number(interestRate) / 100 / 12)) / (1 - Math.pow(1 + Number(interestRate) / 100 / 12, -Number(termMonths)));