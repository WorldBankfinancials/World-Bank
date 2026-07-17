import { getAdminClient } from './auth-middleware';

/**
 * Process scheduled transactions that are due for execution.
 * Finds pending transactions with a scheduled date in the past and executes them.
 */
export async function processScheduledTransactions(_req?: unknown, _res?: unknown): Promise<void> {
  try {
    const adminClient = getAdminClient();
    const now = new Date().toISOString();
    const { data: pending, error } = await adminClient
      .from('transactions')
      .select('id, from_account_id, to_account_id, from_user_id, to_user_id, amount, transaction_type, description, reference_number, currency, recipient_name, recipient_country')
      .eq('status', 'pending')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', now)
      .limit(50);

    if (error || !pending || pending.length === 0) {
      console.info('No scheduled transactions to process');
      return;
    }

    const { atomicBalanceUpdate, atomicTransfer } = await import('./transaction-wrapper');
    let processed = 0;
    let failed = 0;

    for (const txn of pending as Array<Record<string, unknown>>) {
      try {
        const numAmount = parseFloat(String(txn.amount));
        const fromAccountId = txn.from_account_id ? String(txn.from_account_id) : null;
        const toAccountId = txn.to_account_id ? String(txn.to_account_id) : null;

        if (fromAccountId && toAccountId) {
          // Internal scheduled transfer: update the existing row, don't create a new one
          const result = await atomicTransfer({
            fromAccountId,
            toAccountId,
            fromUserId: txn.from_user_id ? String(txn.from_user_id) : undefined,
            amount: numAmount,
            transactionType: String(txn.transaction_type || 'scheduled'),
            description: String(txn.description || 'Scheduled transaction'),
            currency: String(txn.currency || 'USD'),
            referenceNumber: txn.reference_number ? String(txn.reference_number) : undefined,
          });
          if (result.success) {
            // Mark the original pending row as completed
            await adminClient.from('transactions').update({ status: 'completed', completed_at: now }).eq('id', String(txn.id));
            processed++;
          } else failed++;
        } else if (fromAccountId) {
          const result = await atomicBalanceUpdate(fromAccountId, -numAmount, String(txn.description || 'Scheduled debit'));
          if (result.success) {
            await adminClient.from('transactions').update({ status: 'completed', completed_at: now }).eq('id', String(txn.id));
            processed++;
          } else failed++;
        } else if (toAccountId) {
          const result = await atomicBalanceUpdate(toAccountId, numAmount, String(txn.description || 'Scheduled credit'));
          if (result.success) {
            await adminClient.from('transactions').update({ status: 'completed', completed_at: now }).eq('id', String(txn.id));
            processed++;
          } else failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    console.info(`Scheduled transactions: ${processed} processed, ${failed} failed`);
  } catch (error: unknown) {
    console.error('Error processing scheduled transactions:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Send transaction alert to a user via the alerts table.
 * Matches transactions with status 'completed' OR 'success' (both are used in the codebase).
 * Resolves user IDs from account IDs when from_user_id/to_user_id are null.
 */
export async function sendTransactionAlert(_req?: unknown, _res?: unknown): Promise<void> {
  try {
    const adminClient = getAdminClient();
    const { data: recentTxns, error } = await adminClient
      .from('transactions')
      .select('id, from_user_id, to_user_id, from_account_id, to_account_id, amount, currency, transaction_type, status, created_at')
      .in('status', ['completed', 'success'])
      .is('alert_sent', null)
      .limit(100);

    if (error || !recentTxns || recentTxns.length === 0) {
      console.info('No transaction alerts to send');
      return;
    }

    const alerts: Array<Record<string, unknown>> = [];
    for (const txn of recentTxns as Array<Record<string, unknown>>) {
      const amount = parseFloat(String(txn.amount));
      const currency = String(txn.currency || 'USD');
      const type = String(txn.transaction_type || 'transaction');
      const txnId = String(txn.id);

      // Resolve from_user_id from account if not set directly
      let fromUserId = txn.from_user_id;
      if (!fromUserId && txn.from_account_id) {
        const { data: acc } = await adminClient.from('accounts').select('user_id').eq('id', String(txn.from_account_id)).single();
        if (acc) fromUserId = (acc as Record<string, unknown>).user_id;
      }

      // Resolve to_user_id from account if not set directly
      let toUserId = txn.to_user_id;
      if (!toUserId && txn.to_account_id) {
        const { data: acc } = await adminClient.from('accounts').select('user_id').eq('id', String(txn.to_account_id)).single();
        if (acc) toUserId = (acc as Record<string, unknown>).user_id;
      }

      if (fromUserId) {
        alerts.push({
          user_id: fromUserId,
          title: 'Transaction Completed',
          message: `Your ${type} of ${amount.toFixed(2)} ${currency} has been completed.`,
          type: 'success',
          priority: 'normal',
          is_read: false,
        });
      }
      if (toUserId && toUserId !== fromUserId) {
        alerts.push({
          user_id: toUserId,
          title: 'Received Funds',
          message: `You received ${amount.toFixed(2)} ${currency} via ${type}.`,
          type: 'success',
          priority: 'normal',
          is_read: false,
        });
      }

      await adminClient.from('transactions').update({ alert_sent: new Date().toISOString() }).eq('id', txnId);
    }

    if (alerts.length > 0) {
      const { error: alertError } = await adminClient.from('alerts').insert(alerts);
      if (alertError) {
        console.error('Failed to insert alerts:', alertError.message);
      } else {
        console.info(`Sent ${alerts.length} transaction alerts`);
      }
    }
  } catch (error: unknown) {
    console.error('Error sending transaction alerts:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Generate monthly statements for all active users.
 * Matches transactions with status 'completed' OR 'success'.
 */
export async function generateMonthlyStatements(_req?: unknown, _res?: unknown): Promise<void> {
  try {
    const adminClient = getAdminClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const { data: users, error: userError } = await adminClient
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('is_active', true)
      .eq('role', 'customer');

    if (userError || !users || users.length === 0) {
      console.info('No active users for monthly statements');
      return;
    }

    let generated = 0;
    for (const user of users as Array<Record<string, unknown>>) {
      const userId = user.id;
      const { data: accounts } = await adminClient
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!accounts || accounts.length === 0) continue;

      const accountIds = accounts.map((a: Record<string, unknown>) => a.id);
      const { data: txns, error: txnError } = await adminClient
        .from('transactions')
        .select('amount, transaction_type, status, created_at, from_account_id, to_account_id')
        .in('status', ['completed', 'success'])
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`);

      if (txnError || !txns) continue;

      const totalCredits = txns
        .filter((t: Record<string, unknown>) => t.to_account_id && accountIds.includes(t.to_account_id))
        .reduce((sum: number, t: Record<string, unknown>) => sum + parseFloat(String(t.amount || '0')), 0);
      const totalDebits = txns
        .filter((t: Record<string, unknown>) => t.from_account_id && accountIds.includes(t.from_account_id))
        .reduce((sum: number, t: Record<string, unknown>) => sum + parseFloat(String(t.amount || '0')), 0);

      const statementNumber = `STMT${now.getFullYear()}${(now.getMonth())}${Math.floor(Math.random() * 10000)}`;
      const { error: stmtError } = await adminClient.from('statements').insert({
        user_id: userId,
        statement_number: statementNumber,
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString(),
        total_credits: totalCredits.toFixed(2),
        total_debits: totalDebits.toFixed(2),
        net_change: (totalCredits - totalDebits).toFixed(2),
        transaction_count: txns.length,
        status: 'generated',
        generated_at: now.toISOString(),
      });

      if (!stmtError) generated++;
    }

    console.info(`Generated ${generated} monthly statements`);
  } catch (error: unknown) {
    console.error('Error generating monthly statements:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Reconcile account balances by checking for discrepancies between
 * transaction sums and current account balances.
 * Matches transactions with status 'completed' OR 'success'.
 */
export async function reconcileBalances(_req?: unknown, _res?: unknown): Promise<void> {
  try {
    const adminClient = getAdminClient();
    const { data: accounts, error } = await adminClient
      .from('accounts')
      .select('id, user_id, balance, account_number')
      .eq('status', 'active');

    if (error || !accounts || accounts.length === 0) {
      console.info('No accounts to reconcile');
      return;
    }

    let reconciled = 0;
    let discrepancies = 0;

    for (const account of accounts as Array<Record<string, unknown>>) {
      const accountId = account.id;
      const currentBalance = parseFloat(String(account.balance || '0'));

      const { data: credits } = await adminClient
        .from('transactions')
        .select('amount')
        .eq('to_account_id', accountId)
        .in('status', ['completed', 'success']);

      const { data: debits } = await adminClient
        .from('transactions')
        .select('amount')
        .eq('from_account_id', accountId)
        .in('status', ['completed', 'success']);

      const totalCredits = (credits || []).reduce((sum: number, t: Record<string, unknown>) => sum + parseFloat(String(t.amount || '0')), 0);
      const totalDebits = (debits || []).reduce((sum: number, t: Record<string, unknown>) => sum + parseFloat(String(t.amount || '0')), 0);
      const computedBalance = totalCredits - totalDebits;

      const diff = Math.abs(currentBalance - computedBalance);
      if (diff > 0.01) {
        console.warn(`Balance discrepancy for account ${account.account_number}: db=${currentBalance.toFixed(2)}, computed=${computedBalance.toFixed(2)}, diff=${diff.toFixed(2)}`);
        discrepancies++;
      } else {
        reconciled++;
      }
    }

    console.info(`Reconciliation: ${reconciled} OK, ${discrepancies} discrepancies found`);
  } catch (error: unknown) {
    console.error('Error reconciling balances:', error instanceof Error ? error.message : 'Unknown error');
  }
}
