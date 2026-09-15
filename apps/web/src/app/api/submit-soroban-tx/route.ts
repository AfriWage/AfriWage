import { TransactionBuilder } from '@stellar/stellar-sdk';
import { rpc } from '@stellar/stellar-sdk';
import { NextResponse } from 'next/server';
import { badRequest, errorResponse, readJsonBody } from '@/lib/api-errors';
import { charterConfig } from '@/lib/charter-config';

/**
 * Submits a signed Soroban transaction through the Soroban RPC.
 *
 * The existing `/api/submit-tx` submits through Horizon, which is right for the
 * classic payments it was built for. Soroban invocations go through the RPC
 * instead: it is the endpoint that returns the contract's return value, which
 * is how `deploy_treasury`'s new org id is later read back by
 * `/api/orgs/[orgId]/treasury`.
 *
 * `submit-tx` is deliberately left untouched — the ad-hoc and batch payment
 * flows keep using it.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const signedXdr = (body as { signedXdr?: unknown }).signedXdr;

    if (typeof signedXdr !== 'string' || signedXdr.trim() === '') {
      throw badRequest('signedXdr is required');
    }

    const config = charterConfig();
    const server = new rpc.Server(config.rpcUrl);

    let transaction: ReturnType<typeof TransactionBuilder.fromXDR>;
    try {
      transaction = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
    } catch {
      throw badRequest('signedXdr is not a valid transaction envelope');
    }

    const result = await server.sendTransaction(transaction);

    if (result.status === 'ERROR') {
      return NextResponse.json(
        {
          message: 'The network rejected the transaction',
          status: result.status,
          hash: result.hash,
        },
        { status: 502 }
      );
    }

    // PENDING is the success path: the transaction is queued and the caller
    // polls for its result by hash. TRY_AGAIN_LATER and DUPLICATE are reported
    // as-is so the client can decide whether to resubmit.
    return NextResponse.json({ hash: result.hash, status: result.status });
  } catch (error) {
    return errorResponse(error, 'Failed to submit the transaction');
  }
}
