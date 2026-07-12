import { Response, NextFunction } from 'express';
import { storage } from '../storage/storage-factory';
import { createClient } from '@supabase/supabase-js';

export type AuthenticatedRequest = any;

// Singleton Supabase admin client for auth verification
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// AUTHENTICATION MIDDLEWARE: Verifies Supabase JWT tokens via getUser
export async function requireAuth(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT by calling Supabase Auth
    const { data: { user: supabaseUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

    if (verifyError || !supabaseUser) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const email = supabaseUser.email;
    const userId = supabaseUser.id;

    if (!email) {
      return res.status(401).json({ error: 'Invalid token - no email' });
    }

    // Verify account exists in database
    let dbUser = await storage.getUserByEmail(email);

    if (!dbUser) {
      // Sync from Supabase Auth if not in database
      try {
        dbUser = await storage.createUser({
          username: email.split('@')[0],
          email: email,
          firstName: supabaseUser.user_metadata?.first_name || email.split('@')[0],
          lastName: supabaseUser.user_metadata?.last_name || 'User',
          phoneNumber: supabaseUser.user_metadata?.phone || '',
          profession: 'Not provided',
          accountNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`,
          accountId: Date.now(),
          balance: '0',
          isActive: true,
          isVerified: true,
          transferPin: supabaseUser.user_metadata?.transfer_pin || '',
          role: supabaseUser.app_metadata?.role || 'customer'
        });
      } catch (e) {
        // Sync failed
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

    // Attach user to request
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

// Require admin role
export async function requireAdmin(
  req: any,
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
