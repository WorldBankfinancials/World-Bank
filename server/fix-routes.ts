import type { User, InsertUser, InsertTransaction, InsertAccount } from '@shared/schema';
import { generateAccountNumber, generateTransferPin, generateTransactionId, generateReferenceNumber, cryptoRandomInt } from './crypto-utils';
import { validateId, validateAmount } from './validators';
import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage-factory';
import { setupTransferRoutes } from './routes-transfer';
import { log } from './vite';
import { config, logConfiguration } from './config';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireAdmin, AuthenticatedRequest, getAdminClient } from './auth-middleware';
import { authRateLimiter, registrationRateLimiter, transactionRateLimiter, generalRateLimiter } from './rate-limiter';
import { validateRequest, registrationSchema, approvalSchema, balanceUpdateSchema, pinChangeSchema } from './validation-schemas';
import { BankingTransaction, atomicBalanceUpdate, atomicTransfer } from './transaction-wrapper';
import { errorHandler, notFoundHandler, asyncHandler, createApiError } from './error-handler';
import { runStartupChecks } from './startup-checks';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

type AsyncRequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<unknown> | unknown;
function wrapAsync(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
}

function sanitizeUser(user: Record<string, unknown> | object | null | undefined): Record<string, unknown> {
  if (!user) return {};
  const u = user as Record<string, unknown>;
  const { password, transferPin, transfer_pin, password_hash, idNumber, identification_number, ...safe } = u;
  return safe;
}

function sanitizeUsers(users: Record<string, unknown>[] | object[] | null | undefined): Record<string, unknown>[] {
  return (users || []).map(u => sanitizeUser(u));
}

function validatePasswordComplexity(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function sanitizeInput(str: string): string {
  return str.replace(/[<>]/g, '').trim().slice(0, 500);
}

function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
}

interface Transaction {
  id: string | number;
  createdAt: string | Date | null;
  status: string | null;
  amount: string | number;
  type: string;
  description?: string | null;
  recipientName?: string | null;
  recipientAccount?: string | null;
  referenceNumber?: string | null;
  fromAccountId?: string | number | null;
  toAccountId?: string | number | null;
  fromUserId?: string | number | null;
  currency?: string | null;
  recipientCountry?: string | null;
  updatedAt?: string | Date | null;
}

import { randomUUID } from 'crypto';

export async function registerRoutes(app: Express) {
  const api = {
    get:    (p: string, ...h: unknown[]) => app.get(p, ...(h as Parameters<typeof app.get>[1][])),
    post:   (p: string, ...h: unknown[]) => app.post(p, ...(h as Parameters<typeof app.post>[1][])),
    put:    (p: string, ...h: unknown[]) => app.put(p, ...(h as Parameters<typeof app.put>[1][])),
    patch:  (p: string, ...h: unknown[]) => app.patch(p, ...(h as Parameters<typeof app.patch>[1][])),
    delete: (p: string, ...h: unknown[]) => app.delete(p, ...(h as Parameters<typeof app.delete>[1][])),
  } as const;
  setupTransferRoutes(app as Express);

  api.get('/api/health', (req: Request, res: Response) => {
    try {
      return res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Health check failed' });
    }
  });

  api.get('/api/user', wrapAsync(requireAuth), wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUserByEmail(req.user?.email || '' as string);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const userData = sanitizeUser(user as unknown as Record<string, unknown>) as Record<string, unknown>;
      const { data: account } = await getAdminClient().from('accounts').select('balance').eq('user_id', userData.id).eq('status', 'active').limit(1).maybeSingle();
      if (account) userData.balance = (account as Record<string, unknown>).balance;
      return res.json(userData);
    } catch (error: unknown) { return res.status(500).json({ error: 'Failed to fetch user profile' }); }
  }));
