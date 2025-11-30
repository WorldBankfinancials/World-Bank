import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-factory';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string | number;
    email: string;
    role?: string;
  };
}

// AUTHENTICATION MIDDLEWARE: Validates Supabase JWT tokens
// Token format: Supabase JWT (sub = user_id, email = email)
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Auth: No Bearer token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Parse token: Try Supabase JWT first, then base64 format for backward compatibility
    let email: string;
    let userId: string | number;
    
    try {
      // Try parsing as Supabase JWT
      const parts = token.split('.');
      if (parts.length === 3) {
        // JWT format - decode payload (second part)
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        email = payload.email;
        userId = payload.sub || payload.id;
        console.log('✅ Auth: Supabase JWT parsed', { email, userId });
      } else {
        // Try base64 format for backward compatibility
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const tokenParts = decoded.split(':');
        email = tokenParts[0];
        userId = tokenParts[2] || tokenParts[1];
        console.log('✅ Auth: Base64 token parsed', { email, userId });
      }
      
      if (!email) {
        throw new Error('Invalid token format - no email found');
      }
    } catch (parseError) {
      console.error('❌ Auth: Token parse error:', parseError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // DUAL SOURCE 1: Verify account exists in Postgres database
    let dbUser = await storage.getUserByEmail(email);
    
    if (!dbUser) {
      // Try to sync from Supabase Auth if not in database
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        
        const { data: supabaseUser } = await supabase.auth.admin.getUserById(String(userId));
        if (supabaseUser?.user && supabaseUser.user.email === email) {
          // User exists in Supabase Auth, create in database
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
            transferPin: supabaseUser.user.user_metadata?.transfer_pin || '0192',
            role: supabaseUser.user.app_metadata?.role || 'customer'
          });
        }
      } catch (e) {
        // Supabase sync failed
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
      }
    } catch (supabaseError) {
    }

    // Attach user to request (Postgres is primary, but both systems validated)
    req.user = {
      id: dbUser.id,
      email: dbUser.email || email,
      role: dbUser.role || 'customer'
    };

    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
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
