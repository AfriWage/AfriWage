import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const WALLET = Keypair.random().publicKey();

let GET: typeof import('./route').GET;
let auth: typeof import('@/lib/auth');

beforeAll(async () => {
  vi.stubEnv('POSTGRES_URL', 'postgres://user:password@host:5432/dbname');
  vi.stubEnv('YELLOWCARD_API_KEY', 'sandbox-test-key');
  vi.stubEnv('AUTH_SERVER_SIGNING_KEY', Keypair.random().secret());
  vi.stubEnv('JWT_SECRET', 'h'.repeat(32));
  vi.stubEnv('NEXT_PUBLIC_AUTH_HOME_DOMAIN', 'afriwage.test');
  ({ GET } = await import('./route'));
  auth = await import('@/lib/auth');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/auth/session', () => {
  it('reports the authenticated wallet', async () => {
    const token = auth.createSessionToken(WALLET);
    const response = await GET(
      new Request('http://localhost/api/auth/session', {
        headers: { cookie: `${auth.SESSION_COOKIE_NAME}=${token}` },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true, walletPublicKey: WALLET });
  });

  it('reports an anonymous visitor with 200, not 401', async () => {
    const response = await GET(new Request('http://localhost/api/auth/session'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: false });
  });
});
