import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import type { Express } from "express";

// Polyfill __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple logger
export function log(msg: string) {
  console.log(`[server] ${msg}`);
}

// Serve built client in production
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  const indexHtml = path.resolve(distPath, "index.html");

  app.use((req, res, next) => {
    if (req.method !== "GET") return next();

    const reqPath = path.join(distPath, req.path);
    if (fs.existsSync(reqPath) && fs.statSync(reqPath).isFile()) {
      res.sendFile(reqPath);
    } else {
      res.sendFile(indexHtml);
    }
  });

  log("serving static files from dist/public");
}

// Attach Vite dev server
export async function setupVite(app: Express, server: any) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    root: path.resolve(__dirname, "..", "client"),
  });

  app.use(vite.middlewares);

  log("vite dev server attached");
}
