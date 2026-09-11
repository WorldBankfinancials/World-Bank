/**
 * api/index.ts — Vercel serverless entry point
 *
 * Production-ready: matches security posture of server/index.ts.
 */
import express, { type Request, Response, NextFunction } from 'express';
import { registerFixedRoutes } from '../server/fix-routes';
import { generalRateLimiter } from '../server/rate-limiter';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

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

app.use('/api/', generalRateLimiter);

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

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`[api] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    }
  });
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(status).json({ error: message });
});

const routesReady = registerFixedRoutes(app).catch(err => {
  console.error('[api] Failed to register routes:', err);
});

const handler = async (req: Request, res: Response) => {
  await routesReady;
  (app as any)(req, res);
};

export default handler;
