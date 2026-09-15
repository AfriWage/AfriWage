import { db, employees, payrollRunItems, payrollRuns } from '@AfriWage/db';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { errorResponse, notFound } from '@/lib/api-errors';
import { requireRun } from '@/lib/require-run';

/**
 * Full status of a payroll run, including every item's settlement state.
 *
 * Items carry both legs of settlement — the on-chain transaction hash and the
 * off-ramp status — because they finish at different times. A worker paid in
 * naira is not settled when the USDC moves; they are settled when the anchor
 * says so.
 */
export async function GET(request: Request, { params }: { params: { runId: string } }) {
  try {
    const { runId } = await requireRun(request, params.runId);

    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).limit(1);

    if (!run) {
      throw notFound('Payroll run not found');
    }

    const items = await db
      .select({
        id: payrollRunItems.id,
        employeeId: payrollRunItems.employeeId,
        employeeName: employees.name,
        stellarPublicKey: employees.stellarPublicKey,
        payoutOfframpCurrency: employees.payoutOfframpCurrency,
        amount: payrollRunItems.amount,
        onchainTxHash: payrollRunItems.onchainTxHash,
        offrampStatus: payrollRunItems.offrampStatus,
        offrampAnchorTxId: payrollRunItems.offrampAnchorTxId,
        settledAt: payrollRunItems.settledAt,
      })
      .from(payrollRunItems)
      .innerJoin(employees, eq(payrollRunItems.employeeId, employees.id))
      .where(eq(payrollRunItems.payrollRunId, runId))
      .orderBy(asc(employees.name));

    return NextResponse.json({ payrollRun: run, items });
  } catch (error) {
    return errorResponse(error, 'Failed to load the payroll run');
  }
}
