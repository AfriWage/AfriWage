export class RateLimiter {
  private store = new Map<string, number[]>();

  check(ip: string, endpoint: string): { success: boolean; limit: number; remaining: number; retryAfter?: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    const limit = endpoint.startsWith('/api/fund-testnet') ? 5 : 60;

    const timestamps = this.store.get(ip) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= limit) {
      return { success: false, limit, remaining: 0, retryAfter: 60 };
    }

    validTimestamps.push(now);
    this.store.set(ip, validTimestamps);

    return { success: true, limit, remaining: limit - validTimestamps.length };
  }
}

// In Next.js middleware, globalThis is preserved between requests on the same isolate
const global = globalThis as any;
if (!global.apiRateLimiter) {
  global.apiRateLimiter = new RateLimiter();
}

export const rateLimiter: RateLimiter = global.apiRateLimiter;
