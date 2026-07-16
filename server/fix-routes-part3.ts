      const totalInterest = monthlyPayment * Number(termMonths) - Number(principalAmount);
      const totalPayable = Number(principalAmount) + totalInterest;
      const loanNumber = `LN${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('loans').insert({ user_id: req.user?.id || '' as string, loan_number: loanNumber, loan_type: loanType, principal_amount: String(principalAmount), interest_rate: String(interestRate), term_months: termMonths, monthly_payment: monthlyPayment.toFixed(2), remaining_balance: String(principalAmount), total_interest: totalInterest.toFixed(2), total_payable: totalPayable.toFixed(2), status: 'pending' }).select().single();
      if (error) throw new Error('Database operation failed');
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').eq('is_active', true);
      if (admins && admins.length > 0) { const adminAlerts = admins.map((admin: Record<string, unknown>) => ({ user_id: admin.id, title: 'New Loan Application', message: `Loan application for ${principalAmount} from ${req.user?.email} requires review.`, type: 'warning', priority: 'high', is_read: false })); await supabase.from('alerts').insert(adminAlerts); }
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/:id/approve', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: loan, error: loanError } = await supabase.from('loans').select('*').eq('id', req.params.id).single();
      if (loanError || !loan) return res.status(404).json({ error: 'Loan not found' });
      if (loan.status !== 'pending') return res.status(400).json({ error: 'Loan is not in pending status' });
      const { data, error } = await supabase.from('loans').update({ status: 'approved', approved_by: req.user?.id || '' as string, approved_at: new Date().toISOString(), disbursement_date: new Date().toISOString(), maturity_date: new Date(Date.now() + (loan.term_months * 30 * 24 * 60 * 60 * 1000)).toISOString() }).eq('id', req.params.id).select().single();
      if (error) throw error;
      const { data: account } = await supabase.from('accounts').select('id, balance').eq('user_id', loan.user_id).eq('status', 'active').limit(1).single();
      if (account) {
        const accountId = (account as Record<string, unknown>).id as string;
        const principalAmount = parseFloat(String(loan.principal_amount));
        await atomicBalanceUpdate(accountId, principalAmount, `Loan disbursement - ${loan.loan_type} - ${loan.loan_number}`);
        await supabase.from('transactions').insert({ from_account_id: null, to_account_id: (account as Record<string, unknown>).id, from_user_id: null, to_user_id: loan.user_id, amount: principalAmount.toFixed(2), currency: 'USD', transaction_type: 'loan_disbursement', category: 'loan', status: 'completed', description: `Loan disbursement - ${loan.loan_type} - ${loan.loan_number}`, reference_number: `LOAN${Date.now()}${Math.floor(Math.random() * 10000)}`, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() });
        await supabase.from('alerts').insert({ user_id: loan.user_id, title: 'Loan Approved', message: `Your ${loan.loan_type} loan of ${principalAmount.toFixed(2)} has been approved and disbursed to your account.`, type: 'success', priority: 'high', is_read: false });
      }
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/loans/:id/reject', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data: loan, error: loanError } = await supabase.from('loans').select('status').eq('id', req.params.id).single();
      if (loanError || !loan) return res.status(404).json({ error: 'Loan not found' });
      if (loan.status !== 'pending') return res.status(400).json({ error: 'Loan is not in pending status' });
      const { data, error } = await supabase.from('loans').update({ status: 'rejected' }).eq('id', req.params.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/admin/pending-loans', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('loans').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/admin/create-admin-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) return res.status(400).json({ error: 'Email, password, and fullName are required' });
      if (!validatePasswordComplexity(password)) { return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' }); }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'admin' }, user_metadata: {} });
      if (authError || !authData.user) return res.status(500).json({ error: 'Failed to create admin auth account' });
      const adminPin = generateTransferPin();
      const adminPinHash = await bcrypt.hash(adminPin, 12);
      try {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || 'Admin';
        const adminUser = await storage.createUser({ username: email.split('@')[0] + '_admin', firstName, lastName, email, phone: '+1-000-000-0000', accountNumber: `ADMIN-${generateAccountNumber()}`, accountId: randomUUID(), password: randomUUID(), transferPin: adminPinHash, role: 'admin', isVerified: true, isActive: true, balance: '0', dateOfBirth: '1990-01-01', address: 'World Bank HQ', city: 'Washington', state: 'DC', country: 'United States', postalCode: '20001', profession: 'Administrator', annualIncome: 'N/A', idType: 'Staff ID', idNumber: 'ADMIN-001' } as unknown as InsertUser);
        return res.status(201).json({ success: true, message: 'Admin user created successfully', user: { id: adminUser.id, email: adminUser.email, fullName: `${adminUser.firstName} ${adminUser.lastName}`, role: adminUser.role }, credentials: { email, note: 'Password was provided during creation' } });
      } catch (dbError: unknown) { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); throw dbError; }
    } catch (error: unknown) { return res.status(500).json({ error: 'Admin user creation failed', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/set-user-role', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, email, role } = req.body;
      if (!role || !['admin', 'customer'].includes(role)) return res.status(400).json({ error: 'Role must be admin or customer' });
      if (!userId && !email) return res.status(400).json({ error: 'userId or email required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      let supabaseUserId = userId;
      if (!supabaseUserId && email) { const { data: users } = await supabaseAdmin.auth.admin.listUsers(); const found = users?.users?.find((u: { id?: string; email?: string }) => u.email === email); if (!found) return res.status(404).json({ error: 'User not found in Supabase Auth' }); supabaseUserId = found.id; }
      const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, { app_metadata: { role } });
      if (supabaseError) return res.status(500).json({ error: 'Failed to update Supabase role', details: 'An internal error occurred' });
      const targetUser = email ? await storage.getUserByEmail(email) : await storage.getUser(supabaseUserId);
      if (targetUser) { await storage.updateUser(targetUser.id, { role }); }
      return res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to set user role', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/reset-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required' });
      if (!validatePasswordComplexity(newPassword)) { return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' }); }
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) return res.status(500).json({ error: 'Failed to list users' });
      const userToUpdate = users.users.find((u: { id?: string; email?: string }) => u.email === email);
      if (!userToUpdate) return res.status(404).json({ error: 'User not found in Supabase Auth' });
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userToUpdate.id, { password: newPassword });
      if (updateError) return res.status(500).json({ error: 'Failed to reset password', details: 'An internal error occurred' });
      return res.json({ success: true, message: `Password reset successfully for ${email}.`, email });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to reset password', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/delete-user/:email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.params;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) return res.status(500).json({ error: 'Failed to list users' });
      const userToDelete = users.users.find((u: { id?: string; email?: string }) => u.email === email);
      if (!userToDelete) return res.status(404).json({ error: 'User not found in Supabase Auth' });
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      if (deleteAuthError) return res.status(500).json({ error: 'Failed to delete from authentication system' });
      return res.json({ success: true, message: `User ${email} deleted successfully`, deleted_email: email });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to delete user', details: 'An internal error occurred' }); }
  });

  api.post('/api/transactions/:id/reverse', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const sanitizedReason = reason ? sanitizeInput(String(reason)) : 'No reason provided';
      const txnId = id;
      if (!txnId) return res.status(400).json({ error: 'Invalid transaction ID' });
      const allTransactions = await storage.getAllTransactions();
      const transaction = (allTransactions as unknown as Transaction[]).find((t: Transaction) => String(t.id) === String(txnId));
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      if (transaction.status === 'reversed') return res.status(400).json({ error: 'Transaction already reversed' });
      if (transaction.fromAccountId) { const fromAccount = await storage.getAccount(String(transaction.fromAccountId)); if (fromAccount) { const refundAmount = parseFloat(String(transaction.amount)) || 0; const currentBalance = parseFloat(String(fromAccount.balance)) || 0; const newBalance = currentBalance + refundAmount; if (storage.updateAccount) { await storage.updateAccount(String(transaction.fromAccountId), { balance: newBalance.toString() }); } } }
      const reversalTxn = await storage.createTransaction({ fromAccountId: String(transaction.toAccountId || transaction.fromAccountId), toAccountId: String(transaction.fromAccountId), type: 'reversal', amount: String(transaction.amount), status: 'reversed', description: `Reversal of transaction #${txnId}. Reason: ${sanitizedReason}`, currency: transaction.currency || 'USD' } as unknown as InsertTransaction);
      await storage.updateTransactionStatus(txnId, 'reversed', String(req.user?.id || '' as string || '1'), sanitizedReason);
      return res.json({ success: true, message: 'Transaction reversed successfully', reversalTransactionId: reversalTxn.id, amountRefunded: transaction.amount });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to reverse transaction', details: 'An internal error occurred' }); }
  });

  api.get('/api/statements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = typeof (req.user?.id || '' as string) === 'number' ? req.user!.id : (String(req.user?.id || '' as string) || '0');
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });
      const statements = await storage.getStatementsByUserId(userId);
      return res.json(statements);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch statements' }); }
  });

  api.post('/api/objects/upload', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { file, fileName, fileType } = req.body;
      if (!file || !fileName) return res.status(400).json({ error: 'Missing file or fileName' });
      const sanitizedFileName = String(fileName).replace(/[^a-zA-Z0-9.\-]/g, '_');
      const fileId = `upload_${Date.now()}_${randomUUID().substring(0, 8)}`;
      return res.json({ success: true, fileId, fileName: sanitizedFileName, fileType: fileType || 'image/jpeg', uploadedAt: new Date().toISOString(), url: `/uploads/${fileId}`, message: 'File uploaded successfully' });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to upload file' }); }
  });

  api.get('/api/admin/list-users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) return res.status(500).json({ error: 'Failed to list users', details: 'An internal error occurred' });
      return res.json({ total: data.users.length, users: (data.users as unknown as Record<string, unknown>[]).map((u: Record<string, unknown>) => ({ id: u.id, email: u.email, role: (u.app_metadata as Record<string, unknown>)?.role || 'customer', verified: u.email_confirmed_at ? 'yes' : 'no' })) });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to list users', details: 'An internal error occurred' }); }
  });

  api.post('/api/admin/users/:id/profile-photo', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { photoUrl } = req.body;
      if (!id || !photoUrl) return res.status(400).json({ error: 'User ID and photo URL required' });
      if (photoUrl && !/^https?:\/\/.+/.test(String(photoUrl))) { return res.status(400).json({ error: 'Invalid photo URL format' }); }
      const updatedUser = await storage.updateUser(id, { profilePhoto: photoUrl });
      if (!updatedUser) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true, message: 'Profile photo updated successfully', user: updatedUser });
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to upload profile photo', details: 'An internal error occurred' }); }
  });

  api.get('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/cards/lock', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, locked } = req.body;
      if (!cardId) return res.status(400).json({ error: 'Card ID required' });
      const { data, error } = await supabase.from('cards').update({ status: locked ? 'locked' : 'active', updated_at: new Date().toISOString() }).eq('id', cardId).eq('user_id', req.user?.id || '' as string).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/cards/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardId, dailyLimit, monthlyLimit, isContactless } = req.body;
      if (!cardId) return res.status(400).json({ error: 'Card ID required' });
      if (dailyLimit !== undefined && parseFloat(String(dailyLimit)) < 0) return res.status(400).json({ error: 'Daily limit cannot be negative' });
      if (monthlyLimit !== undefined && parseFloat(String(monthlyLimit)) < 0) return res.status(400).json({ error: 'Monthly limit cannot be negative' });
      const { data, error } = await supabase.from('cards').update({ daily_limit: dailyLimit, monthly_limit: monthlyLimit, is_contactless: isContactless, updated_at: new Date().toISOString() }).eq('id', cardId).eq('user_id', req.user?.id || '' as string).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/cards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { cardType, cardholderName } = req.body;
      if (!cardType || !cardholderName) return res.status(400).json({ error: 'Card type and cardholder name required' });
      const supabase = getAdminClient();
      const { data: account } = await supabase.from('accounts').select('id').eq('user_id', req.user?.id || '' as string).eq('status', 'active').limit(1).single();
      if (!account) return res.status(404).json({ error: 'No active account found' });
      const cardNumber = '4' + Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
      const expiryMonth = Math.floor(Math.random() * 12) + 1;
      const expiryYear = new Date().getFullYear() + 4;
      const { data, error } = await supabase.from('cards').insert({ user_id: req.user?.id || '' as string, account_id: (account as Record<string, unknown>).id, card_number: cardNumber, card_type: cardType, cardholder_name: cardholderName, expiry_month: expiryMonth, expiry_year: expiryYear, status: 'active', is_contactless: true, daily_limit: '5000.00', monthly_limit: '50000.00', pin_set: false }).select().single();
      if (error) throw error;
      await supabase.from('alerts').insert({ user_id: req.user?.id || '' as string, title: 'New Card Created', message: `A new ${cardType} card has been created for your account.`, type: 'success', priority: 'normal', is_read: false });
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/alerts', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.patch('/api/alerts/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('alerts').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user?.id || '' as string).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.delete('/api/alerts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', req.params.id).eq('user_id', req.user?.id || '' as string);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/investments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('investments').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/market-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('forex').select('*').order('currency', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/currency-exchange', requireAuth, transactionRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      if (!fromCurrency || !toCurrency || !amount) return res.status(400).json({ error: 'Missing required fields' });
      const sanitizedFromCurrency = sanitizeInput(String(fromCurrency));
      const sanitizedToCurrency = sanitizeInput(String(toCurrency));
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });
      const { data: rate, error: rateError } = await supabase.from('forex').select('rate').eq('currency', sanitizedToCurrency).single();
      if (rateError || !rate) return res.status(400).json({ error: 'Exchange rate not found' });
      const exchangeRate = parseFloat(String((rate as Record<string, unknown>).rate));
      const convertedAmount = numAmount * exchangeRate;
      const { data: userAccount } = await supabase.from('accounts').select('id, balance').eq('user_id', req.user?.id || '' as string || '' as string).eq('status', 'active').limit(1).single();
      if (!userAccount) return res.status(404).json({ error: 'Account not found' });
      const accountId = (userAccount as Record<string, unknown>).id as string;
      const balanceResult = await atomicBalanceUpdate(accountId, -numAmount, `Currency exchange: ${numAmount} ${sanitizedFromCurrency} to ${sanitizedToCurrency}`);
      if (!balanceResult.success) { return res.status(400).json({ error: balanceResult.error || 'Insufficient funds' }); }
      const reference = `EXC${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data: txn, error: txnError } = await supabase.from('transactions').insert({ from_account_id: null, to_account_id: null, from_user_id: req.user?.id || '' as string, amount: numAmount.toFixed(2), currency: sanitizedFromCurrency, exchange_rate: exchangeRate.toFixed(4), converted_amount: convertedAmount.toFixed(2), transaction_type: 'currency_exchange', category: 'exchange', status: 'completed', description: `Currency exchange: ${numAmount} ${sanitizedFromCurrency} to ${convertedAmount.toFixed(2)} ${sanitizedToCurrency}`, reference_number: reference, processed_at: new Date().toISOString(), completed_at: new Date().toISOString() }).select().single();
      if (txnError) throw txnError;
      return res.json({ transaction: txn, convertedAmount: convertedAmount.toFixed(2), rate: exchangeRate });
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', req.user?.id || '' as string).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.post('/api/support-tickets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { subject, description, priority } = req.body;
      if (!subject || !description) return res.status(400).json({ error: 'Subject and description required' });
      const ticketId = `TKT${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const { data, error } = await supabase.from('support_tickets').insert({ user_id: req.user?.id || '' as string, ticket_id: ticketId, subject, description, priority: priority || 'medium', status: 'open' }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/admin/support-tickets', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch (error: unknown) { return res.status(500).json({ error: 'An internal error occurred' }); }
  });

  api.get('/api/admin/transactions', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);