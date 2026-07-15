/**
 * SERVERLESS FUNCTIONS FOR VERCEL DEPLOYMENT
 * These handle critical banking operations outside the main Express server
 * Deploy to Vercel with: vercel deploy
 */

import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Type aliases for Vercel compatibility
type VercelRequest = Request;
type VercelResponse = Response;

// Initialize Supabase client for serverless context
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * SERVERLESS: Process scheduled transactions
 * Trigger: Cron job every 5 minutes
 */
export async function processScheduledTransactions(req: VercelRequest, res: VercelResponse) {
  try {
    // Check secret token to prevent unauthorized access
    if (req.headers['authorization'] !== `Bearer ${process.env.SERVERLESS_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: pendingTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Process each pending transaction
    for (const transaction of pendingTransactions || []) {
      await supabase
        .from('transactions')
        .update({ status: 'auto_rejected', admin_notes: 'Auto-rejected: Expired after 24 hours' })
        .eq('id', transaction.id);
    }

    res.status(200).json({ 
      success: true, 
      processed: pendingTransactions?.length || 0 
    });
  } catch (error: unknown) {
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
}

/**
 * SERVERLESS: Send real-time alerts
 * Trigger: API call from frontend when transaction detected
 */
export async function sendTransactionAlert(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check secret token to prevent unauthorized access
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.SERVERLESS_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { userId, transactionId, amount, type } = req.body;

    // Validate required fields
    if (!userId || !transactionId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create alert in database
    const { data: alert, error } = await supabase
      .from('alerts')
      .insert([
        {
          user_id: userId,
          type: 'transaction',
          title: `Transaction ${type}: ${amount}`,
          message: `Your ${type} transaction of ${amount} has been processed.`,
          status: 'unread',
          created_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Notify via Supabase real-time channels
    const channel = supabase.channel(`alerts:${userId}`);
    channel.send({
      type: 'broadcast',
      event: 'new_alert',
      payload: alert
    });

    res.status(200).json({ success: true, alert });
  } catch (error: unknown) {
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
}

/**
 * SERVERLESS: Generate monthly statements
 * Trigger: 1st of every month at 00:00 UTC
 */
export async function generateMonthlyStatements(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.headers['authorization'] !== `Bearer ${process.env.SERVERLESS_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, account_number')
      .eq('is_active', true);

    if (usersError) throw usersError;

    for (const user of users || []) {
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('from_user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Create statement document
      await supabase.from('documents').insert([
        {
          user_id: user.id,
          document_type: 'monthly_statement',
          url: `/statements/${user.id}_${new Date().getFullYear()}_${new Date().getMonth() + 1}.pdf`,
          status: 'generated',
          uploaded_at: new Date()
        }
      ]);
    }

    res.status(200).json({ 
      success: true, 
      statementsGenerated: users?.length || 0 
    });
  } catch (error: unknown) {
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
}

/**
 * SERVERLESS: Balance verification and reconciliation
 * Trigger: Every 6 hours
 */
export async function reconcileBalances(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.headers['authorization'] !== `Bearer ${process.env.SERVERLESS_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, user_id, balance');

    if (error) throw error;

    let reconciled = 0;
    for (const account of accounts || []) {
      // Calculate actual balance from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .or(`from_account_id.eq.${account.id},to_account_id.eq.${account.id}`);

      let calculatedBalance = 0;
      (transactions || []).forEach(tx => {
        if (tx.type === 'credit') calculatedBalance += parseFloat(tx.amount);
        else calculatedBalance -= parseFloat(tx.amount);
      });

      // Update if mismatch detected
      if (Math.abs(parseFloat(account.balance) - calculatedBalance) > 0.01) {
        await supabase
          .from('accounts')
          .update({ balance: calculatedBalance.toString() })
          .eq('id', account.id);
        reconciled++;
      }
    }

    res.status(200).json({ 
      success: true, 
      accountsReconciled: reconciled 
    });
  } catch (error: unknown) {
    res.status(500).json({ error: (error instanceof Error ? error.message : 'Internal server error') });
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const { action } = req.query;

  switch (action) {
    case 'process-transactions':
      return processScheduledTransactions(req, res);
    case 'send-alert':
      return sendTransactionAlert(req, res);
    case 'generate-statements':
      return generateMonthlyStatements(req, res);
    case 'reconcile':
      return reconcileBalances(req, res);
    default:
      return res.status(400).json({ error: 'Unknown action' });
  }
};