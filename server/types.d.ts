import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      session?: Record<string, unknown>;
      params: Record<string, unknown>;
      body: Record<string, unknown>;
    }
  }
}
