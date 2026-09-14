import { StrKey } from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import { env } from './env';

/**
 * Session handling for wallet-authenticated requests.
 *
 * A session is minted only after `sep10.ts` has verified that the wallet signed
 * an AfriWage challenge, and carries nothing but the wallet public key — every
 * authorisation decision beyond "which wallet is this" is made against
 * `org_members` in `require-org.ts`, so a stale token can never carry a role
 * the database has since revoked.
 *
 * Server-only — it reads `JWT_SECRET` via `./env`.
 */

export const SESSION_COOKIE_NAME = 'afriwage_session';

/** 24 hours, matching the SEP-10 session lifetime AfriWage advertises. */
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

export interface Session {
  walletPublicKey: string;
}

/** Mints a signed session token for a wallet whose challenge has been verified. */
export function createSessionToken(walletPublicKey: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: walletPublicKey,
    issuer: env.NEXT_PUBLIC_AUTH_HOME_DOMAIN,
    expiresIn: SESSION_TTL_SECONDS,
  });
}

/**
 * Verifies a session token and returns its wallet.
 *
 * The algorithm is pinned to HS256 so a token forged with `alg: none` — or with
 * the secret used as an RSA public key — is rejected rather than trusted.
 */
export function verifySessionToken(token: string): Session | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.NEXT_PUBLIC_AUTH_HOME_DOMAIN,
    });

    const subject = typeof payload === 'string' ? undefined : payload.sub;

    if (typeof subject !== 'string' || !StrKey.isValidEd25519PublicKey(subject)) {
      return null;
    }

    return { walletPublicKey: subject };
  } catch {
    return null;
  }
}

/** Extracts a single cookie value from a raw `Cookie` header. */
export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) continue;

    if (part.slice(0, separatorIndex).trim() === name) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }

  return null;
}

/**
 * Reads and verifies the session cookie on a request.
 *
 * Takes a plain `Request` rather than `NextRequest` so it works unchanged in
 * route handlers and in tests that construct a request by hand.
 */
export function getSession(request: Request): Session | null {
  const token = readCookie(request.headers.get('cookie'), SESSION_COOKIE_NAME);

  return token ? verifySessionToken(token) : null;
}

/**
 * Builds the `Set-Cookie` value carrying a session.
 *
 * `HttpOnly` keeps the token away from page scripts, and `SameSite=Lax` blocks
 * it from riding along on cross-site POSTs — the app never needs a cross-site
 * authenticated request, and every mutation here is a POST.
 */
export function buildSessionCookie(token: string): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];

  if (process.env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

/** Builds the `Set-Cookie` value that clears a session on logout. */
export function buildSessionClearCookie(): string {
  const attributes = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];

  if (process.env.NODE_ENV === 'production') {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}
