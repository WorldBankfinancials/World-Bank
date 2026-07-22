import express from "express";
import { createServer } from "http";
import { registerRoutes, registerLiveChatRoutes } from "./fix-routes";
import { errorHandler, notFoundHandler } from "./error-handler";
import { setupVite, serveStatic, log } from "./vite";

async function main() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  await registerRoutes(app);
  await registerLiveChatRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  const port = Number(process.env.PORT) || 5000;
  const httpServer = createServer(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, httpServer);
  }

  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
