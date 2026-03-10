/**
 * Simple in-memory sliding-window rate limiter.
 * For production, replace with Redis-backed implementation.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean stale entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now();
  store.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff - 15 * 60 * 1000);
    if (entry.timestamps.length === 0) store.delete(key);
  });
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate-limited.
 * @returns null if allowed, or the number of seconds until the next allowed request.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = store.get(key) || { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);

  if (entry.timestamps.length >= maxAttempts) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { limited: false };
}
