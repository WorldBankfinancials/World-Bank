import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: { on: (event: string, cb: (...args: unknown[]) => void) => void }) {
  const serverOptions = {
    middlewareMode: true,
    appType: "custom",
    server: { middlewareMode: true }
  };

  const vite = await createServer(serverOptions);
  app.use(vite.middlewares);
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find dist directory at ${distPath}`);
  }
  app.use(express.static(distPath));
}
