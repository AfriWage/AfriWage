import { afterEach, describe, expect, it, vi } from 'vitest';
import { type PaymentVerificationError, verifyPayment } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('verifyPayment', () => {
  it('preserves a not-found response as a non-retryable error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Transaction not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(verifyPayment('a'.repeat(64))).rejects.toMatchObject({
      message: 'Transaction not found',
      status: 404,
      retryable: false,
    } satisfies Partial<PaymentVerificationError>);
  });

  it('marks an upstream verification failure as retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Payment verification temporarily unavailable' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(verifyPayment('a'.repeat(64))).rejects.toMatchObject({
      message: 'Payment verification temporarily unavailable',
      status: 502,
      retryable: true,
    } satisfies Partial<PaymentVerificationError>);
  });
});
