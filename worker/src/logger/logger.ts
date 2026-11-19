import pino from 'pino';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env';

// Unique worker identifier per process instance (or injected via environment)
export const workerId: string = config.workerId || `worker-${randomUUID()}`;

// Base Pino logger configured with default structured fields
export const logger = pino({
  level: config.logLevel,
  base: {
    service: 'job-platform-worker',
    workerId
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(config.nodeEnv === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      }
    : {})
});

/**
 * Creates a contextual child logger with a component label.
 */
export function createComponentLogger(component: string): pino.Logger {
  return logger.child({ component });
}
