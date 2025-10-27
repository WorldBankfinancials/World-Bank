import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthRequest extends Request {
  userEmail?: string;
  userId?: string;
}

/**
 * Middleware to extract user email from Supabase Auth session
 * Adds userEmail and userId to request object
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Try to get email from query parameter first (for backwards compatibility)
    let userEmail = req.query.email as string;
    
    if (!userEmail) {
      // Try to get from Authorization header
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user?.email) {
          userEmail = user.email;
          req.userId = user.id;
        }
      }
    }
    
    // Attach email to request
    if (userEmail) {
      req.userEmail = userEmail;
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(); // Continue even if auth fails - routes will handle it
  }
}

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userEmail) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
