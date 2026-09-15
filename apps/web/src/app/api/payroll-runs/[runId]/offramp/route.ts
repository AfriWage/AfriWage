import { db, employees, payrollRunItems } from '@AfriWage/db';
import { discoverOffRampAnchor, initiateWithdrawal } from '@AfriWage/sdk';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { conflict, errorResponse, notFound, readJsonBody } from '@/lib/api-errors';
import { parseInitiateOfframp } from '@/lib/payroll-validation';
import { requireRun } from '@/lib/require-run';
import { STELLAR_NETWORK } from '@/lib/stellar';

/**
 * Starts the SEP-24 off-ramp for one paid run item. Admins and owners only.
 *
 * Reuses the existing anchor helpers in `packages/sdk/src/anchor.ts` rather
 * than adding a second integration.
 *
 * The anchor `authToken` is supplied by the caller and never stored. SEP-24
 * withdrawal authenticates as the account being withdrawn *from*, so the token
 * has to come from the worker's own wallet completing SEP-10 against the
 * anchor — an employer cannot mint one on their behalf. This route is the point
 * where that token is exchanged for an interactive URL and an anchor
 * transaction id; the id is what makes settlement visible afterwards.
 */
export async function POST(request: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await requireRun(request, params.runId, 'admin');
    const input = parseInitiateOfframp(await readJsonBody(request));

    const [item] = await db
      .select({
        id: payrollRunItems.id,
        amount: payrollRunItems.amount,
        onchainTxHash: payrollRunItems.onchainTxHash,
        offrampStatus: payrollRunItems.offrampStatus,
        stellarPublicKey: employees.stellarPublicKey,
        payoutOfframpCurrency: employees.payoutOfframpCurrency,
      })
      .from(payrollRunItems)
      .innerJoin(employees, eq(payrollRunItems.employeeId, employees.id))
      .where(and(eq(payrollRunItems.id, input.itemId), eq(payrollRunItems.payrollRunId, run.runId)))
      .limit(1);

    if (!item) {
      throw notFound('That item is not part of this payroll run');
    }

    if (!item.onchainTxHash) {
      throw conflict('This item has not been paid on-chain yet');
    }

    const currency = input.destinationCurrency ?? item.payoutOfframpCurrency;

    if (!currency) {
      throw conflict('This worker is paid on-chain and has no off-ramp currency');
    }

    if (item.offrampStatus === 'complete') {
      throw conflict('This item has already been off-ramped');
    }

    const { anchor } = await discoverOffRampAnchor(
      currency as 'NGN' | 'GHS',
      STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
    );

    const interactive = await initiateWithdrawal({
      transferServer: anchor.transferServerSep24,
      authToken: input.authToken,
      assetCode: 'USDC',
      account: item.stellarPublicKey,
      amount: item.amount,
      destinationAsset: currency as 'NGN' | 'GHS',
    });

    const [updated] = await db
      .update(payrollRunItems)
      .set({ offrampStatus: 'pending', offrampAnchorTxId: interactive.id })
      .where(eq(payrollRunItems.id, item.id))
      .returning();

    return NextResponse.json({ item: updated, interactiveUrl: interactive.url });
  } catch (error) {
    return errorResponse(error, 'Failed to start the off-ramp');
  }
}
