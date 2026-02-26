// In-memory rate limiter for auth endpoints.
// In production, replace with @upstash/ratelimit + Redis for distributed limiting.
// Fails open: if anything goes wrong, the request is allowed through.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

function checkLimit(
  storeName: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; retryAfter: number } {
  try {
    const store = getStore(storeName);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: maxRequests - 1, retryAfter: 0 };
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { success: false, remaining: 0, retryAfter };
    }

    entry.count++;
    return { success: true, remaining: maxRequests - entry.count, retryAfter: 0 };
  } catch {
    // Fail open
    return { success: true, remaining: 1, retryAfter: 0 };
  }
}

// Periodically clean up expired entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    stores.forEach((store) => {
      store.forEach((entry, key) => {
        if (now > entry.resetAt) {
          store.delete(key);
        }
      });
    });
  }, 5 * 60 * 1000).unref?.();
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export const rateLimit = {
  // Login: 5 attempts per 15 minutes per IP
  login(ip: string) {
    return checkLimit("login", ip, 5, 15 * 60 * 1000);
  },

  // Signup: 3 attempts per hour per IP
  signup(ip: string) {
    return checkLimit("signup", ip, 3, 60 * 60 * 1000);
  },

  // General API: 100 requests per minute per user
  api(userId: string) {
    return checkLimit("api", userId, 100, 60 * 1000);
  },
};
