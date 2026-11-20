import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const logInstance = req.log || logger;
  logInstance.error(
    {
      err: {
        message: err.message,
        name: err.name,
        stack: err.stack,
        details: err.details,
      },
      statusCode,
      method: req.method,
      url: req.originalUrl || req.url,
    },
    `Unhandled error: ${message}`
  );

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      requestId: req.id,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}
