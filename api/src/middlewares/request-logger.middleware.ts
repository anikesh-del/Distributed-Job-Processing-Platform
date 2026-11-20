import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../config/logger';

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();

  // Extract or generate requestId
  const rawHeader = req.headers['x-request-id'];
  const requestId =
    typeof rawHeader === 'string' && rawHeader.trim().length > 0
      ? rawHeader.trim()
      : randomUUID();

  // Attach to request and response header
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Attach child logger contextualized with requestId
  req.log = logger.child({ requestId });

  // Log completion when response finishes
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number((endTime - startTime) / 1_000_000n);

    const logPayload = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`;

    if (res.statusCode >= 500) {
      req.log.error(logPayload, message);
    } else if (res.statusCode >= 400) {
      req.log.warn(logPayload, message);
    } else {
      req.log.info(logPayload, message);
    }
  });

  next();
}
