import { Decimal } from 'decimal.js';
import { conflict } from './api-errors';

/**
 * The payroll run state machine.
 *
 * Kept import-free of the database and the environment so both the routes and
 * the UI can reason about transitions from the same definition.
 *
 * ```
 * draft → pending_approval → approved → executing → settled
 *   └──────────┴───────────────┴───────────┴────────→ failed
 * ```
 *
 * `approved` is not something AfriWage grants: it reflects Charter's own
 * request reaching its approval threshold, observed by reading the treasury.
 */

export const PAYROLL_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'executing',
  'settled',
  'failed',
] as const;

export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

export function isPayrollStatus(value: unknown): value is PayrollStatus {
  return typeof value === 'string' && (PAYROLL_STATUSES as readonly string[]).includes(value);
}

/**
 * `settled` and `failed` are terminal. A failed run is not resumed in place —
 * its items may have partially settled on-chain, and replaying it would risk
 * paying someone twice. The recovery path is a new run for the unpaid items.
 */
const ALLOWED_TRANSITIONS: Record<PayrollStatus, readonly PayrollStatus[]> = {
  draft: ['pending_approval', 'failed'],
  pending_approval: ['approved', 'failed'],
  approved: ['executing', 'failed'],
  executing: ['settled', 'failed'],
  settled: [],
  failed: [],
};

export function canTransition(from: PayrollStatus, to: PayrollStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Raises a 409 naming both states, so a client can tell what it raced against. */
export function assertTransition(from: PayrollStatus, to: PayrollStatus): void {
  if (!canTransition(from, to)) {
    throw conflict(`A payroll run cannot move from ${from} to ${to}`);
  }
}

/** Per-item off-ramp states. `null` means the payout stays on-chain as USDC. */
export const OFFRAMP_STATUSES = ['pending', 'complete', 'failed'] as const;

export type OfframpStatus = (typeof OFFRAMP_STATUSES)[number];

export function isOfframpStatus(value: unknown): value is OfframpStatus {
  return typeof value === 'string' && (OFFRAMP_STATUSES as readonly string[]).includes(value);
}

/**
 * Sums wage amounts at full USDC precision.
 *
 * Deliberately not `sumUsdcAmounts` from `batch-amounts.ts`: that rounds to two
 * decimal places for display, which is right for the batch screen and wrong for
 * a stored total that later becomes an on-chain `i128`.
 */
export function sumWageAmounts(amounts: string[]): string {
  return amounts.reduce((sum, amount) => sum.plus(new Decimal(amount)), new Decimal(0)).toFixed(7);
}

export interface RunItemSettlement {
  onchainTxHash: string | null;
  offrampStatus: string | null;
}

/**
 * Whether every item in a run has reached its final state.
 *
 * An item is settled when it is confirmed on-chain *and* either no off-ramp was
 * requested or the anchor reports the withdrawal complete. A run is not settled
 * just because the money left the treasury — for a worker being paid in naira,
 * the anchor leg is the part that matters.
 */
export function isRunFullySettled(items: RunItemSettlement[]): boolean {
  if (items.length === 0) {
    return false;
  }

  return items.every(
    (item) =>
      item.onchainTxHash !== null &&
      (item.offrampStatus === null || item.offrampStatus === 'complete')
  );
}

/** Whether any item has failed, which fails the run as a whole. */
export function hasFailedItem(items: RunItemSettlement[]): boolean {
  return items.some((item) => item.offrampStatus === 'failed');
}
