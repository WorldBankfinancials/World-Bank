import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const SECRET = process.env.JWT_SECRET || "dev-secret-please-change";

export function signJwt(payload: object, opts?: jwt.SignOptions) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d", ...(opts || {}) });
}

export function verifyJwt<T = any>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}