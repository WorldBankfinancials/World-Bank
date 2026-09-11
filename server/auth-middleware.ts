/**
 * server/auth-middleware.ts
 *
 * Middleware that verifies Supabase JWTs server-side and looks up the user
 * in the user_profiles table (the primary user table in this DB).
 *
 * req.user = { id: UUID string, email: string, role: UserRole }
 */
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-factory';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@shared/schema';
import type { AuthUser } from '@shared/types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

let _adminClient: ReturnType<typeof createClient> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _adminClient;
}

async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { data, error } = await getAdminClient().auth.getUser(token);
    if (error || !data?.user) return null;
    return { userId: data.user.id, email: data.user.email || '' };
  } catch {
    return null;
  }
}

/**
 * requireAuth middleware:
 * 1. Validates Supabase JWT signature server-side.
 * 2. Looks up user in user_profiles by email.
 * 3. If not found, auto-creates a user_profiles row from Supabase Auth metadata.
 * 4. Rejects inactive accounts.
 * 5. Attaches req.user = { id (UUID), email, role }.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = header.slice(7).trim();
    const verified = await verifyToken(token);
    if (!verified || !verified.email) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const { userId, email } = verified;

    let user = await storage.getUserByEmail(email);

    if (!user) {
      // Auto-sync: create user_profiles row from Supabase Auth
      try {
        const { data: authData } = await getAdminClient().auth.admin.getUserById(userId);
        const meta    = authData?.user?.user_metadata   ?? {};
        const appMeta = authData?.user?.app_metadata    ?? {};
        const firstName = meta.first_name || email.split('@')[0];
        const lastName  = meta.last_name  || 'User';
        user = await storage.createUser({
          email,
          fullName:  `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          phone:     meta.phone || '',
          role:      appMeta.role || 'customer',
          isActive:  true,
          isVerified: true,
          balance:   '0.00',
          accountNumber: `WB${Math.floor(10_000_000 + Math.random() * 90_000_000)}`,
        });
      } catch (syncErr) {
        console.error('[auth] user sync failed:', syncErr);
        res.status(403).json({ error: 'Account not found. Contact support.' });
        return;
      }
    }

    if (!user) {
      res.status(403).json({ error: 'Account not found. Contact support.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'Account pending approval. Contact support to activate your account.',
      });
      return;
    }

    req.user = {
      id:    String(user.id),
      email: user.email,
      role:  (user.role as any) || 'customer',
    };

    next();
  } catch (err) {
    console.error('[auth] requireAuth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * requireAdmin: requires role === 'admin'.
 * Calls requireAuth internally.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}
