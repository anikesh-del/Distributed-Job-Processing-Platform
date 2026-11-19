import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface WorkerConfig {
  nodeEnv: string;
  concurrency: number;
  rabbitmqUrl: string;
  redisUrl: string;
  heartbeatIntervalMs: number;
  heartbeatTtlSeconds: number;
  logLevel: string;
  workerId?: string;
}

export const config: WorkerConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS) || 3000,
  heartbeatTtlSeconds: Number(process.env.HEARTBEAT_TTL_SECONDS) || 10,
  logLevel: process.env.LOG_LEVEL || 'info',
  workerId: process.env.WORKER_ID
};
