import express from "express";
import { createServer } from "http";
import { registerRoutes, registerLiveChatRoutes } from "./fix-routes";
import { errorHandler, notFoundHandler } from "./error-handler";
import { setupVite, serveStatic, log } from "./vite";

async function main() {
  const app = express();

  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await registerRoutes(app);
  await registerLiveChatRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  const port = Number(process.env.PORT) || 5000;
  const httpServer = createServer(app);

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, httpServer);
  }

  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
  });

  const shutdown = (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
      log('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      log('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
