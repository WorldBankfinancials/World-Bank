import type { Express } from 'express';
import path from 'path';
import fs from 'fs';

// Use __dirname for path resolution (works in both ESM and CJS contexts with proper config)
const __dirname_safe = typeof __dirname !== 'undefined' ? __dirname : path.resolve();

export function log(message: string, source?: string) {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.info(`${formattedTime} [express] ${source || 'server'}: ${message}`);
}

export function serveStatic(app: Express) {
  const clientBuildPath = path.resolve(__dirname_safe, '..', 'dist', 'public');
  
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    
    // SPA fallback: serve index.html for non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      } else {
        res.status(404).json({ error: 'API endpoint not found' });
      }
    });
  }
}

// Cast for Vite config compatibility
export const viteConfig = {
  server: {
    middlewareMode: true,
  },
} as unknown as import('vite').InlineConfig;