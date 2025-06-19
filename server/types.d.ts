import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      session?: any;
      params: any;
      body: any;
    }
  }
}