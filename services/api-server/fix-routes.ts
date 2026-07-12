import type { User, InsertTransaction } from '@packages/shared/schema';
import { generateAccountNumber, generateTransferPin, generateTransactionId, generateReferenceNumber } from './crypto-utils';
import { randomUUID } from 'crypto';
import { validateId, validateAmount } from './validators';
import { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import { storage } from './storage-factory';
import { config, logConfiguration } from './config';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireAdmin, AuthenticatedRequest } from './middleware/auth-middleware';
import { 
  authRateLimiter, 
  registrationRateLimiter, 
  transactionRateLimiter, 
  generalRateLimiter 
} from './middleware/rate-limiter';
import { 
  validateRequest, 
  registrationSchema, 
  approvalSchema,
  balanceUpdateSchema,
  pinChangeSchema
} from './validation-schemas';
import { BankingTransaction, atomicBalanceUpdate, atomicTransfer } from './transaction-wrapper';
import { runStartupChecks } from './startup-checks';
import * as bcrypt from 'bcryptjs';

// Type definitions for transactions
interface Transaction {
  id: string | number;
  createdAt: string | Date | null | undefined;
  status: string | null;
  amount: string | number;
  type: string;
  description?: string | null;
  recipientName?: string | null;
  recipientAccount?: string | null;
  referenceNumber?: string | null;
  fromAccountId?: string | number | null;
  toAccountId?: string | number | null;
  currency?: string | null;
  recipientBank?: string | null;
}

interface Investment {
  id: number;
  userId: number;
  type: string;
  symbol: string;
  shares: string;
  averagePrice: string;
  currentPrice: string;
  status: string;
  asset_type?: string;
  assetType?: string;
  total_value?: string | number;
  totalValue?: string | number;
  gain_loss?: string | number;
  gainLoss?: string | number;
}

interface Alert {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean | null;
  createdAt: Date | null;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Fixed route handlers with proper typing
export async function registerFixedRoutes(app: Express): Promise<Server> {
  logConfiguration();
  
  // CRITICAL: Run startup sanity checks to verify database functions
  await runStartupChecks();
  
  // Runtime config endpoint - serves Supabase credentials to frontend
  app.get('/api/config', (req: Request, res: Response) => {
    return res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    });
  });
  
  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    return res.json({ status: 'OK', timestamp: new Date() });
  });