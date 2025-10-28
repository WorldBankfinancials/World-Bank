import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { storage } from './storage-factory';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Extract JWT from Authorization header
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
    
    // Verify JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // CRITICAL: Use app_metadata (server-controlled) NOT user_metadata (user-controlled)
    // Only server code can set app_metadata, preventing privilege escalation
    const role = data.user.app_metadata?.role || 'customer';
    
    // SECURITY: Check if account is active (customer accounts only)
    // Admins always bypass this check
    if (role === 'customer') {
      const dbUser = await (storage as any).getUserByEmail(data.user.email!);
      
      if (!dbUser) {
        console.error(`❌ Authenticated user not found in database: ${data.user.email}`);
        return res.status(403).json({ 
          error: 'Account not found in database. Please contact support.' 
        });
      }
      
      if (!dbUser.isActive) {
        console.log(`🚫 API access blocked - account pending approval: ${data.user.email}`);
        return res.status(403).json({ 
          error: 'Your account is pending approval by our customer support team. You will receive a notification once your account is activated.',
          code: 'ACCOUNT_PENDING_APPROVAL'
        });
      }
    }
    
    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email!,
      role: role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
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
      console.warn(`🚫 Unauthorized admin access attempt by ${req.user?.email}`);
      return res.status(403).json({ error: 'Admin access required' });
    }
    console.log(`✅ Admin access granted to ${req.user?.email}`);
    next();
  });
}
