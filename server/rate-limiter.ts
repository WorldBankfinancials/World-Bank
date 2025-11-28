import { Request, Response, NextFunction } from 'express';

/**
 * RATE LIMITING MIDDLEWARE
 * Prevents brute force attacks and API abuse
 * CRITICAL for security
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [key: string]: RateLimitStore } = {};

export interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    keyGenerator = (req: Request) => req.ip || 'unknown'
  } = options;

  const storeName = `${windowMs}_${maxRequests}`;
  if (!stores[storeName]) {
    stores[storeName] = {};
  }
  const store = stores[storeName];

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }, 60000);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      // Initialize or reset
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      
      console.warn(`🚫 Rate limit exceeded for ${key}: ${store[key].count} requests`);
      
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());
      
      return res.status(429).json({
        error: message,
        retryAfter: retryAfter
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

    next();
  };
}

// ==================== PRE-CONFIGURED RATE LIMITERS ====================

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force login attempts
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again in 15 minutes',
  keyGenerator: (req: Request) => {
    // Rate limit by IP + email combination
    const email = req.body?.email || '';
    return `${req.ip}_${email}`;
  }
});

/**
 * Moderate rate limiter for financial transactions
 * Prevents rapid-fire transaction spam
 */
export const transactionRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 10, // 10 transactions per minute
  message: 'Transaction limit exceeded, please wait before trying again',
  keyGenerator: (req: Request) => {
    // Rate limit by authenticated user email
    const userEmail = (req as any).user?.email || req.ip;
    return `tx_${userEmail}`;
  }
});

/**
 * General API rate limiter
 * Prevents API abuse
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  message: 'Too many requests, please slow down'
});

/**
 * Registration rate limiter
 * Prevents automated account creation
 */
export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 registrations per hour per IP
  message: 'Registration limit exceeded, please try again later'
});
