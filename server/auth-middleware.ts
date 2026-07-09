import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-factory';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;      // UUID from auth.uid()
    email: string;
    role: string;    // customer | admin | support | compliance
  };
}

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

async function verifySupabaseToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return { userId: data.user.id, email: data.user.email || '' };
  } catch {
    return null;
  }
}

/**
 * AUTHENTICATION MIDDLEWARE
 * 1. Validates Supabase JWT signature server-side.
 * 2. Looks up the user in wb_users by email.
 * 3. If not in wb_users, auto-creates the row (sync from Supabase Auth).
 * 4. Blocks inactive accounts.
 * 5. Attaches req.user = { id (UUID), email, role }.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7).trim();
    const verified = await verifySupabaseToken(token);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const { userId, email } = verified;
    if (!email) {
      return res.status(401).json({ error: 'Invalid token: no email claim' });
    }

    // Look up user in wb_users (the primary table)
    let dbUser = await storage.getUserByEmail(email);

    if (!dbUser) {
      // Auto-sync: user authenticated but no wb_users row yet — create it.
      try {
        const supabase = getSupabaseAdmin();
        const { data: authData } = await supabase.auth.admin.getUserById(userId);
        const meta = authData?.user?.user_metadata ?? {};
        const appMeta = authData?.user?.app_metadata ?? {};
        dbUser = await storage.createUser({
          email,
          firstName: meta.first_name || email.split('@')[0],
          lastName:  meta.last_name  || 'User',
          phone:     meta.phone      || '',
          role:      appMeta.role    || 'customer',
          isActive:  true,
          isVerified: true,
          accountNumber: `WB${Math.floor(10000000 + Math.random() * 90000000)}`,
          balance:   '0.00',
        });
      } catch (syncError) {
        // If sync fails, deny access — don't create partial records
        console.error('[auth] wb_users sync failed:', syncError);
        return res.status(403).json({ error: 'Account not found. Please contact support.' });
      }
    }

    if (!dbUser) {
      return res.status(403).json({ error: 'Account not found. Please contact support.' });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({
        error: 'Account pending approval. Contact support to activate your account.',
      });
    }

    req.user = {
      id:    String(dbUser.id),
      email: dbUser.email,
      role:  dbUser.role || 'customer',
    };

    next();
  } catch (error) {
    console.error('[auth] requireAuth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * ADMIN MIDDLEWARE — requires role = 'admin'.
 * Must be used after requireAuth or as a standalone (calls requireAuth internally).
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
