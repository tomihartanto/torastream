import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      // Tolerate short blips without throwing into request handlers
      automaticDeserialization: true,
    })
  : null;

// ---------- Distributed cache helpers ----------

interface CacheEntry<T> {
  data: T;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const raw = await redis.get<CacheEntry<T>>(key);
      return raw ? raw.data : null;
    } catch (err) {
      console.warn("[redis] cacheGet failed, degrading:", err);
      return null;
    }
  }
  const local = localCache.get(key);
  if (!local) return null;
  if (Date.now() - local.timestamp > local.ttl) {
    localCache.delete(key);
    return null;
  }
  return local.data as T;
}

export async function cacheSet<T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  if (ttlSeconds <= 0) return;
  if (redis) {
    try {
      await redis.set(key, { data }, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.warn("[redis] cacheSet failed, degrading:", err);
      return;
    }
  }
  // LRU-ish local fallback capped at 500 entries
  if (localCache.size > 500) {
    const oldest = [...localCache.entries()].sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );
    for (let i = 0; i < 100 && i < oldest.length; i++) {
      localCache.delete(oldest[i][0]);
    }
  }
  localCache.set(key, { data, timestamp: Date.now(), ttl: ttlSeconds * 1000 });
}

interface LocalEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}
const localCache = new Map<string, LocalEntry>();

// ---------- Distributed rate limiter ----------

const localBuckets = new Map<string, { count: number; resetAt: number }>();

function localRateLimit(
  identifier: string,
  maxTokens: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const bucket = localBuckets.get(identifier);
  if (!bucket || bucket.resetAt < now) {
    localBuckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxTokens - 1, reset: now + windowMs };
  }
  if (bucket.count >= maxTokens) {
    return { success: false, remaining: 0, reset: bucket.resetAt };
  }
  bucket.count++;
  return {
    success: true,
    remaining: maxTokens - bucket.count,
    reset: bucket.resetAt,
  };
}

const ratelimiters = new Map<string, Ratelimit>();

export function getRatelimiter(
  key: string,
  limit: number,
  window: "1 s" | "1 m" | "1 h"
): Ratelimit | null {
  if (!redis) return null;
  let rl = ratelimiters.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `ratelimit:${key}`,
      analytics: false,
    });
    ratelimiters.set(key, rl);
  }
  return rl;
}

export async function rateLimit(
  identifier: string,
  options: { limit: number; windowMs: number; windowLabel: "1 s" | "1 m" | "1 h" }
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { limit, windowMs, windowLabel } = options;
  if (redis) {
    const rl = getRatelimiter(identifier, limit, windowLabel);
    if (rl) {
      try {
        const res = await rl.limit(identifier);
        return {
          success: res.success,
          remaining: res.remaining,
          reset: res.reset,
        };
      } catch (err) {
        console.warn("[redis] rateLimit failed, allowing:", err);
        // fail-open: allow the request through without enforcing
        return { success: true, remaining: limit, reset: Date.now() + windowMs };
      }
    }
  }
  return localRateLimit(identifier, limit, windowMs);
}

// Convenience: awaitable block until a slot is available
export async function throttle(
  identifier: string,
  options: { limit: number; windowMs: number; windowLabel: "1 s" | "1 m" | "1 h" }
): Promise<void> {
  const check = async (attempt = 0): Promise<void> => {
    const res = await rateLimit(identifier, options);
    if (res.success) return;
    const wait = Math.max(50, Math.min(res.reset - Date.now(), 2000));
    if (attempt > 20) {
      console.warn(`[redis] throttle gave up after 20 attempts for: ${identifier}`);
      return;
    }
    await new Promise((r) => setTimeout(r, wait));
    return check(attempt + 1);
  };
  return check();
}
