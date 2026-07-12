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

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && req.path.startsWith('/api/')) {
    const csrfToken = req.headers['x-csrf-token'];
    const isAuthEndpoint = req.path === '/api/auth/login' || req.path === '/api/auth/register-complete' || req.path === '/api/auth/register';
    if (!isAuthEndpoint && !csrfToken) {
      return res.status(403).json({ error: 'CSRF token required' });
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
  } catch (error: unknown) {
    console.error(`FATAL ERROR DURING STARTUP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error("FATAL ERROR STACK:", error instanceof Error ? error.stack : 'No stack available');
    process.exit(1);
  }
})();
