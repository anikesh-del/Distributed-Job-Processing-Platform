import { randomUUID } from 'node:crypto';
import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';

const rateLimitLogger = logger.child({ component: 'rate-limiter' });

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetTimeMs: number;
}

/**
 * Atomic sliding window rate limiter Lua script using Redis sorted sets (ZSET).
 * KEYS[1] = ratelimit key (e.g. ratelimit:ip:127.0.0.1)
 * ARGV[1] = current timestamp in milliseconds
 * ARGV[2] = window duration in milliseconds
 * ARGV[3] = maximum allowed requests in the window
 * ARGV[4] = unique member token (timestamp:uuid)
 *
 * Returns: [allowed (1 or 0), remaining, retryAfterSeconds]
 */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxLimit = tonumber(ARGV[3])
local member = ARGV[4]
local clearBefore = now - windowMs

-- 1. Evict entries outside the sliding window
redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)

-- 2. Count requests currently inside the window
local currentRequests = redis.call('ZCARD', key)

if currentRequests < maxLimit then
  -- Add current request timestamp
  redis.call('ZADD', key, now, member)
  -- Refresh TTL to ensure automatic cleanup
  redis.call('PEXPIRE', key, windowMs)
  return { 1, maxLimit - currentRequests - 1, 0 }
else
  -- Calculate retry-after based on the oldest timestamp in the current window
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfterMs = 0
  if oldest and #oldest > 0 then
    local oldestTime = tonumber(oldest[2])
    retryAfterMs = (oldestTime + windowMs) - now
    if retryAfterMs < 0 then retryAfterMs = 0 end
  end
  local retryAfterSec = math.ceil(retryAfterMs / 1000)
  if retryAfterSec <= 0 then retryAfterSec = 1 end
  return { 0, 0, retryAfterSec }
end
`;

export class RateLimiterService {
  /**
   * Checks if an action identified by key is within the allowed rate limit.
   *
   * @param identifier Key identifying the requester (IP address, user ID, API key)
   * @param limit Max requests allowed in the window
   * @param windowMs Window duration in milliseconds (e.g. 60000ms = 1 minute)
   */
  public static async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const member = `${now}:${randomUUID()}`;

    try {
      const redis = getRedisClient();

      // Enforce a strict 500ms timeout on Redis calls to prevent latency spikes
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis rate limiter timeout')), 500)
      );

      const evalPromise = redis.eval(
        SLIDING_WINDOW_LUA,
        1,
        key,
        now.toString(),
        windowMs.toString(),
        limit.toString(),
        member
      ) as Promise<[number, number, number]>;

      const rawResult = await Promise.race([evalPromise, timeoutPromise]);

      const allowed = rawResult[0] === 1;
      const remaining = Number(rawResult[1]);
      const retryAfterSeconds = Number(rawResult[2]);

      return {
        allowed,
        limit,
        remaining,
        retryAfterSeconds,
        resetTimeMs: now + windowMs,
      };
    } catch (error) {
      // Fallback policy: Fail open if Redis is unreachable or timed out
      rateLimitLogger.warn(
        { error, identifier },
        'Redis rate limiting unavailable. Failing open to allow request.'
      );

      return {
        allowed: true,
        limit,
        remaining: limit,
        retryAfterSeconds: 0,
        resetTimeMs: now + windowMs,
      };
    }
  }
}
