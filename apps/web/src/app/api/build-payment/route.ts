import { NextResponse } from 'next/server';
import { Horizon } from '@stellar/stellar-sdk';
import {
  buildPaymentTransactionXdr,
  BuildPaymentRequestError,
  parseBuildPaymentRequest,
} from './build-payment';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

/**
 * Builds an unsigned payment transaction XDR for one or more payment operations.
 * The client (Freighter) will sign it, then submit via /api/submit-tx.
 */
export async function POST(request: Request) {
  try {
    const parsed = parseBuildPaymentRequest(await request.json());

    const account = await server.loadAccount(parsed.senderPublicKey);
    const xdr = buildPaymentTransactionXdr({
      sourceAccount: account,
      payments: parsed.payments,
      memo: parsed.memo,
    });

    return NextResponse.json({ xdr });
  } catch (error) {
    console.error('Error building payment transaction:', error);
    const message = error instanceof Error ? error.message : 'Failed to build transaction';
    const status = error instanceof BuildPaymentRequestError ? 400 : 502;
    return NextResponse.json({ message }, { status });
  }
}
