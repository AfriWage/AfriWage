import {
  Keypair,
  Networks,
  type Transaction,
  TransactionBuilder,
  WebAuth,
} from '@stellar/stellar-sdk';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { stubServerEnv } from '@/test/env-stub';

type Sep10Module = typeof import('./sep10');

const SERVER_KEYPAIR = Keypair.random();
const HOME_DOMAIN = 'afriwage.test';

let sep10: Sep10Module;

beforeAll(async () => {
  stubServerEnv({
    AUTH_SERVER_SIGNING_KEY: SERVER_KEYPAIR.secret(),
    NEXT_PUBLIC_AUTH_HOME_DOMAIN: HOME_DOMAIN,
  });
  sep10 = await import('./sep10');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

/** Signs a challenge the way Freighter would, returning the signed envelope. */
function signChallenge(challengeXdr: string, keypair: Keypair): string {
  const tx = readTransaction(challengeXdr);
  tx.sign(keypair);
  return tx.toEnvelope().toXDR('base64');
}

/** A challenge is never a fee-bump envelope, so narrowing here keeps tests readable. */
function readTransaction(xdr: string): Transaction {
  return TransactionBuilder.fromXDR(xdr, Networks.TESTNET) as Transaction;
}

describe('parseChallengeRequest', () => {
  it('accepts a valid Stellar public key', () => {
    const publicKey = Keypair.random().publicKey();

    expect(sep10.parseChallengeRequest({ publicKey })).toEqual({ publicKey });
  });

  it.each([
    { publicKey: undefined, description: 'a missing publicKey' },
    { publicKey: 'not-a-key', description: 'a malformed publicKey' },
    { publicKey: Keypair.random().secret(), description: 'a secret key, not a public key' },
  ])('rejects $description', ({ publicKey }) => {
    expect(() => sep10.parseChallengeRequest({ publicKey })).toThrow(sep10.Sep10Error);
  });

  it('rejects a non-object body', () => {
    expect(() => sep10.parseChallengeRequest('nope')).toThrow(/must be an object/);
  });
});

describe('parseVerifyRequest', () => {
  it('accepts a non-empty transaction string', () => {
    expect(sep10.parseVerifyRequest({ transaction: 'AAAA' })).toEqual({ transaction: 'AAAA' });
  });

  it.each([[undefined], [''], ['   '], [42]])('rejects an invalid transaction (%s)', (value) => {
    expect(() => sep10.parseVerifyRequest({ transaction: value })).toThrow(sep10.Sep10Error);
  });
});

describe('buildAuthChallenge', () => {
  it('builds a challenge signed by the server with sequence number 0', () => {
    const client = Keypair.random();

    const challenge = sep10.buildAuthChallenge(client.publicKey());
    const tx = readTransaction(challenge);

    expect(tx.source).toBe(SERVER_KEYPAIR.publicKey());
    expect(tx.sequence).toBe('0');
    expect(tx.signatures).toHaveLength(1);
  });

  it('binds the challenge to the configured home domain and the client account', () => {
    const client = Keypair.random();

    const challenge = sep10.buildAuthChallenge(client.publicKey());
    const tx = readTransaction(challenge);
    const [authOp] = tx.operations;

    expect(authOp.type).toBe('manageData');
    expect((authOp as { name: string }).name).toBe(`${HOME_DOMAIN} auth`);
    expect(authOp.source).toBe(client.publicKey());
  });

  it('includes a 64-byte base64 nonce, as SEP-10 requires', () => {
    const challenge = sep10.buildAuthChallenge(Keypair.random().publicKey());
    const tx = readTransaction(challenge);
    const value = (tx.operations[0] as { value: Buffer }).value;

    expect(value).toHaveLength(64);
    expect(Buffer.from(value.toString(), 'base64')).toHaveLength(48);
  });

  it('issues a different nonce on every call', () => {
    const client = Keypair.random().publicKey();

    const first = sep10.buildAuthChallenge(client);
    const second = sep10.buildAuthChallenge(client);

    expect(first).not.toBe(second);
  });
});

describe('verifyAuthChallenge', () => {
  it('returns the client public key when the client signed the challenge', () => {
    const client = Keypair.random();
    const challenge = sep10.buildAuthChallenge(client.publicKey());

    expect(sep10.verifyAuthChallenge(signChallenge(challenge, client))).toBe(client.publicKey());
  });

  it('rejects a challenge the client never signed', () => {
    const client = Keypair.random();
    const challenge = sep10.buildAuthChallenge(client.publicKey());

    expect(() => sep10.verifyAuthChallenge(challenge)).toThrow(sep10.Sep10Error);
  });

  it('rejects a challenge signed by a different wallet than it was issued for', () => {
    const client = Keypair.random();
    const attacker = Keypair.random();
    const challenge = sep10.buildAuthChallenge(client.publicKey());

    expect(() => sep10.verifyAuthChallenge(signChallenge(challenge, attacker))).toThrow(
      sep10.Sep10Error
    );
  });

  it('rejects a challenge issued by another server', () => {
    const otherServer = Keypair.random();
    const client = Keypair.random();
    const foreignChallenge = WebAuth.buildChallengeTx(
      otherServer,
      client.publicKey(),
      HOME_DOMAIN,
      300,
      Networks.TESTNET,
      HOME_DOMAIN
    );

    expect(() => sep10.verifyAuthChallenge(signChallenge(foreignChallenge, client))).toThrow(
      sep10.Sep10Error
    );
  });

  it('rejects a challenge issued for a different home domain', () => {
    const client = Keypair.random();
    const foreignDomain = WebAuth.buildChallengeTx(
      SERVER_KEYPAIR,
      client.publicKey(),
      'evil.example',
      300,
      Networks.TESTNET,
      'evil.example'
    );

    expect(() => sep10.verifyAuthChallenge(signChallenge(foreignDomain, client))).toThrow(
      sep10.Sep10Error
    );
  });

  it('accepts a challenge inside the SDK clock-skew grace period', () => {
    const client = Keypair.random();
    const challenge = sep10.buildAuthChallenge(client.publicKey());
    const signed = signChallenge(challenge, client);

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + (sep10.CHALLENGE_TIMEOUT_SECONDS + 60) * 1000);

    try {
      expect(sep10.verifyAuthChallenge(signed)).toBe(client.publicKey());
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a challenge past the timebounds and the grace period', () => {
    const client = Keypair.random();
    const challenge = sep10.buildAuthChallenge(client.publicKey());
    const signed = signChallenge(challenge, client);

    vi.useFakeTimers();
    vi.setSystemTime(
      Date.now() + (sep10.CHALLENGE_TIMEOUT_SECONDS + sep10.CHALLENGE_GRACE_SECONDS + 60) * 1000
    );

    try {
      expect(() => sep10.verifyAuthChallenge(signed)).toThrow(sep10.Sep10Error);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a garbage envelope without throwing a non-Sep10Error', () => {
    expect(() => sep10.verifyAuthChallenge('not-base64-xdr')).toThrow(sep10.Sep10Error);
  });
});
