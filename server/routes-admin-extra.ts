import { Express, Request, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { authRateLimiter } from './rate-limiter';
import { storage } from './storage-factory';
import { atomicBalanceUpdate } from './transaction-wrapper';
import { generateAccountNumber } from './crypto-utils';
import { InsertAccount } from '@shared/schema';
import * as bcrypt from 'bcryptjs';

type AsyncHandler = (req: AuthenticatedRequest, res: Response) => Promise<unknown> | unknown;
function wrap(fn: AsyncHandler) {
  return (req: Request, res: Response, next: (e?: unknown) => void): void => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
}

function sanitizeUser(user: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!user) return {};
  const { password, transferPin, transfer_pin, password_hash, idNumber, identification_number, ...safe } = user;
  return safe;
}

export function setupAdminExtraRoutes(app: Express) {
  // GET /api/accounts/:id/transactions
  app.get('/api/accounts/:id/transactions', requireAuth, wrap(async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const accounts = await storage.getUserAccounts(user.id);
      const ownsAccount = accounts.some((a: Record<string, unknown>) => String(a.id) === req.params.id);
      if (!ownsAccount && req.user?.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
      const txns = await storage.getAccountTransactions(req.params.id);
      return res.json(txns);
    } catch { return res.status(500).json({ error: 'Failed to fetch account transactions' }); }
  }));

  // GET /api/admin/accounts
  app.get('/api/admin/accounts', requireAdmin, wrap(async (req, res) => {
    try {
      const { data, error } = await getAdminClient().from('accounts').select('*, users!inner(email, first_name, last_name)').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.status(500).json({ error: 'Failed to fetch accounts' }); }
  }));

  // POST /api/admin/accounts
  app.post('/api/admin/accounts', requireAdmin, wrap(async (req, res) => {
    try {
      const { userId, accountType, accountName, balance, currency } = req.body;
      if (!userId || !accountType) return res.status(400).json({ error: 'userId and accountType required' });
      const { data, error } = await getAdminClient().from('accounts').insert({
        user_id: userId, account_number: generateAccountNumber(), account_type: accountType,
        balance: balance || '0.00', available_balance: balance || '0.00',
        currency: currency || 'USD', status: 'active', account_nickname: accountName || null, is_primary: false,
      }).select().single();
      if (error) throw error;
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'create_account', targetType: 'account', targetId: String(data.id), details: { userId, accountType } });
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to create account' }); }
  }));

  // PATCH /api/admin/accounts/:id
  app.patch('/api/admin/accounts/:id', requireAdmin, wrap(async (req, res) => {
    try {
      const { accountName, balance, isActive } = req.body;
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (accountName !== undefined) updates.account_nickname = accountName;
      if (balance !== undefined) {
        const numBalance = parseFloat(String(balance));
        if (isNaN(numBalance) || numBalance < 0) return res.status(400).json({ error: 'Invalid balance' });
        const { data: account } = await getAdminClient().from('accounts').select('balance').eq('id', req.params.id).single();
        const currentBalance = parseFloat(String(account?.balance || '0'));
        const delta = numBalance - currentBalance;
        if (Math.abs(delta) > 0.001) {
          const result = await atomicBalanceUpdate(req.params.id, delta, 'Admin balance adjustment');
          if (!result.success) return res.status(400).json({ error: result.error || 'Failed to adjust balance' });
        }
      }
      if (isActive !== undefined) updates.status = isActive ? 'active' : 'inactive';
      const { data, error } = await getAdminClient().from('accounts').update(updates).eq('id', req.params.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to update account' }); }
  }));

  // DELETE /api/admin/accounts/:id
  app.delete('/api/admin/accounts/:id', requireAdmin, wrap(async (req, res) => {
    try {
      const { data: account } = await getAdminClient().from('accounts').select('balance').eq('id', req.params.id).single();
      if (account && parseFloat(String(account.balance || '0')) !== 0) {
        return res.status(400).json({ error: 'Cannot close account with non-zero balance' });
      }
      const { error } = await getAdminClient().from('accounts').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', req.params.id);
      if (error) throw error;
      return res.json({ success: true });
    } catch { return res.status(500).json({ error: 'Failed to close account' }); }
  }));

  // POST /api/admin/approve-registration/:id
  app.post('/api/admin/approve-registration/:id', requireAdmin, wrap(async (req, res) => {
    try {
      const { initialBalance } = req.body;
      const adminClient = getAdminClient();
      const { data: user, error } = await adminClient.from('users').select('*').eq('id', req.params.id).single();
      if (error || !user) return res.status(404).json({ error: 'Registration not found' });
      await storage.updateUser(req.params.id, { isActive: true, isVerified: true } as Record<string, unknown>);
      const accounts = await storage.getUserAccounts(req.params.id);
      if (accounts.length > 0) {
        await adminClient.from('accounts').update({ status: 'active', updated_at: new Date().toISOString() }).eq('user_id', req.params.id);
        if (initialBalance && parseFloat(String(initialBalance)) > 0) {
          await atomicBalanceUpdate(String(accounts[0].id), parseFloat(String(initialBalance)), 'Initial deposit upon approval');
        }
      } else {
        await storage.createAccount({ userId: req.params.id, accountNumber: generateAccountNumber(), accountType: 'checking', balance: String(initialBalance || '0.00'), currency: 'USD', status: 'active' } as unknown as InsertAccount);
      }
      await adminClient.from('alerts').insert({ user_id: req.params.id, title: 'Account Approved', message: 'Your account has been approved.', type: 'success', priority: 'high', is_read: false });
      return res.json({ success: true, message: 'Registration approved successfully' });
    } catch { return res.status(500).json({ error: 'Failed to approve registration' }); }
  }));

  // POST /api/admin/reject-registration/:id
  app.post('/api/admin/reject-registration/:id', requireAdmin, wrap(async (req, res) => {
    try {
      const { reason } = req.body;
      const adminClient = getAdminClient();
      const { data: user, error } = await adminClient.from('users').select('email').eq('id', req.params.id).single();
      if (error || !user) return res.status(404).json({ error: 'Registration not found' });
      await adminClient.from('users').update({ is_active: false, is_verified: false, updated_at: new Date().toISOString() }).eq('id', req.params.id);
      await adminClient.from('accounts').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('user_id', req.params.id);
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (admin) await storage.createAdminAction({ adminId: admin.id, action: 'reject_registration', targetType: 'user', targetId: req.params.id, details: { reason: reason || 'No reason provided' } });
      return res.json({ success: true, message: 'Registration rejected' });
    } catch { return res.status(500).json({ error: 'Failed to reject registration' }); }
  }));

  // GET /api/admin/chat-sessions
  app.get('/api/admin/chat-sessions', requireAdmin, wrap(async (req, res) => {
    try {
      const { data, error } = await getAdminClient().from('messages')
        .select('conversation_id, sender_id, sender_name, sender_role, message, is_read, created_at, recipient_id')
        .order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      const sessionMap = new Map<string, Record<string, unknown>>();
      for (const msg of (data || []) as Array<Record<string, unknown>>) {
        const sid = msg.conversation_id as string;
        if (!sid) continue;
        if (!sessionMap.has(sid)) {
          sessionMap.set(sid, {
            id: sid,
            customerName: msg.sender_role === 'customer' ? msg.sender_name : 'Unknown',
            customerId: msg.sender_role === 'customer' ? msg.sender_id : msg.recipient_id,
            lastMessage: msg.message, lastMessageAt: msg.created_at,
            unreadCount: msg.sender_role === 'customer' && !msg.is_read ? 1 : 0,
          });
        } else {
          const s = sessionMap.get(sid)!;
          if (msg.sender_role === 'customer' && !msg.is_read) s.unreadCount = (s.unreadCount as number) + 1;
        }
      }
      return res.json(Array.from(sessionMap.values()));
    } catch { return res.status(500).json({ error: 'Failed to fetch chat sessions' }); }
  }));

  // POST /api/admin/customers/:id/profile-picture
  app.post('/api/admin/customers/:id/profile-picture', requireAdmin, wrap(async (req, res) => {
    try {
      const { profilePhoto, photoUrl } = req.body;
      const photoData = profilePhoto || photoUrl;
      if (!photoData) return res.status(400).json({ error: 'Profile photo data required' });
      if (typeof photoData === 'string' && !photoData.startsWith('data:') && !/^https?:\/\/.+/.test(photoData)) {
        return res.status(400).json({ error: 'Invalid photo format' });
      }
      const updatedUser = await storage.updateUser(req.params.id, { profilePhoto: photoData } as Record<string, unknown>);
      if (!updatedUser) return res.status(404).json({ error: 'Customer not found' });
      return res.json({ success: true, message: 'Profile photo updated', user: sanitizeUser(updatedUser as unknown as Record<string, unknown>) });
    } catch { return res.status(500).json({ error: 'Failed to upload profile photo' }); }
  }));

  // PATCH /api/admin/transactions/:id
  app.patch('/api/admin/transactions/:id', requireAdmin, wrap(async (req, res) => {
    try {
      const { status, notes } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });
      const admin = await storage.getUserByEmail(req.user?.email || '');
      const txn = await storage.updateTransactionStatus(req.params.id, status, admin?.id || '', notes);
      if (!txn) return res.status(404).json({ error: 'Transaction not found' });
      return res.json(txn);
    } catch { return res.status(500).json({ error: 'Failed to update transaction' }); }
  }));

  // POST /api/user/change-pin
  app.post('/api/user/change-pin', requireAuth, authRateLimiter, wrap(async (req, res) => {
    try {
      const { currentPin, newPin } = req.body;
      if (!currentPin || !newPin || !/^\d{4,6}$/.test(String(newPin))) return res.status(400).json({ error: 'Current PIN and new PIN (4-6 digits) required' });
      const user = await storage.getUserByEmail(req.user?.email || '');
      if (!user || !user.transferPin) return res.status(401).json({ error: 'PIN not set on account' });
      const pinMatch = await bcrypt.compare(String(currentPin).trim(), String(user.transferPin).trim());
      if (!pinMatch) return res.status(401).json({ error: 'Current PIN is incorrect' });
      const pinHash = await bcrypt.hash(String(newPin), 12);
      await storage.updateUser(user.id, { transferPin: pinHash });
      return res.json({ success: true, message: 'PIN changed successfully' });
    } catch { return res.status(500).json({ error: 'Failed to change PIN' }); }
  }));
}
