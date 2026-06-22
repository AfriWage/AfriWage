import { describe, expect, it } from 'vitest';
import { claimableAmount, fromAtomicAmount, toAtomicAmount, type StreamSnapshot } from './stream';

describe('stream helpers', () => {
  it('calculates claimable amount linearly through an active stream', () => {
    const stream: StreamSnapshot = {
      id: 'stream-001',
      employer: 'GAEMPLOYER0000000000000000000000000000000000000000000000',
      recipient: 'GARECIPIENT00000000000000000000000000000000000000000000',
      totalAmount: '100',
      withdrawnAmount: '25',
      startTime: '2026-06-20T00:00:00Z',
      endTime: '2026-06-30T00:00:00Z',
      status: 'active',
    };

    expect(claimableAmount(stream, '2026-06-25T00:00:00Z')).toBe('25');
  });

  it('returns zero claimable amount before the stream starts', () => {
    const stream: StreamSnapshot = {
      id: 'stream-002',
      employer: 'GAEMPLOYER0000000000000000000000000000000000000000000000',
      recipient: 'GARECIPIENT00000000000000000000000000000000000000000000',
      totalAmount: '48.5',
      withdrawnAmount: '0',
      startTime: '2026-06-24T00:00:00Z',
      endTime: '2026-07-01T00:00:00Z',
      status: 'active',
    };

    expect(claimableAmount(stream, '2026-06-23T23:59:59Z')).toBe('0');
  });

  it('freezes vested value at cancellation time', () => {
    const stream: StreamSnapshot = {
      id: 'stream-003',
      employer: 'GAEMPLOYER0000000000000000000000000000000000000000000000',
      recipient: 'GARECIPIENT00000000000000000000000000000000000000000000',
      totalAmount: '50',
      withdrawnAmount: '10',
      startTime: '2026-06-20T00:00:00Z',
      endTime: '2026-06-30T00:00:00Z',
      status: 'cancelled',
      cancelledAt: '2026-06-24T00:00:00Z',
    };

    expect(claimableAmount(stream, '2026-06-29T00:00:00Z')).toBe('10');
  });

  it('round-trips atomic stream amounts', () => {
    const atomic = toAtomicAmount('12.3456789');
    expect(fromAtomicAmount(atomic)).toBe('12.3456789');
  });
});
