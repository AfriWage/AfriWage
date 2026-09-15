import { Keypair, Networks, type Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const SERVER_KEYPAIR = Keypair.random();
const HOME_DOMAIN = 'afriwage.test';

let POST: typeof import('./route').POST;

beforeAll(async () => {
  vi.stubEnv('POSTGRES_URL', 'postgres://user:password@host:5432/dbname');
  vi.stubEnv('YELLOWCARD_API_KEY', 'sandbox-test-key');
  vi.stubEnv('AUTH_SERVER_SIGNING_KEY', SERVER_KEYPAIR.secret());
  vi.stubEnv('JWT_SECRET', 'f'.repeat(32));
  vi.stubEnv('NEXT_PUBLIC_AUTH_HOME_DOMAIN', HOME_DOMAIN);
  ({ POST } = await import('./route'));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function post(body: unknown, raw?: string): Promise<Response> {
  return POST(
    new Request('http://localhost/api/auth/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw ?? JSON.stringify(body),
    })
  );
}

describe('POST /api/auth/challenge', () => {
  it('returns a server-signed challenge for a valid public key', async () => {
    const publicKey = Keypair.random().publicKey();

    const response = await post({ publicKey });
    const body = (await response.json()) as {
      transaction: string;
      network_passphrase: string;
      server_account: string;
    };

    expect(response.status).toBe(200);
    expect(body.network_passphrase).toBe(Networks.TESTNET);
    expect(body.server_account).toBe(SERVER_KEYPAIR.publicKey());

    const tx = TransactionBuilder.fromXDR(body.transaction, Networks.TESTNET) as Transaction;
    expect(tx.source).toBe(SERVER_KEYPAIR.publicKey());
    expect(tx.operations[0].source).toBe(publicKey);
  });

  it('rejects a malformed public key with 400', async () => {
    const response = await post({ publicKey: 'nope' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'publicKey must be a valid Stellar public key',
    });
  });

  it('rejects a missing public key with 400', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('rejects a body that is not valid JSON with 400, not 500', async () => {
    const response = await post(undefined, '{ not json');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Request body must be valid JSON' });
  });
});
