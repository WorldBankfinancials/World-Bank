import { processScheduledTransactions, sendTransactionAlert, generateMonthlyStatements, reconcileBalances } from '../server/serverless';

export default async (req: any, res: any) => {
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
