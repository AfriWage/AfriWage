export class RateLimiter {
  private store = new Map<string, number[]>();

  check(ip: string, endpoint: string): { success: boolean; limit: number; remaining: number; retryAfter?: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    const isTestnetFunding = endpoint.startsWith('/api/fund-testnet');
    const limit = isTestnetFunding ? 5 : 60;
    const key = `${ip}:${isTestnetFunding ? 'fund-testnet' : 'api'}`;

    const timestamps = this.store.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    this.store.set(key, validTimestamps);

    if (validTimestamps.length >= limit) {
      const retryAfter = Math.max(1, Math.ceil((validTimestamps[0] + windowMs - now) / 1000));
      return { success: false, limit, remaining: 0, retryAfter };
    }

    validTimestamps.push(now);

    return { success: true, limit, remaining: limit - validTimestamps.length };
  }
}

// In Next.js middleware, globalThis is preserved between requests on the same isolate
const globalForRateLimiter = globalThis as typeof globalThis & {
  apiRateLimiter?: RateLimiter;
};

export const rateLimiter = (globalForRateLimiter.apiRateLimiter ??= new RateLimiter());
