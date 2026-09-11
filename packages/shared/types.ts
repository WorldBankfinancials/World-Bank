/**
 * shared/types.ts
 *
 * Additional shared types for API responses, session management,
 * and role-based access control.
 * Imported by both client and server via @packages/shared/types.
 */

import type { UserRole } from './schema';

// ============================================================
// SESSION / AUTH
// ============================================================

/** What the server attaches to req.user after requireAuth middleware. */
export interface AuthUser {
  id: string;       // UUID = auth.uid()
  email: string;
  role: UserRole;
}

/** What is stored in localStorage and returned by /api/auth/login. */
export interface SessionToken {
  token: string;         // Supabase JWT access_token
  refreshToken?: string; // Supabase JWT refresh_token
  expiresAt?: number;    // Unix timestamp ms
}

/** Stored user profile in localStorage ('userProfile' key). */
export interface StoredProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  accountNumber?: string;
  balance?: string;
  isActive?: boolean;
  isVerified?: boolean;
  profilePhoto?: string | null;
}

// ============================================================
// API RESPONSE SHAPES
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiError {
  success?: false;
  error: string;
  details?: string | string[];
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================
// REALTIME
// ============================================================

export interface RealtimeBalanceUpdate {
  userId: string;
  newBalance: number;
  oldBalance: number;
  delta: number;
  timestamp: string;
}

export interface RealtimeChatMessage {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  sessionId: string;
  timestamp: string;
}

export interface RealtimeTransactionUpdate {
  transactionId: string;
  status: string;
  updatedAt: string;
}

// ============================================================
// ROLE-BASED ACCESS
// ============================================================

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer:    ['read:own', 'write:own', 'transfer:own'],
  support:     ['read:own', 'write:own', 'read:all_users', 'read:all_tickets'],
  compliance:  ['read:own', 'write:own', 'read:all', 'write:transactions'],
  admin:       ['read:own', 'write:own', 'read:all', 'write:all', 'admin:all'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdminRole(role: string): role is 'admin' {
  return role === 'admin';
}

export function isStaffRole(role: string): boolean {
  return ['admin', 'support', 'compliance'].includes(role);
}
