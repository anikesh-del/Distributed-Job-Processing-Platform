import Redis from 'ioredis';
import { config } from '../config/env';
import { createComponentLogger, workerId } from '../logger/logger';

const log = createComponentLogger('Heartbeat');

let heartbeatTimer: NodeJS.Timeout | null = null;

export interface HeartbeatPayload {
  workerId: string;
  status: 'alive';
  timestamp: string;
  uptimeSeconds: number;
  concurrency: number;
}

/**
 * Returns the standard Redis key for this worker's heartbeat.
 */
export function getHeartbeatKey(id: string = workerId): string {
  return `worker:${id}:heartbeat`;
}

/**
 * Sends a single heartbeat pulse to Redis with TTL.
 */
export async function sendHeartbeat(redis: Redis): Promise<void> {
  const key = getHeartbeatKey(workerId);
  const payload: HeartbeatPayload = {
    workerId,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    concurrency: config.concurrency
  };

  try {
    // Atomic SET with expiration (EX in seconds)
    await redis.set(key, JSON.stringify(payload), 'EX', config.heartbeatTtlSeconds);
    log.debug({ key, ttl: config.heartbeatTtlSeconds }, 'Heartbeat pulse sent');
  } catch (error) {
    log.error({ err: error, key }, 'Failed to send heartbeat to Redis');
  }
}

/**
 * Starts periodic heartbeat publishing.
 */
export async function startHeartbeat(redis: Redis): Promise<void> {
  log.info(
    { intervalMs: config.heartbeatIntervalMs, ttlSeconds: config.heartbeatTtlSeconds, workerId },
    'Starting worker heartbeat loop...'
  );

  // Send initial pulse immediately
  await sendHeartbeat(redis);

  // Periodically refresh the key before TTL expires
  heartbeatTimer = setInterval(() => {
    void sendHeartbeat(redis);
  }, config.heartbeatIntervalMs);

  // Don't keep event loop alive solely because of this timer
  heartbeatTimer.unref();
}

/**
 * Stops the heartbeat timer and cleans up the heartbeat key on graceful shutdown.
 */
export async function stopHeartbeat(redis: Redis | null): Promise<void> {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    log.info('Heartbeat timer stopped');
  }

  if (redis) {
    try {
      const key = getHeartbeatKey(workerId);
      await redis.del(key);
      log.info({ key }, 'Deleted heartbeat key on graceful shutdown');
    } catch (err) {
      log.warn({ err }, 'Could not delete heartbeat key during shutdown');
    }
  }
}
