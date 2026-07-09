import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-factory';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string | number;
    email: string;
    role?: string;
  };
}

// Cached Supabase admin client (created once, reused)
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

// Verify a Supabase JWT by asking Supabase Auth to retrieve the user.
// This validates the token signature server-side — a forged token will be rejected.
async function verifySupabaseToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const supabase = getSupabaseAdmin();
    // getUser(jwt) validates the JWT signature and returns the user if valid
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return null;
    }
    return {
      userId: data.user.id,
      email: data.user.email || '',
    };
  } catch {
    return null;
  }
}

// AUTHENTICATION MIDDLEWARE: Validates Supabase JWT tokens with signature verification
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Step 1: Verify JWT signature via Supabase Auth
    const verified = await verifySupabaseToken(token);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const { userId, email } = verified;

    if (!email) {
      return res.status(401).json({ error: 'Invalid token - no email in JWT' });
    }

    // Step 2: Verify account exists in database
    let dbUser = await storage.getUserByEmail(email);

    if (!dbUser) {
      // Sync from Supabase Auth if not in database
      try {
        const supabase = getSupabaseAdmin();
        const { data: supabaseUser } = await supabase.auth.admin.getUserById(userId);
        if (supabaseUser?.user && supabaseUser.user.email === email) {
          dbUser = await storage.createUser({
            username: email.split('@')[0],
            email: email,
            password: 'supabase_auth',
            firstName: supabaseUser.user.user_metadata?.first_name || email.split('@')[0],
            lastName: supabaseUser.user.user_metadata?.last_name || 'User',
            phone: supabaseUser.user.user_metadata?.phone || '',
            profession: 'Not provided',
            accountNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`,
            accountId: Date.now(),
            balance: '0',
            isActive: true,
            isVerified: true,
            transferPin: supabaseUser.user.user_metadata?.transfer_pin || '',
            role: supabaseUser.user.app_metadata?.role || 'customer'
          });
        }
      } catch (e) {
        // Supabase sync failed — continue to dbUser check
      }
    }

    if (!dbUser) {
      return res.status(403).json({
        error: 'Account not found. Please contact support.'
      });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({
        error: 'Account not approved. Please contact support.'
      });
    }

    // Attach verified user to request
    req.user = {
      id: dbUser.id,
      email: dbUser.email || email,
      role: dbUser.role || 'customer'
    };

    next();
  } catch (error: unknown) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Require admin role — must be called after requireAuth
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
