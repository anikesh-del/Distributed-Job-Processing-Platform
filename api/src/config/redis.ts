import Redis from 'ioredis';
import { config } from './env';
import { logger } from './logger';

const redisLogger = logger.child({ component: 'redis' });

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      redisLogger.info('Redis socket connected');
    });

    redisClient.on('ready', () => {
      redisLogger.info('Redis connection ready to accept commands');
    });

    redisClient.on('error', (err) => {
      redisLogger.error({ err }, 'Redis connection error');
    });

    redisClient.on('close', () => {
      redisLogger.warn('Redis connection closed');
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<Redis | null> {
  const client = getRedisClient();
  try {
    await client.connect();
    redisLogger.info('Successfully connected to Redis');
    return client;
  } catch (err) {
    redisLogger.error({ err }, 'Failed to connect to Redis on startup (will retry on demand)');
    return null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisLogger.info('Disconnected cleanly from Redis');
    } catch (err) {
      redisLogger.error({ err }, 'Error disconnecting from Redis');
    } finally {
      redisClient = null;
    }
  }
}
