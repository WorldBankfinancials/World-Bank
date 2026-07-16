import { processScheduledTransactions, sendTransactionAlert, generateMonthlyStatements, reconcileBalances } from '../server/serverless';
import type { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const secret = process.env.SERVERLESS_SECRET;
  const authHeader = req.headers.authorization || '';
  const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!secret || !providedToken || providedToken !== secret) {
    return res.status(401).json({ error: 'Unauthorized: valid Bearer token required' });
  }
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
