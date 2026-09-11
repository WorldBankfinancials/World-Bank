import type { Express } from "express";
import type { Server } from "http";

// Safe log export — works in both dev (Replit/local) and prod (Vercel serverless)
export function log(message: string, _source = "express") {
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  // Only log in non-production or when explicitly in server context
  if (process.env.NODE_ENV !== "production" || process.env.REPL_ID) {
    console.log(`${time} [express] ${message}`);
  }
}

// Dev-only functions — loaded lazily so Vercel never tries to import vite package
export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { default: viteConfig } = await import("../vite.config");
  const { nanoid } = await import("nanoid");
  const fs = await import("fs");
  const path = await import("path");

  const viteLogger = createLogger();
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: string, options?: any) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    } as any,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req: any, res: any, next: any) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname, "..", "client", "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Loaded lazily — only called from server/index.ts in prod, not from api/index.ts
  import("fs").then(fs => {
    import("path").then(path => {
      import("express").then(({ default: express }) => {
        const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
        if (!fs.existsSync(distPath)) {
          throw new Error(`Build directory not found: ${distPath}`);
        }
        app.use(express.static(distPath));
        app.use("*", (_req: any, res: any) => {
          res.sendFile(path.resolve(distPath, "index.html"));
        });
      });
    });
  });
}
