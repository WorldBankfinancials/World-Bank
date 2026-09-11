import { createServer } from 'http';
import express from 'express';

export interface PlatformConfig {
  port: number;
  host: string;
  environment: string;
}

export const defaultConfig: PlatformConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
};

export function createPlatformApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));
  return app;
}
