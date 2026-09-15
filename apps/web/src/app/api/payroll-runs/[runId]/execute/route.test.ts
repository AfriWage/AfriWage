import { Keypair } from '@stellar/stellar-sdk';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDrizzleDouble, firstCall } from '@/test/drizzle-double';
import { stubServerEnv } from '@/test/env-stub';

const PAYER = Keypair.random().publicKey();
const ORG_ID = '2c3d4e5f-1a2b-4c3d-9e8f-0a1b2c3d4e5f';
const RUN_ID = '8f7e6d5c-4b3a-4291-8f7e-6d5c4b3a2918';
const TX_HASH = 'c'.repeat(64);

const drizzle = createDrizzleDouble();

const { mockRequireRun } = vi.hoisted(() => ({ mockRequireRun: vi.fn() }));

vi.mock('@AfriWage/db', () => ({
  db: drizzle.db,
  employees: { id: 'employees.id', payoutOfframpCurrency: 'employees.payout_offramp_currency' },
  payrollRuns: { id: 'payroll_runs.id' },
  payrollRunItems: {
    id: 'payroll_run_items.id',
    payrollRunId: 'payroll_run_items.payroll_run_id',
    employeeId: 'payroll_run_items.employee_id',
    onchainTxHash: 'payroll_run_items.onchain_tx_hash',
    offrampStatus: 'payroll_run_items.offramp_status',
  },
}));

vi.mock('@/lib/require-run', () => ({ requireRun: mockRequireRun }));

let route: typeof import('./route');

beforeAll(async () => {
  stubServerEnv();
  route = await import('./route');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function runContext(overrides: Record<string, unknown> = {}) {
  return {
    runId: RUN_ID,
    orgId: ORG_ID,
    role: 'payer',
    walletPublicKey: PAYER,
    status: 'approved',
    totalAmount: '350.7500000',
    charterRequestId: '42',
    ...overrides,
  };
}

beforeEach(() => {
  drizzle.reset();
  mockRequireRun.mockReset();
  mockRequireRun.mockResolvedValue(runContext());
});

const params = { params: { runId: RUN_ID } };

function post(body: unknown): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/payroll-runs/x/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params
  );
}

describe('POST /api/payroll-runs/[runId]/execute', () => {
  it('records the payment hash on every item', async () => {
    drizzle.queue(
      [{ id: 'item-1' }, { id: 'item-2' }],
      [
        { onchainTxHash: TX_HASH, offrampStatus: null, payoutOfframpCurrency: null },
        { onchainTxHash: TX_HASH, offrampStatus: null, payoutOfframpCurrency: null },
      ],
      [{ id: RUN_ID, status: 'settled' }]
    );

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(200);
    expect(firstCall(drizzle.calls, 'set')?.[0]).toEqual({ onchainTxHash: TX_HASH });
  });

  it('settles an on-chain-only run immediately', async () => {
    drizzle.queue(
      [{ id: 'item-1' }],
      [{ onchainTxHash: TX_HASH, offrampStatus: null, payoutOfframpCurrency: null }],
      [{ id: RUN_ID, status: 'settled' }]
    );

    await post({ transactionHash: TX_HASH });

    const runUpdate = drizzle.calls.filter((call) => call.method === 'set').at(1)?.args[0] as {
      status: string;
    };
    expect(runUpdate.status).toBe('settled');
  });

  it('stays executing while an off-ramp leg is still owed', async () => {
    drizzle.queue(
      [{ id: 'item-1' }],
      [{ onchainTxHash: TX_HASH, offrampStatus: null, payoutOfframpCurrency: 'NGN' }],
      [{ id: RUN_ID, status: 'executing' }]
    );

    await post({ transactionHash: TX_HASH });

    const runUpdate = drizzle.calls.filter((call) => call.method === 'set').at(1)?.args[0] as {
      status: string;
    };
    expect(runUpdate.status).toBe('executing');
  });

  it('stamps executedAt when the payment is recorded', async () => {
    drizzle.queue(
      [{ id: 'item-1' }],
      [{ onchainTxHash: TX_HASH, offrampStatus: null, payoutOfframpCurrency: null }],
      [{ id: RUN_ID }]
    );

    await post({ transactionHash: TX_HASH });

    const runUpdate = drizzle.calls.filter((call) => call.method === 'set').at(1)?.args[0] as {
      executedAt: Date;
    };
    expect(runUpdate.executedAt).toBeInstanceOf(Date);
  });

  it('refuses a run that has not been approved', async () => {
    mockRequireRun.mockResolvedValue(runContext({ status: 'pending_approval' }));

    const response = await post({ transactionHash: TX_HASH });

    expect(response.status).toBe(409);
    expect(drizzle.calls).toHaveLength(0);
  });

  it('is idempotent for a run already executing', async () => {
    mockRequireRun.mockResolvedValue(runContext({ status: 'executing' }));
    drizzle.queue(
      [{ id: 'item-1' }],
      [{ onchainTxHash: TX_HASH, offrampStatus: null, payoutOfframpCurrency: 'NGN' }],
      [{ id: RUN_ID, status: 'executing' }]
    );

    expect((await post({ transactionHash: TX_HASH })).status).toBe(200);
  });

  it('requires the payer role', async () => {
    drizzle.queue(
      [{ id: 'item-1' }],
      [{ onchainTxHash: TX_HASH, offrampStatus: null, payoutOfframpCurrency: null }],
      [{ id: RUN_ID }]
    );

    await post({ transactionHash: TX_HASH });

    expect(mockRequireRun).toHaveBeenCalledWith(expect.any(Request), RUN_ID, 'payer');
  });

  it('rejects a malformed hash before writing anything', async () => {
    const response = await post({ transactionHash: 'nope' });

    expect(response.status).toBe(400);
    expect(drizzle.calls).toHaveLength(0);
  });
});
