import type { RequestHandler } from 'express';

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: unknown;
}): RequestHandler {
  const hits = new Map<string, { count: number; resetTime: number }>();

  // Clean up expired entries every 5 minutes to prevent memory leak
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  let lastCleanup = Date.now();

  return (req, res, next) => {
    const now = Date.now();

    // Periodic cleanup of expired entries
    if (now - lastCleanup > CLEANUP_INTERVAL) {
      for (const [k, v] of hits) {
        if (now > v.resetTime) hits.delete(k);
      }
      lastCleanup = now;
    }

    // Use socket IP directly to prevent X-Forwarded-For spoofing
    // (trust proxy must be configured separately if behind a proxy)
    const key = req.socket.remoteAddress || 'unknown';
    let entry = hits.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + options.windowMs };
      hits.set(key, entry);
    }

    entry.count++;

    if (entry.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      return res.status(429).json(options.message);
    }

    next();
  };
}

// Auth rate limiter - stricter limits for login/register
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per window
  message: { error: 'Too many authentication attempts, please try again later' },
});

// Registration rate limiter
export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 registration attempts per hour
  message: { error: 'Too many registration attempts, please try again later' },
});

// Transaction rate limiter
export const transactionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 transaction requests per minute
  message: { error: 'Too many transaction requests, please try again later' },
});

// General rate limiter
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: { error: 'Too many requests, please try again later' },
});
