import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from './rate-limit';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const ip = '127.0.0.1';
    const endpoint = '/api/build-payment';

    for (let i = 0; i < 60; i++) {
      const result = rateLimiter.check(ip, endpoint);
      expect(result.success).toBe(true);
    }

    const result = rateLimiter.check(ip, endpoint);
    expect(result.success).toBe(false);
    expect(result.retryAfter).toBe(60);
  });

  it('has a stricter limit for /api/fund-testnet', () => {
    const ip = '127.0.0.2';
    const endpoint = '/api/fund-testnet';

    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.check(ip, endpoint);
      expect(result.success).toBe(true);
    }

    const result = rateLimiter.check(ip, endpoint);
    expect(result.success).toBe(false);
    expect(result.retryAfter).toBe(60);
  });

  it('resets the limit after the window expires', () => {
    const ip = '127.0.0.3';
    const endpoint = '/api/fund-testnet';

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(ip, endpoint);
    }

    expect(rateLimiter.check(ip, endpoint).success).toBe(false);

    vi.advanceTimersByTime(61 * 1000); // Wait for more than 1 minute

    expect(rateLimiter.check(ip, endpoint).success).toBe(true);
  });

  it('tracks IPs independently', () => {
    const ip1 = '127.0.0.4';
    const ip2 = '127.0.0.5';
    const endpoint = '/api/fund-testnet';

    for (let i = 0; i < 5; i++) {
      rateLimiter.check(ip1, endpoint);
    }

    expect(rateLimiter.check(ip1, endpoint).success).toBe(false);
    expect(rateLimiter.check(ip2, endpoint).success).toBe(true);
  });
});
