import { db, organizations, payrollRuns } from '@AfriWage/db';
import { CharterError, approvePayout, getPayoutRequest } from '@AfriWage/sdk';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { conflict, errorResponse, readJsonBody } from '@/lib/api-errors';
import { charterConfig } from '@/lib/charter-config';
import { assertTransition } from '@/lib/payroll-state';
import { requireRun } from '@/lib/require-run';

/**
 * Approves a run's Charter spend request. Payer role only.
 *
 * `payer` is required literally — an owner does not satisfy it. The role
 * mirrors the treasury's on-chain approver set, so letting an owner through
 * would build a transaction that passes AfriWage's checks and then fails with
 * Charter's `NotApprover`.
 *
 * Two phases again:
 *
 * 1. An empty body returns the unsigned `approve_request` XDR for this payer.
 * 2. `{ sync: true }`, sent after the approval is submitted, re-reads the
 *    request from chain and advances the run if Charter executed it.
 *
 * Phase two takes no transaction hash on purpose. Charter executes the payout
 * inside whichever approval meets the threshold, so the contract — not the
 * caller's transaction — is the authority on whether the run is approved. That
 * also makes the sync idempotent and safe for any payer to trigger.
 */
export async function POST(request: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await requireRun(request, params.runId, 'payer');
    const body = (await readJsonBody(request).catch(() => ({}))) as { sync?: unknown };

    if (run.status !== 'pending_approval') {
      throw conflict(`A payroll run can only be approved from pending_approval, not ${run.status}`);
    }

    if (!run.charterRequestId) {
      throw conflict('This payroll run has no Charter spend request to approve');
    }

    const treasuryContractId = await treasuryFor(run.orgId);
    const config = charterConfig();
    const requestId = Number(run.charterRequestId);

    if (body.sync !== true) {
      const xdr = await approvePayout(
        { treasuryContractId, approver: run.walletPublicKey, requestId },
        config
      );

      return NextResponse.json({ xdr, status: run.status });
    }

    // Resync from chain. Charter is the authority on whether the threshold has
    // been met, so the run's status follows the contract rather than counting
    // approvals here.
    const charterRequest = await getPayoutRequest(treasuryContractId, requestId, config);

    if (charterRequest.status === 'Rejected' || charterRequest.status === 'Cancelled') {
      assertTransition(run.status, 'failed');
      const [failed] = await db
        .update(payrollRuns)
        .set({ status: 'failed' })
        .where(eq(payrollRuns.id, run.runId))
        .returning();

      return NextResponse.json({ payrollRun: failed, charterRequest });
    }

    if (charterRequest.status !== 'Executed') {
      return NextResponse.json({
        payrollRun: null,
        charterRequest,
        approvalsRemaining: true,
      });
    }

    assertTransition(run.status, 'approved');

    const [updated] = await db
      .update(payrollRuns)
      .set({ status: 'approved' })
      .where(eq(payrollRuns.id, run.runId))
      .returning();

    return NextResponse.json({ payrollRun: updated, charterRequest });
  } catch (error) {
    if (error instanceof CharterError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return errorResponse(error, 'Failed to approve the payroll run');
  }
}

async function treasuryFor(orgId: string): Promise<string> {
  const [organization] = await db
    .select({ treasuryContractId: organizations.treasuryContractId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!organization?.treasuryContractId) {
    throw conflict('This organization has no treasury');
  }

  return organization.treasuryContractId;
}
