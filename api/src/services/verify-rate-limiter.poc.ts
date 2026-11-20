import { getRedisClient, connectRedis, disconnectRedis } from '../config/redis';
import { RateLimiterService } from './rate-limiter.service';

/**
 * Proof of Concept: Verifies Redis sliding window rate limiter functionality.
 * Tests:
 * 1. Rapid requests within window limit succeed and decrement remaining counter.
 * 2. Requests exceeding limit are blocked (allowed: false) and return Retry-After.
 * 3. After sliding window duration, requests are allowed again.
 * 4. Verifies TTL and sliding window eviction.
 */
async function runRateLimiterPoC(): Promise<void> {
  console.log('--- Starting Redis Sliding Window Rate Limiter PoC ---');

  await connectRedis();
  const redis = getRedisClient();

  const testId = `poc-test-client-${Date.now()}`;
  const windowMs = 2000; // 2 seconds window
  const limit = 3;       // max 3 requests per 2 seconds

  console.log(`Config: limit=${limit} requests per ${windowMs}ms window`);
  console.log(`Test client key: ratelimit:${testId}`);

  // Clean any previous test data
  await redis.del(`ratelimit:${testId}`);

  console.log('\n[Phase 1] Sending 3 rapid requests (should all succeed)...');
  for (let i = 1; i <= limit; i++) {
    const res = await RateLimiterService.checkLimit(testId, limit, windowMs);
    console.log(
      `Request #${i}: allowed=${res.allowed}, remaining=${res.remaining}, retryAfter=${res.retryAfterSeconds}s`
    );
    if (!res.allowed) {
      throw new Error(`Request #${i} should have been allowed`);
    }
  }

  console.log('\n[Phase 2] Sending request #4 (exceeding limit, should be blocked)...');
  const blockedRes1 = await RateLimiterService.checkLimit(testId, limit, windowMs);
  console.log(
    `Request #4: allowed=${blockedRes1.allowed}, remaining=${blockedRes1.remaining}, retryAfter=${blockedRes1.retryAfterSeconds}s`
  );
  if (blockedRes1.allowed) {
    throw new Error('Request #4 should have been blocked');
  }

  console.log('\n[Phase 3] Checking TTL on Redis key...');
  const pttl = await redis.pttl(`ratelimit:${testId}`);
  console.log(`Key PTTL: ${pttl}ms (ensures key auto-expires)`);
  if (pttl <= 0) {
    throw new Error('Key should have an active TTL');
  }

  console.log(`\n[Phase 4] Waiting for sliding window to expire (${windowMs + 500}ms)...`);
  await new Promise((resolve) => setTimeout(resolve, windowMs + 500));

  console.log('\n[Phase 5] Sending request after window reset (should succeed)...');
  const resetRes = await RateLimiterService.checkLimit(testId, limit, windowMs);
  console.log(
    `Request #5: allowed=${resetRes.allowed}, remaining=${resetRes.remaining}, retryAfter=${resetRes.retryAfterSeconds}s`
  );
  if (!resetRes.allowed) {
    throw new Error('Request #5 should have been allowed after window expiry');
  }

  // Cleanup
  await redis.del(`ratelimit:${testId}`);
  await disconnectRedis();

  console.log('\n✔ Redis sliding window rate limiter PoC PASSED successfully!');
}

runRateLimiterPoC().catch((err) => {
  console.error('PoC failed:', err);
  process.exit(1);
});
