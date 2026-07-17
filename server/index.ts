import express from "express";
import { createServer } from "http";
import { registerRoutes, registerLiveChatRoutes } from "./fix-routes";
import { setupAdminExtraRoutes } from "./routes-admin-extra";
import { setupTransferRoutes } from "./routes-transfer";
import { setupCustomerRoutes } from "./routes-customer";
import { setupAdminExtra2Routes } from "./routes-admin-extra2";
import { errorHandler, notFoundHandler } from "./error-handler";
import { setupVite, serveStatic, log } from "./vite";

async function main() {
  const app = express();

  await registerRoutes(app);
  await registerLiveChatRoutes(app);
  setupTransferRoutes(app);
  setupCustomerRoutes(app);
  setupAdminExtraRoutes(app);
  setupAdminExtra2Routes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, createServer(app));
  }

  const port = Number(process.env.PORT) || 5000;
  const httpServer = createServer(app);
  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
