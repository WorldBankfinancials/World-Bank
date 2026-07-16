/**
 * api/index.ts — Vercel serverless entry point
 *
 * Production-ready: matches security posture of server/index.ts.
 * - CORS + security headers
 * - CSRF protection on state-changing endpoints
 * - General rate limiting
 * - Request logging
 */
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from '../server/fix-routes';
import { generalRateLimiter } from '../server/rate-limiter';

const app = express();

// ---- Body parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ---- Security headers ----
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ---- CORS ----
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowed = [
    'http://localhost:5000',
    'http://localhost:3000',
    'https://worldbankfinancials.vercel.app',
    'https://world-bank-financials.vercel.app',
  ];
  if (origin && (allowed.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Client-Info');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  next();
});

// ---- General rate limiting ----
app.use('/api/', generalRateLimiter);

// ---- CSRF protection for state-changing requests ----
const CSRF_EXEMPT = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/register-complete',
  '/api/auth/check-email',
  '/api/config',
  '/api/health',
];
app.use((req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const path = req.path;
    const exempt = CSRF_EXEMPT.some(p => path === p || path.startsWith(p));
    if (!exempt && req.path.startsWith('/api/')) {
      const csrfToken = req.headers['x-csrf-token'] || req.headers['x-requested-with'];
      if (!csrfToken) {
        res.status(403).json({ error: 'CSRF token required' });
        return;
      }
    }
  }
  next();
});

// ---- Request logging ----
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.info(`[api] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    }
  });
  next();
});

// ---- Global error handler ----
interface AppError {
  status?: number;
  statusCode?: number;
  message: string;
}
app.use((err: AppError | Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as AppError).status || (err as AppError).statusCode || 500;
  // SECURITY: Never disclose error.message to clients in any environment
  const message = 'An internal error occurred';
  res.status(status).json({ error: message });
});

// ---- Register all routes ----
const routesReady = registerRoutes(app).catch((err: unknown) => {
  console.error('[api] Failed to register routes:', err);
});

// Vercel serverless handler
const handler = async (req: Request, res: Response) => {
  await routesReady;
  (app as (req: Request, res: Response) => void)(req, res);
};

export default handler;
