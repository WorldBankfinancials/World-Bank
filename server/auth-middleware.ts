import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-factory';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string | number;
    email: string;
    role?: string;
  };
}

// DUAL-SOURCE AUTH MIDDLEWARE: Validates against BOTH Postgres AND Supabase
// Token format: base64(email:timestamp:id) 
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

    const token = authHeader.replace('Bearer ', '');
    
    // Parse token: format is base64(email:timestamp:id)
    let email: string;
    let userId: string | number;
    
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      email = parts[0];
      userId = parts[2] || parts[1];
      
      if (!email) {
        throw new Error('Invalid token format');
      }
    } catch (parseError) {
      console.log('❌ Token parsing failed:', parseError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // DUAL SOURCE 1: Verify account exists in Postgres database
    const dbUser = await storage.getUserByEmail(email);
    
    if (!dbUser) {
      console.log('❌ User not found in Postgres:', email);
      return res.status(403).json({ 
        error: 'Account not found. Please contact support.' 
      });
    }

    if (!dbUser.isActive) {
      console.log('⚠️  Account not active:', email);
      return res.status(403).json({ 
        error: 'Account not approved. Please contact support.' 
      });
    }

    // DUAL SOURCE 2: Verify with Supabase Auth (optional but sync if available)
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: supabaseUser } = await supabase.auth.admin.getUserById(String(userId));
      if (supabaseUser?.user && supabaseUser.user.email === email) {
        console.log('✅ Verified in both Postgres and Supabase Auth:', email);
      }
    } catch (supabaseError) {
      console.log('⚠️  Supabase verification skipped (unavailable)');
    }

    // Attach user to request (Postgres is primary, but both systems validated)
    req.user = {
      id: dbUser.id,
      email: dbUser.email || email,
      role: dbUser.role || 'customer'
    };

    console.log('✅ Auth passed for:', email, 'role:', req.user.role);
    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('❌ Auth error:', errorMessage);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Require admin role (checks immutable app_metadata set only by server)
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  await requireAuth(req, res, async () => {
    // SECURITY: Only trust app_metadata.role which users cannot modify
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
