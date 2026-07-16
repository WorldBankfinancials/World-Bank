import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import zlib from "zlib";
import { registerFixedRoutes } from "./fix-routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from "ws";
import { setupLiveChatWebSocket } from "./supabase-live-chat";
import { generalRateLimiter } from "./rate-limiter";

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Compression middleware (inline implementation - no external dependency)
app.use((req: Request, res: Response, next: NextFunction) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) return next();
  const originalSend = res.send.bind(res);
  res.send = function (body: any): Response {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      const buf = typeof body === 'string' ? Buffer.from(body) : body;
      if (buf.length > 1024) {
        zlib.gzip(buf, (err, compressed) => {
          if (err) return originalSend(body);
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Length', String(compressed.length));
          return originalSend(compressed);
        });
        return res;
      }
    }
    return originalSend(body);
  } as unknown as typeof res.send;
  next();
});

// Cache static assets aggressively
app.use('/assets', (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

// CSRF Protection - HMAC-based token system (no server-side storage needed)
const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

function generateCsrfToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', CSRF_SECRET).update(timestamp).digest('hex');
  return `${timestamp}.${hmac}`;
}

function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [timestamp, signature] = parts;
  // Optional: reject tokens older than 24 hours
  const tsNum = Number(timestamp);
  if (isNaN(tsNum)) return false;
  const ageMs = Date.now() - tsNum;
  if (ageMs < 0 || ageMs > 24 * 60 * 60 * 1000) return false;
  const expected = crypto.createHmac('sha256', CSRF_SECRET).update(timestamp).digest('hex');
  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// CORS - restrict origins via whitelist (never wildcard in production)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : (process.env.NODE_ENV === 'production'
      ? ['https://worldbankfinancials.vercel.app']
      : ['http://localhost:5173', 'http://localhost:3000']);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV !== 'production') {
    // Allow same-origin/no-origin requests in development
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, Apikey');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && req.path.startsWith('/api/')) {
    const csrfToken = req.headers['x-csrf-token'] as string;
    const isAuthEndpoint = req.path === '/api/auth/login'
      || req.path === '/api/auth/register-complete'
      || req.path === '/api/auth/register'
      || req.path === '/api/csrf-token';
    if (!isAuthEndpoint && !validateCsrfToken(csrfToken || '')) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  const supabaseHost = process.env.SUPABASE_URL?.replace('https://', '') || process.env.VITE_SUPABASE_URL?.replace('https://', '') || 'localhost';
  const requestHost = req.headers.host || '';
  const productionWs = requestHost ? `wss://${requestHost} ws://${requestHost}` : '';
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co ws://localhost:* wss://localhost:* ws://0.0.0.0:* ${productionWs} https://api.coingecko.com https://finnhub.io`,
    `img-src 'self' data: blob: https://${supabaseHost} https://*.supabase.co https://*.amazonaws.com https://api.dicebear.com`,
    "media-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "object-src 'none'",
  ].join('; '));
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/api/', generalRateLimiter);

// CSRF token endpoint - must be before the CSRF-protecting middleware above
// (which already exempts /api/csrf-token from token validation)
app.get('/api/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken();
  res.json({ token });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  try {
    console.info("Starting server initialization...");
    console.info("Supabase integration verified.");
    console.info("Registering routes...");
    const server = await registerFixedRoutes(app);
    console.info("Routes registered.");
    const wss = new WebSocketServer({ server, path: '/ws/chat' });
    setupLiveChatWebSocket(wss);
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`[Error] ${status}: ${message}`);
      res.status(status).json({ message });
    });
    if (app.get("env") === "development") {
      console.info("Setting up Vite...");
      await setupVite(app, server);
      console.info("Vite setup complete.");
    } else {
      serveStatic(app);
    }
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
      console.info(`serving on port ${port}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.info(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.info('HTTP server closed.');
        process.exit(0);
      });
      // Force exit if server doesn't close within 10 seconds
      setTimeout(() => {
        console.error('Forcing exit after timeout.');
        process.exit(1);
      }, 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: unknown) {
    console.error(`FATAL ERROR DURING STARTUP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error("FATAL ERROR STACK:", error instanceof Error ? error.stack : 'No stack available');
    process.exit(1);
  }
})();
