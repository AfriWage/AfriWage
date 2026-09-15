'use client';

import { apiFetch } from './api-client';
import { getPublicKey, signTransaction } from './freighter';

/**
 * Client half of AfriWage's SEP-10 login.
 *
 * Mirrors the flow `packages/sdk/src/anchor.ts` runs against an anchor, but
 * pointed at AfriWage's own endpoints: request a challenge, sign it with
 * Freighter, exchange it for the session cookie.
 */

export interface SessionState {
  authenticated: boolean;
  walletPublicKey?: string;
}

interface ChallengeResponse {
  transaction: string;
}

/**
 * Connects the wallet and authenticates it, returning the logged-in key.
 *
 * The public key is read back from the verify response rather than trusted from
 * the connected wallet, so the client's idea of who it is always matches what
 * the server actually authenticated.
 */
export async function loginWithFreighter(): Promise<string> {
  const publicKey = await getPublicKey();

  const { transaction } = await apiFetch<ChallengeResponse>('/api/auth/challenge', {
    method: 'POST',
    body: JSON.stringify({ publicKey }),
  });

  const signedXdr = await signTransaction(transaction);

  const { walletPublicKey } = await apiFetch<{ walletPublicKey: string }>('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ transaction: signedXdr }),
  });

  return walletPublicKey;
}

export function fetchSession(): Promise<SessionState> {
  return apiFetch<SessionState>('/api/auth/session');
}

export function logout(): Promise<SessionState> {
  return apiFetch<SessionState>('/api/auth/logout', { method: 'POST' });
}
