import {
  Keypair,
  Networks,
  type Transaction,
  TransactionBuilder,
  WebAuth,
} from '@stellar/stellar-sdk';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { stubServerEnv } from '@/test/env-stub';

const SERVER_KEYPAIR = Keypair.random();
const HOME_DOMAIN = 'afriwage.test';

let POST: typeof import('./route').POST;
let auth: typeof import('@/lib/auth');

beforeAll(async () => {
  stubServerEnv({
    AUTH_SERVER_SIGNING_KEY: SERVER_KEYPAIR.secret(),
    NEXT_PUBLIC_AUTH_HOME_DOMAIN: HOME_DOMAIN,
  });
  ({ POST } = await import('./route'));
  auth = await import('@/lib/auth');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function challengeFor(client: Keypair, signer: Keypair = client): string {
  const challenge = WebAuth.buildChallengeTx(
    SERVER_KEYPAIR,
    client.publicKey(),
    HOME_DOMAIN,
    300,
    Networks.TESTNET,
    HOME_DOMAIN
  );

  const tx = TransactionBuilder.fromXDR(challenge, Networks.TESTNET) as Transaction;
  tx.sign(signer);
  return tx.toEnvelope().toXDR('base64');
}

function post(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

describe('POST /api/auth/verify', () => {
  it('issues an HttpOnly session cookie for a correctly signed challenge', async () => {
    const client = Keypair.random();

    const response = await post({ transaction: challengeFor(client) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ walletPublicKey: client.publicKey() });

    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${auth.SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('issues a session that getSession accepts on a later request', async () => {
    const client = Keypair.random();
    const response = await post({ transaction: challengeFor(client) });
    const cookie = (response.headers.get('set-cookie') ?? '').split(';')[0];

    const session = auth.getSession(
      new Request('http://localhost/api/orgs', { headers: { cookie } })
    );

    expect(session).toEqual({ walletPublicKey: client.publicKey() });
  });

  it('returns 401 and sets no cookie when another wallet signed the challenge', async () => {
    const client = Keypair.random();
    const attacker = Keypair.random();

    const response = await post({ transaction: challengeFor(client, attacker) });

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('returns 401 for an unsigned challenge', async () => {
    const client = Keypair.random();
    const unsigned = WebAuth.buildChallengeTx(
      SERVER_KEYPAIR,
      client.publicKey(),
      HOME_DOMAIN,
      300,
      Networks.TESTNET,
      HOME_DOMAIN
    );

    expect((await post({ transaction: unsigned })).status).toBe(401);
  });

  it('returns 401 for a challenge issued by a different server', async () => {
    const otherServer = Keypair.random();
    const client = Keypair.random();
    const foreign = WebAuth.buildChallengeTx(
      otherServer,
      client.publicKey(),
      HOME_DOMAIN,
      300,
      Networks.TESTNET,
      HOME_DOMAIN
    );
    const tx = TransactionBuilder.fromXDR(foreign, Networks.TESTNET) as Transaction;
    tx.sign(client);

    const response = await post({ transaction: tx.toEnvelope().toXDR('base64') });

    expect(response.status).toBe(401);
  });

  it('returns 401 for a missing transaction field', async () => {
    expect((await post({})).status).toBe(401);
  });
});
