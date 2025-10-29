import { Request, Response, NextFunction } from 'express';

/**
 * COMPREHENSIVE ERROR HANDLING MIDDLEWARE
 * Provides detailed, user-friendly error messages
 * CRITICAL for production banking application
 */

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
  isOperational?: boolean;
}

/**
 * Create a standardized API error
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  details?: any
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  error.isOperational = true;
  return error;
}

/**
 * Global error handling middleware
 * MUST be registered LAST in Express middleware chain
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // SECURITY FIX: Log error WITHOUT sensitive data (passwords, PINs, tokens)
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.error('🚨 ERROR:', {
    message: err.message,
    stack: isProduction ? undefined : err.stack, // Hide stack traces in production
    path: req.path,
    method: req.method,
    // CRITICAL: NEVER log request body in production (contains passwords/PINs/tokens)
    body: isProduction ? '[REDACTED]' : req.body,
    statusCode: err.statusCode,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  const errorResponse: any = {
    error: true,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Include details in development
  if (!isProduction) {
    errorResponse.details = err.details;
    errorResponse.stack = err.stack;
  } else if (err.details) {
    // Only include safe details in production
    errorResponse.hint = 'Contact support if this persists';
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Catches errors from async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler (404)
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: true,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
}
