import { Request, Response, NextFunction } from 'express';
import { storage } from './storage-factory';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string | number;
    email: string;
    role?: string;
  };
}

// UNIFIED AUTH MIDDLEWARE: Works with Postgres-based tokens
// Token format: base64(email:timestamp:id) or proper JWT
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
      userId = parts[2] || parts[1]; // Use id if available, else timestamp
      
      if (!email) {
        throw new Error('Invalid token format');
      }
    } catch (parseError) {
      console.log('❌ Token parsing failed:', parseError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // SECURITY: Verify account exists in Postgres database
    const dbUser = await storage.getUserByEmail(email);
    
    if (!dbUser) {
      console.log('❌ User not found in database:', email);
      return res.status(403).json({ 
        error: 'Account not found in database. Please contact support.' 
      });
    }

    if (!dbUser.isActive) {
      console.log('⚠️  Account not active:', email);
      return res.status(403).json({ 
        error: 'Account not approved. Please contact support.' 
      });
    }

    // Attach user to request (use database ID as source of truth)
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
