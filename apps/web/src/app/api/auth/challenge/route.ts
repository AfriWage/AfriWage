import { NextResponse } from 'next/server';
import { errorResponse, readJsonBody } from '@/lib/api-errors';
import {
  Sep10Error,
  buildAuthChallenge,
  getAuthServerPublicKey,
  parseChallengeRequest,
} from '@/lib/sep10';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

/**
 * Issues a SEP-10 challenge transaction for a wallet to sign.
 *
 * The response uses the SEP-10 wire shape (`transaction` plus
 * `network_passphrase`) so the client can hand it straight to Freighter — the
 * same shape `packages/sdk/src/anchor.ts` consumes when AfriWage is the client
 * authenticating against an anchor.
 *
 * No state is stored for an issued challenge. The challenge carries its own
 * nonce, home domain and timebounds and is signed by the server, so
 * `/api/auth/verify` can validate it standalone.
 */
export async function POST(request: Request) {
  try {
    const { publicKey } = parseChallengeRequest(await readJsonBody(request));

    return NextResponse.json({
      transaction: buildAuthChallenge(publicKey),
      network_passphrase: NETWORK_PASSPHRASE,
      server_account: getAuthServerPublicKey(),
    });
  } catch (error) {
    if (error instanceof Sep10Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return errorResponse(error, 'Failed to build authentication challenge');
  }
}
