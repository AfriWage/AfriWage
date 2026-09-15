import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubServerEnv } from '@/test/env-stub';

const { mockSendTransaction } = vi.hoisted(() => ({ mockSendTransaction: vi.fn() }));

vi.mock('@stellar/stellar-sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');

  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: class {
        sendTransaction = mockSendTransaction;
      },
    },
  };
});

let POST: typeof import('./route').POST;

/** A real signed envelope, so the route's XDR parsing is genuinely exercised. */
let signedXdr: string;

beforeAll(async () => {
  stubServerEnv();
  vi.stubEnv(
    'CHARTER_FACTORY_CONTRACT_ID',
    'CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4'
  );
  stubServerEnv();
  vi.stubEnv(
    'CHARTER_TREASURY_TOKEN_CONTRACT_ID',
    'CAH4PUADD2X3K52TKETWTIL4GHPZT55LWUEVVOSH6B3D3KA2ZH7HQGTT'
  );

  const { Account, Networks, Operation, TransactionBuilder, BASE_FEE } = await import(
    '@stellar/stellar-sdk'
  );
  const keypair = Keypair.random();
  const transaction = new TransactionBuilder(new Account(keypair.publicKey(), '1'), {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.bumpSequence({ bumpTo: '2' }))
    .setTimeout(60)
    .build();
  transaction.sign(keypair);
  signedXdr = transaction.toXDR();

  ({ POST } = await import('./route'));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  mockSendTransaction.mockReset();
});

function post(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/submit-soroban-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

describe('POST /api/submit-soroban-tx', () => {
  it('returns the hash when the RPC queues the transaction', async () => {
    mockSendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'abc123' });

    const response = await post({ signedXdr });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hash: 'abc123', status: 'PENDING' });
  });

  it('reports TRY_AGAIN_LATER as-is so the client can decide to resubmit', async () => {
    mockSendTransaction.mockResolvedValue({ status: 'TRY_AGAIN_LATER', hash: 'abc123' });

    const response = await post({ signedXdr });

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('TRY_AGAIN_LATER');
  });

  it('maps an RPC rejection to 502', async () => {
    mockSendTransaction.mockResolvedValue({ status: 'ERROR', hash: 'abc123' });

    expect((await post({ signedXdr })).status).toBe(502);
  });

  it('rejects a missing envelope with 400', async () => {
    const response = await post({});

    expect(response.status).toBe(400);
    expect(mockSendTransaction).not.toHaveBeenCalled();
  });

  it('rejects an unparseable envelope with 400, not 500', async () => {
    const response = await post({ signedXdr: 'not-xdr' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'signedXdr is not a valid transaction envelope',
    });
    expect(mockSendTransaction).not.toHaveBeenCalled();
  });
});
