import { storage } from './storage-factory';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TERMINAL_STATUSES = ['completed', 'failed', 'reversed'];
// Use consistent status values matching routes-transfer.ts
const PENDING_STATUS = 'processing';
const APPROVED_STATUS = 'completed';
const REJECTED_STATUS = 'failed';

export async function approveTransfer(transactionId: string, adminId: string, notes?: string) {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error || !transaction) {
    throw new Error('Transaction not found');
  }

  if (TERMINAL_STATUSES.includes(transaction.status)) {
    throw new Error(`Transaction already in terminal state: ${transaction.status}`);
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ 
      status: APPROVED_STATUS,
      admin_notes: notes || '',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (updateError) throw new Error('Failed to approve transfer');

  await storage.createAdminAction({
    adminId,
    action: 'approve_transfer',
    targetType: 'transaction',
    targetId: transactionId,
    details: { notes, previousStatus: transaction.status, newStatus: APPROVED_STATUS },
  });

  return { success: true, status: APPROVED_STATUS };
}

export async function rejectTransfer(transactionId: string, adminId: string, notes: string) {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error || !transaction) {
    throw new Error('Transaction not found');
  }

  if (TERMINAL_STATUSES.includes(transaction.status)) {
    throw new Error(`Transaction already in terminal state: ${transaction.status}`);
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ 
      status: REJECTED_STATUS,
      admin_notes: notes,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (updateError) throw new Error('Failed to reject transfer');

  await createSupportTicketForRejection(transaction, adminId, notes);

  await storage.createAdminAction({
    adminId,
    action: 'reject_transfer',
    targetType: 'transaction',
    targetId: transactionId,
    details: { notes, previousStatus: transaction.status, newStatus: REJECTED_STATUS },
  });

  return { success: true, status: REJECTED_STATUS };
}

async function createSupportTicketForRejection(transaction: any, adminId: string, reason: string) {
  try {
    await storage.createSupportTicket({
      userId: transaction.from_user_id || transaction.user_id,
      subject: 'Transfer Request Rejected',
      description: `Your transfer of ${transaction.amount} ${transaction.currency} has been rejected. Reason: ${reason}`,
      status: 'open',
      priority: 'high',
      category: 'transfer',
      adminNotes: reason,
    });
  } catch (err) {
    console.error('[transfer-approval] Failed to create support ticket:', err);
  }
}
