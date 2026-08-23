import { NextResponse } from 'next/server';
import { Horizon, TransactionBuilder, Networks } from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

/**
 * Submits a signed transaction XDR to the Stellar network.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedXdr } = body;

    if (!signedXdr) {
      return NextResponse.json({ message: 'signedXdr is required' }, { status: 400 });
    }

    const transaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    const result = await server.submitTransaction(transaction);

    return NextResponse.json({
      hash: result.hash,
      ledger: result.ledger,
      successful: result.successful,
    });
  } catch (error) {
    console.error('Error submitting transaction:', error);

    // Extract Horizon error details if available
    const errorDetails = error as { response?: { data?: { extras?: { result_codes?: unknown } } } };
    const resultCodes = errorDetails?.response?.data?.extras?.result_codes;
    const message = resultCodes
      ? `Transaction failed: ${JSON.stringify(resultCodes)}`
      : error instanceof Error
        ? error.message
        : 'Failed to submit transaction';

    return NextResponse.json({ message, successful: false }, { status: 502 });
  }
}
