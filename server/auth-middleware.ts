/**
 * server/auth-middleware.ts
 *
 * Verifies Supabase JWTs server-side.
 * Looks up user in users (primary user table).
 * req.user = { id: UUID string, email: string, role: UserRole }
 */
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-factory';
import { getAdminClient } from './supabase-public-storage';
import type { User } from '@shared/schema';
import type { AuthUser } from '@shared/types';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
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
      // SECURITY: Do NOT auto-create users. If a Supabase Auth user has no local profile,
      // they must complete the registration flow (/api/auth/register-complete).
      res.status(403).json({ error: 'Account not found. Please complete registration or contact support.' });
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
      role:  user.role || 'customer',
    };

    next();
  } catch (err) {
    console.error('[auth] requireAuth error:', err);
    if (err instanceof Error && err.message.includes('Invalid token')) {
      res.status(401).json({ error: 'Authentication failed' });
    } else {
      res.status(500).json({ error: 'Authentication service error' });
    }
  }
}

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
