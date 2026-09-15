import { Keypair } from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { stubServerEnv } from '@/test/env-stub';

type AuthModule = typeof import('./auth');

const JWT_SECRET = 'c'.repeat(32);
const HOME_DOMAIN = 'afriwage.test';
const WALLET = Keypair.random().publicKey();

let auth: AuthModule;

beforeAll(async () => {
  stubServerEnv({
    JWT_SECRET,
    NEXT_PUBLIC_AUTH_HOME_DOMAIN: HOME_DOMAIN,
  });
  auth = await import('./auth');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function requestWithCookie(cookie: string): Request {
  return new Request('http://localhost/api/orgs', { headers: { cookie } });
}

describe('createSessionToken / verifySessionToken', () => {
  it('round-trips the wallet public key', () => {
    const token = auth.createSessionToken(WALLET);

    expect(auth.verifySessionToken(token)).toEqual({ walletPublicKey: WALLET });
  });

  it('issues a token that expires in 24 hours', () => {
    const decoded = jwt.decode(auth.createSessionToken(WALLET)) as jwt.JwtPayload;

    expect(decoded.exp).toBeDefined();
    expect((decoded.exp as number) - (decoded.iat as number)).toBe(auth.SESSION_TTL_SECONDS);
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({}, 'd'.repeat(32), {
      algorithm: 'HS256',
      subject: WALLET,
      issuer: HOME_DOMAIN,
      expiresIn: 3600,
    });

    expect(auth.verifySessionToken(forged)).toBeNull();
  });

  it('rejects an unsigned alg:none token', () => {
    const forged = jwt.sign({ sub: WALLET, iss: HOME_DOMAIN }, '', { algorithm: 'none' });

    expect(auth.verifySessionToken(forged)).toBeNull();
  });

  it('rejects a token issued for another home domain', () => {
    const forged = jwt.sign({}, JWT_SECRET, {
      algorithm: 'HS256',
      subject: WALLET,
      issuer: 'evil.example',
      expiresIn: 3600,
    });

    expect(auth.verifySessionToken(forged)).toBeNull();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({}, JWT_SECRET, {
      algorithm: 'HS256',
      subject: WALLET,
      issuer: HOME_DOMAIN,
      expiresIn: -10,
    });

    expect(auth.verifySessionToken(expired)).toBeNull();
  });

  it('rejects a token whose subject is not a Stellar public key', () => {
    const forged = jwt.sign({}, JWT_SECRET, {
      algorithm: 'HS256',
      subject: 'admin',
      issuer: HOME_DOMAIN,
      expiresIn: 3600,
    });

    expect(auth.verifySessionToken(forged)).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(auth.verifySessionToken('not.a.jwt')).toBeNull();
  });
});

describe('readCookie', () => {
  it('returns the named cookie from a multi-cookie header', () => {
    expect(readCookieFixture('NEXT_LOCALE=en; afriwage_session=abc123; theme=dark')).toBe('abc123');
  });

  it('does not match a cookie whose name merely ends with the target', () => {
    expect(readCookieFixture('not_afriwage_session=abc123')).toBeNull();
  });

  it('returns null for a missing header', () => {
    expect(auth.readCookie(null, auth.SESSION_COOKIE_NAME)).toBeNull();
  });

  function readCookieFixture(header: string) {
    return auth.readCookie(header, auth.SESSION_COOKIE_NAME);
  }
});

describe('getSession', () => {
  it('returns the session for a request carrying a valid cookie', () => {
    const token = auth.createSessionToken(WALLET);

    expect(getSessionFor(`${auth.SESSION_COOKIE_NAME}=${token}`)).toEqual({
      walletPublicKey: WALLET,
    });
  });

  it('returns null when the request has no cookie header', () => {
    expect(auth.getSession(new Request('http://localhost/api/orgs'))).toBeNull();
  });

  it('returns null when the cookie holds a forged token', () => {
    expect(getSessionFor(`${auth.SESSION_COOKIE_NAME}=not.a.jwt`)).toBeNull();
  });

  function getSessionFor(cookie: string) {
    return auth.getSession(requestWithCookie(cookie));
  }
});

describe('cookie builders', () => {
  it('marks the session cookie HttpOnly, Lax and path-wide', () => {
    const cookie = auth.buildSessionCookie('token-value');

    expect(cookie).toContain(`${auth.SESSION_COOKIE_NAME}=token-value`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain(`Max-Age=${auth.SESSION_TTL_SECONDS}`);
  });

  it('expires the cookie immediately when clearing a session', () => {
    const cookie = auth.buildSessionClearCookie();

    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('HttpOnly');
  });
});
