import { describe, expect, it } from 'vitest';
import type { TransactionRecord } from '@AfriWage/sdk';
import {
  DASHBOARD_TRANSACTION_LIMIT,
  getDashboardActivityState,
  isIncomingTransaction,
} from './dashboard-activity';

const transaction: TransactionRecord = {
  id: 'transaction-1',
  operationId: 'transaction-1-0',
  hash: 'hash-1',
  type: 'payment',
  amount: '25.00',
  asset: 'USDC',
  from: 'G-SENDER',
  to: 'G-RECIPIENT',
  createdAt: '2026-08-16T08:00:00.000Z',
  successful: true,
};

describe('getDashboardActivityState', () => {
  it('keeps activity disconnected until a wallet address is available', () => {
    expect(
      getDashboardActivityState(null, {
        data: [transaction],
        isError: false,
        isLoading: false,
      })
    ).toEqual({ kind: 'disconnected' });
  });

  it.each([
    [{ isError: false, isLoading: true }, 'loading'],
    [{ isError: true, isLoading: false }, 'error'],
    [{ isError: false, isLoading: false }, 'empty'],
  ] as const)('returns the honest %s state', (queryState, kind) => {
    expect(
      getDashboardActivityState('G-ADDRESS', {
        ...queryState,
        data: [],
      })
    ).toEqual({ kind });
  });

  it('returns real transactions when the query succeeds', () => {
    expect(
      getDashboardActivityState('G-ADDRESS', {
        data: [transaction],
        isError: false,
        isLoading: false,
      })
    ).toEqual({ kind: 'ready', transactions: [transaction] });
  });
});

describe('dashboard transaction presentation', () => {
  it('uses a bounded recent-activity limit', () => {
    expect(DASHBOARD_TRANSACTION_LIMIT).toBe(4);
  });

  it('derives direction from the connected address', () => {
    expect(isIncomingTransaction(transaction, 'G-RECIPIENT')).toBe(true);
    expect(isIncomingTransaction(transaction, 'G-SENDER')).toBe(false);
  });
});
