import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
  isOperational?: boolean;
  code?: string;
}

export function createApiError(
  message: string,
  statusCode: number = 500,
  details?: unknown,
  code?: string
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  error.isOperational = true;
  error.code = code;
  return error;
}

const SAFE_STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad request',
  401: 'Authentication required',
  403: 'Access denied',
  404: 'Not found',
  409: 'Conflict',
  429: 'Too many requests',
  500: 'An internal error occurred',
};

const SENSITIVE_BODY_KEYS = ['password', 'transferPin', 'pin', 'cvv', 'cardNumber', 'token', 'refreshToken'];

function redactBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return '[REDACTED]';
  const redacted = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_BODY_KEYS.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    }
  }
  return redacted;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.statusCode || 500;

  const errorLog = {
    message: err.message,
    code: err.code,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
    body: redactBody(req.body),
    statusCode,
    timestamp: new Date().toISOString()
  };
  console.error('Error handler:', errorLog);

  const clientMessage = isProduction
    ? (SAFE_STATUS_MESSAGES[statusCode] || 'An internal error occurred')
    : err.message;

  const errorResponse: Record<string, unknown> = {
    error: true,
    message: clientMessage,
    code: err.code,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (!isProduction) {
    errorResponse.details = err.details;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: true,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
}
