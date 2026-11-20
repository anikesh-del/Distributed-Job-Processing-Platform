import express, { Application } from 'express';
import healthRouter from './routes/health.route';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { rateLimiterMiddleware } from './middlewares/rate-limiter.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

export function createApp(): Application {
  const app = express();

  // Request correlation & structured logging
  app.use(requestLoggerMiddleware);

  // Global sliding window rate limiting (100 requests per minute by default)
  app.use(rateLimiterMiddleware({ windowMs: 60_000, limit: 100 }));

  // Standard body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/health', healthRouter);

  // Fallback 404 handler
  app.use(notFoundMiddleware);

  // Global error handler
  app.use(errorMiddleware);

  return app;
}
