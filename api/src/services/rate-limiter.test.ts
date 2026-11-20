import assert from 'node:assert';

/**
 * In-memory simulation of the Redis Sliding Window Lua script to verify mathematical correctness.
 */
class SlidingWindowSimulator {
  private sets = new Map<string, Array<{ score: number; member: string }>>();

  public executeLua(
    key: string,
    now: number,
    windowMs: number,
    maxLimit: number,
    member: string
  ): [number, number, number] {
    let entries = this.sets.get(key) || [];

    // 1. ZREMRANGEBYSCORE key -inf (now - windowMs)
    const clearBefore = now - windowMs;
    entries = entries.filter((e) => e.score > clearBefore);

    // 2. ZCARD key
    const currentRequests = entries.length;

    if (currentRequests < maxLimit) {
      // 3. ZADD key now member
      entries.push({ score: now, member });
      this.sets.set(key, entries);
      return [1, maxLimit - currentRequests - 1, 0];
    } else {
      // 4. Calculate retry-after from oldest entry
      const oldest = entries[0];
      let retryAfterMs = 0;
      if (oldest) {
        retryAfterMs = (oldest.score + windowMs) - now;
        if (retryAfterMs < 0) retryAfterMs = 0;
      }
      let retryAfterSec = Math.ceil(retryAfterMs / 1000);
      if (retryAfterSec <= 0) retryAfterSec = 1;
      return [0, 0, retryAfterSec];
    }
  }
}

async function runSimulatorTests() {
  console.log('Testing Sliding Window Rate Limiter Logic...');

  const sim = new SlidingWindowSimulator();
  const key = 'ratelimit:user-123';
  const limit = 3;
  const windowMs = 5000; // 5 seconds
  let now = 100000;

  // Req 1 (t = 100000)
  const [a1, r1] = sim.executeLua(key, now, windowMs, limit, `${now}:1`);
  assert.strictEqual(a1, 1, 'Req 1 should be allowed');
  assert.strictEqual(r1, 2, 'Req 1 should have remaining 2');

  // Req 2 (t = 101000)
  now += 1000;
  const [a2, r2] = sim.executeLua(key, now, windowMs, limit, `${now}:2`);
  assert.strictEqual(a2, 1, 'Req 2 should be allowed');
  assert.strictEqual(r2, 1, 'Req 2 should have remaining 1');

  // Req 3 (t = 102000)
  now += 1000;
  const [a3, r3] = sim.executeLua(key, now, windowMs, limit, `${now}:3`);
  assert.strictEqual(a3, 1, 'Req 3 should be allowed');
  assert.strictEqual(r3, 0, 'Req 3 should have remaining 0');

  // Req 4 (t = 103000) - Limit reached!
  now += 1000;
  const [a4, r4, retryAfter4] = sim.executeLua(key, now, windowMs, limit, `${now}:4`);
  assert.strictEqual(a4, 0, 'Req 4 should be blocked');
  assert.strictEqual(r4, 0, 'Req 4 should have remaining 0');
  assert.strictEqual(retryAfter4, 2, 'Retry-after should be 2s (oldest at 100000 + 5000 - 103000 = 2000ms)');

  // Advance time past the oldest request (t = 105100) -> oldest (100000) slides out!
  now = 105100;
  const [a5, r5] = sim.executeLua(key, now, windowMs, limit, `${now}:5`);
  assert.strictEqual(a5, 1, 'Req 5 should be allowed because oldest slid out');
  assert.strictEqual(r5, 0, 'Req 5 remaining should be 0 (entries at 101000, 102000, 105100)');

  // Advance time past all entries (t = 115000)
  now = 115000;
  const [a6, r6] = sim.executeLua(key, now, windowMs, limit, `${now}:6`);
  assert.strictEqual(a6, 1, 'Req 6 should be allowed after full window reset');
  assert.strictEqual(r6, 2, 'Remaining should be reset to 2');

  console.log('✔ All Sliding Window algorithm invariants verified successfully!');
}

runSimulatorTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
