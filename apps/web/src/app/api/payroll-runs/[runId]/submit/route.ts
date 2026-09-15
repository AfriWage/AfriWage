import { db, organizations, payrollRuns } from '@AfriWage/db';
import { CharterError, readSubmittedRequestId, requestPayout } from '@AfriWage/sdk';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { conflict, errorResponse, notFound, readJsonBody } from '@/lib/api-errors';
import { charterConfig } from '@/lib/charter-config';
import { assertTransition } from '@/lib/payroll-state';
import { parseSubmitRun } from '@/lib/payroll-validation';
import { requireRun } from '@/lib/require-run';

/**
 * Moves a run from `draft` to `pending_approval`. Admins and owners only.
 *
 * Two phases, because the spend request has to be signed by the submitting
 * member and AfriWage holds no treasury key:
 *
 * 1. `{ categoryId }` returns the unsigned `submit_request` XDR.
 * 2. `{ transactionHash }` reads the request id back out of the submitted
 *    transaction and advances the run.
 *
 * The status only changes in phase two. A run whose member abandons the signing
 * prompt stays a draft rather than sitting in `pending_approval` with no
 * on-chain request behind it.
 *
 * One Charter request covers the whole run. Charter pays a single recipient per
 * request, so per-employee requests would need `threshold` signatures each —
 * dozens of Freighter prompts for one payroll. The run-level request releases
 * the total to the submitting member's wallet, which then fans out to workers
 * through the existing multi-operation payment builder; per-item transaction
 * hashes are recorded at that step.
 */
export async function POST(request: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await requireRun(request, params.runId, 'admin');
    const input = parseSubmitRun(await readJsonBody(request));

    assertTransition(run.status, 'pending_approval');

    const [organization] = await db
      .select({ treasuryContractId: organizations.treasuryContractId })
      .from(organizations)
      .where(eq(organizations.id, run.orgId))
      .limit(1);

    if (!organization?.treasuryContractId) {
      throw conflict('Provision a treasury before submitting a payroll run');
    }

    if ('categoryId' in input && input.categoryId !== undefined) {
      const xdr = await requestPayout(
        {
          treasuryContractId: organization.treasuryContractId,
          requester: run.walletPublicKey,
          categoryId: input.categoryId,
          recipient: run.walletPublicKey,
          amount: run.totalAmount,
          memo: payrollMemo(run.runId),
        },
        charterConfig()
      );

      return NextResponse.json({ xdr, status: run.status });
    }

    const charterRequestId = await readSubmittedRequestId(
      input.transactionHash as string,
      charterConfig()
    );

    if (charterRequestId === null) {
      return NextResponse.json({ pending: true, status: run.status }, { status: 202 });
    }

    const [updated] = await db
      .update(payrollRuns)
      .set({ status: 'pending_approval', charterRequestId: String(charterRequestId) })
      .where(eq(payrollRuns.id, run.runId))
      .returning();

    if (!updated) {
      throw notFound('Payroll run not found');
    }

    return NextResponse.json({ payrollRun: updated, pending: false });
  } catch (error) {
    if (error instanceof CharterError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return errorResponse(error, 'Failed to submit the payroll run');
  }
}

/**
 * Memo recorded on-chain with the spend request.
 *
 * Charter memos are short, so this carries the run's id prefix rather than the
 * full uuid — enough to tie an on-chain request back to a run when auditing.
 */
function payrollMemo(runId: string): string {
  return `payroll:${runId.slice(0, 8)}`;
}
