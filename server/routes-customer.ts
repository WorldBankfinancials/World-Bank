import { Express, Request, Response, RequestHandler } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { storage } from './storage-factory';
import { atomicBalanceUpdate, BankingTransaction } from './transaction-wrapper';
import { cryptoRandomInt } from './crypto-utils';
import { authRateLimiter } from './rate-limiter';

function wrap(handler: (req: AuthenticatedRequest, res: Response) => Promise<any>): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req as AuthenticatedRequest, res as Response)).catch(next);
}

function sanitizeUser(user: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!user) return {};
  const { password, transferPin, transfer_pin, password_hash, idNumber, identification_number, ...safe } = user;
  return safe;
}

export function setupCustomerRoutes(app: Express) {
  app.get('/api/alerts', requireAuth as RequestHandler, wrap(async (req: AuthenticatedRequest, res: Response) => {
    const user = await storage.getUserByEmail(req.user?.email || '');
    if (!user) return res.json([]);
    const alerts = await storage.getUserAlerts(user.id);
    return res.json(alerts);
  }));
