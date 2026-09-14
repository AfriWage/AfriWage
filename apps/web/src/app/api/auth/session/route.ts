import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Reports the current session so the client can restore its logged-in state on
 * load without re-running the SEP-10 flow.
 *
 * The session cookie is HttpOnly, so this route is the only way the browser can
 * learn which wallet it is authenticated as.
 */
export async function GET(request: Request) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({ authenticated: true, walletPublicKey: session.walletPublicKey });
}
