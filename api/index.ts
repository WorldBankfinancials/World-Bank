import express, { type Request, Response, NextFunction } from "express";
import { registerFixedRoutes } from "../server/fix-routes";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, Apikey');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on('finish', () => { if (path.startsWith('/api')) console.log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`); });
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

const routesReady = registerFixedRoutes(app).catch((err) => {
  console.error('Failed to register routes:', err);
});

const handler = async (req: Request, res: Response) => {
  await routesReady;
  app(req, res);
};

export default handler;
