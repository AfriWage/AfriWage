import { NextResponse } from 'next/server';
import { buildSessionCookie, createSessionToken } from '@/lib/auth';
import { errorResponse, readJsonBody } from '@/lib/api-errors';
import { Sep10Error, parseVerifyRequest, verifyAuthChallenge } from '@/lib/sep10';

/**
 * Verifies a signed SEP-10 challenge and starts a session.
 *
 * The wallet public key is taken from the verified challenge, never from the
 * request body — a caller cannot claim an account it did not sign for.
 */
export async function POST(request: Request) {
  try {
    const { transaction } = parseVerifyRequest(await readJsonBody(request));
    const walletPublicKey = verifyAuthChallenge(transaction);
    const token = createSessionToken(walletPublicKey);

    return NextResponse.json(
      { walletPublicKey },
      { headers: { 'Set-Cookie': buildSessionCookie(token) } }
    );
  } catch (error) {
    if (error instanceof Sep10Error) {
      // A failed challenge is an authentication failure, not a malformed
      // request: 401 lets the client distinguish "sign again" from "fix the
      // request" without parsing the message.
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    return errorResponse(error, 'Failed to verify authentication challenge');
  }
}
