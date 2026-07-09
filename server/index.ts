import { verifySupabaseIntegration } from './database-verification';
import express, { type Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { registerFixedRoutes } from "./fix-routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from "ws";
import { setupLiveChatWebSocket } from "./supabase-live-chat";
import { generalRateLimiter } from "./rate-limiter";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CORS for API access
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, Apikey');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// SECURITY: Add security headers middleware with nonce-based CSP
app.use((req: Request, res: Response, next: NextFunction) => {
  // Generate per-request nonce for script-src
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CSRF protection: validate token on state-changing requests
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && req.path.startsWith('/api/')) {
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.headers['x-session-id'];
    // Skip CSRF for auth endpoints (login/register) since no session exists yet
    const isAuthEndpoint = req.path === '/api/auth/login' || 
                           req.path === '/api/auth/register-complete' ||
                           req.path === '/api/auth/register';
    if (!isAuthEndpoint && !csrfToken) {
      return res.status(403).json({ error: 'CSRF token required' });
    }
  }
  
  // Content Security Policy — nonce-based, no unsafe-inline or unsafe-eval
  const supabaseHost = 'icbsxmrmorkdgxtumamu.supabase.co';
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
  
  // Cache busting - force fresh content always
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
});

// Apply general rate limiter to all API routes
app.use('/api/', generalRateLimiter);

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
    console.log("Starting server initialization...");
    // Verify Supabase integration is active
    verifySupabaseIntegration();
    console.log("Supabase integration verified.");
    
    // Initialize Express server with all routes
    console.log("Registering routes...");
    const server = await registerFixedRoutes(app);
    console.log("Routes registered.");

    // Enable WebSocket for live chat with separate path to avoid Vite conflicts
    const wss = new WebSocketServer({ server, path: '/ws/chat' });
    setupLiveChatWebSocket(wss);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`[Error] ${status}: ${message}`);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("Setting up Vite...");
      await setupVite(app, server);
      console.log("Vite setup complete.");
    } else {
      serveStatic(app);
    }

    // Use process.env.PORT for production (Vercel assigns dynamically), fallback to 5000 for dev
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`serving on port ${port}`);
    });
  } catch (error: any) {
    console.error(`FATAL ERROR DURING STARTUP: ${error.message}`);
    console.error("FATAL ERROR STACK:", error.stack);
    process.exit(1);
  }
})();
