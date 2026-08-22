import type { TransactionRecord } from '@AfriWage/sdk';

export const DASHBOARD_TRANSACTION_LIMIT = 4;

export type DashboardActivityState =
  | { kind: 'disconnected' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; transactions: TransactionRecord[] };

interface DashboardActivityQueryState {
  data?: TransactionRecord[];
  isError: boolean;
  isLoading: boolean;
}

export function getDashboardActivityState(
  address: string | null,
  query: DashboardActivityQueryState
): DashboardActivityState {
  if (!address) return { kind: 'disconnected' };
  if (query.isLoading) return { kind: 'loading' };
  if (query.isError) return { kind: 'error' };
  if (!query.data?.length) return { kind: 'empty' };

  return { kind: 'ready', transactions: query.data };
}

export function isIncomingTransaction(transaction: TransactionRecord, address: string): boolean {
  return transaction.to === address;
}
