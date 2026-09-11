/**
 * ERROR MONITORING & LOGGING UTILITIES
 * Centralized error tracking for production debugging
 */

import { Request, Response, NextFunction } from 'express';

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  context: string;
  message: string;
  stack?: string;
  userId?: string | number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}

const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 1000;

/**
 * Log error with full context
 */
export function logErrorWithContext(
  context: string,
  error: any,
  req?: Request,
  additionalData?: Record<string, any>
): ErrorLog {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId: (req as any)?.user?.id,
    endpoint: req?.path,
    method: req?.method,
    statusCode: (error as any)?.statusCode || (error as any)?.status
  };

  // Log to console
  console.error(`[ERROR] ${context}`, errorLog);

  // Store in memory (limited)
  errorLogs.push(errorLog);
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.shift();
  }

  return errorLog;
}

/**
 * Express middleware for error monitoring
 */
export function errorMonitoringMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logErrorWithContext('Express Error Handler', err, req);
  
  if (!res.headersSent) {
    res.status(err.status || err.statusCode || 500).json({
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get recent error logs (admin endpoint)
 */
export function getRecentErrorLogs(limit = 100): ErrorLog[] {
  return errorLogs.slice(-limit);
}

/**
 * Clear error logs
 */
export function clearErrorLogs(): void {
  errorLogs.length = 0;
}

/**
 * Export error logs
 */
export function exportErrorLogs(): string {
  return JSON.stringify(errorLogs, null, 2);
}
