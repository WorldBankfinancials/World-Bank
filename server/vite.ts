import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer, type InlineConfig } from "vite";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.info(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: { on: (event: string, cb: (...args: unknown[]) => void) => void }) {
  const serverOptions = {
    middlewareMode: true,
    appType: "custom",
  };

  const vite = await createServer(serverOptions as unknown as InlineConfig);
  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist");
  if (!fs.existsSync(distPath)) {
    log(`dist directory not found at ${distPath}, serving fallback`);
    app.get("*", (_req, res) => {
      res.status(200).json({ status: "ok", message: "Frontend build not found" });
    });
    return;
  }
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
