import { db, payrollRunItems, payrollRuns } from '@AfriWage/db';
import { getTransactionStatus } from '@AfriWage/sdk';
import { and, eq, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-errors';
import {
  type OfframpStatus,
  hasFailedItem,
  isRunFullySettled,
  mapAnchorStatus,
} from '@/lib/payroll-state';
import { requireRun } from '@/lib/require-run';

/**
 * Polls the anchor for every pending off-ramp on this run and writes the result
 * back. Any member may trigger it; the work is idempotent.
 *
 * This exists because the off-ramp must not be fire-and-forget. A worker paid in
 * naira has no way to see where their money is unless settlement state is
 * persisted, so the anchor's view is pulled into `payroll_run_items` rather than
 * being left in the anchor's dashboard.
 *
 * Status comes from the server-side Yellow Card client, which authenticates with
 * AfriWage's own API key. The SEP-24 alternative would need the worker's anchor
 * token on every poll, and AfriWage deliberately does not store those.
 *
 * Charter's own indexer (https://github.com/Ch-rter/app, `indexer/`) was checked
 * as a possible replacement for this polling. It does not remove it: the indexer
 * is itself a poller over Soroban events serving a read-only REST API, with no
 * webhook or push surface. It also only indexes Charter's contract events, which
 * say nothing about an anchor withdrawal — this route polls the anchor, not the
 * chain. Swapping in a webhook later only changes who calls this route.
 */
export async function POST(request: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await requireRun(request, params.runId);

    const pending = await db
      .select({
        id: payrollRunItems.id,
        offrampAnchorTxId: payrollRunItems.offrampAnchorTxId,
      })
      .from(payrollRunItems)
      .where(
        and(
          eq(payrollRunItems.payrollRunId, run.runId),
          eq(payrollRunItems.offrampStatus, 'pending'),
          isNotNull(payrollRunItems.offrampAnchorTxId)
        )
      );

    const checked = await Promise.all(
      pending.map(async (item) => {
        const status = await readAnchorStatus(item.offrampAnchorTxId as string);
        return { id: item.id, status };
      })
    );

    for (const { id, status } of checked) {
      if (status === 'pending') continue;

      await db
        .update(payrollRunItems)
        .set({
          offrampStatus: status,
          settledAt: status === 'complete' ? new Date() : null,
        })
        .where(eq(payrollRunItems.id, id));
    }

    const items = await db
      .select({
        onchainTxHash: payrollRunItems.onchainTxHash,
        offrampStatus: payrollRunItems.offrampStatus,
      })
      .from(payrollRunItems)
      .where(eq(payrollRunItems.payrollRunId, run.runId));

    const nextStatus = resolveRunStatus(run.status, items);

    if (nextStatus !== run.status) {
      await db.update(payrollRuns).set({ status: nextStatus }).where(eq(payrollRuns.id, run.runId));
    }

    return NextResponse.json({
      status: nextStatus,
      checked: checked.length,
      items,
    });
  } catch (error) {
    return errorResponse(error, 'Failed to refresh off-ramp status');
  }
}

async function readAnchorStatus(anchorTxId: string): Promise<OfframpStatus> {
  try {
    const transaction = await getTransactionStatus(anchorTxId);
    return mapAnchorStatus(transaction.status);
  } catch {
    // A transient anchor failure must not mark a worker's payout failed — that
    // state is terminal for the run. Leave it pending for the next poll.
    return 'pending';
  }
}

function resolveRunStatus(
  current: string,
  items: { onchainTxHash: string | null; offrampStatus: string | null }[]
): string {
  if (current !== 'executing') {
    return current;
  }

  if (hasFailedItem(items)) {
    return 'failed';
  }

  return isRunFullySettled(items) ? 'settled' : 'executing';
}
