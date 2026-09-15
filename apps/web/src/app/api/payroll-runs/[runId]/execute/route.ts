import { db, employees, payrollRunItems, payrollRuns } from '@AfriWage/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { conflict, errorResponse, readJsonBody } from '@/lib/api-errors';
import { assertTransition, isRunFullySettled } from '@/lib/payroll-state';
import { parseConfirmTransaction } from '@/lib/payroll-validation';
import { requireRun } from '@/lib/require-run';

/**
 * Records the fan-out payment that pays each worker. Payer role only.
 *
 * Charter released the run's total to the submitting member's wallet when the
 * approval threshold was met. The distribution itself is an ordinary multi-
 * operation USDC payment, built by the existing `/api/build-payment` route and
 * signed in Freighter — that builder already handles up to 100 operations and
 * is deliberately reused rather than reimplemented here.
 *
 * This route only records the result. The confirmed transaction hash is the
 * single source of truth for whether workers were paid, so a run is never
 * advanced on the strength of an intention.
 */
export async function POST(request: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await requireRun(request, params.runId, 'payer');
    const { transactionHash } = parseConfirmTransaction(await readJsonBody(request));

    if (run.status !== 'approved' && run.status !== 'executing') {
      throw conflict(`A payroll run can only be executed from approved, not ${run.status}`);
    }

    if (run.status === 'approved') {
      assertTransition(run.status, 'executing');
    }

    const items = await db
      .update(payrollRunItems)
      .set({ onchainTxHash: transactionHash })
      .where(eq(payrollRunItems.payrollRunId, run.runId))
      .returning();

    // A run with no off-ramp legs is finished the moment the payment confirms.
    // One with off-ramps stays `executing` until the anchor reports each leg
    // complete, which `offramp-status` polls for.
    const settlements = await db
      .select({
        onchainTxHash: payrollRunItems.onchainTxHash,
        offrampStatus: payrollRunItems.offrampStatus,
        payoutOfframpCurrency: employees.payoutOfframpCurrency,
      })
      .from(payrollRunItems)
      .innerJoin(employees, eq(payrollRunItems.employeeId, employees.id))
      .where(eq(payrollRunItems.payrollRunId, run.runId));

    const needsOfframp = settlements.some((item) => item.payoutOfframpCurrency !== null);
    const settled = !needsOfframp && isRunFullySettled(settlements);

    const [updated] = await db
      .update(payrollRuns)
      .set({
        status: settled ? 'settled' : 'executing',
        executedAt: new Date(),
      })
      .where(eq(payrollRuns.id, run.runId))
      .returning();

    return NextResponse.json({ payrollRun: updated, itemCount: items.length });
  } catch (error) {
    return errorResponse(error, 'Failed to record the payroll execution');
  }
}
