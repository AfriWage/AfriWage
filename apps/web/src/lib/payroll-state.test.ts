import { describe, expect, it } from 'vitest';
import {
  PAYROLL_STATUSES,
  type PayrollStatus,
  assertTransition,
  canTransition,
  hasFailedItem,
  isOfframpStatus,
  isPayrollStatus,
  isRunFullySettled,
  mapAnchorStatus,
  sumWageAmounts,
} from './payroll-state';

describe('canTransition', () => {
  it.each([
    ['draft', 'pending_approval'],
    ['pending_approval', 'approved'],
    ['approved', 'executing'],
    ['executing', 'settled'],
  ])('allows the happy path step %s → %s', (from, to) => {
    expect(canTransition(from as PayrollStatus, to as PayrollStatus)).toBe(true);
  });

  it.each([['draft'], ['pending_approval'], ['approved'], ['executing']])(
    'allows %s to fail',
    (from) => {
      expect(canTransition(from as PayrollStatus, 'failed')).toBe(true);
    }
  );

  it.each([
    ['draft', 'approved', 'skipping approval'],
    ['draft', 'executing', 'skipping straight to payout'],
    ['draft', 'settled', 'skipping the entire flow'],
    ['pending_approval', 'executing', 'executing without approval'],
    ['approved', 'settled', 'settling without executing'],
    ['pending_approval', 'draft', 'going backwards'],
    ['executing', 'approved', 'going backwards'],
  ])('refuses %s → %s (%s)', (from, to) => {
    expect(canTransition(from as PayrollStatus, to as PayrollStatus)).toBe(false);
  });

  it.each([['settled'], ['failed']])('treats %s as terminal', (from) => {
    for (const to of PAYROLL_STATUSES) {
      expect(canTransition(from as PayrollStatus, to)).toBe(false);
    }
  });

  it('does not let a failed run be replayed, which could pay someone twice', () => {
    expect(canTransition('failed', 'executing')).toBe(false);
  });
});

describe('assertTransition', () => {
  it('passes for an allowed transition', () => {
    expect(() => assertTransition('draft', 'pending_approval')).not.toThrow();
  });

  it('raises a 409 naming both states', () => {
    try {
      assertTransition('draft', 'settled');
      throw new Error('Expected the call to throw');
    } catch (error) {
      expect((error as { status: number }).status).toBe(409);
      expect((error as Error).message).toContain('draft');
      expect((error as Error).message).toContain('settled');
    }
  });
});

describe('sumWageAmounts', () => {
  it('sums at full USDC precision rather than rounding to cents', () => {
    expect(sumWageAmounts(['0.0000001', '0.0000002'])).toBe('0.0000003');
  });

  it('does not lose a stroop across many items', () => {
    expect(sumWageAmounts(Array.from({ length: 10 }, () => '0.0000001'))).toBe('0.0000010');
  });

  it('handles a large total exactly', () => {
    expect(sumWageAmounts(['1000000.1234567', '2000000.7654321'])).toBe('3000000.8888888');
  });

  it('returns zero for an empty run', () => {
    expect(sumWageAmounts([])).toBe('0.0000000');
  });

  it('avoids the float error a naive sum would introduce', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in float arithmetic.
    expect(sumWageAmounts(['0.1', '0.2'])).toBe('0.3000000');
  });
});

describe('isRunFullySettled', () => {
  it('settles an on-chain-only run once every item has a transaction hash', () => {
    expect(
      isRunFullySettled([
        { onchainTxHash: 'abc', offrampStatus: null },
        { onchainTxHash: 'def', offrampStatus: null },
      ])
    ).toBe(true);
  });

  it('does not settle while an off-ramp is still pending', () => {
    expect(
      isRunFullySettled([
        { onchainTxHash: 'abc', offrampStatus: null },
        { onchainTxHash: 'def', offrampStatus: 'pending' },
      ])
    ).toBe(false);
  });

  it('settles once every off-ramp is complete', () => {
    expect(
      isRunFullySettled([
        { onchainTxHash: 'abc', offrampStatus: 'complete' },
        { onchainTxHash: 'def', offrampStatus: null },
      ])
    ).toBe(true);
  });

  it('does not settle an item that has no on-chain hash yet', () => {
    expect(isRunFullySettled([{ onchainTxHash: null, offrampStatus: null }])).toBe(false);
  });

  it('does not settle a failed off-ramp', () => {
    expect(isRunFullySettled([{ onchainTxHash: 'abc', offrampStatus: 'failed' }])).toBe(false);
  });

  it('does not report an empty run as settled', () => {
    expect(isRunFullySettled([])).toBe(false);
  });
});

describe('mapAnchorStatus', () => {
  it('maps a completed withdrawal to complete', () => {
    expect(mapAnchorStatus('completed')).toBe('complete');
  });

  it.each([['error'], ['refunded'], ['expired']])('maps %s to failed', (status) => {
    expect(mapAnchorStatus(status)).toBe('failed');
  });

  it.each([
    ['pending_user_transfer_start'],
    ['pending_anchor'],
    ['pending_external'],
    ['incomplete'],
  ])('treats the intermediate state %s as pending', (status) => {
    expect(mapAnchorStatus(status)).toBe('pending');
  });

  it('treats an unfamiliar status as pending rather than paid', () => {
    expect(mapAnchorStatus('some_future_anchor_state')).toBe('pending');
  });
});

describe('hasFailedItem', () => {
  it('flags a run with a failed off-ramp', () => {
    expect(
      hasFailedItem([
        { onchainTxHash: 'abc', offrampStatus: 'complete' },
        { onchainTxHash: 'def', offrampStatus: 'failed' },
      ])
    ).toBe(true);
  });

  it('does not flag a healthy run', () => {
    expect(hasFailedItem([{ onchainTxHash: 'abc', offrampStatus: 'pending' }])).toBe(false);
  });
});

describe('status guards', () => {
  it.each(PAYROLL_STATUSES)('accepts %s as a payroll status', (status) => {
    expect(isPayrollStatus(status)).toBe(true);
  });

  it.each([['queued'], [''], [null], [3]])('rejects %s as a payroll status', (value) => {
    expect(isPayrollStatus(value)).toBe(false);
  });

  it.each([['pending'], ['complete'], ['failed']])('accepts %s as an off-ramp status', (value) => {
    expect(isOfframpStatus(value)).toBe(true);
  });

  it('rejects an unknown off-ramp status', () => {
    expect(isOfframpStatus('refunded')).toBe(false);
  });
});
