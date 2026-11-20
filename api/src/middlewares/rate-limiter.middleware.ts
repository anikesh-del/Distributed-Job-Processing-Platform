import { Request, Response, NextFunction } from 'express';
import { RateLimiterService } from '../services/rate-limiter.service';

export interface RateLimiterOptions {
  windowMs?: number; // default: 60,000 (1 minute)
  limit?: number;    // default: 100 requests per window
  keyGenerator?: (req: Request) => string;
}

/**
 * Express middleware implementing atomic Redis sliding window rate limiting.
 */
export function rateLimiterMiddleware(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const limit = options.limit ?? 100;
  const keyGenerator =
    options.keyGenerator ??
    ((req: Request) => req.ip || req.socket.remoteAddress || 'anonymous');

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = keyGenerator(req);
    const result = await RateLimiterService.checkLimit(identifier, limit, windowMs);

    // Standard RFC rate limiting headers
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000));

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds);
      req.log?.warn(
        {
          identifier,
          limit: result.limit,
          retryAfter: result.retryAfterSeconds,
        },
        'Rate limit exceeded'
      );

      res.status(429).json({
        error: {
          message: 'Too many requests. Please try again later.',
          statusCode: 429,
          requestId: req.id,
          retryAfter: result.retryAfterSeconds,
        },
      });
      return;
    }

    next();
  };
}
