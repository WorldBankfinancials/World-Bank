import { Express, RequestHandler } from 'express';
import { requireAdmin, requireAuth, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { storage } from './storage-factory';
import { atomicBalanceUpdate } from './transaction-wrapper';

function wrap(handler: (req: AuthenticatedRequest, res: any) => Promise<any>): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req as AuthenticatedRequest, res as any)).catch(next);
}

export function setupAdminExtra2Routes(app: Express) {
  app.get('/api/admin/support-tickets', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { data, error } = await getAdminClient().from('support_tickets')
        .select('*, users(email, first_name, last_name)').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/admin/tickets/:id/respond', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { message } = req.body;
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (!admin) return res.status(404).json({ error: 'Admin not found' });
      const { data: ticket } = await getAdminClient().from('support_tickets')
        .select('user_id').eq('id', req.params.id).single();
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
      const msg = await storage.createMessage({
        senderId: admin.id,
        senderName: `Admin ${admin.firstName} ${admin.lastName}`,
        senderRole: 'admin',
        conversationId: `ticket-${req.params.id}`,
        message,
        isRead: false,
      } as any);
      await getAdminClient().from('support_tickets').update({ status: 'responded', updated_at: new Date().toISOString() }).eq('id', req.params.id);
      return res.json(msg);
    } catch { return res.status(500).json({ error: 'Failed to respond to ticket' }); }
  }));

  app.get('/api/admin/pending-transfers', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { data, error } = await getAdminClient().from('transactions')
        .select('*, accounts!from_account_id(account_number, users(email, first_name, last_name))')
        .eq('status', 'pending').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/admin/transfers/:id/approve', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { data: txn, error } = await getAdminClient().from('transactions')
        .select('*').eq('id', req.params.id).single();
      if (error || !txn) return res.status(404).json({ error: 'Transfer not found' });
      if (txn.status !== 'pending') return res.status(400).json({ error: 'Transfer is not pending' });
      const admin = await storage.getUserByEmail(req.user?.email || '');
      if (txn.to_account_id) {
        await atomicBalanceUpdate(String(txn.to_account_id), parseFloat(String(txn.amount)), `Approved transfer credit`);
      }
      await getAdminClient().from('transactions').update({
        status: 'completed', approved_by: admin?.id, approved_at: new Date().toISOString(), completed_at: new Date().toISOString()
      }).eq('id', req.params.id);
      return res.json({ success: true, message: 'Transfer approved' });
    } catch { return res.status(500).json({ error: 'Failed to approve transfer' }); }
  }));

  app.post('/api/admin/transfers/:id/reject', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { reason } = req.body;
      const { data: txn, error } = await getAdminClient().from('transactions')
        .select('*').eq('id', req.params.id).single();
      if (error || !txn) return res.status(404).json({ error: 'Transfer not found' });
      if (txn.status !== 'pending') return res.status(400).json({ error: 'Transfer is not pending' });
      if (txn.from_account_id) {
        await atomicBalanceUpdate(String(txn.from_account_id), parseFloat(String(txn.amount)), `Refund: rejected transfer`);
      }
      await getAdminClient().from('transactions').update({
        status: 'rejected', admin_notes: reason || 'Rejected by admin'
      }).eq('id', req.params.id);
      return res.json({ success: true, message: 'Transfer rejected, funds refunded' });
    } catch { return res.status(500).json({ error: 'Failed to reject transfer' }); }
  }));

  app.get('/api/admin/transactions', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { data, error } = await getAdminClient().from('transactions')
        .select('*, accounts!from_account_id(account_number, users(email, first_name, last_name))')
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/admin/transactions', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { fromAccountId, toAccountId, amount, transactionType, description, status } = req.body;
      const admin = await storage.getUserByEmail(req.user?.email || '');
      const txn = await storage.createTransaction({
        fromAccountId: fromAccountId || null,
        toAccountId: toAccountId || null,
        amount: parseFloat(String(amount)),
        transactionType: transactionType || 'admin_adjustment',
        description: description || 'Admin transaction',
        status: status || 'completed',
        approvedBy: admin?.id,
      } as any);
      return res.json(txn);
    } catch { return res.status(500).json({ error: 'Failed to create transaction' }); }
  }));

  app.post('/api/transactions/:id/reverse', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { data: txn, error } = await getAdminClient().from('transactions')
        .select('*').eq('id', req.params.id).single();
      if (error || !txn) return res.status(404).json({ error: 'Transaction not found' });
      if (txn.status === 'reversed') return res.status(400).json({ error: 'Transaction already reversed' });
      if (txn.status !== 'completed' && txn.status !== 'success') {
        return res.status(400).json({ error: 'Only completed transactions can be reversed' });
      }
      if (txn.from_account_id) {
        await atomicBalanceUpdate(String(txn.from_account_id), parseFloat(String(txn.amount)), `Reversal credit`);
      }
      if (txn.to_account_id) {
        await atomicBalanceUpdate(String(txn.to_account_id), -parseFloat(String(txn.amount)), `Reversal debit`);
      }
      await getAdminClient().from('transactions').update({ status: 'reversed' }).eq('id', req.params.id);
      return res.json({ success: true, message: 'Transaction reversed' });
    } catch { return res.status(500).json({ error: 'Failed to reverse transaction' }); }
  }));

  app.post('/api/admin/reset-password', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword) return res.status(400).json({ error: 'userId and newPassword required' });
      const { data, error } = await getAdminClient().auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      return res.json({ success: true, message: 'Password reset successfully' });
    } catch { return res.status(500).json({ error: 'Failed to reset password' }); }
  }));

  app.post('/api/admin/set-user-role', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });
      const updated = await storage.updateUser(userId, { role } as any);
      return res.json({ success: true, user: updated });
    } catch { return res.status(500).json({ error: 'Failed to set user role' }); }
  }));

  app.delete('/api/admin/delete-user/:email', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await getAdminClient().from('users').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', user.id);
      await getAdminClient().from('accounts').update({ status: 'closed' }).eq('user_id', user.id);
      return res.json({ success: true, message: 'User deactivated' });
    } catch { return res.status(500).json({ error: 'Failed to delete user' }); }
  }));

  app.post('/api/admin/customers/:id/balance', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { amount, action } = req.body;
      const numAmount = parseFloat(String(amount));
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });
      const accounts = await storage.getUserAccounts(req.params.id);
      if (!accounts || accounts.length === 0) return res.status(404).json({ error: 'No account found' });
      const delta = action === 'debit' ? -numAmount : numAmount;
      const result = await atomicBalanceUpdate(String(accounts[0].id), delta, `Admin ${action || 'credit'}`);
      if (!result.success) return res.status(400).json({ error: result.error });
      const admin = await storage.getUserByEmail(req.user?.email || '');
      await storage.createTransaction({
        fromAccountId: action === 'debit' ? String(accounts[0].id) : null,
        toAccountId: action === 'credit' ? String(accounts[0].id) : null,
        amount: numAmount,
        transactionType: 'admin_adjustment',
        description: `Admin ${action || 'credit'} by ${admin?.email || 'admin'}`,
        status: 'completed',
        approvedBy: admin?.id,
      } as any);
      return res.json({ success: true, newBalance: result.newBalance });
    } catch { return res.status(500).json({ error: 'Failed to adjust balance' }); }
  }));

  app.post('/api/admin/users/:id/profile-photo', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { profilePhoto, photoUrl } = req.body;
      const photoData = profilePhoto || photoUrl;
      if (!photoData) return res.status(400).json({ error: 'Profile photo data required' });
      const updated = await storage.updateUser(req.params.id, { profilePhoto: photoData } as any);
      return res.json({ success: true, user: updated });
    } catch { return res.status(500).json({ error: 'Failed to upload profile photo' }); }
  }));

  app.get('/api/admin/transaction-routes', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { data, error } = await getAdminClient().from('transaction_routes')
        .select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    } catch { return res.json([]); }
  }));

  app.post('/api/admin/transaction-routes', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { name, description, transactionType, minAmount, maxAmount, requiresApproval } = req.body;
      const { data, error } = await getAdminClient().from('transaction_routes').insert({
        name, description: description || '', transaction_type: transactionType,
        min_amount: minAmount || 0, max_amount: maxAmount || 1000000,
        requires_approval: requiresApproval || false, is_active: true,
      }).select().single();
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to create transaction route' }); }
  }));

  app.patch('/api/admin/transaction-routes/:id', requireAdmin, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { name, description, isActive, requiresApproval } = req.body;
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (isActive !== undefined) updates.is_active = isActive;
      if (requiresApproval !== undefined) updates.requires_approval = requiresApproval;
      const { data, error } = await getAdminClient().from('transaction_routes')
        .update(updates).eq('id', req.params.id).select().single();
      if (error) throw error;
      return res.json(data);
    } catch { return res.status(500).json({ error: 'Failed to update transaction route' }); }
  }));

  app.post('/api/objects/upload', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { bucket, path: filePath, contentType, data } = req.body;
      if (!bucket || !filePath || !data) return res.status(400).json({ error: 'bucket, path, and data required' });
      const buffer = Buffer.from(data, 'base64');
      const { uploadFile, getFileUrl } = await import('./supabase-public-storage');
      const result = await uploadFile(bucket, filePath, buffer, contentType || 'application/octet-stream');
      const url = await getFileUrl(bucket, filePath);
      return res.json({ success: true, path: result?.path || filePath, url });
    } catch { return res.status(500).json({ error: 'Failed to upload file' }); }
  }));
}
