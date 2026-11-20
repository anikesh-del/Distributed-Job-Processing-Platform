import Redis from 'ioredis';
import { config } from '../config/env';
import { createComponentLogger } from '../logger/logger';

const log = createComponentLogger('Redis');

let redisClient: Redis | null = null;

/**
 * Returns the singleton Redis client instance, initializing it if needed.
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    log.info({ url: config.redisUrl }, 'Initializing Redis client...');

    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      log.info('Redis socket connected');
    });

    redisClient.on('ready', () => {
      log.info('Redis connection ready to accept commands');
    });

    redisClient.on('error', (err) => {
      log.error({ err }, 'Redis connection error');
    });

    redisClient.on('close', () => {
      log.warn('Redis connection closed');
    });
  }

  return redisClient;
}

/**
 * Connects to Redis explicitly.
 */
export async function connectRedis(): Promise<Redis> {
  const client = getRedisClient();
  await client.connect();
  return client;
}

/**
 * Gracefully disconnects the Redis client.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      log.info('Closing Redis connection...');
      await redisClient.quit();
      log.info('Redis connection closed cleanly');
    } catch (err) {
      log.error({ err }, 'Error while closing Redis connection');
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
}
