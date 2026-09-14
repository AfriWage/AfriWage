import { Keypair, StrKey, WebAuth } from '@stellar/stellar-sdk';
import { env } from './env';
import { NETWORK_PASSPHRASE } from './stellar';

/**
 * SEP-10 web authentication, with AfriWage as its own authentication server.
 *
 * `packages/sdk/src/anchor.ts` speaks the *client* half of this protocol when
 * AfriWage authenticates against an anchor. This module is the *server* half:
 * AfriWage issues challenges for its own home domain and verifies that the
 * wallet holding a public key signed one, which is what turns "a connected
 * Freighter wallet" into "a logged-in member".
 *
 * Server-only — it reads `AUTH_SERVER_SIGNING_KEY` via `./env`.
 */

/**
 * Challenge lifetime written into the transaction's timebounds. SEP-10's
 * recommended default; short enough to limit replay.
 *
 * Note that verification is more lenient than this value suggests: the SDK's
 * `readChallengeTx` allows a fixed five-minute grace period on top of the
 * timebounds to absorb clock skew, so a challenge is in practice accepted for
 * up to ten minutes after it was issued.
 */
export const CHALLENGE_TIMEOUT_SECONDS = 300;

/** Clock-skew grace the SDK adds to the timebounds when reading a challenge. */
export const CHALLENGE_GRACE_SECONDS = 300;

/** Raised for any malformed request or failed verification. Maps to a 400. */
export class Sep10Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Sep10Error';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * The keypair whose secret signs challenges. Derived lazily so a module import
 * in a context without the env (e.g. a unit test of an unrelated helper) does
 * not throw at load time.
 */
function serverKeypair(): Keypair {
  return Keypair.fromSecret(env.AUTH_SERVER_SIGNING_KEY);
}

/** Public key clients use to validate that a challenge came from AfriWage. */
export function getAuthServerPublicKey(): string {
  return serverKeypair().publicKey();
}

export interface ParsedChallengeRequest {
  publicKey: string;
}

export function parseChallengeRequest(body: unknown): ParsedChallengeRequest {
  if (!isRecord(body)) {
    throw new Sep10Error('Request body must be an object');
  }

  const { publicKey } = body;

  if (typeof publicKey !== 'string' || !StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Sep10Error('publicKey must be a valid Stellar public key');
  }

  return { publicKey };
}

export interface ParsedVerifyRequest {
  transaction: string;
}

export function parseVerifyRequest(body: unknown): ParsedVerifyRequest {
  if (!isRecord(body)) {
    throw new Sep10Error('Request body must be an object');
  }

  const { transaction } = body;

  if (typeof transaction !== 'string' || transaction.trim() === '') {
    throw new Sep10Error('transaction must be a base64-encoded transaction envelope');
  }

  return { transaction };
}

/**
 * Builds a SEP-10 challenge transaction for the given wallet.
 *
 * The transaction has sequence number 0 so it can never be submitted to the
 * network; its only purpose is to be signed as a proof of key ownership.
 */
export function buildAuthChallenge(clientPublicKey: string): string {
  return WebAuth.buildChallengeTx(
    serverKeypair(),
    clientPublicKey,
    env.NEXT_PUBLIC_AUTH_HOME_DOMAIN,
    CHALLENGE_TIMEOUT_SECONDS,
    NETWORK_PASSPHRASE,
    env.NEXT_PUBLIC_AUTH_HOME_DOMAIN
  );
}

/**
 * Verifies a signed challenge and returns the wallet public key it proves
 * ownership of.
 *
 * The client account is deliberately *not* looked up on Horizon. AfriWage
 * onboards wallets that may hold no funds and therefore may not exist on the
 * network yet, so the master key is treated as the sole authorised signer
 * rather than reading the account's signer set and thresholds.
 */
export function verifyAuthChallenge(signedTransactionXdr: string): string {
  const serverPublicKey = getAuthServerPublicKey();

  let clientAccountID: string;
  try {
    ({ clientAccountID } = WebAuth.readChallengeTx(
      signedTransactionXdr,
      serverPublicKey,
      NETWORK_PASSPHRASE,
      env.NEXT_PUBLIC_AUTH_HOME_DOMAIN,
      env.NEXT_PUBLIC_AUTH_HOME_DOMAIN
    ));
  } catch (error) {
    throw new Sep10Error(
      error instanceof Error ? error.message : 'Challenge transaction could not be read'
    );
  }

  try {
    const signers = WebAuth.verifyChallengeTxSigners(
      signedTransactionXdr,
      serverPublicKey,
      NETWORK_PASSPHRASE,
      [clientAccountID],
      env.NEXT_PUBLIC_AUTH_HOME_DOMAIN,
      env.NEXT_PUBLIC_AUTH_HOME_DOMAIN
    );

    if (!signers.includes(clientAccountID)) {
      throw new Sep10Error('Challenge was not signed by the claimed account');
    }
  } catch (error) {
    if (error instanceof Sep10Error) throw error;
    throw new Sep10Error(
      error instanceof Error ? error.message : 'Challenge signature verification failed'
    );
  }

  return clientAccountID;
}
