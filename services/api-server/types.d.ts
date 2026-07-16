// Express Request type augmentation for auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | number;
        email: string;
        role: string;
      };
      validatedBody?: unknown;
    }
  }
}

export {};
