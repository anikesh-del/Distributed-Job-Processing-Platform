import Redis from 'ioredis';
import { config } from '../config/env';
import { createComponentLogger, workerId } from '../logger/logger';
import { getHeartbeatKey, HeartbeatPayload } from './heartbeat.service';

const log = createComponentLogger('HeartbeatPoC');

/**
 * Proof of concept script to verify Redis heartbeat writing, TTL, and automatic expiry.
 */
async function runHeartbeatPoC(): Promise<void> {
  const testTtlSeconds = 2;
  const testKey = getHeartbeatKey(`test-${workerId}`);

  log.info({ redisUrl: config.redisUrl }, 'Connecting to Redis for Heartbeat PoC verification...');
  const redis = new Redis(config.redisUrl);

  try {
    const payload: HeartbeatPayload = {
      workerId: `test-${workerId}`,
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 1,
      concurrency: config.concurrency
    };

    // 1. Write key with TTL
    log.info({ key: testKey, ttl: testTtlSeconds }, 'Step 1: Writing heartbeat key with TTL...');
    await redis.set(testKey, JSON.stringify(payload), 'EX', testTtlSeconds);

    // 2. Verify key exists and inspect TTL
    const stored = await redis.get(testKey);
    const ttl = await redis.ttl(testKey);
    log.info({ key: testKey, ttl, exists: !!stored }, 'Step 2: Key verified in Redis with active TTL');

    if (!stored || ttl <= 0) {
      throw new Error('Verification failed: Key was not saved or TTL was not set correctly.');
    }

    // 3. Wait for TTL to expire
    log.info({ waitMs: (testTtlSeconds + 0.5) * 1000 }, 'Step 3: Waiting for TTL to expire...');
    await new Promise((resolve) => setTimeout(resolve, (testTtlSeconds + 0.5) * 1000));

    // 4. Verify key has expired
    const expiredVal = await redis.get(testKey);
    log.info({ key: testKey, expiredVal, isExpired: expiredVal === null }, 'Step 4: Checking expiry...');

    if (expiredVal !== null) {
      throw new Error('Verification failed: Key did not expire as expected.');
    }

    log.info(' SUCCESS: Redis heartbeat TTL and automatic expiry verified successfully!');
  } catch (error) {
    log.error({ err: error }, 'Heartbeat PoC verification encountered an error');
    process.exitCode = 1;
  } finally {
    await redis.quit();
  }
}

void runHeartbeatPoC();
