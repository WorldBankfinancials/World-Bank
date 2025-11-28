import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export interface AuthRequest extends Request {
  auth?: { userId: number; role?: string } | null;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }
  const token = header.slice(7);
  try {
    const payload = verifyJwt<{ userId: number; role?: string }>(token);
    req.auth = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}